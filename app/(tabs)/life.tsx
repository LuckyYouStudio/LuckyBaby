import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, Empty, Pill, Row, Screen, Section } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { fmtDate, gestation } from '../../src/lib/pregnancy';

function WeightChart({ points, dueDate }: { points: { date: string; value: number }[]; dueDate: string }) {
  if (points.length < 2) return <Body2>记两次以上体重后会画出曲线。</Body2>;
  const w = 320, h = 120, pad = 8;
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1;
  const weeks = points.map((p) => gestation(dueDate, p.date).week);
  const wmin = Math.min(...weeks), wmax = Math.max(...weeks) || 1;
  const x = (wk: number) => pad + ((wk - wmin) / Math.max(1, wmax - wmin)) * (w - pad * 2);
  const y = (v: number) => h - pad - ((v - min) / (max - min)) * (h - pad * 2);
  return (
    <View style={{ height: h, width: '100%', position: 'relative' }}>
      {points.map((p, i) => {
        const cx = x(weeks[i]), cy = y(p.value);
        const next = points[i + 1];
        return (
          <React.Fragment key={p.date + i}>
            {next && (() => {
              const nx = x(weeks[i + 1]), ny = y(next.value);
              const len = Math.hypot(nx - cx, ny - cy);
              const ang = (Math.atan2(ny - cy, nx - cx) * 180) / Math.PI;
              return <View style={{ position: 'absolute', left: cx, top: cy, width: len, height: 2, backgroundColor: colors.pine, transform: [{ translateX: 0 }, { rotate: `${ang}deg` }], transformOrigin: 'left center' as any }} />;
            })()}
            <View style={{ position: 'absolute', left: cx - 4, top: cy - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: i === points.length - 1 ? colors.apricot : colors.pine }} />
            {(i === 0 || i === points.length - 1) && (
              <Text style={{ position: 'absolute', left: cx - 16, top: cy - 20, fontSize: 11, color: colors.ink2 }}>{p.value}</Text>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function Life() {
  const { state } = useStore();
  const { me, canSee, byId } = useDerived();
  const router = useRouter();
  if (!me) return null;

  const logs = state.logs.filter((l) => canSee(l.visibility)).sort((a, b) => (a.at < b.at ? 1 : -1));
  const packTotal = state.packing?.length || 15;
  const packDone = state.packing?.filter((p) => p.done).length ?? 0;
  const weights = logs.filter((l) => l.kind === 'weight' && l.value != null).sort((a, b) => (a.date < b.date ? -1 : 1)).map((l) => ({ date: l.date, value: l.value! }));
  const lastW = weights[weights.length - 1];
  const firstW = weights[0];
  const kindLabel = { weight: '体重', symptom: '症状', mood: '心情', kick: '胎动', note: '随手记' } as const;
  const kindTone = { weight: 'pine', symptom: 'warn', mood: 'apricot', kick: 'slate', note: 'grey' } as const;

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
        {me.role !== 'family' && (
          <Row style={{ gap: 10 }}>
            <Card style={{ flex: 1, backgroundColor: colors.pineSoft, borderColor: colors.pineSoft }} onPress={() => router.push('/kicks')}>
              <Text style={{ fontSize: 26 }}>👣</Text>
              <Body style={{ fontWeight: '700', marginTop: 4 }}>数胎动</Body>
              <Caption>大按钮，一只手按{'\n'}28 周起每天三次</Caption>
            </Card>
            <Card style={{ flex: 1, backgroundColor: colors.apricotSoft, borderColor: colors.apricotSoft }} onPress={() => router.push('/packing')}>
              <Text style={{ fontSize: 26 }}>🧳</Text>
              <Body style={{ fontWeight: '700', marginTop: 4 }}>待产包</Body>
              <Caption>{packDone} / {packTotal} 已备好{'\n'}全家一起准备</Caption>
            </Card>
          </Row>
        )}
        <Section title="体重">
          <Card>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <View>
                <Text style={{ fontSize: 28, fontWeight: '700', color: colors.ink, fontVariant: ['tabular-nums'] }}>{lastW ? `${lastW.value} kg` : '—'}</Text>
                <Caption>{lastW ? `${fmtDate(lastW.date)}` : '还没记录'}{firstW && lastW && firstW !== lastW ? ` · 较首次 ${(lastW.value - firstW.value >= 0 ? '+' : '')}${(lastW.value - firstW.value).toFixed(1)} kg` : ''}</Caption>
              </View>
              <Pill text="孕期推荐增重 11.5–16 kg" tone="grey" />
            </Row>
            <WeightChart points={weights} dueDate={state.pregnancy.dueDate} />
          </Card>
        </Section>

        <Section title="最近记录">
          {logs.length === 0 ? (
            <Empty text="还没有记录。体重、症状、心情、胎动都可以记。" />
          ) : (
            logs.slice(0, 30).map((l) => {
              const who = byId(l.byId);
              return (
                <Card key={l.id} style={{ marginBottom: space.sm }}>
                  <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Row style={{ flex: 1, alignItems: 'flex-start' }}>
                      <Pill text={kindLabel[l.kind]} tone={kindTone[l.kind]} />
                      <Body style={{ flex: 1 }}>{l.kind === 'weight' ? `${l.value} kg` : l.kind === 'kick' ? `${l.value} 次` : l.text}</Body>
                    </Row>
                    <Row style={{ marginLeft: 8 }}>
                      {who && <Avatar name={who.name} role={who.role} size={20} />}
                      <Caption>{fmtDate(l.date)}</Caption>
                    </Row>
                  </Row>
                  {l.kind !== 'note' && l.kind !== 'symptom' && l.kind !== 'mood' && !!l.text && <Body2 style={{ marginTop: 4 }}>{l.text}</Body2>}
                </Card>
              );
            })
          )}
        </Section>

        {me.role !== 'family' && <Button title="记一笔" onPress={() => router.push('/log/new')} style={{ marginTop: space.xl }} />}
      </ScrollView>
    </Screen>
  );
}
