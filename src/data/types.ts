export type Role = 'mom' | 'dad' | 'family';
export type Visibility = 'self' | 'partner' | 'family';

export interface Member {
  id: string;
  name: string;
  role: Role;
  relation?: string; // 例如“外婆”“奶奶”
  joinedAt: string;
}

export interface Pregnancy {
  lmp?: string; // 末次月经 YYYY-MM-DD
  dueDate: string; // 预产期 YYYY-MM-DD
  momName: string;
  babyNickname?: string;
}

export interface CheckupMetric {
  key: string; // bp_sys, bp_dia, weight, fundal_height, abdominal, fhr, glucose, hb
  value: number;
  unit: string;
}

export interface Checkup {
  id: string;
  title: string;
  weekFrom: number; // 建议孕周
  weekTo: number;
  date?: string; // 实际/预约日期 YYYY-MM-DD
  hospital?: string;
  items: string[];
  notes?: string; // 注意事项（空腹/憋尿）
  companionId?: string; // 谁陪同
  done: boolean;
  metrics: CheckupMetric[];
  result?: string; // 结果备注
  visibility: Visibility;
  fromTemplate?: boolean;
  bringItems?: { text: string; done: boolean }[]; // 带什么
  photos?: string[]; // 报告照片（本机 URI，暂不同步）
}

export interface PackingItem {
  id: string;
  group: string; // 证件 / 妈妈 / 宝宝
  text: string;
  done: boolean;
  byId?: string; // 谁准备的
}

export interface Supplement {
  id: string;
  name: string;
  dose: string;
  timeOfDay: string; // HH:mm
  weekFrom: number;
  weekTo: number;
  note?: string;
  active: boolean;
  visibility: Visibility;
}

export interface SupplementLog {
  id: string;
  supplementId: string;
  date: string; // YYYY-MM-DD
  byId: string; // 谁打的卡
  at: string; // ISO
}

export type LogKind = 'weight' | 'symptom' | 'mood' | 'kick' | 'note' | 'contraction';

export interface DailyLog {
  id: string;
  kind: LogKind;
  date: string;
  value?: number; // 体重 kg / 胎动次数
  text?: string; // 症状、心情、备注
  byId: string;
  at: string;
  visibility: Visibility;
}

export interface Activity {
  id: string;
  at: string;
  byId: string;
  text: string;
  kind: 'checkup' | 'supplement' | 'log' | 'family' | 'system';
  refId?: string;
  visibility: Visibility;
  likes: string[]; // member ids
  comments: { id: string; byId: string; text: string; at: string }[];
}

export interface AppState {
  onboarded: boolean;
  meId: string; // 当前设备使用者
  familyCode: string;
  pregnancy: Pregnancy;
  members: Member[];
  checkups: Checkup[];
  supplements: Supplement[];
  supplementLogs: SupplementLog[];
  logs: DailyLog[];
  activities: Activity[];
  /** 云同步信息；null 为纯本地 */
  cloud: { familyId: string; userId: string } | null;
  /** 本地提醒是否已开启（产检前一天、补充剂） */
  remindersEnabled?: boolean;
  /** 待产包（本版本本机保存） */
  packing?: PackingItem[];
  /** 外观与字号（本机） */
  settings?: { theme: 'system' | 'light' | 'dark'; fontScale: number; lang?: 'system' | 'zh' | 'en' };
}
