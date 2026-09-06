// 本地提醒：产检前一天 20:00 与当天 08:00；补充剂每天按设定时间。
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import type { AppState } from '../data/types';
import { gestation, parseYmd, today } from './pregnancy';
import { cycleView } from './cycle';
import { needsFasting } from '../data/schedule';
import { tr } from '../i18n';

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
      const fasting = needsFasting(c.notes) ? tr('记得空腹。') : '';
      const eve = new Date(d); eve.setDate(eve.getDate() - 1); eve.setHours(20, 0, 0, 0);
      const morn = new Date(d); morn.setHours(8, 0, 0, 0);
      if (eve > now) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `明天产检：${c.title}`, body: `${fasting}${c.hospital ? c.hospital + '。' : ''}${bring ? tr('带上：') + bring : ''}`.trim() || tr('看看要带什么'), data: { checkupId: c.id } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: eve },
        });
      }
      if (morn > now) {
        await Notifications.scheduleNotificationAsync({
          content: { title: `今天产检：${c.title}`, body: `${fasting}${bring ? tr('出门前检查：') + bring : tr('祝顺利')}`, data: { checkupId: c.id } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: morn },
        });
      }
    }

    const me = state.members.find((m) => m.id === state.meId);
    const week = state.pregnancy.dueDate ? gestation(state.pregnancy.dueDate).week : 0;

    // 备孕：易孕期开始（9:00）、最佳时机第一天（20:00）、月经该来那天（9:00）；小两口都提醒
    if (state.pregnancy.stage === 'ttc' && me && me.role !== 'family') {
      const v = cycleView(state.cycleLogs ?? [], state.pregnancy.cycleLen, state.pregnancy.periodLen, t);
      if (v) {
        const at = (ymd: string, h: number) => { const d = parseYmd(ymd); d.setHours(h, 0, 0, 0); return d; };
        const her = me.role === 'mom';
        const plan: { when: Date; title: string; body: string }[] = [
          { when: at(v.fertileStart, 9), title: her ? tr('易孕期开始了') : tr('她的易孕期开始了'), body: tr('接下来一周隔天同房一次就好。预计排卵 {d}。', { d: v.ovulation.slice(5).replace('-', '/') }) },
          { when: at(v.peakStart, 20), title: her ? tr('今晚是最佳时机 💚') : tr('这几天是好时机 💚'), body: tr('排卵日前 2 天到当天最容易受孕。') },
          { when: at(v.nextPeriod, 9), title: her ? tr('月经预计今天来') : tr('她的月经预计今天来'), body: her ? tr('来了记一下；没来过几天可以验孕。') : tr('问问她，顺便准备点热的。') },
        ];
        for (const p of plan) {
          if (p.when <= now) continue;
          await Notifications.scheduleNotificationAsync({ content: { title: p.title, body: p.body, data: { ttc: true } }, trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: p.when } });
        }
      }
    }
    const due = state.supplements.filter((s) => s.active && week >= s.weekFrom && week <= s.weekTo);

    if (me?.role === 'dad') {
      // 准爸爸：她到点 2 小时还没记，就提醒他看一眼（本机版；有远程推送后由云端统一发）
      for (const s of due) {
        const logged = state.supplementLogs.some((l) => l.supplementId === s.id && l.date === t);
        if (logged) continue;
        const [hh, mm] = (s.timeOfDay || '08:00').split(':').map(Number);
        const at = new Date(); at.setHours((hh || 8) + 2, mm || 0, 0, 0);
        if (at <= now) continue;
        await Notifications.scheduleNotificationAsync({
          content: { title: `${state.pregnancy.momName}今天的${s.name}还没记`, body: tr('问问她吃了没，或者你替她记一下'), data: { supplementId: s.id, nudge: true } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at },
        });
      }
    } else {
      // 准妈妈：到点提醒吃
      for (const s of due) {
        const [hh, mm] = (s.timeOfDay || '08:00').split(':').map(Number);
        await Notifications.scheduleNotificationAsync({
          content: { title: tr('该吃{name}了', { name: tr(s.name) }), body: `${tr(s.dose)}${s.note ? ' · ' + tr(s.note) : ''}`, data: { supplementId: s.id } },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: hh || 8, minute: mm || 0 },
        });
      }
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
