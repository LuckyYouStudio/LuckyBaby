import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store/store';
import { Body2, Button, Caption, Field, Row, Screen } from '../../src/components/ui';
import { colors, roleColor, space } from '../../src/theme';
import type { Role } from '../../src/data/types';
import { uid } from '../../src/lib/pregnancy';
import { tr } from '../../src/i18n';

const RELATIONS = (): any[] => [tr('老公'), tr('妈妈'), tr('爸爸'), tr('婆婆'), tr('公公'), tr('姐姐'), tr('妹妹'), tr('哥哥'), tr('弟弟'), tr('闺蜜')];

export default function NewMember() {
  const { state, dispatch } = useStore();
  const router = useRouter();
  const hasDad = state.members.some((m) => m.role === 'dad');
  const [role, setRole] = useState<Role>(hasDad ? 'family' : 'dad');
  const [name, setName] = useState('');
  const [relation, setRelation] = useState(hasDad ? '' : tr('老公'));

  const save = () => {
    if (!name.trim()) return;
    dispatch({ type: 'addMember', member: { id: uid(), name: name.trim(), role, relation: relation || undefined, joinedAt: new Date().toISOString() } });
    router.back();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Body2 style={{ marginBottom: space.lg }}>{tr('把邀请码')} <Text style={{ fontWeight: '700', color: colors.pine }}>{state.familyCode}</Text> {tr('发给家人。当前版本先在本机添加成员，用来体验不同角色看到的内容；云端同步在下一版本开放。')}</Body2>
        <Caption style={{ marginBottom: 6 }}>{tr('角色')}</Caption>
        <Row style={{ gap: 8, marginBottom: space.lg }}>
          {(['dad', 'family'] as Role[]).map((r) => (
            <Pressable key={r} disabled={r === 'dad' && hasDad} onPress={() => { setRole(r); setRelation(r === 'dad' ? tr('老公') : ''); }} style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: role === r ? roleColor[r].fg : colors.line, backgroundColor: role === r ? roleColor[r].bg : colors.card, opacity: r === 'dad' && hasDad ? 0.4 : 1 }}>
              <Text style={{ fontWeight: '700', color: role === r ? roleColor[r].fg : colors.ink2, textAlign: 'center' }}>{roleColor[r].label}</Text>
              <Caption style={{ textAlign: 'center', marginTop: 2 }}>{r === 'dad' ? tr('能记录、打卡、陪产检') : tr('看动态和产检日程')}</Caption>
            </Pressable>
          ))}
        </Row>
        <Field label={tr("称呼")} value={name} onChange={setName} placeholder={role === 'dad' ? tr('例如：阿强') : tr('例如：外婆')} />
        <Caption style={{ marginBottom: 6 }}>{tr('关系')}</Caption>
        <Row style={{ flexWrap: 'wrap', gap: 8, marginBottom: space.xl }}>
          {RELATIONS().map((t) => (
            <Pressable key={t} onPress={() => setRelation(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: relation === t ? colors.pineSoft : colors.paper2 }}>
              <Text style={{ color: relation === t ? colors.pine : colors.ink2 }}>{t}</Text>
            </Pressable>
          ))}
        </Row>
        <Button title={tr("添加")} onPress={save} disabled={!name.trim()} />
      </ScrollView>
    </Screen>
  );
}
