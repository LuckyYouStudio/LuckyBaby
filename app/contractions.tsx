import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useDerived, useStore } from '../src/store/store';
import { Body, Body2, Button, Caption, Card, Row, Screen } from '../src/components/ui';
import { colors, space } from '../src/theme';
import { uid } from '../src/lib/pregnancy';
import { tr } from '../src/i18n';

type C = { start: number; end?: number };

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  return tr('{m}分{s}秒', { m: Math.floor(s / 60), s: String(s % 60).padStart(2, '0') });
};

/** 宫缩计时：一个按钮开始/结束，自动算持续时间和间隔 */
export default function Contractions() {
  useKeepAwake();
  const { dispatch } = useStore();
  const { me, today } = useDerived();
  const router = useRouter();
  const [list, setList] = useState<C[]>([]);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = list.find((c) => !c.end);
  const done = list.filter((c) => c.end) as Required<C>[];
  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (active) setList(list.map((c) => (c === active ? { ...c, end: Date.now() } : c)));
    else setList([...list, { start: Date.now() }]);
  };

  // 最近一小时的统计
  const hourAgo = now - 3600_000;
  const recent = done.filter((c) => c.start >= hourAgo);
  const avgDur = recent.length ? recent.reduce((a, c) => a + (c.end - c.start), 0) / recent.length : 0;
  const gaps = recent.slice(1).map((c, i) => c.start - recent[i].start);
  const avgGap = gaps.length ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;
  // 5-1-1：约每 5 分钟一次、每次约 1 分钟、持续 1 小时
  const regular = recent.length >= 6 && avgGap > 0 && avgGap <= 6 * 60_000 && avgDur >= 45_000 && recent[recent.length - 1].start - recent[0].start >= 50 * 60_000;

  const save = () => {
    if (!me || done.length === 0) { router.back(); return; }
    const text = tr('最近一小时 {n} 次，平均持续 {d}，平均间隔 {g}', { n: recent.length, d: fmt(avgDur), g: fmt(avgGap) });
    dispatch({
      type: 'addLog',
      log: { id: uid(), kind: 'contraction', date: today, value: done.length, text, byId: me.id, at: new Date().toISOString(), visibility: 'partner' },
      activity: tr('记录了宫缩：{text}', { text }),
    });
    router.back();
  };

  return (
    <Screen style={{ padding: space.lg }}>
      <Body2 style={{ textAlign: 'center', marginTop: space.sm }}>{tr('感觉肚子发紧发硬时按“开始”，松下来按“结束”。')}{'\n'}{tr('规律不规律，App 帮你算，你只管按。')}</Body2>

      <Card style={{ marginTop: space.lg, backgroundColor: regular ? colors.apricotSoft : colors.card, borderColor: regular ? colors.apricot : colors.line }}>
        <Row style={{ justifyContent: 'space-around' }}>
          <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] }}>{recent.length}</Text><Caption>{tr('最近 1 小时')}</Caption></View>
          <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] }}>{avgDur ? fmt(avgDur) : '—'}</Text><Caption>{tr('平均持续')}</Caption></View>
          <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 26, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] }}>{avgGap ? fmt(avgGap) : '—'}</Text><Caption>{tr('平均间隔')}</Caption></View>
        </Row>
        {regular ? (
          <Body style={{ marginTop: space.md, color: colors.apricot, fontWeight: '700' }}>{tr('已经比较规律了（约每 5 分钟一次、每次约 1 分钟、持续 1 小时）。按医生交代的，可以准备去医院了。')}</Body>
        ) : (
          <Caption style={{ marginTop: space.md }}>{tr('一般到"每 5 分钟一次、每次 1 分钟、持续 1 小时"就该去医院；破水或出血不用等，直接去。')}</Caption>
        )}
      </Card>

      <View style={{ alignItems: 'center', marginVertical: space.xl }}>
        <Pressable onPress={toggle} style={({ pressed }) => ({ width: 220, height: 220, borderRadius: 110, backgroundColor: active ? colors.apricot : pressed ? colors.pine : colors.pineSoft, borderWidth: 6, borderColor: active ? colors.apricot : colors.pine, alignItems: 'center', justifyContent: 'center' })}>
          <Text style={{ fontSize: 40, fontWeight: '700', color: active ? colors.onPine : colors.pine, fontVariant: ['tabular-nums'] }}>{active ? fmt(now - active.start) : tr('开始')}</Text>
          <Text style={{ fontSize: 16, color: active ? colors.onPine : colors.pine, fontWeight: '600', marginTop: 4 }}>{active ? tr('松了就按结束') : tr('肚子发紧时按')}</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {done.slice().reverse().map((c, i, arr) => {
          const prev = arr[i + 1];
          return (
            <Row key={c.start} style={{ justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line }}>
              <Caption>{new Date(c.start).toTimeString().slice(0, 5)}</Caption>
              <Body2>{tr('持续')} {fmt(c.end - c.start)}</Body2>
              <Body2>{prev ? `${tr('间隔')} ${fmt(c.start - prev.start)}` : ''}</Body2>
            </Row>
          );
        })}
      </ScrollView>

      <View style={{ gap: 10, marginBottom: space.xl }}>
        <Button title={done.length ? `保存并返回（${done.length} 次）` : tr('返回')} onPress={save} />
      </View>
    </Screen>
  );
}
