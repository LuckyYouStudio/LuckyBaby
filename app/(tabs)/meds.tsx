import React, { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useDerived, useStore } from '../../src/store/store';
import { Body, Body2, Button, Caption, Card, Field, Pill, Row, Screen, Section } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { addDays, uid } from '../../src/lib/pregnancy';

export default function Meds() {
  const { state, dispatch } = useStore();
  const { me, g, today, canSee, byId } = useDerived();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState('08:00');
  if (!me) return null;

  const visible = state.supplements.filter((s) => canSee(s.visibility));
  const current = visible.filter((s) => s.active && g.week >= s.weekFrom && g.week <= s.weekTo);
  const later = visible.filter((s) => s.active && g.week < s.weekFrom);
  const past = visible.filter((s) => !s.active || g.week > s.weekTo);
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const logOf = (sid: string, d: string) => state.supplementLogs.find((l) => l.supplementId === sid && l.date === d);
  const readonly = me.role === 'family';

  const save = () => {
    if (!name.trim()) return;
    dispatch({ type: 'upsertSupplement', supplement: { id: uid(), name: name.trim(), dose: dose.trim() || '按医嘱', timeOfDay: time || '08:00', weekFrom: g.week, weekTo: 40, active: true, visibility: 'partner' } });
    setName(''); setDose(''); setAdding(false);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
        <Body2 style={{ marginBottom: space.sm }}>预置了常见补充剂与推荐孕周，剂量以医嘱为准。准爸爸也可以替她打卡。</Body2>

        <Section title="最近 7 天">
          <Card style={{ padding: space.md }}>
            <Row style={{ marginLeft: 72, justifyContent: 'space-between', marginBottom: 6 }}>
              {days.map((d) => (
                <Caption key={d} style={{ width: 24, textAlign: 'center', color: d === today ? colors.pine : colors.ink3, fontWeight: d === today ? '700' : '400' }}>
                  {Number(d.slice(8))}
                </Caption>
              ))}
            </Row>
            {current.length === 0 && <Body2>本周没有需要吃的补充剂。</Body2>}
            {current.map((s) => (
              <Row key={s.id} style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <Body style={{ width: 72 }} numberOfLines={1}>{s.name}</Body>
                <Row style={{ flex: 1, justifyContent: 'space-between' }}>
                  {days.map((d) => {
                    const l = logOf(s.id, d);
                    const who = l ? byId(l.byId) : undefined;
                    return (
                      <Pressable
                        key={d}
                        disabled={readonly || d > today}
                        onPress={() => dispatch({ type: 'toggleSupplementLog', supplementId: s.id, date: d, byId: me.id })}
                        style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: l ? (who?.role === 'dad' ? colors.apricot : colors.pine) : colors.paper2, borderWidth: d === today ? 2 : 0, borderColor: colors.pine }}
                      >
                        {l && <Text style={{ color: colors.onPine, fontSize: 12, fontWeight: '700' }}>✓</Text>}
                      </Pressable>
                    );
                  })}
                </Row>
              </Row>
            ))}
            <Row style={{ marginTop: 4, gap: 12 }}>
              <Row style={{ gap: 4 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.pine }} /><Caption>妈妈记的</Caption></Row>
              <Row style={{ gap: 4 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.apricot }} /><Caption>爸爸记的</Caption></Row>
            </Row>
          </Card>
        </Section>

        <Section title="正在吃">
          {current.map((s) => (
            <Card key={s.id} style={{ marginBottom: space.sm }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '700' }}>{s.name} · {s.dose}</Body>
                  <Caption>每天 {s.timeOfDay} · 孕 {s.weekFrom}–{s.weekTo} 周{s.note ? ' · ' + s.note : ''}</Caption>
                </View>
                {!readonly && <Switch value={s.active} onValueChange={(v) => dispatch({ type: 'upsertSupplement', supplement: { ...s, active: v } })} trackColor={{ true: colors.pine }} />}
              </Row>
            </Card>
          ))}
        </Section>

        {later.length > 0 && (
          <Section title="之后要吃">
            {later.map((s) => (
              <Card key={s.id} style={{ marginBottom: space.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <View>
                    <Body>{s.name} · {s.dose}</Body>
                    <Caption>孕 {s.weekFrom} 周开始{s.note ? ' · ' + s.note : ''}</Caption>
                  </View>
                  <Pill text={`${s.weekFrom} 周起`} tone="grey" />
                </Row>
              </Card>
            ))}
          </Section>
        )}

        {past.length > 0 && (
          <Section title="已停">
            {past.map((s) => (
              <Card key={s.id} style={{ marginBottom: space.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Body style={{ color: colors.ink3 }}>{s.name} · {s.dose}</Body>
                  {!readonly && !s.active && <Pressable onPress={() => dispatch({ type: 'upsertSupplement', supplement: { ...s, active: true, weekTo: 40 } })}><Caption style={{ color: colors.pine }}>恢复</Caption></Pressable>}
                </Row>
              </Card>
            ))}
          </Section>
        )}

        {!readonly && (adding ? (
          <Card style={{ marginTop: space.xl }}>
            <Field label="名称" value={name} onChange={setName} placeholder="例如：地屈孕酮" />
            <Field label="剂量" value={dose} onChange={setDose} placeholder="例如：10 mg" />
            <Field label="每天几点" value={time} onChange={setTime} placeholder="08:00" />
            <Row style={{ gap: 8 }}>
              <Button title="保存" onPress={save} small />
              <Button title="取消" kind="ghost" onPress={() => setAdding(false)} small />
            </Row>
          </Card>
        ) : (
          <Button title="添加药物或补充剂" kind="ghost" onPress={() => setAdding(true)} style={{ marginTop: space.xl }} />
        ))}
      </ScrollView>
    </Screen>
  );
}
