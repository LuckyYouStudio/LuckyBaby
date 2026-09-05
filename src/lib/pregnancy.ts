const DAY = 86400000;

export function toYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

export function today(): string {
  return toYmd(new Date());
}

/** 末次月经 + 280 天 = 预产期 */
export function dueFromLmp(lmp: string): string {
  return addDays(lmp, 280);
}

export function lmpFromDue(due: string): string {
  return addDays(due, -280);
}

/** 返回 {week, day, totalDays} ，以末次月经为第 0 天 */
export function gestation(dueDate: string, on: string = today()) {
  const lmp = parseYmd(lmpFromDue(dueDate));
  const totalDays = Math.round((parseYmd(on).getTime() - lmp.getTime()) / DAY);
  const week = Math.floor(totalDays / 7);
  const day = totalDays - week * 7;
  return { week, day, totalDays, daysLeft: 280 - totalDays };
}

/** 孕周对应的日期（该周第一天） */
export function dateOfWeek(dueDate: string, week: number): string {
  return addDays(lmpFromDue(dueDate), week * 7);
}

export function trimester(week: number): 1 | 2 | 3 {
  if (week <= 13) return 1;
  if (week <= 27) return 2;
  return 3;
}

export function fmtDate(s?: string): string {
  if (!s) return '未定';
  const d = parseYmd(s);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export function fmtRelative(s: string): string {
  const diff = Math.round((parseYmd(s).getTime() - parseYmd(today()).getTime()) / DAY);
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === -1) return '昨天';
  if (diff > 0) return `${diff} 天后`;
  return `${-diff} 天前`;
}

export function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const hh = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (toYmd(d) === toYmd(now)) return `今天 ${hh}`;
  return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}`;
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
