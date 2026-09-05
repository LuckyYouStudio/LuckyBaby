import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDerived, useStore } from '../../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, H1, H2, Pill, Row, Screen, Section } from '../../src/components/ui';
import { Feed } from '../../src/components/Feed';
import { colors, roleColor, space } from '../../src/theme';
import { babyOfWeek } from '../../src/data/babySize';
import { fmtDate, fmtRelative, fmtTime, trimester, uid } from '../../src/lib/pregnancy';
import { requestReminderPermission } from '../../src/lib/reminders';
import { alert } from '../../src/lib/alert';
import { Platform } from 'react-native';
import { tr } from '../../src/i18n';

// 在渲染时取色，深浅色切换才会跟着变
const quickOptions = () => [
  { t: tr('还好'), e: '🙂', fg: colors.pine, bg: colors.pineSoft },
  { t: tr('吐了'), e: '🤢', fg: colors.warn, bg: colors.warnSoft },
  { t: tr('累瘫'), e: '😪', fg: colors.slate, bg: colors.slateSoft },
  { t: tr('不舒服'), e: '😣', fg: colors.apricot, bg: colors.apricotSoft },
];

export default function Today() {
  const { state, dispatch } = useStore();
  const { me, g, today, canSee, byId } = useDerived();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  if (!me) return null;

  const baby = babyOfWeek(g.week);
  const upcoming = state.checkups
    .filter((c) => !c.done && c.date && c.date >= today && (me.role === 'family' || canSee(c.visibility)))
    .sort((a, b) => (a.date! < b.date! ? -1 : 1))
    .slice(0, 2);
  const dueSupplements = state.supplements.filter((s) => s.active && g.week >= s.weekFrom && g.week <= s.weekTo && canSee(s.visibility));
  const taken = (id: string) => state.supplementLogs.find((l) => l.supplementId === id && l.date === today);
  const progress = Math.max(0, Math.min(1, g.totalDays / 280));
  const todayMood = state.logs.find((l) => l.kind === 'mood' && l.date === today && l.byId === me.id);
  const quick = (t: string) => {
    if (todayMood) dispatch({ type: 'deleteLog', id: todayMood.id });
    if (todayMood?.text === t) return;
    dispatch({ type: 'addLog', log: { id: uid(), kind: 'mood', date: today, text: t, byId: me.id, at: new Date().toISOString(), visibility: 'family' }, activity: tr('今天{mood}', { mood: tr(t) }) });
  };
  const enableReminders = async () => {
    const ok = await requestReminderPermission();
    if (!ok) { alert(tr('没有拿到通知权限'), tr('可以在系统设置里给「幸运宝贝」打开通知，再回来开启。')); return; }
    dispatch({ type: 'setReminders', enabled: true });
  };
  const nick = state.pregnancy.babyNickname ?? tr('宝宝');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + 12, paddingBottom: 40 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: space.md }}>
          <View>
            <Caption>{me.role === 'mom' ? tr('你好，{name}', { name: me.name }) : tr('{mom} 的孕期 · 你是{role}', { mom: state.pregnancy.momName, role: tr(roleColor[me.role].label) })}</Caption>
            <H1>
              {tr('孕 {w} 周 {d} 天', { w: g.week, d: g.day })}
            </H1>
          </View>
          <Avatar name={me.name} role={me.role} size={40} />
        </Row>

        <View style={{ height: 6, backgroundColor: colors.paper2, borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
          <View style={{ width: `${progress * 100}%`, height: 6, backgroundColor: colors.pine }} />
        </View>
        <Row style={{ justifyContent: 'space-between', marginBottom: space.lg }}>
          <Caption>孕{[tr('早'), tr('中'), tr('晚')][trimester(g.week) - 1]}期</Caption>
          <Caption>{tr('距预产期 {n} 天', { n: g.daysLeft })} · {fmtDate(state.pregnancy.dueDate)}</Caption>
        </Row>

        {me.role === 'mom' && (
          <View style={{ marginBottom: space.lg }}>
            <Caption style={{ marginBottom: 6 }}>{tr('今天怎么样？点一下就行')}</Caption>
            <Row style={{ gap: 8 }}>
              {quickOptions().map((q) => {
                const on = todayMood?.text === q.t;
                return (
                  <Pressable key={q.t} onPress={() => quick(q.t)} style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: on ? q.fg : colors.line, backgroundColor: on ? q.bg : colors.card }}>
                    <Text style={{ fontSize: 22 }}>{q.e}</Text>
                    <Text style={{ fontWeight: '700', color: on ? q.fg : colors.ink2, marginTop: 2 }}>{tr(q.t)}</Text>
                  </Pressable>
                );
              })}
            </Row>
          </View>
        )}

        {!state.remindersEnabled && me.role !== 'family' && Platform.OS !== 'web' && (
          <Card style={{ marginBottom: space.lg, backgroundColor: colors.apricotSoft, borderColor: colors.apricotSoft }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Body style={{ fontWeight: '700', color: colors.ink }}>{tr('让手机提醒，不用记')}</Body>
                <Caption>{tr('产检前一晚说要不要空腹、带什么；补充剂到点提醒。')}</Caption>
              </View>
              <Button title={tr("开启")} small onPress={enableReminders} />
            </Row>
          </Card>
        )}

        <Card style={{ backgroundColor: colors.pineSoft, borderColor: colors.pineSoft }}>
          <Caption style={{ color: colors.pine }}>{tr('本周的{nick}', { nick })}</Caption>
          <H2 style={{ color: colors.pine, marginTop: 2 }}>{tr('像一颗{like}', { like: tr(baby.like) })}</H2>
          <Body2 style={{ color: colors.pine, marginTop: 4 }}>
            {baby.length} · {tr(baby.note)}
          </Body2>
        </Card>

        {me.role !== 'family' && <Section title={tr("今天要吃")} right={<Pressable onPress={() => router.push('/meds')}><Caption style={{ color: colors.pine }}>{tr('全部')}</Caption></Pressable>}>
          {dueSupplements.length === 0 ? (
            <Body2>{tr('本周没有需要吃的补充剂。')}</Body2>
          ) : (
            <Card style={{ padding: 0 }}>
              {dueSupplements.map((s, i) => {
                const log = taken(s.id);
                const who = log ? byId(log.byId) : undefined;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => dispatch({ type: 'toggleSupplementLog', supplementId: s.id, date: today, byId: me.id })}
                    style={{ flexDirection: 'row', alignItems: 'center', padding: space.md, paddingHorizontal: space.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}
                  >
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: log ? colors.pine : colors.line, backgroundColor: log ? colors.pine : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      {log && <Text style={{ color: colors.onPine, fontSize: 13, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Body style={log ? { color: colors.ink3, textDecorationLine: 'line-through' } : undefined}>
                        {tr(s.name)} · {tr(s.dose)}
                      </Body>
                      <Caption>{log && who ? `${who.name} 记于 ${fmtTime(log.at).replace(tr('今天 '), '')}` : `${s.timeOfDay}${s.note ? ' · ' + tr(s.note) : ''}`}</Caption>
                    </View>
                  </Pressable>
                );
              })}
            </Card>
          )}
          {me.role === 'dad' && <Caption style={{ marginTop: 6 }}>{tr('你也可以替她打卡，动态里会显示是你记的。')}</Caption>}
        </Section>}

        <Section title={tr("接下来的产检")} right={<Pressable onPress={() => router.push('/checkups')}><Caption style={{ color: colors.pine }}>{tr('全部')}</Caption></Pressable>}>
          {upcoming.length === 0 ? (
            <Body2>{tr('近期没有安排的产检。')}</Body2>
          ) : (
            upcoming.map((c) => {
              const comp = c.companionId ? byId(c.companionId) : undefined;
              return (
                <Card key={c.id} style={{ marginBottom: space.sm }} onPress={() => router.push(`/checkup/${c.id}`)}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Body style={{ fontWeight: '700' }}>{tr(c.title)}</Body>
                    <Pill text={fmtRelative(c.date!)} tone={c.date === today ? 'apricot' : 'grey'} />
                  </Row>
                  <Body2 style={{ marginTop: 2 }}>
                    {fmtDate(c.date)} · {tr('孕 {w} 周', { w: c.weekTo !== c.weekFrom ? `${c.weekFrom}–${c.weekTo}` : c.weekFrom })}{c.hospital ? ' · ' + c.hospital : ''}
                  </Body2>
                  {!!c.notes && <Caption style={{ marginTop: 4, color: colors.warn }}>{tr(c.notes)}</Caption>}
                  <Row style={{ marginTop: 8 }}>
                    {comp ? (
                      <>
                        <Avatar name={comp.name} role={comp.role} size={22} />
                        <Caption>{comp.name} {tr('陪同')}</Caption>
                      </>
                    ) : (
                      <Caption>{tr('还没有人说要陪')}</Caption>
                    )}
                  </Row>
                </Card>
              );
            })
          )}
        </Section>

        <Section title={tr("家里的动态")} right={<Pressable onPress={() => router.push('/family')}><Caption style={{ color: colors.pine }}>{tr('全部')}</Caption></Pressable>}>
          <Feed limit={3} />
        </Section>

        <Button title={tr("记一笔")} onPress={() => router.push('/log/new')} style={{ marginTop: space.xl }} />
      </ScrollView>
    </Screen>
  );
}
