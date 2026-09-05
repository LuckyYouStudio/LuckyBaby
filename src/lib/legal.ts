import { Linking } from 'react-native';
import { getLang } from '../i18n';
const BASE = 'https://wpjmmgqqdyycmxlnnkfd.supabase.co/functions/v1/legal';
export const privacyUrl = () => `${BASE}?doc=privacy&lang=${getLang()}`;
export const termsUrl = () => `${BASE}?doc=terms&lang=${getLang()}`;
export const openPrivacy = () => Linking.openURL(privacyUrl());
export const openTerms = () => Linking.openURL(termsUrl());
