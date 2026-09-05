// 中国常规产检时间表（参考北京/深圳三甲医院公开流程，医院之间略有差异）
import type { Checkup } from './types';

type T = Omit<Checkup, 'id' | 'done' | 'metrics' | 'visibility' | 'fromTemplate' | 'date' | 'companionId'>;

export const CHECKUP_TEMPLATES: T[] = [
  { title: '早孕确认', weekFrom: 6, weekTo: 8, items: ['B 超确认宫内孕、胎心', '血 HCG / 孕酮'], notes: 'B 超可能需憋尿' },
  { title: '建档', weekFrom: 6, weekTo: 12, items: ['空腹抽血（血常规、血型、肝肾功能、传染病）', '尿常规', '心电图', '腹部彩超'], notes: '空腹。带双方身份证、母子健康手册、早期 B 超单' },
  { title: 'NT 检查', weekFrom: 11, weekTo: 13, items: ['NT 超声（颈项透明层）'], notes: '不需空腹、不需憋尿。NT < 2.5–3 mm 为正常' },
  { title: '唐筛 / 无创 DNA', weekFrom: 16, weekTo: 18, items: ['唐氏筛查抽血 或 无创 DNA'], notes: '唐筛需空腹；无创不需' },
  { title: '常规产检', weekFrom: 20, weekTo: 20, items: ['血压', '体重', '宫高腹围', '胎心'], notes: '' },
  { title: '大排畸', weekFrom: 22, weekTo: 24, items: ['系统超声（四维/三维）'], notes: '不需空腹。吃饱、适当活动，让宝宝动起来。可能需要多次' },
  { title: '糖耐（OGTT）', weekFrom: 24, weekTo: 28, items: ['空腹血糖', '喝糖水后 1 小时血糖', '2 小时血糖'], notes: '前一晚 22:00 后禁食禁水；5 分钟内喝完糖水；参考 5.1 / 10.0 / 8.5 mmol/L' },
  { title: '常规产检', weekFrom: 30, weekTo: 30, items: ['血压', '体重', '宫高腹围', '胎心', '血常规、尿常规'], notes: '' },
  { title: '常规产检 + B 超', weekFrom: 32, weekTo: 32, items: ['B 超（胎位、羊水、胎盘）', '血压体重', '胎心'], notes: '' },
  { title: '常规产检', weekFrom: 34, weekTo: 34, items: ['血压', '体重', '宫高腹围', '胎心'], notes: '' },
  { title: '胎心监护 + B 族链球菌', weekFrom: 36, weekTo: 36, items: ['胎心监护（NST）', 'GBS 筛查', '血常规'], notes: '36 周起每周一次' },
  { title: '胎心监护', weekFrom: 37, weekTo: 37, items: ['胎心监护', '血压体重'], notes: '' },
  { title: '胎心监护 + B 超估重', weekFrom: 38, weekTo: 38, items: ['胎心监护', 'B 超估重、羊水'], notes: '' },
  { title: '胎心监护', weekFrom: 39, weekTo: 39, items: ['胎心监护', '血压体重'], notes: '' },
  { title: '足月产检', weekFrom: 40, weekTo: 40, items: ['胎心监护', '评估分娩方式'], notes: '准备待产包' },
];

export const METRIC_DEFS: { key: string; label: string; unit: string; ref: string; low?: number; high?: number }[] = [
  { key: 'bp_sys', label: '收缩压', unit: 'mmHg', ref: '90–139', low: 90, high: 139 },
  { key: 'bp_dia', label: '舒张压', unit: 'mmHg', ref: '60–89', low: 60, high: 89 },
  { key: 'weight', label: '体重', unit: 'kg', ref: '按孕周增重' },
  { key: 'fundal_height', label: '宫高', unit: 'cm', ref: '≈ 孕周 ± 3' },
  { key: 'abdominal', label: '腹围', unit: 'cm', ref: '—' },
  { key: 'fhr', label: '胎心率', unit: '次/分', ref: '110–160', low: 110, high: 160 },
  { key: 'glucose', label: '空腹血糖', unit: 'mmol/L', ref: '< 5.1', high: 5.1 },
  { key: 'hb', label: '血红蛋白', unit: 'g/L', ref: '≥ 110', low: 110 },
];

export function metricFlag(key: string, value: number): 'ok' | 'high' | 'low' | 'na' {
  const d = METRIC_DEFS.find((m) => m.key === key);
  if (!d || (d.low === undefined && d.high === undefined)) return 'na';
  if (d.high !== undefined && value > d.high) return 'high';
  if (d.low !== undefined && value < d.low) return 'low';
  return 'ok';
}
