import { Linking } from 'react-native';
import { getLang } from '../i18n';
// GitHub Pages：Supabase functions 域名会把 text/html 降级成 text/plain+nosniff（防钓鱼），
// 浏览器只会显示 HTML 源码，隐私政策必须正常渲染，所以走 Pages。内容由 scripts/build-site.mjs
// 从 supabase/functions/legal 生成，两边文案保持一致。
const BASE = 'https://luckyyoustudio.github.io/LuckyBaby';
export const privacyUrl = () => `${BASE}/privacy.html?lang=${getLang()}`;
export const termsUrl = () => `${BASE}/terms.html?lang=${getLang()}`;
export const openPrivacy = () => Linking.openURL(privacyUrl());
export const openTerms = () => Linking.openURL(termsUrl());
