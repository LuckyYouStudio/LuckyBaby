// 邀请：链接、分享文案
export const INVITE_BASE = 'https://wpjmmgqqdyycmxlnnkfd.supabase.co/functions/v1/join';
export const SCHEME_JOIN = 'luckybaby://join?code=';

export function inviteUrl(code: string, from?: string) {
  const u = `${INVITE_BASE}?code=${encodeURIComponent(code)}`;
  return from ? `${u}&from=${encodeURIComponent(from)}` : u;
}

export function inviteMessage(code: string, from: string) {
  return `${from}邀请你加入「幸运宝贝」，一起记录孕期。\n邀请码：${code}\n点链接加入：${inviteUrl(code, from)}`;
}

/** 从扫码结果 / 粘贴文本里抠出 6 位邀请码 */
export function extractCode(text: string): string | null {
  const t = (text || '').trim();
  const fromUrl = t.match(/[?&]code=([A-Za-z0-9]{6})/);
  if (fromUrl) return fromUrl[1].toUpperCase();
  const bare = t.match(/\b([A-Z0-9]{6})\b/i);
  return bare ? bare[1].toUpperCase() : null;
}
