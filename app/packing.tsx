import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useDerived, useStore } from '../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, Field, Row, Screen, Section } from '../src/components/ui';
import { colors, space } from '../src/theme';
import { defaultPacking } from '../src/data/schedule';
import type { PackingItem } from '../src/data/types';

/** 待产包：全家一起准备，准爸爸可以认领 */
export default function Packing() {
  const { state, dispatch } = useStore();
  const { me, byId } = useDerived();
  const [adding, setAdding] = useState<string | null>(null);
  const [text, setText] = useState('');
  if (!me) return null;
  const items: PackingItem[] = state.packing && state.packing.length ? state.packing : defaultPacking();
  const groups = ['证件', '妈妈', '宝宝'];
  const done = items.filter((i) => i.done).length;
  const readonly = me.role === 'family';

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Row style={{ justifyContent: 'space-between' }}>
          <Body2>建议孕 34 周前备齐。勾一下代表准备好了，会显示是谁准备的。</Body2>
        </Row>
        <View style={{ height: 8, backgroundColor: colors.paper2, borderRadius: 4, overflow: 'hidden', marginTop: space.md }}>
          <View style={{ width: `${(done / Math.max(1, items.length)) * 100}%`, height: 8, backgroundColor: colors.pine }} />
        </View>
        <Caption style={{ marginTop: 4 }}>{done} / {items.length} 已备好</Caption>

        {groups.map((g) => (
          <Section key={g} title={g} right={!readonly ? <Pressable onPress={() => { setAdding(g); setText(''); }}><Caption style={{ color: colors.pine }}>添加</Caption></Pressable> : undefined}>
            <Card style={{ padding: 0 }}>
              {items.filter((i) => i.group === g).map((it, idx) => {
                const who = it.byId ? byId(it.byId) : undefined;
                return (
                  <Pressable key={it.id} disabled={readonly} onPress={() => dispatch({ type: 'togglePacking', id: it.id, byId: me.id })} style={{ flexDirection: 'row', alignItems: 'center', padding: space.md, paddingHorizontal: space.lg, borderTopWidth: idx ? 1 : 0, borderTopColor: colors.line }}>
                    <View style={{ width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: it.done ? colors.pine : colors.line, backgroundColor: it.done ? colors.pine : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      {it.done && <Text style={{ color: colors.onPine, fontSize: 14, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <Body style={{ flex: 1, color: it.done ? colors.ink3 : colors.ink, textDecorationLine: it.done ? 'line-through' : 'none' }}>{it.text}</Body>
                    {who && <Avatar name={who.name} role={who.role} size={22} />}
                  </Pressable>
                );
              })}
            </Card>
            {adding === g && (
              <Card style={{ marginTop: space.sm }}>
                <Field label="加一项" value={text} onChange={setText} placeholder="例如：束腹带" />
                <Row style={{ gap: 8 }}>
                  <Button title="添加" small onPress={() => { if (text.trim()) dispatch({ type: 'addPacking', group: g, text: text.trim() }); setAdding(null); }} />
                  <Button title="取消" small kind="ghost" onPress={() => setAdding(null)} />
                </Row>
              </Card>
            )}
          </Section>
        ))}
        <Caption style={{ marginTop: space.xl, textAlign: 'center' }}>清单按常见医院要求整理，以你产检医院的通知为准。</Caption>
      </ScrollView>
    </Screen>
  );
}
