// 只记经期模式的首页顶部：周期第几天、距下次月经、当前阶段与一句贴心话、一键记录（月经/经量/痛经/症状）
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../store/store';
import { Body, Body2, Button, Caption, Card, H1, Row } from './ui';
import { DateField } from './DateField';
import { colors, space } from '../theme';
import { addDays, fmtDate, uid } from '../lib/pregnancy';
import type { CycleView } from '../lib/cycle';
import { tr } from '../i18n';
import type { CycleKind } from '../data/types';
import { CycleBar, Quick } from './TtcHome';

export const SYMPTOMS = () => [tr('腰酸'), tr('乳房胀'), tr('头痛'), tr('长痘'), tr('失眠'), tr('食欲大'), tr('情绪低'), tr('腹胀')];

export function phaseName(v: CycleView) {
  switch (v.phase) {
    case 'period': return tr('月经期');
    case 'follicular': return tr('卵泡期');
    case 'fertile': case 'peak': return tr('排卵期');
    case 'luteal': return tr('黄体期');
    case 'pms': return tr('经前期');
    case 'late': return tr('月经推迟');
  }
}

export function phaseTip(v: CycleView) {
  switch (v.phase) {
    case 'period': return tr('注意保暖，少碰生冷；痛得厉害可以记下来，方便和医生说。');
    case 'follicular': return tr('身体状态通常最好的一段时间，适合安排运动和重要的事。');
    case 'fertile': case 'peak': return tr('这几天是排卵期，分泌物会变多变透明，属于正常现象。');
    case 'luteal': return tr('可能会有点胀或困，不用担心。');
    case 'pms': return tr('月经快来了，情绪波动、乳房胀、长痘都常见。早点睡，少喝咖啡。');
    case 'late': return tr('推迟几天很常见，压力、熬夜、换环境都会影响。超过一周还没来，可以验个孕或问问医生。');
  }
}

export function CycleHome() {
  const { state, dispatch } = useStore();
  const { me, cycle, today: t } = useDerived();
  const router = useRouter();
  const [lmp, setLmp] = useState(addDays(t, -14));
  if (!me) return null;
  const logs = state.cycleLogs ?? [];
  const has = (kind: CycleKind, date = t) => logs.find((l) => l.kind === kind && l.date === date);
  const log = (kind: CycleKind, extra?: { value?: number; text?: string; activity?: string }, date = t) => {
    const exist = has(kind, date);
    if (exist && extra?.value === exist.value && extra?.text === exist.text) { dispatch({ type: 'deleteCycleLog', id: exist.id }); return; }
    dispatch({ type: 'addCycleLog', log: { id: uid(), kind, date, value: extra?.value, text: extra?.text, byId: me.id, at: new Date().toISOString() }, activity: extra?.activity });
  };
  const inPeriod = cycle?.phase === 'period';
  const isMom = me.role === 'mom';
  const flow = has('flow')?.value;
  const pain = has('pain')?.value;
  const symptoms = (has('symptom')?.text ?? '').split('、').filter(Boolean);
  const toggleSymptom = (s: string) => {
    const next = symptoms.includes(s) ? symptoms.filter((x) => x !== s) : [...symptoms, s];
    const exist = has('symptom');
    if (exist) dispatch({ type: 'deleteCycleLog', id: exist.id });
    if (next.length) dispatch({ type: 'addCycleLog', log: { id: uid(), kind: 'symptom', date: t, text: next.join('、'), byId: me.id, at: new Date().toISOString() } });
  };

  if (!isMom) {
    return (
      <View style={{ marginBottom: space.lg }}>
        <Caption>{tr('{mom} 的经期记录', { mom: state.pregnancy.momName })}</Caption>
        <H1>{cycle ? phaseName(cycle) : tr('经期记录')}</H1>
        {cycle && me.role === 'dad' && <Body2 style={{ marginTop: 6 }}>{cycle.phase === 'period' ? tr('她这几天在经期，多体谅一点，热水袋和热饮备着。') : cycle.phase === 'pms' ? tr('她的月经快来了（预计 {d}），情绪起伏是正常的。', { d: fmtDate(cycle.nextPeriod) }) : tr('下次月经预计 {d}。', { d: fmtDate(cycle.nextPeriod) })}</Body2>}
        {me.role === 'family' && <Body2 style={{ marginTop: 6 }}>{tr('经期的具体记录只有她自己和伴侣能看到。')}</Body2>}
      </View>
    );
  }

  return (
    <View>
      <Caption>{tr('你好，{name}', { name: me.name })}</Caption>
      <H1 style={{ marginBottom: space.md }}>{cycle ? (cycle.phase === 'late' ? tr('月经推迟 {n} 天', { n: cycle.lateDays }) : cycle.phase === 'period' ? tr('月经期 · 第 {n} 天', { n: cycle.cycleDay }) : tr('距下次月经 {n} 天', { n: cycle.daysToNext })) : tr('开始记录经期')}</H1>

      {!cycle ? (
        <Card style={{ marginBottom: space.lg }}>
          <Body style={{ fontWeight: '700' }}>{tr('先记一下上次月经第一天')}</Body>
          <Body2 style={{ marginBottom: space.md }}>{tr('有了这一天，就能预测下次月经和排卵期。')}</Body2>
          <DateField label={tr('上次月经第一天')} value={lmp} onChange={setLmp} min={addDays(t, -120)} max={t} />
          <Button title={tr('记下')} onPress={() => /^\d{4}-\d{2}-\d{2}$/.test(lmp) && log('period_start', undefined, lmp)} disabled={!/^\d{4}-\d{2}-\d{2}$/.test(lmp)} />
        </Card>
      ) : (
        <>
          <CycleBar v={cycle} />
          <Row style={{ justifyContent: 'space-between', marginBottom: space.lg }}>
            <Caption>{tr('周期第 {n} 天 / 约 {len} 天', { n: cycle.cycleDay, len: cycle.avgLen })}</Caption>
            <Caption>{tr('下次月经 {d}', { d: fmtDate(cycle.nextPeriod) })}</Caption>
          </Row>
          <Card style={{ marginBottom: space.lg, backgroundColor: cycle.phase === 'period' ? colors.warnSoft : cycle.phase === 'pms' || cycle.phase === 'late' ? colors.apricotSoft : colors.pineSoft, borderColor: 'transparent' }}>
            <Caption style={{ color: colors.ink2 }}>{tr('现在是')}</Caption>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 2 }}>{phaseName(cycle)}</Text>
            <Body2 style={{ marginTop: 6 }}>{phaseTip(cycle)}</Body2>
            <Caption style={{ marginTop: 10 }}>{tr('排卵期 {a}–{b} · 经前期约从 {c} 起', { a: fmtDate(cycle.fertileStart), b: fmtDate(cycle.fertileEnd), c: fmtDate(addDays(cycle.nextPeriod, -5)) })}</Caption>
            {!cycle.regular && <Caption style={{ color: colors.warn, marginTop: 4 }}>{tr('最近几次周期长短差得多，预测误差会比较大。')}</Caption>}
          </Card>
        </>
      )}

      {cycle && (
        <View style={{ marginBottom: space.lg }}>
          <Caption style={{ marginBottom: 6 }}>{tr('今天')}</Caption>
          <Row style={{ gap: 8 }}>
            {inPeriod
              ? <Quick e="🩸" t={tr('月经走了')} on={!!has('period_end')} fg={colors.warn} bg={colors.warnSoft} onPress={() => log('period_end')} />
              : <Quick e="🩸" t={tr('月经来了')} on={!!has('period_start')} fg={colors.warn} bg={colors.warnSoft} onPress={() => log('period_start', { activity: tr('月经来了') })} />}
            <Quick e="💧" t={flow ? [tr('量少'), tr('量中'), tr('量多')][flow - 1] : tr('经量')} on={!!flow} fg={colors.apricot} bg={colors.apricotSoft} onPress={() => log('flow', { value: flow ? (flow % 3) + 1 : 2 })} />
            <Quick e="😖" t={pain ? [tr('微痛'), tr('痛'), tr('很痛')][pain - 1] : tr('痛经')} on={!!pain} fg={colors.slate} bg={colors.slateSoft} onPress={() => log('pain', { value: pain ? (pain % 3) + 1 : 1 })} />
          </Row>
          <Caption style={{ marginTop: 4 }}>{tr('经量和痛经多点几下可以换档：少 / 中 / 多，微痛 / 痛 / 很痛。')}</Caption>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {SYMPTOMS().map((s) => {
              const on = symptoms.includes(s);
              return (
                <Pressable key={s} onPress={() => toggleSymptom(s)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: on ? colors.pine : colors.line, backgroundColor: on ? colors.pineSoft : colors.card }}>
                  <Text style={{ color: on ? colors.pine : colors.ink2, fontSize: 13 }}>{s}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => router.push('/calendar' as never)} style={{ marginTop: 12 }}>
            <Caption style={{ color: colors.pine, fontWeight: '700' }}>{tr('看日历、改周期长度、补记 →')}</Caption>
          </Pressable>
        </View>
      )}
    </View>
  );
}
