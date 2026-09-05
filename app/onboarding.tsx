import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store/store';
import { Body, Body2, Button, Caption, Field, H1, Screen } from '../src/components/ui';
import { colors, space } from '../src/theme';
import { addDays, dueFromLmp, today, uid } from '../src/lib/pregnancy';

export default function Onboarding() {
  const { dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'lmp' | 'due'>('lmp');
  const [date, setDate] = useState(addDays(today(), -70)); // 默认示例：孕 10 周
  const [nick, setNick] = useState('');

  const valid = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const dueDate = mode === 'lmp' ? dueFromLmp(date) : date;

  const start = () => {
    if (!valid) return;
    dispatch({
      type: 'setup',
      pregnancy: { dueDate, lmp: mode === 'lmp' ? date : undefined, momName: name.trim(), babyNickname: nick.trim() || undefined },
      me: { id: uid(), name: name.trim(), role: 'mom', joinedAt: new Date().toISOString() },
    });
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Caption style={{ marginBottom: 8 }}>幸运宝贝 · 一家人一起记录的孕期</Caption>
          <H1 style={{ marginBottom: 12 }}>你好，准妈妈</H1>
          <Body2 style={{ marginBottom: space.xxl }}>先由你建立这个家庭。之后用邀请码把准爸爸和家人加进来，他们能看到什么由你决定。</Body2>

          <Field label="你的称呼" value={name} onChange={setName} placeholder="例如：小雨" />

          <Caption style={{ marginBottom: 6 }}>推算孕周的方式</Caption>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.lg }}>
            {(['lmp', 'due'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMode(m)}
                style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: mode === m ? colors.pine : colors.line, backgroundColor: mode === m ? colors.pineSoft : colors.card }}
              >
                <Text style={{ fontWeight: '700', color: mode === m ? colors.pine : colors.ink2, textAlign: 'center' }}>{m === 'lmp' ? '末次月经' : '医生给的预产期'}</Text>
              </Pressable>
            ))}
          </View>

          <Field label={mode === 'lmp' ? '末次月经第一天（YYYY-MM-DD）' : '预产期（YYYY-MM-DD）'} value={date} onChange={setDate} placeholder="2026-06-26" keyboardType="numeric" />
          {valid && (
            <Body style={{ marginTop: -8, marginBottom: space.lg, color: colors.pine }}>
              预产期 {dueDate}
            </Body>
          )}

          <Field label="宝宝小名（可选）" value={nick} onChange={setNick} placeholder="例如：小豆子" />

          <Button title="建立家庭" onPress={start} disabled={!valid} style={{ marginTop: space.md }} />
          <Caption style={{ marginTop: space.lg, textAlign: 'center' }}>数据只存在你的手机里。不做社区，不做广告，不卖数据。</Caption>
          <Pressable onPress={() => dispatch({ type: 'seedDemo' })} style={{ marginTop: space.xl, alignItems: 'center' }}>
            <Caption style={{ color: colors.pine, fontWeight: '700' }}>先用示例家庭看看</Caption>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
