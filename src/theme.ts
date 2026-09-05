// 视觉：纸张感米白 + 深松绿 + 杏色。每个角色一个颜色。
// colors 是可变对象：applyTheme() 会原地替换成浅色/深色调色板，订阅了 store 的组件重渲染后即生效。
export type ThemeMode = 'system' | 'light' | 'dark';

const light = {
  paper: '#F5F6F2',
  paper2: '#EBEDE6',
  card: '#FFFFFF',
  ink: '#1F2A24',
  ink2: '#4B5750',
  ink3: '#7C877F',
  line: '#D5D9D1',
  pine: '#2E5E4E',
  pineSoft: '#DDE8E1',
  onPine: '#FFFFFF', // 松绿底上的文字
  apricot: '#D9884F',
  apricotSoft: '#F6E3D3',
  slate: '#6F84A0',
  slateSoft: '#E1E7EE',
  warn: '#B9482A',
  warnSoft: '#F3DCD4',
  ok: '#2E5E4E',
};

// 夜里起夜看：低亮度、低对比但仍清晰，不用纯黑
const dark: typeof light = {
  paper: '#171B18',
  paper2: '#1F2521',
  card: '#1D2320',
  ink: '#E6EAE4',
  ink2: '#B4BDB6',
  ink3: '#7F8983',
  line: '#2E3630',
  pine: '#8FC3AE',
  pineSoft: '#22352D',
  onPine: '#10201A',
  apricot: '#E6A06F',
  apricotSoft: '#3B2A1E',
  slate: '#9BB0CB',
  slateSoft: '#232B36',
  warn: '#E07A5B',
  warnSoft: '#3A241E',
  ok: '#8FC3AE',
};

export const colors = { ...light };
export let isDark = false;

export function applyTheme(darkMode: boolean) {
  isDark = darkMode;
  Object.assign(colors, darkMode ? dark : light);
}

/** 字号倍率：标准 1、大 1.15、特大 1.3 */
export let fontScale = 1;
export function setFontScale(n: number) {
  fontScale = n;
}
const fs = (n: number) => Math.round(n * fontScale);

export const roleColor = {
  get mom() { return { fg: colors.pine, bg: colors.pineSoft, label: '准妈妈' }; },
  get dad() { return { fg: colors.apricot, bg: colors.apricotSoft, label: '准爸爸' }; },
  get family() { return { fg: colors.slate, bg: colors.slateSoft, label: '家人' }; },
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 6, md: 10, lg: 14 };

export const type = {
  get h1() { return { fontSize: fs(28), fontWeight: '700' as const, color: colors.ink, letterSpacing: 0.3 }; },
  get h2() { return { fontSize: fs(20), fontWeight: '700' as const, color: colors.ink }; },
  get h3() { return { fontSize: fs(16), fontWeight: '700' as const, color: colors.ink }; },
  get body() { return { fontSize: fs(16), color: colors.ink, lineHeight: fs(24) }; },
  get body2() { return { fontSize: fs(14), color: colors.ink2, lineHeight: fs(21) }; },
  get caption() { return { fontSize: fs(12), color: colors.ink3, letterSpacing: 0.4, lineHeight: fs(17) }; },
};
