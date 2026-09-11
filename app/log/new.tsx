import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Body2, Button, Caption, Field, Row, Screen } from '../../src/components/ui';
import { DateField } from '../../src/components/DateField';
import { colors, space } from '../../src/theme';
import type { LogKind, Visibility } from '../../src/data/types';
import { uid } from '../../src/lib/pregnancy';
import { tr } from '../../src/i18n';

const KINDS = (): any[] => [
  { k: 'weight', t: tr('体重'), hint: tr('kg，建议每周同一时间称') },
  { k: 'symptom', t: tr('症状'), hint: tr('孕吐、水肿、腰酸、失眠…') },
  { k: 'mood', t: tr('心情'), hint: tr('今天感觉怎么样') },
  { k: 'kick', t: tr('胎动'), hint: tr('28 周起，早中晚各数 1 小时') },
  { k: 'note', t: tr('随手记'), hint: tr('想说的话、想留下的瞬间') },
];
const SYMPTOMS = (): any[] => [tr('孕吐'), tr('嗜睡'), tr('水肿'), tr('腰酸'), tr('失眠'), tr('便秘'), tr('胃灼热'), tr('头晕'), tr('抽筋'), tr('尿频')];
const MOODS = (): any[] => [tr('很好'), tr('平静'), tr('有点累'), tr('焦虑'), tr('烦躁'), tr('感动')];

export default function NewLog() {
  const { state, dispatch } = useStore();
  const { me, today } = useDerived();
  const router = useRouter();
  const [kind, setKind] = useState<LogKind>('weight');
  const [value, setValue] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState(today);
  const [vis, setVis] = useState<Visibility>('family');
  if (!me) return null;

  const toggleTag = (t: string) => setText((cur) => (cur.includes(t) ? cur.replace(t, '').replace(/\s+/g, ' ').trim() : (cur + ' ' + t).trim()));
  const valid = kind === 'weight' || kind === 'kick' ? !!Number(value) : text.trim().length > 0;
  const save = () => {
    if (!valid) return;
    const v = kind === 'weight' || kind === 'kick' ? Number(value) : undefined;
    const summary = kind === 'weight' ? tr('记录体重 {v} kg', { v: v! }) : kind === 'kick' ? tr('数了胎动 {v} 次', { v: v! }) : kind === 'symptom' ? tr('今天：{t}', { t: text.trim() }) : kind === 'mood' ? tr('心情：{t}', { t: text.trim() }) : text.trim();
    dispatch({ type: 'addLog', log: { id: uid(), kind, date, value: v, text: text.trim() || undefined, byId: me.id, at: new Date().toISOString(), visibility: vis }, activity: summary });
    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: space.lg }}>
            {KINDS().map((o) => (
              <Pressable key={o.k} onPress={() => { setKind(o.k); setText(''); setValue(''); }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: kind === o.k ? colors.pine : colors.line, backgroundColor: kind === o.k ? colors.pineSoft : colors.card }}>
                <Text style={{ fontWeight: '700', color: kind === o.k ? colors.pine : colors.ink2 }}>{o.t}</Text>
              </Pressable>
            ))}
          </Row>
          <Body2 style={{ marginBottom: space.md }}>{KINDS().find((o) => o.k === kind)!.hint}</Body2>

          {(kind === 'weight' || kind === 'kick') && <Field label={kind === 'weight' ? tr('体重（kg）') : tr('次数')} value={value} onChange={setValue} keyboardType="decimal-pad" placeholder={kind === 'weight' ? '58.5' : '10'} />}
          {kind === 'symptom' && (
            <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: space.md }}>
              {SYMPTOMS().map((t) => <Pressable key={t} onPress={() => toggleTag(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: text.includes(t) ? colors.warnSoft : colors.paper2 }}><Text style={{ color: text.includes(t) ? colors.warn : colors.ink2 }}>{t}</Text></Pressable>)}
            </Row>
          )}
          {kind === 'mood' && (
            <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: space.md }}>
              {MOODS().map((t) => <Pressable key={t} onPress={() => setText(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: text === t ? colors.apricotSoft : colors.paper2 }}><Text style={{ color: text === t ? colors.apricot : colors.ink2 }}>{t}</Text></Pressable>)}
            </Row>
          )}
          {kind !== 'weight' && kind !== 'kick' && <Field label={kind === 'note' ? tr('内容') : tr('补充说明')} value={text} onChange={setText} multiline placeholder="…" />}
          {(kind === 'weight' || kind === 'kick') && <Field label={tr("备注（可选）")} value={text} onChange={setText} placeholder="…" />}
          <DateField label={tr("日期")} value={date} onChange={setDate} max={today} />

          {me.role === 'mom' && (
            <>
              <Caption style={{ marginBottom: 6 }}>{tr('谁能看到')}</Caption>
              <Row style={{ gap: 8, marginBottom: space.xl }}>
                {([['self', tr('仅自己')], ['partner', tr('伴侣')], ['family', tr('全家')]] as [Visibility, string][]).map(([v, t]) => (
                  <Pressable key={v} onPress={() => setVis(v)} style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: vis === v ? colors.pine : colors.line, backgroundColor: vis === v ? colors.pineSoft : colors.card, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '700', color: vis === v ? colors.pine : colors.ink2 }}>{t}</Text>
                  </Pressable>
                ))}
              </Row>
            </>
          )}
          <Button title={tr("保存")} onPress={save} disabled={!valid} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
