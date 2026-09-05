import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, Divider, Field, Pill, Row, Screen, Section } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { METRIC_DEFS, metricFlag } from '../../src/data/schedule';
import type { Checkup, Visibility } from '../../src/data/types';

export default function CheckupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const { me, byId } = useDerived();
  const router = useRouter();
  const original = state.checkups.find((c) => c.id === id);
  const [c, setC] = useState<Checkup | undefined>(original);
  const [metrics, setMetrics] = useState<Record<string, string>>(() => Object.fromEntries((original?.metrics ?? []).map((m) => [m.key, String(m.value)])));
  const [itemsText, setItemsText] = useState(original?.items.join('\n') ?? '');
  useEffect(() => {
    // 直接通过链接打开时，本地数据可能晚于页面初始化才恢复
    if (!c && original) {
      setC(original);
      setMetrics(Object.fromEntries(original.metrics.map((m) => [m.key, String(m.value)])));
      setItemsText(original.items.join('\n'));
    }
  }, [original]);
  if (!c || !me) return null;
  const readonly = me.role === 'family';

  const save = (markDone?: boolean) => {
    const ms = METRIC_DEFS.filter((d) => metrics[d.key]?.trim()).map((d) => ({ key: d.key, value: Number(metrics[d.key]), unit: d.unit }));
    const next: Checkup = { ...c, items: itemsText.split('\n').map((s) => s.trim()).filter(Boolean), metrics: ms, done: markDone ?? c.done };
    const activity = markDone && !c.done ? `完成了「${c.title}」${ms.length ? '，记录了 ' + ms.length + ' 项数值' : ''}${next.result ? '：' + next.result : ''}` : undefined;
    dispatch({ type: 'upsertCheckup', checkup: next, activity });
    router.back();
  };

  const vis: { v: Visibility; t: string }[] = [
    { v: 'self', t: '仅自己' },
    { v: 'partner', t: '伴侣' },
    { v: 'family', t: '全家' },
  ];

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Row style={{ justifyContent: 'space-between' }}>
            <Pill text={`孕 ${c.weekFrom}${c.weekTo !== c.weekFrom ? '–' + c.weekTo : ''} 周`} />
            {c.done && <Pill text="已完成" tone="grey" />}
          </Row>

          {readonly ? (
            <>
              <Text style={{ fontSize: 24, fontWeight: '700', marginTop: 8, color: colors.ink }}>{c.title}</Text>
              <Body2>{c.date ?? '未定'}{c.hospital ? ' · ' + c.hospital : ''}</Body2>
            </>
          ) : (
            <>
              <TextInput value={c.title} onChangeText={(t) => setC({ ...c, title: t })} style={{ fontSize: 24, fontWeight: '700', marginTop: 8, color: colors.ink }} />
              <Row style={{ gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}><Field label="日期" value={c.date ?? ''} onChange={(t) => setC({ ...c, date: t })} placeholder="YYYY-MM-DD" keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Field label="医院" value={c.hospital ?? ''} onChange={(t) => setC({ ...c, hospital: t })} placeholder="例如：协和" /></View>
              </Row>
            </>
          )}

          {!!c.notes && (
            <Card style={{ backgroundColor: colors.apricotSoft, borderColor: colors.apricotSoft, marginTop: 4 }}>
              <Caption style={{ color: colors.apricot }}>注意</Caption>
              <Body2 style={{ color: colors.ink }}>{c.notes}</Body2>
            </Card>
          )}

          <Section title="检查项目">
            {readonly ? (
              c.items.map((it, i) => <Body key={i}>· {it}</Body>)
            ) : (
              <TextInput value={itemsText} onChangeText={setItemsText} multiline placeholder="一行一项" placeholderTextColor={colors.ink3} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 12, minHeight: 80, fontSize: 15, color: colors.ink, textAlignVertical: 'top' }} />
            )}
          </Section>

          <Section title="谁陪同">
            <Row style={{ flexWrap: 'wrap', gap: 8 }}>
              {state.members.filter((m) => m.role !== 'mom').map((m) => {
                const on = c.companionId === m.id;
                return (
                  <Pressable key={m.id} disabled={readonly} onPress={() => setC({ ...c, companionId: on ? undefined : m.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: on ? colors.apricot : colors.line, backgroundColor: on ? colors.apricotSoft : colors.card }}>
                    <Avatar name={m.name} role={m.role} size={22} />
                    <Body2 style={{ color: on ? colors.apricot : colors.ink2, fontWeight: on ? '700' : '400' }}>{m.name}</Body2>
                  </Pressable>
                );
              })}
              {state.members.length <= 1 && <Caption>先去「家庭」邀请准爸爸或家人。</Caption>}
            </Row>
          </Section>

          {!readonly && <Section title="数值">
            <Card style={{ padding: 0 }}>
              {METRIC_DEFS.map((d, i) => {
                const raw = metrics[d.key] ?? '';
                const flag = raw.trim() ? metricFlag(d.key, Number(raw)) : 'na';
                return (
                  <Row key={d.key} style={{ padding: space.md, paddingHorizontal: space.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line, justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Body>{d.label}</Body>
                      <Caption>参考 {d.ref}</Caption>
                    </View>
                    {readonly ? (
                      <Body style={{ fontWeight: '700' }}>{raw ? `${raw} ${d.unit}` : '—'}</Body>
                    ) : (
                      <Row>
                        <TextInput value={raw} onChangeText={(t) => setMetrics({ ...metrics, [d.key]: t })} keyboardType="decimal-pad" placeholder="—" placeholderTextColor={colors.ink3} style={{ width: 72, textAlign: 'right', fontSize: 17, fontWeight: '700', color: flag === 'ok' ? colors.pine : flag === 'na' ? colors.ink : colors.warn, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 4 }} />
                        <Caption style={{ width: 44 }}>{d.unit}</Caption>
                      </Row>
                    )}
                    {flag === 'high' && <Pill text="偏高" tone="warn" />}
                    {flag === 'low' && <Pill text="偏低" tone="warn" />}
                  </Row>
                );
              })}
            </Card>
            <Caption style={{ marginTop: 6 }}>参考范围仅供了解，具体以医生判断为准。</Caption>
          </Section>}

          {!readonly && <Section title="结果与备注">
            {(
              <TextInput value={c.result ?? ''} onChangeText={(t) => setC({ ...c, result: t })} multiline placeholder="例如：一切正常，医生说下次 4 周后来" placeholderTextColor={colors.ink3} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 12, minHeight: 72, fontSize: 15, color: colors.ink, textAlignVertical: 'top' }} />
            )}
          </Section>}
          {readonly && <Caption style={{ marginTop: space.xl }}>检查数值和结果只对准妈妈和准爸爸可见。</Caption>}

          {me.role === 'mom' && (
            <Section title="谁能看到">
              <Row style={{ gap: 8 }}>
                {vis.map((o) => (
                  <Pressable key={o.v} onPress={() => setC({ ...c, visibility: o.v })} style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: c.visibility === o.v ? colors.pine : colors.line, backgroundColor: c.visibility === o.v ? colors.pineSoft : colors.card, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '700', color: c.visibility === o.v ? colors.pine : colors.ink2 }}>{o.t}</Text>
                  </Pressable>
                ))}
              </Row>
            </Section>
          )}

          {!readonly && (
            <View style={{ marginTop: space.xxl, gap: 10 }}>
              {!c.done && <Button title="标记完成并保存" onPress={() => save(true)} />}
              <Button title={c.done ? '保存' : '仅保存'} kind="ghost" onPress={() => save()} />
              {c.done && <Button title="改回未完成" kind="ghost" onPress={() => { setC({ ...c, done: false }); dispatch({ type: 'upsertCheckup', checkup: { ...c, done: false } }); }} />}
              <Pressable style={{ alignItems: 'center', marginTop: 8 }} onPress={() => Alert.alert('删除这次产检', c.title, [{ text: '取消' }, { text: '删除', style: 'destructive', onPress: () => { dispatch({ type: 'deleteCheckup', id: c.id }); router.back(); } }])}>
                <Caption style={{ color: colors.warn }}>删除</Caption>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
