import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store/store';
import { Body, Body2, Button, Caption, Field, H1, Screen } from '../src/components/ui';
import { colors, roleColor, space } from '../src/theme';
import { addDays, dueFromLmp, today, uid } from '../src/lib/pregnancy';
import { cloudEnabled, ensureSession } from '../src/lib/supabase';
import { createFamilyRemote, joinFamilyRemote, pullAll } from '../src/store/sync';
import type { Role } from '../src/data/types';

const RELATIONS = ['老公', '妈妈', '爸爸', '婆婆', '公公', '姐姐', '妹妹', '哥哥', '弟弟', '闺蜜'];

function Choice<T extends string>({ value, options, onChange }: { value: T; options: { v: T; t: string; d?: string; fg?: string; bg?: string }[]; onChange: (v: T) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.lg }}>
      {options.map((o) => {
        const on = value === o.v;
        return (
          <Pressable key={o.v} onPress={() => onChange(o.v)} style={{ flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: on ? o.fg ?? colors.pine : colors.line, backgroundColor: on ? o.bg ?? colors.pineSoft : colors.card }}>
            <Text style={{ fontWeight: '700', color: on ? o.fg ?? colors.pine : colors.ink2, textAlign: 'center' }}>{o.t}</Text>
            {!!o.d && <Caption style={{ textAlign: 'center', marginTop: 2 }}>{o.d}</Caption>}
          </Pressable>
        );
      })}
    </View>
  );
}

export default function Onboarding() {
  const { dispatch } = useStore();
  const insets = useSafeAreaInsets();
  const [flow, setFlow] = useState<'create' | 'join'>('create');
  const [busy, setBusy] = useState(false);

  // 建立家庭
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'lmp' | 'due'>('lmp');
  const [date, setDate] = useState(addDays(today(), -70));
  const [nick, setNick] = useState('');
  const validCreate = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const dueDate = mode === 'lmp' ? dueFromLmp(date) : date;

  // 加入家庭
  const [code, setCode] = useState('');
  const [jname, setJname] = useState('');
  const [role, setRole] = useState<Role>('dad');
  const [relation, setRelation] = useState('老公');
  const validJoin = code.trim().length >= 6 && jname.trim().length > 0;

  const create = async () => {
    if (!validCreate) return;
    const pregnancy = { dueDate, lmp: mode === 'lmp' ? date : undefined, momName: name.trim(), babyNickname: nick.trim() || undefined };
    const me = { id: uid(), name: name.trim(), role: 'mom' as const, joinedAt: new Date().toISOString() };
    if (!cloudEnabled) { dispatch({ type: 'setup', pregnancy, me }); return; }
    setBusy(true);
    try {
      const userId = await ensureSession();
      const r = await createFamilyRemote(pregnancy, me.id);
      dispatch({ type: 'setup', pregnancy, me: { ...me, id: r.member_id }, familyCode: r.invite_code, cloud: { familyId: r.family_id, userId } });
    } catch (e: any) {
      Alert.alert('连不上云端', `${e?.message ?? e}\n\n可以先在本机使用，之后再开云同步。`, [
        { text: '取消' },
        { text: '先本机使用', onPress: () => dispatch({ type: 'setup', pregnancy, me }) },
      ]);
    } finally { setBusy(false); }
  };

  const join = async () => {
    if (!validJoin) return;
    if (!cloudEnabled) { Alert.alert('云同步未配置', '请先在 .env 里填 Supabase 地址和密钥。'); return; }
    setBusy(true);
    try {
      const userId = await ensureSession();
      const r = await joinFamilyRemote(code.trim(), jname.trim(), role, relation || undefined, uid());
      const slices = await pullAll(r.familyId);
      const me = slices.members.find((m) => m.id === r.memberId) ?? { id: r.memberId, name: jname.trim(), role, relation, joinedAt: new Date().toISOString() };
      dispatch({ type: 'joinFamily', pregnancy: r.pregnancy, me, familyCode: r.inviteCode, cloud: { familyId: r.familyId, userId }, slices });
    } catch (e: any) {
      Alert.alert('没能加入', String(e?.message ?? e));
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Caption style={{ marginBottom: 8 }}>幸运宝贝 · 一家人一起记录的孕期</Caption>
          <H1 style={{ marginBottom: 16 }}>{flow === 'create' ? '你好，准妈妈' : '加入她的孕期'}</H1>

          <Choice value={flow} onChange={setFlow} options={[{ v: 'create', t: '我是准妈妈', d: '建立家庭' }, { v: 'join', t: '我有邀请码', d: '准爸爸 / 家人' }]} />

          {flow === 'create' ? (
            <>
              <Body2 style={{ marginBottom: space.xl }}>先由你建立这个家庭。之后用邀请码把准爸爸和家人加进来，他们能看到什么由你决定。</Body2>
              <Field label="你的称呼" value={name} onChange={setName} placeholder="例如：小雨" />
              <Caption style={{ marginBottom: 6 }}>推算孕周的方式</Caption>
              <Choice value={mode} onChange={setMode} options={[{ v: 'lmp', t: '末次月经' }, { v: 'due', t: '医生给的预产期' }]} />
              <Field label={mode === 'lmp' ? '末次月经第一天（YYYY-MM-DD）' : '预产期（YYYY-MM-DD）'} value={date} onChange={setDate} placeholder="2026-06-26" keyboardType="numeric" />
              {validCreate && <Body style={{ marginTop: -8, marginBottom: space.lg, color: colors.pine }}>预产期 {dueDate}</Body>}
              <Field label="宝宝小名（可选）" value={nick} onChange={setNick} placeholder="例如：小豆子" />
              {busy ? <ActivityIndicator color={colors.pine} style={{ marginTop: space.md }} /> : <Button title="建立家庭" onPress={create} disabled={!validCreate} style={{ marginTop: space.md }} />}
            </>
          ) : (
            <>
              <Body2 style={{ marginBottom: space.xl }}>让准妈妈把「家庭」页的 6 位邀请码发给你。加入后你看到的内容由她决定。</Body2>
              <Field label="邀请码" value={code} onChange={(t) => setCode(t.toUpperCase())} placeholder="例如：TY7K2Q" />
              <Field label="你的称呼" value={jname} onChange={setJname} placeholder={role === 'dad' ? '例如：阿强' : '例如：外婆'} />
              <Caption style={{ marginBottom: 6 }}>你是</Caption>
              <Choice value={role} onChange={(r) => { setRole(r); setRelation(r === 'dad' ? '老公' : ''); }} options={[
                { v: 'dad', t: '准爸爸', d: '能记录、打卡、陪产检', fg: roleColor.dad.fg, bg: roleColor.dad.bg },
                { v: 'family', t: '家人', d: '看动态和产检日程', fg: roleColor.family.fg, bg: roleColor.family.bg },
              ]} />
              <Caption style={{ marginBottom: 6 }}>和准妈妈的关系</Caption>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.xl }}>
                {RELATIONS.map((t) => (
                  <Pressable key={t} onPress={() => setRelation(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: relation === t ? colors.pineSoft : colors.paper2 }}>
                    <Text style={{ color: relation === t ? colors.pine : colors.ink2 }}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              {busy ? <ActivityIndicator color={colors.pine} /> : <Button title="加入家庭" onPress={join} disabled={!validJoin} />}
            </>
          )}

          <Caption style={{ marginTop: space.lg, textAlign: 'center' }}>{cloudEnabled ? '数据只在你的家庭内可见。不做社区，不做广告，不卖数据。' : '数据只存在你的手机里。不做社区，不做广告，不卖数据。'}</Caption>
          <Pressable onPress={() => dispatch({ type: 'seedDemo' })} style={{ marginTop: space.xl, alignItems: 'center' }}>
            <Caption style={{ color: colors.pine, fontWeight: '700' }}>先用示例家庭看看</Caption>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
