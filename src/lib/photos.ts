// 报告照片：有云端时传到 Supabase Storage 私有桶 reports，本地只保留路径；纯本地模式保留 file:// URI。
import { File } from 'expo-file-system';
import { supabase } from './supabase';
import { uid } from './pregnancy';

const BUCKET = 'reports';
const isLocal = (p: string) => p.startsWith('file:') || p.startsWith('ph:') || p.startsWith('assets-library:') || p.startsWith('content:');

export async function uploadReportPhoto(familyId: string, checkupId: string, localUri: string): Promise<string> {
  if (!supabase) return localUri;
  const bytes = await new File(localUri).bytes();
  const ext = localUri.toLowerCase().endsWith('.png') ? 'png' : 'jpg';
  const path = `${familyId}/${checkupId}/${uid()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: ext === 'png' ? 'image/png' : 'image/jpeg', upsert: false });
  if (error) throw error;
  return path;
}

export async function deleteReportPhoto(path: string) {
  if (!supabase || isLocal(path)) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

// 签名 URL 缓存（1 小时有效，提前 5 分钟刷新）
const cache = new Map<string, { url: string; exp: number }>();

export async function resolvePhotoUrl(path: string): Promise<string> {
  if (isLocal(path) || !supabase) return path;
  const hit = cache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
  if (error || !data) throw error ?? new Error('no url');
  cache.set(path, { url: data.signedUrl, exp: Date.now() + 55 * 60_000 });
  return data.signedUrl;
}
