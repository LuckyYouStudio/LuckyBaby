import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** 未配置环境变量时为 null，App 以纯本地模式运行 */
export const supabase: SupabaseClient | null =
  url && anon && url.startsWith('http')
    ? createClient(url, anon, {
        auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
      })
    : null;

export const cloudEnabled = supabase !== null;

/** 匿名登录：家人不用注册账号，靠邀请码进家庭 */
export async function ensureSession(): Promise<string> {
  if (!supabase) throw new Error('云同步未配置');
  const { data } = await supabase.auth.getSession();
  if (data.session?.user) return data.session.user.id;
  const { data: anonData, error } = await supabase.auth.signInAnonymously();
  if (error || !anonData.user) throw error ?? new Error('匿名登录失败');
  return anonData.user.id;
}
