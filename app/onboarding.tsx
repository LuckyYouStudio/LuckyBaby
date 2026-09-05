import React, { useEffect, useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { extractCode } from '../src/lib/invite';
import { LangToggle } from '../src/components/LangToggle';
import { alert } from '../src/lib/alert';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store/store';
import { Body, Body2, Button, Caption, Field, H1, Row, Screen } from '../src/components/ui';
import { colors, roleColor, space } from '../src/theme';
import { addDays, dueFromLmp, today, uid } from '../src/lib/pregnancy';
import { cloudEnabled, ensureSession } from '../src/lib/supabase';
import { createFamilyRemote, joinFamilyRemote, myFamilyRemote, pullAll } from '../src/store/sync';
import { restoreEmailStart, signInWithApple } from '../src/lib/account';
import { EmailOtp } from '../src/components/EmailOtp';
import type { Role } from '../src/data/types';
import { tr } from '../src/i18n';

const RELATIONS = (): any[] => [tr('老公'), tr('妈妈'), tr('爸爸'), tr('婆婆'), tr('公公'), tr('姐姐'), tr('妹妹'), tr('哥哥'), tr('弟弟'), tr('闺蜜')];

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
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const [flow, setFlow] = useState<'create' | 'join'>(params.code ? 'join' : 'create');
  const [restoreMode, setRestoreMode] = useState(false);
  const [busy, setBusy] = useState(false);

  // 建立家庭
  const [name, setName] = useState('');
  const [mode, setMode] = useState<'lmp' | 'due'>('lmp');
  const [date, setDate] = useState(addDays(today(), -70));
  const [nick, setNick] = useState('');
  const validCreate = name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date);
  const dueDate = mode === 'lmp' ? dueFromLmp(date) : date;

  // 加入家庭
  const [code, setCode] = useState(extractCode(params.code ?? '') ?? '');
  useEffect(() => { const c = extractCode(params.code ?? ''); if (c) { setCode(c); setFlow('join'); } }, [params.code]);
  const paste = async () => {
    const t = await Clipboard.getStringAsync();
    const c = extractCode(t);
    if (c) setCode(c); else alert(tr('剪贴板里没有邀请码'), tr('让家人把 6 位邀请码或邀请链接发给你，复制后再点粘贴。'));
  };
  const [jname, setJname] = useState('');
  const [role, setRole] = useState<Role>('dad');
  const [relation, setRelation] = useState(tr('老公'));
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
      alert(tr('连不上云端'), `${e?.message ?? e}\n\n可以先在本机使用，之后再开云同步。`, [
        { text: tr('取消') },
        { text: tr('先本机使用'), onPress: () => dispatch({ type: 'setup', pregnancy, me }) },
      ]);
    } finally { setBusy(false); }
  };

  const finishRestore = async (userId: string) => {
    const mine = await myFamilyRemote();
    if (!mine) { alert(tr('这个账号还没有绑定过家庭'), tr('如果你是准妈妈，请建立家庭；如果是家人，请用邀请码加入。')); return; }
    const slices = await pullAll(mine.familyId);
    const me = slices.members.find((m) => m.id === mine.memberId);
    if (!me) throw new Error('member missing');
    dispatch({ type: 'joinFamily', pregnancy: mine.pregnancy, me, familyCode: mine.inviteCode, cloud: { familyId: mine.familyId, userId, bound: true }, slices });
  };
  const restore = async () => {
    if (!cloudEnabled) return;
    setBusy(true);
    try {
      const userId = await signInWithApple();
      const mine = await myFamilyRemote();
      if (!mine) { alert(tr('这个 Apple ID 还没有绑定过家庭'), tr('如果你是准妈妈，请建立家庭；如果是家人，请用邀请码加入。')); return; }
      const slices = await pullAll(mine.familyId);
      const me = slices.members.find((m) => m.id === mine.memberId);
      if (!me) throw new Error('member missing');
      dispatch({ type: 'joinFamily', pregnancy: mine.pregnancy, me, familyCode: mine.inviteCode, cloud: { familyId: mine.familyId, userId, bound: true }, slices });
    } catch (e: any) {
      if (String(e?.code) === 'ERR_REQUEST_CANCELED') return;
      alert(tr('恢复失败'), String(e?.message ?? e));
    } finally { setBusy(false); }
  };

  const join = async () => {
    if (!validJoin) return;
    if (!cloudEnabled) { alert(tr('云同步未配置'), tr('请先在 .env 里填 Supabase 地址和密钥。')); return; }
    setBusy(true);
    try {
      const userId = await ensureSession();
      const r = await joinFamilyRemote(code.trim(), jname.trim(), role, relation || undefined, uid());
      const slices = await pullAll(r.familyId);
      const me = slices.members.find((m) => m.id === r.memberId) ?? { id: r.memberId, name: jname.trim(), role, relation, joinedAt: new Date().toISOString() };
      dispatch({ type: 'joinFamily', pregnancy: r.pregnancy, me, familyCode: r.inviteCode, cloud: { familyId: r.familyId, userId }, slices });
    } catch (e: any) {
      alert(tr('没能加入'), String(e?.message ?? e));
    } finally { setBusy(false); }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <Caption>{tr('幸运宝贝 · 一家人一起记录的孕期')}</Caption>
            <LangToggle compact />
          </Row>
          <H1 style={{ marginBottom: 16 }}>{flow === 'create' ? tr('你好，准妈妈') : tr('加入她的孕期')}</H1>

          <Choice value={flow} onChange={setFlow} options={[{ v: 'create', t: tr('我是准妈妈'), d: tr('建立家庭') }, { v: 'join', t: tr('我有邀请码'), d: tr('准爸爸 / 家人') }]} />

          {flow === 'create' ? (
            <>
              <Body2 style={{ marginBottom: space.xl }}>{tr('先由你建立这个家庭。之后用邀请码把准爸爸和家人加进来，他们能看到什么由你决定。')}</Body2>
              <Field label={tr("你的称呼")} value={name} onChange={setName} placeholder={tr("例如：小雨")} />
              <Caption style={{ marginBottom: 6 }}>{tr('推算孕周的方式')}</Caption>
              <Choice value={mode} onChange={setMode} options={[{ v: 'lmp', t: tr('末次月经') }, { v: 'due', t: tr('医生给的预产期') }]} />
              <Field label={mode === 'lmp' ? tr('末次月经第一天（YYYY-MM-DD）') : tr('预产期（YYYY-MM-DD）')} value={date} onChange={setDate} placeholder="2026-06-26" keyboardType="numeric" />
              {validCreate && <Body style={{ marginTop: -8, marginBottom: space.lg, color: colors.pine }}>{tr('预产期')} {dueDate}</Body>}
              <Field label={tr("宝宝小名（可选）")} value={nick} onChange={setNick} placeholder={tr("例如：小豆子")} />
              {busy ? <ActivityIndicator color={colors.pine} style={{ marginTop: space.md }} /> : <Button title={tr("建立家庭")} onPress={create} disabled={!validCreate} style={{ marginTop: space.md }} />}
            </>
          ) : (
            <>
              <Body2 style={{ marginBottom: space.xl }}>{tr('让准妈妈把「家庭」页的 6 位邀请码发给你。加入后你看到的内容由她决定。')}</Body2>
              <Field label={tr("邀请码")} value={code} onChange={(t) => setCode(t.toUpperCase())} placeholder={tr("例如：TY7K2Q")} />
              <Row style={{ gap: 8, marginTop: -8, marginBottom: space.lg }}>
                <Button title={tr("粘贴邀请码")} small kind="ghost" onPress={paste} />
                <Button title={tr("扫二维码")} small kind="ghost" onPress={() => router.push('/scan' as never)} />
              </Row>
              <Field label={tr("你的称呼")} value={jname} onChange={setJname} placeholder={role === 'dad' ? tr('例如：阿强') : tr('例如：外婆')} />
              <Caption style={{ marginBottom: 6 }}>{tr('你是')}</Caption>
              <Choice value={role} onChange={(r) => { setRole(r); setRelation(r === 'dad' ? tr('老公') : ''); }} options={[
                { v: 'dad', t: tr('准爸爸'), d: tr('能记录、打卡、陪产检'), fg: roleColor.dad.fg, bg: roleColor.dad.bg },
                { v: 'family', t: tr('家人'), d: tr('看动态和产检日程'), fg: roleColor.family.fg, bg: roleColor.family.bg },
              ]} />
              <Caption style={{ marginBottom: 6 }}>{tr('和准妈妈的关系')}</Caption>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: space.xl }}>
                {RELATIONS().map((t) => (
                  <Pressable key={t} onPress={() => setRelation(t)} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: relation === t ? colors.pineSoft : colors.paper2 }}>
                    <Text style={{ color: relation === t ? colors.pine : colors.ink2 }}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              {busy ? <ActivityIndicator color={colors.pine} /> : <Button title={tr("加入家庭")} onPress={join} disabled={!validJoin} />}
            </>
          )}

          <Caption style={{ marginTop: space.lg, textAlign: 'center' }}>{cloudEnabled ? tr('数据只在你的家庭内可见。不做社区，不做广告，不卖数据。') : tr('数据只存在你的手机里。不做社区，不做广告，不卖数据。')}</Caption>
          {cloudEnabled && (
            <View style={{ marginTop: space.lg, alignItems: 'center' }}>
              {Platform.OS === 'ios' && (
                <Pressable onPress={restore} disabled={busy}>
                  <Caption style={{ color: colors.pine, fontWeight: '700' }}>{tr('换了手机？用 Apple 登录恢复')}</Caption>
                </Pressable>
              )}
              <Pressable onPress={() => setRestoreMode((v) => !v)} disabled={busy} style={{ marginTop: 8 }}>
                <Caption style={{ color: colors.pine, fontWeight: '700' }}>{Platform.OS === 'ios' ? tr('或用邮箱链接恢复') : tr('换了手机？用邮箱链接恢复')}</Caption>
              </Pressable>
            </View>
          )}
          {cloudEnabled && restoreMode && (
            <EmailOtp sendLabel={tr('发登录链接')} onSend={restoreEmailStart} />
          )}
          <Pressable onPress={() => dispatch({ type: 'seedDemo' })} style={{ marginTop: space.xl, alignItems: 'center' }}>
            <Caption style={{ color: colors.pine, fontWeight: '700' }}>{tr('先用示例家庭看看')}</Caption>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
