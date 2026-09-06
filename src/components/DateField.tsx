// 日期选择：点一下展开系统滚轮（iOS）或弹出系统日期框（Android），不用手敲 YYYY-MM-DD
import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Caption } from './ui';
import { colors, isDark, radius, space, type } from '../theme';
import { fmtFullDate, parseYmd, toYmd } from '../lib/pregnancy';
import { getLang, tr } from '../i18n';

const valid = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function DateField({ label, value, onChange, min, max, placeholder }: { label: string; value: string; onChange: (ymd: string) => void; min?: string; max?: string; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  const d = valid(value) ? parseYmd(value) : new Date();
  const pick = (dt?: Date) => { if (dt) onChange(toYmd(dt)); };
  return (
    <View style={{ marginBottom: space.lg }}>
      <Caption style={{ marginBottom: 6 }}>{label}</Caption>
      <Pressable onPress={() => setOpen((o) => !o)} style={{ borderWidth: 1, borderColor: open ? colors.pine : colors.line, borderRadius: radius.md, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[type.body, !valid(value) && { color: colors.ink3 }]}>{valid(value) ? fmtFullDate(value) : placeholder ?? tr('点击选择日期')}</Text>
        <Text style={{ color: colors.pine, fontWeight: '700' }}>{open ? tr('收起') : tr('选择')}</Text>
      </Pressable>
      {open && Platform.OS === 'ios' && (
        <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderTopWidth: 0, borderBottomLeftRadius: radius.md, borderBottomRightRadius: radius.md, alignItems: 'center', paddingBottom: 6, overflow: 'hidden', width: '100%' }}>
          <DateTimePicker value={d} mode="date" display="spinner" locale={getLang() === 'en' ? 'en-US' : 'zh-CN'} themeVariant={isDark ? 'dark' : 'light'} minimumDate={min ? parseYmd(min) : undefined} maximumDate={max ? parseYmd(max) : undefined} onChange={(_, dt) => pick(dt)} style={{ height: 180, alignSelf: 'stretch' }} />
          <Button title={tr('完成')} small kind="ghost" onPress={() => setOpen(false)} />
        </View>
      )}
      {open && Platform.OS !== 'ios' && (
        <DateTimePicker value={d} mode="date" display="default" minimumDate={min ? parseYmd(min) : undefined} maximumDate={max ? parseYmd(max) : undefined} onChange={(e, dt) => { setOpen(false); if (e.type === 'set') pick(dt); }} />
      )}
    </View>
  );
}
