import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useStore } from '../src/store/store';
import { Body, Body2, Caption, Card, Screen, Section } from '../src/components/ui';
import { colors, space, type ThemeMode } from '../src/theme';
import { tr } from '../src/i18n';

export default function Settings() {
  const { state, dispatch } = useStore();
  const theme = state.settings?.theme ?? 'system';
  const scale = state.settings?.fontScale ?? 1;
  const langPref = state.settings?.lang ?? 'system';
  const Opt = ({ value, cur, label, hint, onPick }: { value: string | number; cur: string | number; label: string; hint?: string; onPick: (v: never) => void }) => {
    const on = value === cur;
    return (
      <Pressable onPress={() => onPick(value as never)} style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: on ? colors.pine : colors.line, backgroundColor: on ? colors.pineSoft : colors.card, alignItems: 'center' }}>
        <Text style={{ fontWeight: '700', color: on ? colors.pine : colors.ink2 }}>{label}</Text>
        {!!hint && <Caption style={{ marginTop: 2 }}>{hint}</Caption>}
      </Pressable>
    );
  };
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }}>
        <Section title={tr("外观")}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Opt value="system" cur={theme} label={tr("跟随系统")} onPick={(v: ThemeMode) => dispatch({ type: 'setSettings', settings: { theme: v } })} />
            <Opt value="light" cur={theme} label={tr("浅色")} onPick={(v: ThemeMode) => dispatch({ type: 'setSettings', settings: { theme: v } })} />
            <Opt value="dark" cur={theme} label={tr("深色")} hint={tr("夜里看不刺眼")} onPick={(v: ThemeMode) => dispatch({ type: 'setSettings', settings: { theme: v } })} />
          </View>
        </Section>
        <Section title={tr("语言")}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Opt value="system" cur={langPref} label={tr("跟随系统")} onPick={(v: 'system' | 'zh' | 'en') => dispatch({ type: 'setSettings', settings: { lang: v } })} />
            <Opt value="zh" cur={langPref} label="中文" onPick={(v: 'system' | 'zh' | 'en') => dispatch({ type: 'setSettings', settings: { lang: v } })} />
            <Opt value="en" cur={langPref} label="English" onPick={(v: 'system' | 'zh' | 'en') => dispatch({ type: 'setSettings', settings: { lang: v } })} />
          </View>
        </Section>
        <Section title={tr("字号")}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Opt value={1} cur={scale} label={tr("标准")} onPick={(v: number) => dispatch({ type: 'setSettings', settings: { fontScale: v } })} />
            <Opt value={1.15} cur={scale} label={tr("大")} onPick={(v: number) => dispatch({ type: 'setSettings', settings: { fontScale: v } })} />
            <Opt value={1.3} cur={scale} label={tr("特大")} hint={tr("给长辈")} onPick={(v: number) => dispatch({ type: 'setSettings', settings: { fontScale: v } })} />
          </View>
          <Card style={{ marginTop: space.md }}>
            <Body>{tr('孕 25 周 3 天 · 像一颗白萝卜')}</Body>
            <Body2 style={{ marginTop: 4 }}>{tr('这是正文的样子。手机系统里的"文字大小"设置也会叠加生效。')}</Body2>
          </Card>
        </Section>
        <Caption style={{ marginTop: space.xl }}>{tr('这两项只影响这台手机，不会同步给家人。')}</Caption>
      </ScrollView>
    </Screen>
  );
}
