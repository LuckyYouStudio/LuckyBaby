// 云同步：本地 reducer 仍是设备上的事实来源；这里负责把差异推到 Supabase，
// 并在别的家人改动时拉回来合并。
import { supabase } from '../lib/supabase';
import type { Activity, AppState, Checkup, DailyLog, Member, Pregnancy, Role, Supplement, SupplementLog } from '../data/types';
import { tr } from '../i18n';

export interface CloudInfo { familyId: string; userId: string }

type Row = Record<string, unknown>;
const isLocalPhoto = (p: string) => /^(file|ph|assets-library|content):/.test(p);

// ---------- 行 ↔ 本地对象 ----------
const toMember = (r: Row): Member => ({ id: r.id as string, name: r.name as string, role: r.role as Role, relation: (r.relation as string) ?? undefined, joinedAt: r.joined_at as string });
const toCheckup = (r: Row): Checkup => ({
  id: r.id as string, title: r.title as string, weekFrom: r.week_from as number, weekTo: r.week_to as number,
  date: (r.date as string) ?? undefined, hospital: (r.hospital as string) ?? undefined, items: (r.items as string[]) ?? [],
  notes: (r.notes as string) ?? undefined, companionId: (r.companion_id as string) ?? undefined, done: !!r.done,
  metrics: (r.metrics as Checkup['metrics']) ?? [], result: (r.result as string) ?? undefined, visibility: r.visibility as Checkup['visibility'],
  bringItems: (r.bring_items as Checkup['bringItems']) ?? [],
  photos: (r.photos as string[]) ?? [],
});
const fromCheckup = (c: Checkup, fid: string): Row => ({
  id: c.id, family_id: fid, title: c.title, week_from: c.weekFrom, week_to: c.weekTo, date: c.date ?? null, hospital: c.hospital ?? null,
  items: c.items, notes: c.notes ?? null, companion_id: c.companionId ?? null, done: c.done, metrics: c.metrics, result: c.result ?? null,
  visibility: c.visibility, bring_items: c.bringItems ?? [], photos: (c.photos ?? []).filter((p) => !isLocalPhoto(p)), updated_at: new Date().toISOString(),
});
const toSupplement = (r: Row): Supplement => ({
  id: r.id as string, name: r.name as string, dose: (r.dose as string) ?? '', timeOfDay: (r.time_of_day as string) ?? '08:00',
  weekFrom: (r.week_from as number) ?? 0, weekTo: (r.week_to as number) ?? 40, note: (r.note as string) ?? undefined, active: !!r.active, visibility: r.visibility as Supplement['visibility'],
});
const fromSupplement = (s: Supplement, fid: string): Row => ({ id: s.id, family_id: fid, name: s.name, dose: s.dose, time_of_day: s.timeOfDay, week_from: s.weekFrom, week_to: s.weekTo, note: s.note ?? null, active: s.active, visibility: s.visibility });
const toSupLog = (r: Row): SupplementLog => ({ id: r.id as string, supplementId: r.supplement_id as string, date: r.date as string, byId: r.by_id as string, at: r.at as string });
const fromSupLog = (l: SupplementLog, fid: string): Row => ({ id: l.id, family_id: fid, supplement_id: l.supplementId, date: l.date, by_id: l.byId, at: l.at });
const toLog = (r: Row): DailyLog => ({ id: r.id as string, kind: r.kind as DailyLog['kind'], date: r.date as string, value: r.value == null ? undefined : Number(r.value), text: (r.text as string) ?? undefined, byId: r.by_id as string, at: r.at as string, visibility: r.visibility as DailyLog['visibility'] });
const fromLog = (l: DailyLog, fid: string): Row => ({ id: l.id, family_id: fid, kind: l.kind, date: l.date, value: l.value ?? null, text: l.text ?? null, by_id: l.byId, at: l.at, visibility: l.visibility });
const toActivity = (r: Row, comments: Row[]): Activity => ({
  id: r.id as string, at: r.at as string, byId: r.by_id as string, kind: r.kind as Activity['kind'], text: r.text as string,
  refId: (r.ref_id as string) ?? undefined, visibility: r.visibility as Activity['visibility'], likes: (r.likes as string[]) ?? [],
  comments: comments.filter((c) => c.activity_id === r.id).map((c) => ({ id: c.id as string, byId: c.by_id as string, text: c.text as string, at: c.at as string })).sort((a, b) => (a.at < b.at ? -1 : 1)),
});
const fromActivity = (a: Activity, fid: string): Row => ({ id: a.id, family_id: fid, by_id: a.byId, kind: a.kind, text: a.text, ref_id: a.refId ?? null, visibility: a.visibility, likes: a.likes, at: a.at });
const toPregnancy = (f: Row): Pregnancy => ({ dueDate: f.due_date as string, lmp: (f.lmp as string) ?? undefined, momName: f.mom_name as string, babyNickname: (f.baby_nickname as string) ?? undefined });

// ---------- RPC ----------
export async function createFamilyRemote(p: Pregnancy, memberId: string) {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Shanghai';
  const { data, error } = await supabase!.rpc('create_family', { p_due_date: p.dueDate, p_lmp: p.lmp ?? null, p_mom_name: p.momName, p_baby_nickname: p.babyNickname ?? null, p_member_id: memberId, p_tz: tz });
  if (error) throw error;
  return data as { family_id: string; invite_code: string; member_id: string };
}

export async function joinFamilyRemote(code: string, name: string, role: Role, relation: string | undefined, memberId: string) {
  const { data, error } = await supabase!.rpc('join_family', { p_code: code, p_name: name, p_role: role, p_relation: relation ?? null, p_member_id: memberId });
  if (error) throw new Error(friendly(error.message));
  const d = data as { family_id: string; member_id: string; family: Row };
  return { familyId: d.family_id, memberId: d.member_id, pregnancy: toPregnancy(d.family), inviteCode: d.family.invite_code as string };
}

export async function myFamilyRemote() {
  const { data, error } = await supabase!.rpc('my_family');
  if (error || !data) return null;
  const d = data as { family: Row; member_id: string };
  return { familyId: d.family.id as string, memberId: d.member_id, pregnancy: toPregnancy(d.family), inviteCode: d.family.invite_code as string };
}

function friendly(msg: string): string {
  if (msg.includes('invite code not found')) return tr('邀请码不对，再核对一下');
  if (msg.includes('already a member')) return tr('你已经在这个家庭里了');
  if (msg.includes('dad already exists')) return tr('这个家庭已经有准爸爸了，请选"家人"');
  return msg;
}

// ---------- 拉取 ----------
export type RemoteSlices = Pick<AppState, 'members' | 'checkups' | 'supplements' | 'supplementLogs' | 'logs' | 'activities'>;

export async function pullAll(fid: string): Promise<RemoteSlices> {
  const sb = supabase!;
  const q = (t: string) => sb.from(t).select('*').eq('family_id', fid);
  const [m, c, s, sl, l, a] = await Promise.all([q('members'), q('checkups'), q('supplements'), q('supplement_logs'), q('daily_logs'), q('activities')]);
  const firstErr = [m, c, s, sl, l, a].find((r) => r.error)?.error;
  if (firstErr) throw firstErr;
  const actRows = (a.data ?? []) as Row[];
  const cm = actRows.length ? await sb.from('comments').select('*').in('activity_id', actRows.map((r) => r.id as string)) : { data: [] as Row[] };
  return {
    members: ((m.data ?? []) as Row[]).map(toMember),
    checkups: ((c.data ?? []) as Row[]).map(toCheckup),
    supplements: ((s.data ?? []) as Row[]).map(toSupplement),
    supplementLogs: ((sl.data ?? []) as Row[]).map(toSupLog),
    logs: ((l.data ?? []) as Row[]).map(toLog),
    activities: actRows.map((r) => toActivity(r, (cm.data ?? []) as Row[])).sort((x, y) => (x.at < y.at ? 1 : -1)),
  };
}

// ---------- 推送差异 ----------
async function diffTable<T extends { id: string }>(table: string, prev: T[], next: T[], toRow: (t: T) => Row) {
  const sb = supabase!;
  const prevById = new Map(prev.map((x) => [x.id, JSON.stringify(x)]));
  const changed = next.filter((x) => prevById.get(x.id) !== JSON.stringify(x));
  const nextIds = new Set(next.map((x) => x.id));
  const removed = prev.filter((x) => !nextIds.has(x.id)).map((x) => x.id);
  // 先删后写：避免“删掉旧行再写同一天新行”时撞唯一约束
  if (removed.length) {
    const { error } = await sb.from(table).delete().in('id', removed);
    if (error) throw new Error(`${table} 删除失败：${error.message}`);
  }
  if (changed.length) {
    const { error } = await sb.from(table).upsert(changed.map(toRow));
    if (error) throw new Error(`${table} 写入失败：${error.message}`);
  }
}

export async function pushDiff(prev: AppState, next: AppState, fid: string) {
  const cloudPhotos = (c: Checkup) => ({ ...c, photos: (c.photos ?? []).filter((p) => !isLocalPhoto(p)) });
  await diffTable('checkups', prev.checkups.map(cloudPhotos), next.checkups.map(cloudPhotos), (c) => fromCheckup(c, fid));
  await diffTable('supplements', prev.supplements, next.supplements, (s) => fromSupplement(s, fid));
  await diffTable('supplement_logs', prev.supplementLogs, next.supplementLogs, (l) => fromSupLog(l, fid));
  await diffTable('daily_logs', prev.logs, next.logs, (l) => fromLog(l, fid));
  // 动态本体（不含评论）
  const strip = (a: Activity) => ({ ...a, comments: [] });
  await diffTable('activities', prev.activities.map(strip), next.activities.map(strip), (a) => fromActivity(a, fid));
  // 评论只增不删
  const prevCm = new Set(prev.activities.flatMap((a) => a.comments.map((c) => c.id)));
  const newCm = next.activities.flatMap((a) => a.comments.filter((c) => !prevCm.has(c.id)).map((c) => ({ id: c.id, activity_id: a.id, by_id: c.byId, text: c.text, at: c.at })));
  if (newCm.length) {
    const { error } = await supabase!.from('comments').upsert(newCm);
    if (error) throw error;
  }
  // 成员：只处理移除（加入走 RPC）
  const nextM = new Set(next.members.map((m) => m.id));
  const removedM = prev.members.filter((m) => !nextM.has(m.id)).map((m) => m.id);
  if (removedM.length) {
    const { error } = await supabase!.from('members').delete().in('id', removedM);
    if (error) throw error;
  }
}

// ---------- 客户端错误上报（排查同步问题用；只存文本，不含记录内容） ----------
let lastReport = 0;
export async function reportClientError(fid: string, memberId: string, message: string) {
  if (!supabase || Date.now() - lastReport < 60_000) return;
  lastReport = Date.now();
  try { await supabase.from('client_errors').insert({ family_id: fid, member_id: memberId, message: message.slice(0, 500) }); } catch {}
}

// ---------- 实时 ----------
export function subscribe(fid: string, onChange: () => void) {
  const ch = supabase!.channel(`family:${fid}`);
  for (const t of ['members', 'checkups', 'supplements', 'supplement_logs', 'daily_logs', 'activities']) {
    ch.on('postgres_changes', { event: '*', schema: 'public', table: t, filter: `family_id=eq.${fid}` }, onChange);
  }
  ch.on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, onChange);
  ch.subscribe();
  return () => { supabase!.removeChannel(ch); };
}
