import type { Supplement } from './types';

type T = Omit<Supplement, 'id' | 'active' | 'visibility'>;

// 参考：中国营养学会 / 各地卫健委科普。具体剂量以医嘱为准。
export const SUPPLEMENT_TEMPLATES: T[] = [
  { name: '叶酸', dose: '0.4–0.8 mg', timeOfDay: '08:00', weekFrom: 0, weekTo: 12, note: '孕前 3 个月至孕 12 周；高危孕妇按医嘱' },
  { name: '钙', dose: '600 mg', timeOfDay: '21:00', weekFrom: 14, weekTo: 40, note: '孕中期起；与铁剂错开 2 小时' },
  { name: '铁', dose: '按医嘱', timeOfDay: '12:00', weekFrom: 14, weekTo: 40, note: '饭后服，少喝茶和咖啡；可能引起便秘' },
  { name: 'DHA', dose: '200 mg', timeOfDay: '12:00', weekFrom: 14, weekTo: 40, note: '随餐服用' },
  { name: '维生素 D', dose: '400 IU', timeOfDay: '08:00', weekFrom: 0, weekTo: 40, note: '' },
];
