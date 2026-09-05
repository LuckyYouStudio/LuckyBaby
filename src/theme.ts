// 视觉：纸张感米白 + 深松绿 + 杏色。每个角色一个颜色。
export const colors = {
  paper: '#F5F6F2',
  paper2: '#EBEDE6',
  card: '#FFFFFF',
  ink: '#1F2A24',
  ink2: '#4B5750',
  ink3: '#7C877F',
  line: '#D5D9D1',
  pine: '#2E5E4E',
  pineSoft: '#DDE8E1',
  apricot: '#D9884F',
  apricotSoft: '#F6E3D3',
  slate: '#6F84A0',
  slateSoft: '#E1E7EE',
  warn: '#B9482A',
  warnSoft: '#F3DCD4',
  ok: '#2E5E4E',
};

export const roleColor = {
  mom: { fg: colors.pine, bg: colors.pineSoft, label: '准妈妈' },
  dad: { fg: colors.apricot, bg: colors.apricotSoft, label: '准爸爸' },
  family: { fg: colors.slate, bg: colors.slateSoft, label: '家人' },
} as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radius = { sm: 6, md: 10, lg: 14 };

export const type = {
  h1: { fontSize: 28, fontWeight: '700' as const, color: colors.ink, letterSpacing: 0.3 },
  h2: { fontSize: 20, fontWeight: '700' as const, color: colors.ink },
  h3: { fontSize: 16, fontWeight: '700' as const, color: colors.ink },
  body: { fontSize: 16, color: colors.ink, lineHeight: 24 },
  body2: { fontSize: 14, color: colors.ink2, lineHeight: 21 },
  caption: { fontSize: 12, color: colors.ink3, letterSpacing: 0.4 },
  mono: { fontFamily: 'Menlo', fontVariant: ['tabular-nums'] as const },
};
