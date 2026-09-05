// 本地提醒：产检前一天 20:00 与当天 08:00；补充剂每天按设定时间。
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { AppState } from '../data/types';
import { gestation, parseYmd, today } from './pregnancy';

const supported = Platform.OS !== 'web';

if (supported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!supported) return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

let scheduling = false;

/** 依据当前状态重排全部提醒（幂等：先清空再排） */
export async function rescheduleReminders(state: AppState) {
  if (!supported || !state.remindersEnabled || scheduling) return;
  scheduling = true;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const t = today();
    const now = new Date();

    // 产检
    for (const c of state.checkups) {
      if (c.done || !c.date || c.date < t) continue;
      const d = parseYmd(c.date);
      const bring = (c.bringItems ?? []).filter((b) => !b.done).map((b) => b.text).join('、');
      const fasting = c.notes?.includes('空腹') ? '记得空腹。' : '';
      const eve = new Date(d); eve.setDate(eve.getDate() - 1); eve.setHours(20, 0, 0, 0);
      const morn = new Date(d); morn.setHours(8, 0, 0, 0);
      if (eve > now) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `明天产检：${c.title}`, body: `${fasting}${c.hospital ? c.hospital + '。' : ''}${bring ? '带上：' + bring : ''}`.trim() || '看看要带什么', data: { checkupId: c.id } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: eve },
        });
      }
      if (morn > now) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `今天产检：${c.title}`, body: `${fasting}${bring ? '出门前检查：' + bring : '祝顺利'}`, data: { checkupId: c.id } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: morn },
        });
      }
    }

    // 补充剂（只排本周需要吃的）
    const week = state.pregnancy.dueDate ? gestation(state.pregnancy.dueDate).week : 0;
    for (const s of state.supplements) {
      if (!s.active || week < s.weekFrom || week > s.weekTo) continue;
      const [hh, mm] = (s.timeOfDay || '08:00').split(':').map(Number);
      await Notifications.scheduleNotificationAsync({
        content: { title: `该吃${s.name}了`, body: `${s.dose}${s.note ? ' · ' + s.note : ''}`, data: { supplementId: s.id } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hh || 8, minute: mm || 0 },
      });
    }
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`[reminders] scheduled ${pending.length}:`, pending.map((n) => n.content.title).join(' | '));
  } catch (e) {
    console.warn('[reminders]', e);
  } finally {
    scheduling = false;
  }
}

export async function cancelReminders() {
  if (!supported) return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
