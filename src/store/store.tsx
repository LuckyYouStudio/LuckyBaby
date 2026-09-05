import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Activity, AppState, Checkup, DailyLog, Member, Pregnancy, Supplement, SupplementLog, Visibility } from '../data/types';
import { CHECKUP_TEMPLATES } from '../data/schedule';
import { SUPPLEMENT_TEMPLATES } from '../data/supplements';
import { dateOfWeek, gestation, today, uid } from '../lib/pregnancy';
import { demoState } from './demo';

const KEY = 'luckybaby.state.v1';

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
};

type Action =
  | { type: 'hydrate'; state: AppState }
  | { type: 'setup'; pregnancy: Pregnancy; me: Member }
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
  | { type: 'post'; byId: string; text: string };

function act(byId: string, kind: Activity['kind'], text: string, visibility: Visibility = 'family', refId?: string): Activity {
  return { id: uid(), at: new Date().toISOString(), byId, kind, text, refId, visibility, likes: [], comments: [] };
}

function seedFromTemplates(dueDate: string): { checkups: Checkup[]; supplements: Supplement[] } {
  const checkups: Checkup[] = CHECKUP_TEMPLATES.map((t) => ({
    ...t,
    id: uid(),
    date: dateOfWeek(dueDate, t.weekFrom),
    done: false,
    metrics: [],
    visibility: 'partner',
    fromTemplate: true,
  }));
  const supplements: Supplement[] = SUPPLEMENT_TEMPLATES.map((t) => ({
    ...t,
    id: uid(),
    active: true,
    visibility: 'partner',
  }));
  return { checkups, supplements };
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
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const first = act(a.me.id, 'system', `${a.me.name} 创建了家庭，预产期 ${a.pregnancy.dueDate}`);
      return {
        ...emptyState,
        onboarded: true,
        meId: a.me.id,
        familyCode: code,
        pregnancy: a.pregnancy,
        members: [a.me],
        ...seeded,
        activities: [first],
      };
    }
    case 'addMember':
      return {
        ...s,
        members: [...s.members, a.member],
        activities: [act(a.member.id, 'family', `${a.member.name} 加入了家庭`), ...s.activities],
      };
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
      const log: SupplementLog = { id: uid(), supplementId: a.supplementId, date: a.date, byId: a.byId, at: new Date().toISOString() };
      const sup = s.supplements.find((x) => x.id === a.supplementId);
      const by = s.members.find((m) => m.id === a.byId);
      const text = by?.role === 'mom' ? `吃了${sup?.name ?? '补充剂'}` : `帮她记了一次${sup?.name ?? '补充剂'}`;
      return { ...s, supplementLogs: [...s.supplementLogs, log], activities: [act(a.byId, 'supplement', text, 'partner', log.id), ...s.activities] };
    }
    case 'addLog': {
      const activities = a.activity ? [act(a.log.byId, 'log', a.activity, a.log.visibility, a.log.id), ...s.activities] : s.activities;
      return { ...s, logs: [...s.logs, a.log], activities };
    }
    case 'deleteLog':
      return { ...s, logs: s.logs.filter((l) => l.id !== a.id) };
    case 'like':
      return {
        ...s,
        activities: s.activities.map((x) =>
          x.id !== a.activityId ? x : { ...x, likes: x.likes.includes(a.byId) ? x.likes.filter((i) => i !== a.byId) : [...x.likes, a.byId] },
        ),
      };
    case 'comment':
      return {
        ...s,
        activities: s.activities.map((x) =>
          x.id !== a.activityId ? x : { ...x, comments: [...x.comments, { id: uid(), byId: a.byId, text: a.text, at: new Date().toISOString() }] },
        ),
      };
    case 'post':
      return { ...s, activities: [act(a.byId, 'log', a.text, 'family'), ...s.activities] };
    default:
      return s;
  }
}

const Ctx = createContext<{ state: AppState; dispatch: React.Dispatch<Action>; ready: boolean } | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, emptyState);
  const [ready, setReady] = React.useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'hydrate', state: { ...emptyState, ...JSON.parse(raw) } });
      })
      .catch(() => {})
      .finally(() => {
        hydrated.current = true;
        setReady(true);
      });
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  const value = useMemo(() => ({ state, dispatch, ready }), [state, ready]);
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
