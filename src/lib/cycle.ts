// 备孕：按月经记录估算排卵日与易孕期。
// 方法：下次月经 = 上次月经第一天 + 平均周期；排卵日 = 下次月经 − 14（黄体期按 14 天）；
// 易孕期 = 排卵日前 5 天到后 1 天；最佳时机 = 排卵日前 2 天到排卵日。
// 若本周期记录了排卵试纸阳性，则排卵日按阳性次日算。只做估算，周期不规律时误差大，不能用于避孕。
import type { CycleLog } from '../data/types';
import { addDays, parseYmd, today } from './pregnancy';

const DAY = 86400000;
export const LUTEAL = 14;
export const DEFAULT_CYCLE = 28;
export const DEFAULT_PERIOD = 5;

export const diffDays = (a: string, b: string) => Math.round((parseYmd(a).getTime() - parseYmd(b).getTime()) / DAY);

export function periodStarts(logs: CycleLog[]): string[] {
  return [...new Set(logs.filter((l) => l.kind === 'period_start').map((l) => l.date))].sort();
}

/** 用最近几次周期长度求平均（剔除明显异常的 <15 或 >60 天） */
export function cycleStats(starts: string[], fallback = DEFAULT_CYCLE) {
  const lens: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    const n = diffDays(starts[i], starts[i - 1]);
    if (n >= 15 && n <= 60) lens.push(n);
  }
  const recent = lens.slice(-6);
  if (!recent.length) return { avgLen: fallback, samples: 0, regular: true };
  const avg = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length);
  const spread = Math.max(...recent) - Math.min(...recent);
  return { avgLen: avg, samples: recent.length, regular: recent.length < 2 || spread <= 7 };
}

export type Phase = 'period' | 'follicular' | 'fertile' | 'peak' | 'luteal' | 'late';
export type Chance = 'high' | 'medium' | 'low';

export interface CycleView {
  lastStart: string;
  cycleDay: number; // 第几天，从 1 起
  avgLen: number;
  periodLen: number;
  nextPeriod: string;
  ovulation: string;
  fertileStart: string;
  fertileEnd: string;
  peakStart: string; // 最佳时机起
  peakEnd: string;
  phase: Phase;
  chance: Chance;
  lateDays: number; // 月经推迟天数（未推迟为 0）
  fromLh: boolean; // 排卵日是否来自试纸阳性
  samples: number;
  regular: boolean;
}

/** 当前周期的估算；没有任何月经记录时返回 null */
export function cycleView(logs: CycleLog[], cycleLen = DEFAULT_CYCLE, periodLen = DEFAULT_PERIOD, on = today()): CycleView | null {
  const starts = periodStarts(logs).filter((d) => d <= on);
  if (!starts.length) return null;
  const lastStart = starts[starts.length - 1];
  const { avgLen, samples, regular } = cycleStats(starts, cycleLen);
  const cycleDay = diffDays(on, lastStart) + 1;
  let nextPeriod = addDays(lastStart, avgLen);
  let ovulation = addDays(nextPeriod, -LUTEAL);
  let fromLh = false;
  const lh = logs.filter((l) => l.kind === 'lh_pos' && l.date >= lastStart && l.date <= on).map((l) => l.date).sort()[0];
  if (lh) { ovulation = addDays(lh, 1); nextPeriod = addDays(ovulation, LUTEAL); fromLh = true; }
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);
  const peakStart = addDays(ovulation, -2);
  const peakEnd = ovulation;
  const periodEnd = logs.filter((l) => l.kind === 'period_end' && l.date >= lastStart).map((l) => l.date).sort()[0] ?? addDays(lastStart, periodLen - 1);
  const lateDays = on > nextPeriod ? diffDays(on, nextPeriod) : 0;
  let phase: Phase = 'follicular';
  if (on <= periodEnd) phase = 'period';
  else if (lateDays > 0) phase = 'late';
  else if (on >= peakStart && on <= peakEnd) phase = 'peak';
  else if (on >= fertileStart && on <= fertileEnd) phase = 'fertile';
  else if (on > fertileEnd) phase = 'luteal';
  const chance: Chance = phase === 'peak' ? 'high' : phase === 'fertile' ? 'medium' : 'low';
  return { lastStart, cycleDay, avgLen, periodLen, nextPeriod, ovulation, fertileStart, fertileEnd, peakStart, peakEnd, phase, chance, lateDays, fromLh, samples, regular };
}

export type DayMark = { period?: 'logged' | 'predicted'; fertile?: boolean; peak?: boolean; ovulation?: boolean; sex?: boolean; lh?: 'pos' | 'neg'; bbt?: number };

/** 给日历用：某一天的标记（含未来 3 个周期的预测） */
export function dayMarks(logs: CycleLog[], view: CycleView | null, periodLen = DEFAULT_PERIOD): (date: string) => DayMark {
  const byDate = new Map<string, CycleLog[]>();
  for (const l of logs) byDate.set(l.date, [...(byDate.get(l.date) ?? []), l]);
  // 已记录的月经区间
  const starts = periodStarts(logs);
  const ends = logs.filter((l) => l.kind === 'period_end').map((l) => l.date).sort();
  const logged = new Set<string>();
  for (const s of starts) {
    const e = ends.find((x) => x >= s && diffDays(x, s) < 15) ?? addDays(s, periodLen - 1);
    for (let d = s; d <= e; d = addDays(d, 1)) logged.add(d);
  }
  // 预测：当前周期的易孕期 + 之后 3 个周期
  const predicted = new Set<string>(), fertile = new Set<string>(), peak = new Set<string>(), ovu = new Set<string>();
  if (view) {
    for (let d = view.fertileStart; d <= view.fertileEnd; d = addDays(d, 1)) fertile.add(d);
    for (let d = view.peakStart; d <= view.peakEnd; d = addDays(d, 1)) peak.add(d);
    ovu.add(view.ovulation);
    let np = view.nextPeriod;
    for (let k = 0; k < 3; k++) {
      for (let i = 0; i < periodLen; i++) predicted.add(addDays(np, i));
      const o = addDays(np, view.avgLen - LUTEAL);
      for (let i = -5; i <= 1; i++) fertile.add(addDays(o, i));
      for (let i = -2; i <= 0; i++) peak.add(addDays(o, i));
      ovu.add(o);
      np = addDays(np, view.avgLen);
    }
  }
  return (date) => {
    const ls = byDate.get(date) ?? [];
    const m: DayMark = {};
    if (logged.has(date)) m.period = 'logged';
    else if (predicted.has(date) && date > (view?.lastStart ?? '')) m.period = 'predicted';
    if (!m.period) {
      if (fertile.has(date)) m.fertile = true;
      if (peak.has(date)) m.peak = true;
      if (ovu.has(date)) m.ovulation = true;
    }
    if (ls.some((l) => l.kind === 'sex')) m.sex = true;
    if (ls.some((l) => l.kind === 'lh_pos')) m.lh = 'pos';
    else if (ls.some((l) => l.kind === 'lh_neg')) m.lh = 'neg';
    const bbt = ls.find((l) => l.kind === 'bbt');
    if (bbt?.value) m.bbt = bbt.value;
    return m;
  };
}

/** 历次周期（起始日、长度） */
export function cycleHistory(logs: CycleLog[]) {
  const starts = periodStarts(logs);
  return starts.map((s, i) => ({ start: s, len: i + 1 < starts.length ? diffDays(starts[i + 1], s) : undefined })).reverse();
}
