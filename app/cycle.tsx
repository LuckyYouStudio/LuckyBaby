// 备孕日历：月经、易孕期、排卵日、同房、试纸；周期设置；「我怀孕了」
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDerived, useStore } from '../src/store/store';
import { SYMPTOMS } from '../src/components/CycleHome';
import { Body, Body2, Button, Caption, Card, Field, Row, Screen, Section } from '../src/components/ui';
import { colors, space } from '../src/theme';
import { addDays, dueFromLmp, fmtDate, parseYmd, toYmd, uid } from '../src/lib/pregnancy';
import { cycleHistory, dayMarks, DEFAULT_CYCLE, DEFAULT_PERIOD } from '../src/lib/cycle';
import { alert } from '../src/lib/alert';
import { getLang, tr } from '../src/i18n';
import type { CycleKind } from '../src/data/types';

const WEEK = () => (getLang() === 'en' ? ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] : ['日', '一', '二', '三', '四', '五', '六']);
const monthTitle = (y: number, m: number) => (getLang() === 'en' ? `${['January','February','March','April','May','June','July','August','September','October','November','December'][m]} ${y}` : `${y} 年 ${m + 1} 月`);

export default function Cycle() {
  const { state, dispatch } = useStore();
  const { me, cycle, today } = useDerived();
  const router = useRouter();
  const params = useLocalSearchParams<{ pregnant?: string }>();
  const [offset, setOffset] = useState(0);
  const [sel, setSel] = useState(today);
  const [cycleLen, setCycleLen] = useState(String(state.pregnancy.cycleLen ?? DEFAULT_CYCLE));
  const [periodLen, setPeriodLen] = useState(String(state.pregnancy.periodLen ?? DEFAULT_PERIOD));
  const [bbt, setBbt] = useState('');
  const logs = state.cycleLogs ?? [];
  const marks = useMemo(() => dayMarks(logs, cycle, state.pregnancy.periodLen ?? DEFAULT_PERIOD), [logs, cycle, state.pregnancy.periodLen]);
  const isMom = me?.role === 'mom';
  const cyc = (state.pregnancy.stage ?? 'pregnant') === 'cycle';

  const becomePregnant = () => {
    if (!me) return;
    const lmp = cycle?.lastStart;
    const due = lmp ? dueFromLmp(lmp) : dueFromLmp(addDays(today, -28));
    alert(tr('恭喜！🎉'), tr('按上次月经 {lmp} 推算，预产期是 {due}。之后 App 会切到孕期模式，铺好产检时间表；预产期可以在产检确认后再改。', { lmp: lmp ? fmtDate(lmp) : tr('未知'), due: fmtDate(due) }), [
      { text: tr('再等等') },
      { text: tr('确认怀孕'), onPress: () => { dispatch({ type: 'becomePregnant', dueDate: due, lmp, byId: me.id }); router.replace('/'); } },
    ]);
  };
  useEffect(() => { if (params.pregnant) becomePregnant(); }, [params.pregnant]);

  if (!me) return null;
  if (me.role === 'family') return <Screen><View style={{ padding: space.xl }}><Body2>{tr('备孕的具体记录只有小两口自己能看到。')}</Body2></View></Screen>;

  // 日历
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + offset);
  const y = base.getFullYear(), m = base.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => toYmd(new Date(y, m, i + 1)))];
  while (cells.length % 7) cells.push(null);

  const selLogs = logs.filter((l) => l.date === sel);
  const has = (k: CycleKind) => selLogs.find((l) => l.kind === k);
  const toggle = (k: CycleKind, value?: number, text?: string) => {
    const ex = has(k);
    if (ex && value == null && text == null) { dispatch({ type: 'deleteCycleLog', id: ex.id }); return; }
    if (ex && (value != null || text != null)) dispatch({ type: 'deleteCycleLog', id: ex.id });
    if (k === 'lh_pos' && has('lh_neg')) dispatch({ type: 'deleteCycleLog', id: has('lh_neg')!.id });
    if (k === 'lh_neg' && has('lh_pos')) dispatch({ type: 'deleteCycleLog', id: has('lh_pos')!.id });
    dispatch({ type: 'addCycleLog', log: { id: uid(), kind: k, date: sel, value, text, byId: me.id, at: new Date().toISOString() } });
  };
  const selSymptoms = (has('symptom')?.text ?? '').split('、').filter(Boolean);
  const toggleSymptom = (s: string) => { const next = selSymptoms.includes(s) ? selSymptoms.filter((x) => x !== s) : [...selSymptoms, s]; const ex = has('symptom'); if (ex) dispatch({ type: 'deleteCycleLog', id: ex.id }); if (next.length) dispatch({ type: 'addCycleLog', log: { id: uid(), kind: 'symptom', date: sel, text: next.join('、'), byId: me.id, at: new Date().toISOString() } }); };
  const saveCycle = () => {
    const c = parseInt(cycleLen, 10), p = parseInt(periodLen, 10);
    if (!(c >= 15 && c <= 60) || !(p >= 1 && p <= 10)) { alert(tr('数字不对'), tr('周期 15–60 天，经期 1–10 天。')); return; }
    dispatch({ type: 'setCycle', cycleLen: c, periodLen: p });
  };
  const history = cycleHistory(logs);
  const Tog = ({ k, t, e, on }: { k: CycleKind; t: string; e: string; on: boolean }) => (
    <Pressable onPress={() => toggle(k)} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: on ? colors.pine : colors.line, backgroundColor: on ? colors.pineSoft : colors.card }}>
      <Text style={{ color: on ? colors.pine : colors.ink2, fontWeight: '600' }}>{e} {t}</Text>
    </Pressable>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: space.sm }}>
          <Pressable onPress={() => setOffset((o) => o - 1)} style={{ padding: 8 }}><Text style={{ color: colors.pine, fontSize: 18 }}>‹</Text></Pressable>
          <Body style={{ fontWeight: '700' }}>{monthTitle(y, m)}</Body>
          <Pressable onPress={() => setOffset((o) => o + 1)} style={{ padding: 8 }}><Text style={{ color: colors.pine, fontSize: 18 }}>›</Text></Pressable>
        </Row>
        <Card style={{ padding: 8 }}>
          <Row>{WEEK().map((w) => <Caption key={w} style={{ flex: 1, textAlign: 'center' }}>{w}</Caption>)}</Row>
          {Array.from({ length: cells.length / 7 }, (_, r) => (
            <Row key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((d, i) => {
                if (!d) return <View key={i} style={{ flex: 1, height: 46 }} />;
                const mk = marks(d);
                const isSel = d === sel, isToday = d === today, future = d > today;
                let bg = 'transparent', fg = future ? colors.ink3 : colors.ink, border = 'transparent';
                if (mk.period === 'logged') { bg = colors.warnSoft; fg = colors.warn; }
                else if (mk.period === 'predicted') { border = colors.warn; fg = colors.warn; }
                else if (mk.peak) { bg = colors.pine; fg = colors.onPine; }
                else if (mk.fertile) { bg = colors.pineSoft; fg = colors.pine; }
                return (
                  <Pressable key={d} onPress={() => setSel(d)} style={{ flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: bg, borderWidth: isSel ? 2 : border !== 'transparent' ? 1 : 0, borderColor: isSel ? colors.apricot : border, borderStyle: !isSel && mk.period === 'predicted' ? 'dashed' : 'solid', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: fg, fontWeight: isToday || mk.ovulation ? '700' : '500', fontSize: 14 }}>{mk.ovulation ? '★' : parseYmd(d).getDate()}</Text>
                    </View>
                    <Row style={{ position: 'absolute', bottom: 2, gap: 2 }}>
                      {mk.sex && <Text style={{ fontSize: 8 }}>💕</Text>}
                      {mk.lh === 'pos' && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.pine }} />}
                      {!!mk.bbt && <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: colors.slate }} />}
                    </Row>
                  </Pressable>
                );
              })}
            </Row>
          ))}
        </Card>
        <Row style={{ gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <Legend c={colors.warnSoft} t={tr('月经')} /><Legend c={colors.pineSoft} t={tr('易孕期')} /><Legend c={colors.pine} t={tr('最佳时机')} /><Caption>★ {tr('预计排卵')}</Caption><Caption>💕 {tr('同房')}</Caption>
        </Row>

        <Section title={fmtDate(sel) + (sel === today ? ' · ' + tr('今天') : '')}>
          <Card>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {isMom && <Tog k="period_start" t={tr('月经开始')} e="🩸" on={!!has('period_start')} />}
              {isMom && <Tog k="period_end" t={tr('月经结束')} e="⭕" on={!!has('period_end')} />}
              <Tog k="sex" t={tr('同房')} e="💕" on={!!has('sex')} />
              {isMom && !cyc && <Tog k="lh_pos" t={tr('试纸阳性')} e="🧪" on={!!has('lh_pos')} />}
              {isMom && !cyc && <Tog k="lh_neg" t={tr('试纸阴性')} e="➖" on={!!has('lh_neg')} />}
            </View>
            {isMom && (
              <View style={{ marginTop: space.md }}>
                <Caption style={{ marginBottom: 6 }}>{tr('经量 / 痛经')}</Caption>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[1, 2, 3].map((v) => { const on = has('flow')?.value === v; return <Pressable key={'f' + v} onPress={() => (on ? toggle('flow') : toggle('flow', v))} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: on ? colors.apricot : colors.line, backgroundColor: on ? colors.apricotSoft : colors.card }}><Text style={{ color: on ? colors.apricot : colors.ink2, fontSize: 13 }}>💧 {[tr('量少'), tr('量中'), tr('量多')][v - 1]}</Text></Pressable>; })}
                  {[1, 2, 3].map((v) => { const on = has('pain')?.value === v; return <Pressable key={'p' + v} onPress={() => (on ? toggle('pain') : toggle('pain', v))} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: on ? colors.slate : colors.line, backgroundColor: on ? colors.slateSoft : colors.card }}><Text style={{ color: on ? colors.slate : colors.ink2, fontSize: 13 }}>😖 {[tr('微痛'), tr('痛'), tr('很痛')][v - 1]}</Text></Pressable>; })}
                </View>
                <Caption style={{ marginTop: 10, marginBottom: 6 }}>{tr('症状')}</Caption>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {SYMPTOMS().map((s) => { const on = selSymptoms.includes(s); return <Pressable key={s} onPress={() => toggleSymptom(s)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: on ? colors.pine : colors.line, backgroundColor: on ? colors.pineSoft : colors.card }}><Text style={{ color: on ? colors.pine : colors.ink2, fontSize: 13 }}>{s}</Text></Pressable>; })}
                </View>
              </View>
            )}
            {isMom && (
              <Row style={{ marginTop: space.md, gap: 8, alignItems: 'flex-end' }}>
                <View style={{ flex: 1, marginBottom: -space.lg }}>
                  <Field label={tr('基础体温 ℃（晨起未动时量）')} value={bbt || (has('bbt')?.value ? String(has('bbt')!.value) : '')} onChange={setBbt} placeholder="36.6" keyboardType="decimal-pad" />
                </View>
                <Button title={tr('记')} small onPress={() => { const v = parseFloat(bbt); if (v >= 35 && v <= 40) { toggle('bbt', v); setBbt(''); } }} disabled={!bbt} />
              </Row>
            )}
            {!isMom && <Caption style={{ marginTop: 8 }}>{tr('月经和试纸由她来记；你可以记同房。')}</Caption>}
          </Card>
        </Section>

        {cycle && (
          <Section title={tr('这个周期')}>
            <Card>
              <Body2>{tr('上次月经 {a} · 周期第 {n} 天', { a: fmtDate(cycle.lastStart), n: cycle.cycleDay })}</Body2>
              <Body2>{tr('预计排卵 {o}，易孕期 {a}–{b}', { o: fmtDate(cycle.ovulation), a: fmtDate(cycle.fertileStart), b: fmtDate(cycle.fertileEnd) })}{cycle.fromLh ? tr('（按试纸阳性）') : ''}</Body2>
              <Body2>{tr('下次月经预计 {d}', { d: fmtDate(cycle.nextPeriod) })}{cycle.lateDays ? ' · ' + tr('已推迟 {n} 天', { n: cycle.lateDays }) : ''}</Body2>
              <Caption style={{ marginTop: 6 }}>{cycle.samples ? tr('按最近 {n} 个周期平均 {len} 天估算', { n: cycle.samples, len: cycle.avgLen }) : tr('还没有完整周期，先按设置的 {len} 天估算', { len: cycle.avgLen })}</Caption>
            </Card>
          </Section>
        )}

        {history.length > 1 && (
          <Section title={tr('历次周期')}>
            <Card style={{ padding: 0 }}>
              {history.slice(0, 8).map((h, i) => (
                <Row key={h.start} style={{ justifyContent: 'space-between', padding: space.md, paddingHorizontal: space.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                  <Body>{fmtDate(h.start)}</Body>
                  <Body2>{h.len ? tr('{n} 天', { n: h.len }) : tr('进行中')}</Body2>
                </Row>
              ))}
            </Card>
          </Section>
        )}

        {isMom && (
          <Section title={tr('周期设置')}>
            <Card>
              <Row style={{ gap: 12 }}>
                <View style={{ flex: 1 }}><Field label={tr('平均周期（天）')} value={cycleLen} onChange={setCycleLen} keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Field label={tr('经期（天）')} value={periodLen} onChange={setPeriodLen} keyboardType="numeric" /></View>
              </Row>
              <Button title={tr('保存')} small kind="ghost" onPress={saveCycle} style={{ alignSelf: 'flex-start', marginTop: -8 }} />
              <Caption style={{ marginTop: 10 }}>{tr('记满两个周期后，会自动按你实际的周期长度算，这里的数字只在开头用。')}</Caption>
            </Card>
          </Section>
        )}

        {isMom && cyc && <Button title={tr('开始备孕')} kind="ghost" onPress={() => alert(tr('开始备孕？'), tr('切换后首页会显示易孕期和最佳时机，并加上孕前检查和叶酸提醒。经期记录都保留。'), [{ text: tr('取消') }, { text: tr('开始'), onPress: () => { dispatch({ type: 'startTtc', byId: me.id }); router.replace('/'); } }])} style={{ marginTop: space.xl }} />}
        {isMom && <Button title={tr('我怀孕了 🎉')} onPress={becomePregnant} style={{ marginTop: cyc ? space.md : space.xl }} />}
        <Caption style={{ marginTop: space.lg, textAlign: 'center' }}>{cyc ? tr('预测按平均周期估算，周期不规律时误差较大。排卵期只作参考，不能用于避孕；有疑问请咨询医生。') : tr('排卵日按下次月经前 14 天估算，周期不规律时误差较大。只作备孕参考，不能用于避孕；有疑问请咨询医生。')}</Caption>
      </ScrollView>
    </Screen>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return <Row style={{ gap: 4 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} /><Caption>{t}</Caption></Row>;
}
