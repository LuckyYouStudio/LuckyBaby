import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, Pill, Row, Screen } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { fmtDate, fmtRelative, uid } from '../../src/lib/pregnancy';
import { tr } from '../../src/i18n';

export default function Checkups() {
  const { state, dispatch } = useStore();
  const { me, g, today, canSee, byId } = useDerived();
  const router = useRouter();
  if (!me) return null;

  const list = state.checkups.filter((c) => me.role === 'family' || canSee(c.visibility)).sort((a, b) => (a.weekFrom - b.weekFrom) || ((a.date ?? '') < (b.date ?? '') ? -1 : 1));
  const done = list.filter((c) => c.done);
  const todo = list.filter((c) => !c.done);

  const addCustom = () => {
    const id = uid();
    dispatch({
      type: 'upsertCheckup',
      checkup: { id, title: tr('自定义产检'), weekFrom: g.week, weekTo: g.week, date: today, items: [], done: false, metrics: [], visibility: 'partner' },
    });
    router.push(`/checkup/${id}`);
  };

  const Item = ({ c }: { c: (typeof list)[number] }) => {
    const comp = c.companionId ? byId(c.companionId) : undefined;
    const current = !c.done && g.week >= c.weekFrom && g.week <= c.weekTo;
    const overdue = !c.done && g.week > c.weekTo;
    return (
      <Card style={{ marginBottom: space.sm, borderColor: current ? colors.pine : colors.line }} onPress={() => router.push(`/checkup/${c.id}`)}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Row style={{ flex: 1, alignItems: 'flex-start', marginRight: 8 }}>
            <View style={{ width: 44 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: c.done ? colors.ink3 : colors.pine, fontVariant: ['tabular-nums'] }}>{c.weekFrom}</Text>
              <Caption>{tr('周')}</Caption>
            </View>
            <View style={{ flex: 1 }}>
              <Body style={{ fontWeight: '700', color: c.done ? colors.ink3 : colors.ink }}>{tr(c.title)}</Body>
              <Caption>{c.date ? `${fmtDate(c.date)} · ${fmtRelative(c.date)}` : tr('未安排日期')}{c.hospital ? ' · ' + c.hospital : ''}</Caption>
            </View>
          </Row>
          {c.done ? <Pill text={tr("已完成")} tone="grey" /> : current ? <Pill text={tr("本周")} tone="pine" /> : overdue ? <Pill text={tr("已过窗口")} tone="warn" /> : null}
        </Row>
        {!c.done && c.items.length > 0 && <Body2 style={{ marginTop: 6 }} numberOfLines={1}>{c.items.map((x) => tr(x)).join(' · ')}</Body2>}
        {!c.done && (
          <Row style={{ marginTop: 8 }}>
            {comp ? (
              <>
                <Avatar name={comp.name} role={comp.role} size={22} />
                <Caption>{comp.name} {tr('陪同')}</Caption>
              </>
            ) : me.role !== 'family' ? (
              <Pressable onPress={() => dispatch({ type: 'upsertCheckup', checkup: { ...c, companionId: me.id }, activity: tr('{name} 要陪「{title}」', { name: me.name, title: tr(c.title) }) })}>
                <Caption style={{ color: colors.apricot, fontWeight: '700' }}>{tr('我陪')}</Caption>
              </Pressable>
            ) : (
              <Caption>{tr('还没有人说要陪')}</Caption>
            )}
          </Row>
        )}
        {c.done && c.metrics.length > 0 && me.role !== 'family' && (
          <Body2 style={{ marginTop: 6 }} numberOfLines={1}>
            {c.metrics.map((m) => `${m.value}${m.unit}`).join(' · ')}
          </Body2>
        )}
      </Card>
    );
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
        <Body2 style={{ marginBottom: space.md }}>{tr('按常规产检节点自动排入，点开可改日期、医院、记录数值。医院之间流程略有差异，以医生安排为准。')}</Body2>
        {todo.map((c) => (
          <Item key={c.id} c={c} />
        ))}
        {me.role !== 'family' && <Button title={tr("添加一次产检")} kind="ghost" onPress={addCustom} style={{ marginTop: space.sm }} />}
        {done.length > 0 && (
          <>
            <Caption style={{ marginTop: space.xl, marginBottom: space.sm }}>{tr('已完成 {n} 次', { n: done.length })}</Caption>
            {done.map((c) => (
              <Item key={c.id} c={c} />
            ))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
