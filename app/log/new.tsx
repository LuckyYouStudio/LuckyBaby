import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Body2, Button, Caption, Field, Row, Screen } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import type { LogKind, Visibility } from '../../src/data/types';
import { uid } from '../../src/lib/pregnancy';

const KINDS: { k: LogKind; t: string; hint: string }[] = [
  { k: 'weight', t: '体重', hint: 'kg，建议每周同一时间称' },
  { k: 'symptom', t: '症状', hint: '孕吐、水肿、腰酸、失眠…' },
  { k: 'mood', t: '心情', hint: '今天感觉怎么样' },
  { k: 'kick', t: '胎动', hint: '28 周起，早中晚各数 1 小时' },
  { k: 'note', t: '随手记', hint: '想说的话、想留下的瞬间' },
];
const SYMPTOMS = ['孕吐', '嗜睡', '水肿', '腰酸', '失眠', '便秘', '胃灼热', '头晕', '抽筋', '尿频'];
const MOODS = ['很好', '平静', '有点累', '焦虑', '烦躁', '感动'];

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
    const summary = kind === 'weight' ? `记录体重 ${v} kg` : kind === 'kick' ? `数了胎动 ${v} 次` : kind === 'symptom' ? `今天：${text.trim()}` : kind === 'mood' ? `心情：${text.trim()}` : text.trim();
    dispatch({ type: 'addLog', log: { id: uid(), kind, date, value: v, text: text.trim() || undefined, byId: me.id, at: new Date().toISOString(), visibility: vis }, activity: summary });
    router.back();
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: space.lg }}>
            {KINDS.map((o) => (
              <Pressable key={o.k} onPress={() => { setKind(o.k); setText(''); setValue(''); }} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: kind === o.k ? colors.pine : colors.line, backgroundColor: kind === o.k ? colors.pineSoft : colors.card }}>
                <Text style={{ fontWeight: '700', color: kind === o.k ? colors.pine : colors.ink2 }}>{o.t}</Text>
              </Pressable>
            ))}
          </Row>
          <Body2 style={{ marginBottom: space.md }}>{KINDS.find((o) => o.k === kind)!.hint}</Body2>

          {(kind === 'weight' || kind === 'kick') && <Field label={kind === 'weight' ? '体重（kg）' : '次数'} value={value} onChange={setValue} keyboardType="decimal-pad" placeholder={kind === 'weight' ? '58.5' : '10'} />}
          {kind === 'symptom' && (
            <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: space.md }}>
              {SYMPTOMS.map((t) => <Pressable key={t} onPress={() => toggleTag(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: text.includes(t) ? colors.warnSoft : colors.paper2 }}><Text style={{ color: text.includes(t) ? colors.warn : colors.ink2 }}>{t}</Text></Pressable>)}
            </Row>
          )}
          {kind === 'mood' && (
            <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: space.md }}>
              {MOODS.map((t) => <Pressable key={t} onPress={() => setText(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: text === t ? colors.apricotSoft : colors.paper2 }}><Text style={{ color: text === t ? colors.apricot : colors.ink2 }}>{t}</Text></Pressable>)}
            </Row>
          )}
          {kind !== 'weight' && kind !== 'kick' && <Field label={kind === 'note' ? '内容' : '补充说明'} value={text} onChange={setText} multiline placeholder="…" />}
          {(kind === 'weight' || kind === 'kick') && <Field label="备注（可选）" value={text} onChange={setText} placeholder="…" />}
          <Field label="日期" value={date} onChange={setDate} keyboardType="numeric" />

          {me.role === 'mom' && (
            <>
              <Caption style={{ marginBottom: 6 }}>谁能看到</Caption>
              <Row style={{ gap: 8, marginBottom: space.xl }}>
                {([['self', '仅自己'], ['partner', '伴侣'], ['family', '全家']] as [Visibility, string][]).map(([v, t]) => (
                  <Pressable key={v} onPress={() => setVis(v)} style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: vis === v ? colors.pine : colors.line, backgroundColor: vis === v ? colors.pineSoft : colors.card, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '700', color: vis === v ? colors.pine : colors.ink2 }}>{t}</Text>
                  </Pressable>
                ))}
              </Row>
            </>
          )}
          <Button title="保存" onPress={save} disabled={!valid} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
