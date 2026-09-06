// 备孕期首页顶部：周期第几天、今天的受孕几率与建议、一键记录
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../store/store';
import { Body, Body2, Button, Caption, Card, H1, Row } from './ui';
import { DateField } from './DateField';
import { colors, roleLabel, space } from '../theme';
import { addDays, fmtDate, today, uid } from '../lib/pregnancy';
import { diffDays, type CycleView } from '../lib/cycle';
import { tr } from '../i18n';
import type { CycleKind } from '../data/types';

export function chanceLabel(c: CycleView['chance']) {
  return c === 'high' ? tr('高') : c === 'medium' ? tr('中') : tr('低');
}

export function headline(v: CycleView | null) {
  if (!v) return tr('开始备孕');
  switch (v.phase) {
    case 'peak': return tr('今天是好时机 💚');
    case 'fertile': return tr('易孕期');
    case 'period': return tr('月经期 · 第 {n} 天', { n: v.cycleDay });
    case 'late': return tr('月经推迟 {n} 天', { n: v.lateDays });
    default: return tr('周期第 {n} 天', { n: v.cycleDay });
  }
}

export function advice(v: CycleView) {
  switch (v.phase) {
    case 'peak': return tr('建议今天同房。排卵日前 2 天到排卵日当天最容易受孕。');
    case 'fertile': return tr('这几天都有机会，隔一天同房一次就好，不必天天。');
    case 'period': return tr('先好好休息。经期结束后别忘了每天补叶酸。');
    case 'follicular': return tr('还早。易孕期从 {d} 开始，到时候会提醒你们。', { d: fmtDate(v.fertileStart) });
    case 'luteal': return tr('已过排卵期。预计 {d} 来月经；到时没来可以验孕。', { d: fmtDate(v.nextPeriod) });
    case 'late': return tr('月经推迟了，可以用早早孕试纸测一下。如果是两条线，点下面「我怀孕了」。');
  }
}

/** 周期进度条：经期 / 易孕期 / 最佳 / 今天 */
export function CycleBar({ v }: { v: CycleView }) {
  const len = Math.max(v.avgLen, v.cycleDay);
  const pct = (d: string) => `${Math.min(100, Math.max(0, (diffDays(d, v.lastStart) / len) * 100))}%`;
  const width = (a: string, b: string) => `${Math.max(2, ((diffDays(b, a) + 1) / len) * 100)}%`;
  return (
    <View style={{ height: 10, backgroundColor: colors.paper2, borderRadius: 5, overflow: 'hidden', marginBottom: 6, position: 'relative' }}>
      <View style={{ position: 'absolute', left: 0, width: `${(v.periodLen / len) * 100}%`, height: 10, backgroundColor: colors.warnSoft }} />
      <View style={{ position: 'absolute', left: pct(v.fertileStart) as any, width: width(v.fertileStart, v.fertileEnd) as any, height: 10, backgroundColor: colors.pineSoft }} />
      <View style={{ position: 'absolute', left: pct(v.peakStart) as any, width: width(v.peakStart, v.peakEnd) as any, height: 10, backgroundColor: colors.pine }} />
      <View style={{ position: 'absolute', left: pct(today()) as any, width: 3, height: 10, backgroundColor: colors.apricot }} />
    </View>
  );
}

export function TtcHome() {
  const { state, dispatch } = useStore();
  const { me, cycle, today: t } = useDerived();
  const router = useRouter();
  const [lmp, setLmp] = useState(addDays(t, -14));
  if (!me) return null;
  const logs = state.cycleLogs ?? [];
  const has = (kind: CycleKind, date = t) => logs.find((l) => l.kind === kind && l.date === date);
  const log = (kind: CycleKind, activity?: string, date = t) => {
    const exist = has(kind, date);
    if (exist) { dispatch({ type: 'deleteCycleLog', id: exist.id }); return; }
    dispatch({ type: 'addCycleLog', log: { id: uid(), kind, date, byId: me.id, at: new Date().toISOString() }, activity });
  };
  const inPeriod = cycle?.phase === 'period';

  if (me.role === 'family') {
    return (
      <View style={{ marginBottom: space.lg }}>
        <Caption>{tr('{mom} 的备孕期 · 你是{role}', { mom: state.pregnancy.momName, role: tr(roleLabel(me.role, 'ttc')) })}</Caption>
        <H1>{tr('备孕中')}</H1>
        <Body2 style={{ marginTop: 6 }}>{tr('备孕的具体记录只有小两口自己能看到。等到有好消息，这里会第一时间告诉你。')}</Body2>
      </View>
    );
  }

  return (
    <View>
      <Row style={{ justifyContent: 'space-between', marginBottom: space.md }}>
        <View style={{ flex: 1 }}>
          <Caption>{me.role === 'mom' ? tr('你好，{name} · 备孕中', { name: me.name }) : tr('{mom} 备孕中 · 你是{role}', { mom: state.pregnancy.momName, role: tr(roleLabel(me.role, 'ttc')) })}</Caption>
          <H1>{headline(cycle)}</H1>
        </View>
      </Row>

      {!cycle ? (
        <Card style={{ marginBottom: space.lg }}>
          <Body style={{ fontWeight: '700' }}>{tr('先记一下上次月经第一天')}</Body>
          <Body2 style={{ marginBottom: space.md }}>{tr('有了这一天，就能算出排卵日和易孕期。')}</Body2>
          {me.role === 'mom' ? (
            <>
              <DateField label={tr('上次月经第一天')} value={lmp} onChange={setLmp} min={addDays(t, -120)} max={t} />
              <Button title={tr('记下')} onPress={() => /^\d{4}-\d{2}-\d{2}$/.test(lmp) && log('period_start', undefined, lmp)} disabled={!/^\d{4}-\d{2}-\d{2}$/.test(lmp)} />
            </>
          ) : <Caption>{tr('这一项由她来记。')}</Caption>}
        </Card>
      ) : (
        <>
          <CycleBar v={cycle} />
          <Row style={{ justifyContent: 'space-between', marginBottom: space.lg }}>
            <Caption>{tr('周期第 {n} 天 / 约 {len} 天', { n: cycle.cycleDay, len: cycle.avgLen })}</Caption>
            <Caption>{tr('下次月经 {d}', { d: fmtDate(cycle.nextPeriod) })}</Caption>
          </Row>

          <Card style={{ marginBottom: space.lg, backgroundColor: cycle.chance === 'high' ? colors.pine : cycle.chance === 'medium' ? colors.pineSoft : colors.card, borderColor: cycle.chance === 'low' ? colors.line : 'transparent' }}>
            {(() => { const fg = cycle.chance === 'high' ? colors.onPine : cycle.chance === 'medium' ? colors.pine : colors.ink; const fg2 = cycle.chance === 'high' ? colors.onPine : colors.ink2; return (
              <>
                <Caption style={{ color: fg }}>{tr('今天怀孕几率')}</Caption>
                <Text style={{ fontSize: 28, fontWeight: '700', color: fg, marginTop: 2 }}>{chanceLabel(cycle.chance)}</Text>
                <Body2 style={{ color: fg2, marginTop: 6 }}>{advice(cycle)}</Body2>
                <Caption style={{ color: fg2, marginTop: 10 }}>
                  {tr('预计排卵 {o} · 易孕期 {a}–{b}', { o: fmtDate(cycle.ovulation), a: fmtDate(cycle.fertileStart), b: fmtDate(cycle.fertileEnd) })}{cycle.fromLh ? ' · ' + tr('按试纸阳性推算') : ''}
                </Caption>
                {!cycle.regular && <Caption style={{ color: cycle.chance === 'high' ? colors.onPine : colors.warn, marginTop: 4 }}>{tr('最近几次周期长短差得多，估算误差会比较大；配合排卵试纸更准。')}</Caption>}
                {cycle.phase === 'late' && me.role === 'mom' && <Button title={tr('我怀孕了 🎉')} small onPress={() => router.push('/cycle?pregnant=1' as never)} style={{ marginTop: 12, alignSelf: 'flex-start' }} />}
              </>
            ); })()}
          </Card>
        </>
      )}

      {cycle && (
        <View style={{ marginBottom: space.lg }}>
          <Caption style={{ marginBottom: 6 }}>{tr('点一下就记上')}</Caption>
          <Row style={{ gap: 8 }}>
            {me.role === 'mom' && (inPeriod
              ? <Quick e="🩸" t={tr('月经走了')} on={!!has('period_end')} fg={colors.warn} bg={colors.warnSoft} onPress={() => log('period_end')} />
              : <Quick e="🩸" t={tr('月经来了')} on={!!has('period_start')} fg={colors.warn} bg={colors.warnSoft} onPress={() => log('period_start', tr('月经来了，新的一个周期'))} />)}
            <Quick e="💕" t={tr('同房')} on={!!has('sex')} fg={colors.apricot} bg={colors.apricotSoft} onPress={() => log('sex')} />
            {me.role === 'mom' && <Quick e="🧪" t={tr('试纸阳性')} on={!!has('lh_pos')} fg={colors.pine} bg={colors.pineSoft} onPress={() => { const n = has('lh_neg'); if (n) dispatch({ type: 'deleteCycleLog', id: n.id }); log('lh_pos', tr('排卵试纸阳性，接下来两天是最佳时机')); }} />}
            {me.role === 'mom' && <Quick e="➖" t={tr('试纸阴性')} on={!!has('lh_neg')} fg={colors.slate} bg={colors.slateSoft} onPress={() => { const p = has('lh_pos'); if (p) dispatch({ type: 'deleteCycleLog', id: p.id }); log('lh_neg'); }} />}
          </Row>
          <Pressable onPress={() => router.push('/cycle' as never)} style={{ marginTop: 10 }}>
            <Caption style={{ color: colors.pine, fontWeight: '700' }}>{tr('看日历、改周期长度、补记 →')}</Caption>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function Quick({ e, t, on, fg, bg, onPress }: { e: string; t: string; on: boolean; fg: string; bg: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1.5, borderColor: on ? fg : colors.line, backgroundColor: on ? bg : colors.card }}>
      <Text style={{ fontSize: 20 }}>{e}</Text>
      <Text style={{ fontWeight: '700', fontSize: 12, color: on ? fg : colors.ink2, marginTop: 2 }} numberOfLines={1}>{on ? '✓ ' : ''}{t}</Text>
    </Pressable>
  );
}
