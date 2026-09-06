// 账号绑定：匿名账号 → 通过 Apple 登录，把家庭成员身份转移过去；换手机后可用 Apple 登录恢复。
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { tr } from '../i18n';

export async function isAppleSignInAvailable() {
  try { return await AppleAuthentication.isAvailableAsync(); } catch { return false; }
}

/** 用 Apple 登录，返回新的 Supabase 用户 id */
export async function signInWithApple(): Promise<string> {
  if (!supabase) throw new Error(tr('云同步未配置'));
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  const cred = await AppleAuthentication.signInAsync({
    requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
    nonce: hashedNonce,
  });
  if (!cred.identityToken) throw new Error(tr('没有拿到 Apple 的登录凭证'));
  const { data, error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: cred.identityToken, nonce: rawNonce });
  if (error || !data.user) throw error ?? new Error(tr('Apple 登录失败'));
  return data.user.id;
}

/** 当前是否匿名账号 */
export async function isAnonymous(): Promise<boolean> {
  if (!supabase) return true;
  const { data } = await supabase.auth.getUser();
  return !data.user || !!data.user.is_anonymous;
}

/** 把匿名账号的家庭身份绑定到 Apple 账号。返回新 userId */
export async function bindApple(): Promise<string> {
  if (!supabase) throw new Error(tr('云同步未配置'));
  const { data: tokenData, error: tErr } = await supabase.rpc('create_transfer_token');
  if (tErr) throw tErr;
  const token = tokenData as string;
  const newUserId = await signInWithApple();
  const { error } = await supabase.rpc('redeem_transfer_token', { p_token: token });
  if (error) {
    if (error.message.includes('already has family')) throw new Error(tr('这个 Apple ID 已经绑定了另一个家庭'));
    throw error;
  }
  return newUserId;
}

/** 删除账号：清云端数据 + 删除登录账号 */
export async function deleteAccount(): Promise<void> {
  if (!supabase) return;
  const { data, error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
  if (data && (data as any).error) throw new Error((data as any).error);
  await supabase.auth.signOut();
}

/** 离开当前家庭：家人删掉自己的成员行（准妈妈只清本机，云端家庭保留）；然后退出登录，下次建/加家庭用新身份 */
export async function leaveFamily(memberId: string, role: string): Promise<void> {
  if (!supabase) return;
  try { if (role !== 'mom') await supabase.from('members').delete().eq('id', memberId); } catch {}
  try { await supabase.auth.signOut(); } catch {}
}

// ---------- 邮箱链接（iOS / 安卓通用；免费版 Supabase 不能发验证码，改为点链接） ----------
export const AUTH_REDIRECT = 'luckybaby://auth';

/** 匿名账号绑定邮箱：发确认链接（匿名用户升级为正式用户，id 不变） */
export async function bindEmailStart(email: string) {
  if (!supabase) throw new Error(tr('云同步未配置'));
  const { error } = await supabase.auth.updateUser({ email: email.trim().toLowerCase() }, { emailRedirectTo: AUTH_REDIRECT });
  if (error) throw error;
}

/** 换机恢复：发登录链接 */
export async function restoreEmailStart(email: string) {
  if (!supabase) throw new Error(tr('云同步未配置'));
  const { error } = await supabase.auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: AUTH_REDIRECT, shouldCreateUser: false } });
  if (error) throw error;
}

/** 处理邮件链接打开 App：luckybaby://auth?code=... → 建立会话，返回 userId */
export async function completeEmailLink(url: string): Promise<string> {
  if (!supabase) throw new Error(tr('云同步未配置'));
  const code = url.match(/[?&]code=([^&#]+)/)?.[1];
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(decodeURIComponent(code));
    if (error || !data.user) throw error ?? new Error(tr('链接无效或已过期'));
    return data.user.id;
  }
  // 兼容 implicit 形式：#access_token=...&refresh_token=...
  const frag = url.split('#')[1] ?? '';
  const q = Object.fromEntries(frag.split('&').map((kv) => kv.split('=').map(decodeURIComponent) as [string, string]));
  if (q.access_token && q.refresh_token) {
    const { data, error } = await supabase.auth.setSession({ access_token: q.access_token, refresh_token: q.refresh_token });
    if (error || !data.user) throw error ?? new Error(tr('链接无效或已过期'));
    return data.user.id;
  }
  if (q.error_description) throw new Error(decodeURIComponent(q.error_description));
  throw new Error(tr('链接无效或已过期'));
}
