// 孕期信息：改预产期（按末次月经或医生给的日期）、宝宝小名
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../src/store/store';
import { Body, Body2, Button, Caption, Field, Screen } from '../src/components/ui';
import { colors, space } from '../src/theme';
import { dueFromLmp, lmpFromDue } from '../src/lib/pregnancy';
import { alert } from '../src/lib/alert';
import { tr } from '../src/i18n';

export default function PregnancyInfo() {
  const { state, dispatch } = useStore();
  const { me } = useDerived();
  const router = useRouter();
  const p = state.pregnancy;
  const [mode, setMode] = useState<'lmp' | 'due'>(p.lmp ? 'lmp' : 'due');
  const [date, setDate] = useState(p.lmp ?? lmpFromDue(p.dueDate));
  const [due, setDue] = useState(p.dueDate);
  const [nick, setNick] = useState(p.babyNickname ?? '');
  if (!me) return null;
  const ymd = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
  const newDue = mode === 'lmp' ? (ymd(date) ? dueFromLmp(date) : '') : due;
  const valid = mode === 'lmp' ? ymd(date) : ymd(due);

  const save = () => {
    if (!valid) { alert(tr('日期格式不对'), tr('请按 YYYY-MM-DD 填写，例如 2027-05-29。')); return; }
    dispatch({ type: 'updatePregnancy', dueDate: newDue, lmp: mode === 'lmp' ? date : undefined, babyNickname: nick.trim() || undefined, byId: me.id });
    router.back();
  };
  const Opt = ({ v, t }: { v: 'lmp' | 'due'; t: string }) => {
    const on = mode === v;
    return (
      <Pressable onPress={() => setMode(v)} style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: on ? colors.pine : colors.line, backgroundColor: on ? colors.pineSoft : colors.card }}>
        <Text style={{ fontWeight: '700', color: on ? colors.pine : colors.ink2, textAlign: 'center' }}>{t}</Text>
      </Pressable>
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Caption style={{ marginBottom: 6 }}>{tr('推算孕周的方式')}</Caption>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.lg }}>
          <Opt v="lmp" t={tr('末次月经')} /><Opt v="due" t={tr('医生给的预产期')} />
        </View>
        {mode === 'lmp'
          ? <Field label={tr('末次月经第一天（YYYY-MM-DD）')} value={date} onChange={setDate} placeholder="2026-08-22" keyboardType="numeric" />
          : <Field label={tr('预产期（YYYY-MM-DD）')} value={due} onChange={setDue} placeholder="2027-05-29" keyboardType="numeric" />}
        {valid && <Body style={{ marginTop: -8, marginBottom: space.lg, color: colors.pine }}>{tr('预产期')} {newDue}</Body>}
        <Field label={tr('宝宝小名（可选）')} value={nick} onChange={setNick} placeholder={tr('例如：小豆子')} />
        <Body2 style={{ marginBottom: space.lg }}>{tr('预产期一改，还没做的模板产检会按新日期重新排；你自己加的和已完成的不动。')}</Body2>
        <Button title={tr('保存修改')} onPress={save} disabled={!valid} />
      </ScrollView>
    </Screen>
  );
}
