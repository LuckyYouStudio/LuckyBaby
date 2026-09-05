import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { AppState as AppStateRN } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Activity, AppState, Checkup, DailyLog, Member, Pregnancy, Supplement, SupplementLog, Visibility } from '../data/types';
import { CHECKUP_TEMPLATES, defaultBring, defaultPacking } from '../data/schedule';
import { SUPPLEMENT_TEMPLATES } from '../data/supplements';
import { dateOfWeek, gestation, today, uid } from '../lib/pregnancy';
import { demoState } from './demo';
import { cloudEnabled, ensureSession, supabase } from '../lib/supabase';
import { myFamilyRemote, pullAll, pushDiff, reportClientError, subscribe, type CloudInfo, type RemoteSlices } from './sync';
import { cancelReminders, rescheduleReminders } from '../lib/reminders';
import { registerPushToken } from '../lib/push';
import { alert } from '../lib/alert';
import { tr } from '../i18n';

const KEY = 'luckybaby.state.v1';
const SYNCED_KEY = 'luckybaby.synced.v1'; // 上次与云端一致的快照

export const emptyState: AppState = {
  onboarded: false,
  meId: '',
  familyCode: '',
  pregnancy: { dueDate: '', momName: '' },
  members: [],
  checkups: [],
  supplements: [],
  supplementLogs: [],
  logs: [],
  activities: [],
  cloud: null,
};

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline';

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'setup'; pregnancy: Pregnancy; me: Member; familyCode?: string; cloud?: CloudInfo }
  | { type: 'joinFamily'; pregnancy: Pregnancy; me: Member; familyCode: string; cloud: CloudInfo; slices: RemoteSlices }
  | { type: 'applyRemote'; slices: RemoteSlices; lastSynced: AppState }
  | { type: 'reset' }
  | { type: 'seedDemo' }
  | { type: 'addMember'; member: Member }
  | { type: 'removeMember'; id: string }
  | { type: 'switchMe'; id: string }
  | { type: 'upsertCheckup'; checkup: Checkup; activity?: string }
  | { type: 'deleteCheckup'; id: string }
  | { type: 'upsertSupplement'; supplement: Supplement }
  | { type: 'toggleSupplementLog'; supplementId: string; date: string; byId: string }
  | { type: 'addLog'; log: DailyLog; activity?: string }
  | { type: 'deleteLog'; id: string }
  | { type: 'like'; activityId: string; byId: string }
  | { type: 'comment'; activityId: string; byId: string; text: string }
  | { type: 'post'; byId: string; text: string }
  | { type: 'setReminders'; enabled: boolean }
  | { type: 'setCloudUser'; userId: string; bound: boolean }
  | { type: 'setSettings'; settings: Partial<NonNullable<AppState['settings']>> }
  | { type: 'togglePacking'; id: string; byId: string }
  | { type: 'addPacking'; group: string; text: string };

/** 把日期编进 supplementId 的末 12 位，得到一个确定的合法 UUID */
function logIdFor(supplementId: string, date: string) {
  const digits = date.replace(/-/g, '').padEnd(12, '0').slice(0, 12);
  return /^[0-9a-f-]{36}$/i.test(supplementId) ? supplementId.slice(0, 24) + digits : `${supplementId}-${date}`;
}

function act(byId: string, kind: Activity['kind'], text: string, visibility: Visibility = 'family', refId?: string): Activity {
  return { id: uid(), at: new Date().toISOString(), byId, kind, text, refId, visibility, likes: [], comments: [] };
}

function seedFromTemplates(dueDate: string): { checkups: Checkup[]; supplements: Supplement[] } {
  const checkups: Checkup[] = CHECKUP_TEMPLATES.map((t) => ({ ...t, id: uid(), date: dateOfWeek(dueDate, t.weekFrom), done: false, metrics: [], visibility: 'partner', fromTemplate: true, bringItems: defaultBring(t.notes) }));
  const supplements: Supplement[] = SUPPLEMENT_TEMPLATES.map((t) => ({ ...t, id: uid(), active: true, visibility: 'partner' }));
  return { checkups, supplements };
}

/** 服务端数据为底，保留本地尚未同步的改动 */
function mergeSlice<T extends { id: string }>(server: T[], local: T[], synced: T[]): T[] {
  const syncedById = new Map(synced.map((x) => [x.id, JSON.stringify(x)]));
  const localById = new Map(local.map((x) => [x.id, x]));
  const out = new Map(server.map((x) => [x.id, x]));
  for (const x of local) if (syncedById.get(x.id) !== JSON.stringify(x)) out.set(x.id, x); // 本地新增或修改
  for (const s of synced) if (!localById.has(s.id)) out.delete(s.id); // 本地删除
  return [...out.values()];
}

function reducer(s: AppState, a: Action): AppState {
  switch (a.type) {
    case 'hydrate':
      return a.state;
    case 'reset':
      return emptyState;
    case 'seedDemo':
      return demoState();
    case 'setup': {
      const seeded = seedFromTemplates(a.pregnancy.dueDate);
      const code = a.familyCode ?? Math.random().toString(36).slice(2, 8).toUpperCase();
      const first = act(a.me.id, 'system', `${a.me.name} 创建了家庭，预产期 ${a.pregnancy.dueDate}`);
      return { ...emptyState, onboarded: true, meId: a.me.id, familyCode: code, pregnancy: a.pregnancy, members: [a.me], ...seeded, activities: [first], cloud: a.cloud ?? null };
    }
    case 'joinFamily':
      return { ...emptyState, onboarded: true, meId: a.me.id, familyCode: a.familyCode, pregnancy: a.pregnancy, cloud: a.cloud, ...a.slices, members: a.slices.members.some((m) => m.id === a.me.id) ? a.slices.members : [...a.slices.members, a.me] };
    case 'applyRemote': {
      const L = a.lastSynced;
      const activities = mergeSlice(a.slices.activities, s.activities, L.activities).sort((x, y) => (x.at < y.at ? 1 : -1));
      return {
        ...s,
        members: mergeSlice(a.slices.members, s.members, L.members),
        // 云端照片以服务端为准；本机还没传上去的 file:// 照片保留
        checkups: mergeSlice(a.slices.checkups, s.checkups, L.checkups).map((c) => {
          const local = (s.checkups.find((x) => x.id === c.id)?.photos ?? []).filter((p) => /^(file|ph|assets-library|content):/.test(p));
          const cloud = (c.photos ?? []).filter((p) => !local.includes(p));
          return { ...c, photos: [...cloud, ...local] };
        }),
        supplements: mergeSlice(a.slices.supplements, s.supplements, L.supplements),
        supplementLogs: mergeSlice(a.slices.supplementLogs, s.supplementLogs, L.supplementLogs),
        logs: mergeSlice(a.slices.logs, s.logs, L.logs),
        activities,
      };
    }
    case 'addMember':
      return { ...s, members: [...s.members, a.member], activities: [act(a.member.id, 'family', `${a.member.name} 加入了家庭`), ...s.activities] };
    case 'removeMember':
      return { ...s, members: s.members.filter((m) => m.id !== a.id) };
    case 'switchMe':
      return { ...s, meId: a.id };
    case 'upsertCheckup': {
      const exists = s.checkups.some((c) => c.id === a.checkup.id);
      const checkups = exists ? s.checkups.map((c) => (c.id === a.checkup.id ? a.checkup : c)) : [...s.checkups, a.checkup];
      const activities = a.activity ? [act(s.meId, 'checkup', a.activity, a.checkup.visibility, a.checkup.id), ...s.activities] : s.activities;
      return { ...s, checkups, activities };
    }
    case 'deleteCheckup':
      return { ...s, checkups: s.checkups.filter((c) => c.id !== a.id) };
    case 'upsertSupplement': {
      const exists = s.supplements.some((c) => c.id === a.supplement.id);
      const supplements = exists ? s.supplements.map((c) => (c.id === a.supplement.id ? a.supplement : c)) : [...s.supplements, a.supplement];
      return { ...s, supplements };
    }
    case 'toggleSupplementLog': {
      const found = s.supplementLogs.find((l) => l.supplementId === a.supplementId && l.date === a.date);
      if (found) return { ...s, supplementLogs: s.supplementLogs.filter((l) => l.id !== found.id) };
      // 同一补充剂同一天的打卡 id 固定：两台手机同时记也不会撞唯一约束，后写的覆盖
      const log: SupplementLog = { id: logIdFor(a.supplementId, a.date), supplementId: a.supplementId, date: a.date, byId: a.byId, at: new Date().toISOString() };
      const sup = s.supplements.find((x) => x.id === a.supplementId);
      const by = s.members.find((m) => m.id === a.byId);
      const text = by?.role === 'mom' ? `吃了${sup?.name ?? tr('补充剂')}` : `帮她记了一次${sup?.name ?? tr('补充剂')}`;
      return { ...s, supplementLogs: [...s.supplementLogs, log], activities: [act(a.byId, 'supplement', text, 'partner', log.id), ...s.activities] };
    }
    case 'addLog': {
      const activities = a.activity ? [act(a.log.byId, 'log', a.activity, a.log.visibility, a.log.id), ...s.activities] : s.activities;
      return { ...s, logs: [...s.logs, a.log], activities };
    }
    case 'deleteLog':
      // 连带删掉这条记录产生的动态（例如换了心情）
      return { ...s, logs: s.logs.filter((l) => l.id !== a.id), activities: s.activities.filter((x) => x.refId !== a.id) };
    case 'like':
      return { ...s, activities: s.activities.map((x) => (x.id !== a.activityId ? x : { ...x, likes: x.likes.includes(a.byId) ? x.likes.filter((i) => i !== a.byId) : [...x.likes, a.byId] })) };
    case 'comment':
      return { ...s, activities: s.activities.map((x) => (x.id !== a.activityId ? x : { ...x, comments: [...x.comments, { id: uid(), byId: a.byId, text: a.text, at: new Date().toISOString() }] })) };
    case 'post':
      return { ...s, activities: [act(a.byId, 'log', a.text, 'family'), ...s.activities] };
    case 'setReminders':
      return { ...s, remindersEnabled: a.enabled };
    case 'setCloudUser':
      return s.cloud ? { ...s, cloud: { ...s.cloud, userId: a.userId, bound: a.bound } } : s;
    case 'setSettings':
      return { ...s, settings: { theme: 'system', fontScale: 1, ...s.settings, ...a.settings } };
    case 'togglePacking': {
      const packing = (s.packing && s.packing.length ? s.packing : defaultPacking());
      return { ...s, packing: packing.map((p) => (p.id !== a.id ? p : { ...p, done: !p.done, byId: p.done ? undefined : a.byId })) };
    }
    case 'addPacking': {
      const packing = (s.packing && s.packing.length ? s.packing : defaultPacking());
      return { ...s, packing: [...packing, { id: uid(), group: a.group, text: a.text, done: false }] };
    }
    default:
      return s;
  }
}

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; ready: boolean; sync: SyncStatus; syncError: string; refresh: () => void } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, emptyState);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncStatus>('local');
  const [syncError, setSyncError] = useState('');
  const describe = (e: unknown) => { const m = (e as any)?.message ?? String(e); return /Network request failed|fetch/i.test(m) ? tr('网络不通') : m.slice(0, 80); };
  const hydrated = useRef(false);
  const lastSynced = useRef<AppState>(emptyState); // 上次与云端一致的快照
  const pushing = useRef(false);
  const failures = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // 1. 从本地恢复；若本地为空但云端有家庭（换设备/重装），拉回来
  useEffect(() => {
    (async () => {
      try {
        const [raw, rawSynced] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(SYNCED_KEY)]);
        if (raw) {
          const st = { ...emptyState, ...JSON.parse(raw) } as AppState;
          dispatch({ type: 'hydrate', state: st });
          // 没有快照时视为全部未同步：下次推送会把本地全量 upsert 一遍（幂等）
          if (st.cloud && rawSynced) lastSynced.current = { ...emptyState, ...JSON.parse(rawSynced) } as AppState;
        } else if (cloudEnabled) {
          const userId = await ensureSession();
          const mine = await myFamilyRemote();
          if (mine) {
            const slices = await pullAll(mine.familyId);
            const me = slices.members.find((m) => m.id === mine.memberId)!;
            dispatch({ type: 'joinFamily', pregnancy: mine.pregnancy, me, familyCode: mine.inviteCode, cloud: { familyId: mine.familyId, userId }, slices });
          }
        }
      } catch {}
      hydrated.current = true;
      setReady(true);
      // 绑定状态以当前登录会话为准
      if (supabase) {
        const { data } = await supabase.auth.getUser();
        const st = stateRef.current;
        if (data.user && st.cloud) dispatch({ type: 'setCloudUser', userId: data.user.id, bound: !data.user.is_anonymous });
      }
    })();
  }, []);

  // 2. 持久化
  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  // 3. 推送本地改动
  const push = async () => {
    const st = stateRef.current;
    if (!st.cloud || pushing.current) return;
    if (st === lastSynced.current) return;
    pushing.current = true;
    setSync('syncing');
    try {
      await pushDiff(lastSynced.current, st, st.cloud.familyId);
      lastSynced.current = st;
      AsyncStorage.setItem(SYNCED_KEY, JSON.stringify(st)).catch(() => {});
      setSync('synced'); setSyncError(''); failures.current = 0;
    } catch (e) {
      console.warn('[sync] push failed', e);
      const msg = describe(e);
      setSync('offline'); setSyncError(tr('上传失败：') + msg);
      failures.current += 1;
      // 不丢弃本地改动：把原因上报并显示出来，之后按 60 秒节奏继续重试
      if (msg !== tr('网络不通') && failures.current <= 3) reportClientError(st.cloud.familyId, st.meId, `push: ${msg}`);
    } finally {
      pushing.current = false;
      if (stateRef.current !== lastSynced.current && stateRef.current.cloud) setTimeout(push, failures.current ? 60_000 : 3000);
    }
  };
  useEffect(() => {
    if (!hydrated.current || !state.cloud) return;
    const t = setTimeout(push, 400);
    return () => clearTimeout(t);
  }, [state]);

  // 3b. 提醒：状态变化后重排（防抖）
  const reminderKey = JSON.stringify({ e: state.remindersEnabled, me: state.meId, c: state.checkups.map((c) => [c.id, c.date, c.done, c.hospital, c.bringItems]), s: state.supplements.map((x) => [x.id, x.active, x.timeOfDay, x.weekFrom, x.weekTo]), l: state.supplementLogs.filter((l) => l.date === today()).map((l) => l.supplementId), d: state.pregnancy.dueDate });
  useEffect(() => {
    if (!hydrated.current) return;
    if (!state.remindersEnabled) { cancelReminders(); return; }
    const t = setTimeout(() => rescheduleReminders(stateRef.current), 800);
    return () => clearTimeout(t);
  }, [reminderKey]);

  // 3c. 远程推送 token（有 EAS projectId 时才会真正登记）
  useEffect(() => {
    if (!state.cloud || !state.remindersEnabled || !state.meId) return;
    registerPushToken(state.meId, state.cloud.familyId);
  }, [state.cloud?.familyId, state.remindersEnabled, state.meId]);

  // 4. 拉取远端改动（实时 + 首次）
  const pull = async () => {
    const st = stateRef.current;
    if (!st.cloud) return;
    try {
      const slices = await pullAll(st.cloud.familyId);
      if (st.meId && !slices.members.some((m) => m.id === st.meId)) {
        // 被创建人移出了家庭（RLS 之后什么都拉不到，members 里也没有自己）
        dispatch({ type: 'reset' });
        AsyncStorage.multiRemove([KEY, SYNCED_KEY]).catch(() => {});
        lastSynced.current = emptyState;
        alert(tr('你已被移出这个家庭'), tr('本机的记录已清空。如果是误操作，可以凭邀请码重新加入。'));
        return;
      }
      dispatch({ type: 'applyRemote', slices, lastSynced: lastSynced.current });
      // 合并后的状态在下一轮 effect 里成为 stateRef；把 lastSynced 推进到"服务端快照 + 本地未同步改动"
      setTimeout(() => {
        const merged = stateRef.current;
        lastSynced.current = { ...merged, ...slices } as AppState;
        AsyncStorage.setItem(SYNCED_KEY, JSON.stringify(lastSynced.current)).catch(() => {});
        setSync('synced'); setSyncError('');
      }, 0);
      // 拉完顺便把没推上去的推一下
      if (stateRef.current !== lastSynced.current) push();
    } catch (e) {
      console.warn('[sync] pull failed', e);
      const msg = describe(e);
      setSync('offline'); setSyncError(tr('下载失败：') + msg);
      if (msg !== tr('网络不通')) reportClientError(st.cloud.familyId, st.meId, `pull: ${msg}`);
    }
  };
  useEffect(() => {
    if (!state.cloud) { setSync('local'); return; }
    pull();
    const unsub = subscribe(state.cloud.familyId, pull);
    // 回到前台就同步一次；实时通道不可用时每 60 秒轮询兜底
    const onAppState = (st: string) => { if (st === 'active') pull(); };
    const sub = AppStateRN.addEventListener('change', onAppState);
    const timer = setInterval(() => { if (AppStateRN.currentState === 'active') pull(); }, 60_000);
    return () => { unsub(); sub.remove(); clearInterval(timer); };
  }, [state.cloud?.familyId]);

  const value = useMemo(() => ({ state, dispatch, ready, sync, syncError, refresh: pull }), [state, ready, sync, syncError]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error('StoreProvider missing');
  return c;
}

/** 常用派生数据 */
export function useDerived() {
  const { state } = useStore();
  const me = state.members.find((m) => m.id === state.meId) ?? state.members[0];
  const g = state.pregnancy.dueDate ? gestation(state.pregnancy.dueDate) : { week: 0, day: 0, totalDays: 0, daysLeft: 280 };
  const t = today();
  const canSee = (v: Visibility) => {
    if (!me) return false;
    if (me.role === 'mom') return true;
    if (me.role === 'dad') return v !== 'self';
    return v === 'family';
  };
  const byId = (id: string) => state.members.find((m) => m.id === id);
  return { me, g, today: t, canSee, byId };
}
