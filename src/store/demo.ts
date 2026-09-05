import type { AppState, Checkup, DailyLog, Member, SupplementLog } from '../data/types';
import { CHECKUP_TEMPLATES } from '../data/schedule';
import { SUPPLEMENT_TEMPLATES } from '../data/supplements';
import { addDays, dateOfWeek, dueFromLmp, today, uid } from '../lib/pregnancy';

/** 示例家庭：孕 25 周，方便体验各角色视角 */
export function demoState(): AppState {
  const lmp = addDays(today(), -25 * 7 - 3);
  const dueDate = dueFromLmp(lmp);
  const mom: Member = { id: 'm1', name: '小雨', role: 'mom', joinedAt: new Date().toISOString() };
  const dad: Member = { id: 'd1', name: '阿强', role: 'dad', relation: '老公', joinedAt: new Date().toISOString() };
  const gm: Member = { id: 'f1', name: '外婆', role: 'family', relation: '妈妈', joinedAt: new Date().toISOString() };
  const iso = (daysAgo: number, hh = 9) => { const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(hh, 12, 0, 0); return d.toISOString(); };

  const checkups: Checkup[] = CHECKUP_TEMPLATES.map((t) => {
    const done = t.weekTo < 25;
    const c: Checkup = { ...t, id: uid(), date: dateOfWeek(dueDate, t.weekFrom), done, metrics: [], visibility: 'partner', fromTemplate: true, hospital: done || t.weekFrom <= 28 ? '市妇幼' : undefined };
    if (t.title === 'NT 检查') { c.metrics = [{ key: 'bp_sys', value: 112, unit: 'mmHg' }, { key: 'bp_dia', value: 70, unit: 'mmHg' }, { key: 'weight', value: 54.2, unit: 'kg' }, { key: 'fhr', value: 158, unit: '次/分' }]; c.result = 'NT 1.6 mm，正常'; c.companionId = 'd1'; }
    if (t.title === '大排畸') { c.metrics = [{ key: 'bp_sys', value: 115, unit: 'mmHg' }, { key: 'bp_dia', value: 72, unit: 'mmHg' }, { key: 'weight', value: 58.9, unit: 'kg' }, { key: 'fhr', value: 146, unit: '次/分' }]; c.result = '结构未见明显异常，左手挡脸，下周复查'; c.companionId = 'd1'; }
    if (t.title === '唐筛 / 无创 DNA') { c.result = '无创低风险'; c.metrics = [{ key: 'hb', value: 108, unit: 'g/L' }]; }
    if (t.title === '糖耐（OGTT）') { c.date = addDays(today(), 3); c.companionId = 'd1'; }
    return c;
  });

  const supplements = SUPPLEMENT_TEMPLATES.map((t) => ({ ...t, id: `s_${t.name}`, active: true, visibility: 'partner' as const }));
  const logsSup: SupplementLog[] = [];
  for (let i = 6; i >= 1; i--) {
    const d = addDays(today(), -i);
    if (i !== 3) logsSup.push({ id: uid(), supplementId: 's_钙', date: d, byId: i % 2 ? 'm1' : 'd1', at: iso(i, 21) });
    logsSup.push({ id: uid(), supplementId: 's_DHA', date: d, byId: 'm1', at: iso(i, 12) });
    if (i !== 5 && i !== 2) logsSup.push({ id: uid(), supplementId: 's_铁', date: d, byId: 'm1', at: iso(i, 12) });
  }
  logsSup.push({ id: uid(), supplementId: 's_DHA', date: today(), byId: 'd1', at: iso(0, 12) });

  const logs: DailyLog[] = [
    { id: uid(), kind: 'weight', date: addDays(today(), -70), value: 55.0, byId: 'm1', at: iso(70), visibility: 'partner' },
    { id: uid(), kind: 'weight', date: addDays(today(), -42), value: 56.8, byId: 'm1', at: iso(42), visibility: 'partner' },
    { id: uid(), kind: 'weight', date: addDays(today(), -21), value: 58.9, byId: 'm1', at: iso(21), visibility: 'partner' },
    { id: uid(), kind: 'weight', date: addDays(today(), -7), value: 59.6, byId: 'm1', at: iso(7), visibility: 'partner' },
    { id: uid(), kind: 'weight', date: today(), value: 60.1, byId: 'm1', at: iso(0, 7), visibility: 'partner' },
    { id: uid(), kind: 'symptom', date: addDays(today(), -1), text: '腰酸 抽筋', byId: 'm1', at: iso(1, 22), visibility: 'partner' },
    { id: uid(), kind: 'mood', date: addDays(today(), -2), text: '感动', byId: 'm1', at: iso(2, 20), visibility: 'family' },
    { id: uid(), kind: 'note', date: addDays(today(), -2), text: '今晚第一次感觉到明显的胎动，像小鱼吐泡泡。', byId: 'm1', at: iso(2, 20), visibility: 'family' },
  ];

  const A = (daysAgo: number, hh: number, byId: string, kind: 'checkup' | 'supplement' | 'log' | 'family' | 'system', text: string, visibility: 'self' | 'partner' | 'family' = 'family', likes: string[] = [], comments: { byId: string; text: string }[] = []) => ({
    id: uid(), at: iso(daysAgo, hh), byId, kind, text, visibility, likes, comments: comments.map((c) => ({ id: uid(), byId: c.byId, text: c.text, at: iso(daysAgo, hh + 1) })),
  });

  return {
    onboarded: true,
    meId: 'm1',
    familyCode: 'TY7K2Q',
    pregnancy: { lmp, dueDate, momName: '小雨', babyNickname: '小豆子' },
    members: [mom, dad, gm],
    checkups,
    supplements,
    supplementLogs: logsSup,
    logs,
    activities: [
      A(0, 7, 'm1', 'log', '记录体重 60.1 kg', 'partner'),
      A(0, 12, 'd1', 'supplement', '帮她记了一次DHA', 'partner'),
      A(1, 22, 'm1', 'log', '今天：腰酸 抽筋', 'partner', ['d1'], [{ byId: 'd1', text: '今晚给你揉腿' }]),
      A(2, 20, 'm1', 'log', '今晚第一次感觉到明显的胎动，像小鱼吐泡泡。', 'family', ['d1', 'f1'], [{ byId: 'f1', text: '小豆子在跟妈妈打招呼呢' }, { byId: 'd1', text: '我也要摸！' }]),
      A(4, 10, 'd1', 'checkup', '阿强 要陪「糖耐（OGTT）」', 'family', ['m1']),
      A(21, 11, 'm1', 'checkup', '完成了「大排畸」，记录了 4 项数值：结构未见明显异常，左手挡脸，下周复查', 'partner', ['d1']),
      A(21, 9, 'd1', 'checkup', '阿强 要陪「大排畸」', 'family'),
      A(40, 9, 'f1', 'family', '外婆 加入了家庭', 'family', ['m1', 'd1']),
      A(60, 9, 'd1', 'family', '阿强 加入了家庭', 'family', ['m1']),
      A(61, 9, 'm1', 'system', `小雨 创建了家庭，预产期 ${dueDate}`, 'family'),
    ],
  };
}
