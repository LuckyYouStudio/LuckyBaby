// 国际化：中文原文即键，英文在 en.ts 对照表里；没有对照的返回原文。
// 用法：tr('孕 {w} 周 {d} 天', { w: 25, d: 3 })
import { en } from './en';

export type Lang = 'zh' | 'en';
let lang: Lang = 'zh';

export function setLang(l: Lang) {
  lang = l;
}
export function getLang(): Lang {
  return lang;
}

export function tr(key: string, params?: Record<string, string | number>): string {
  let s = lang === 'en' ? (en[key] ?? key) : key;
  if (params) for (const [k, v] of Object.entries(params)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
