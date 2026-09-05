// 远程推送 token 登记。需要 EAS projectId（app.json extra.eas.projectId）与 Apple 开发者账号；
// 没有时安静跳过，伴侣提醒退化为准爸爸手机上的本地提醒（见 reminders.ts）。
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

export async function registerPushToken(memberId: string, familyId: string) {
  if (!supabase || Platform.OS === 'web') return;
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId;
  if (!projectId) { console.log('[push] 未配置 EAS projectId，跳过远程推送登记'); return; }
  try {
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from('push_tokens').upsert({ member_id: memberId, family_id: familyId, token, platform: Platform.OS, updated_at: new Date().toISOString() });
    console.log('[push] token 已登记');
  } catch (e) {
    console.warn('[push]', e);
  }
}
