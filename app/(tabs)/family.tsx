import React, { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { alert } from '../../src/lib/alert';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, Divider, Pill, Row, Screen, Section } from '../../src/components/ui';
import { Feed } from '../../src/components/Feed';
import { LangToggle } from '../../src/components/LangToggle';
import { bindApple, bindEmailStart, deleteAccount, leaveFamily } from '../../src/lib/account';
import { EmailOtp } from '../../src/components/EmailOtp';
import { Platform } from 'react-native';
import { openPrivacy, openTerms } from '../../src/lib/legal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, roleColor, roleLabel, space } from '../../src/theme';
import { tr } from '../../src/i18n';

export default function Family() {
  const { state, dispatch, sync, syncError, refresh } = useStore();
  const { me } = useDerived();
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const bind = async () => {
    setBusy(true);
    try {
      const userId = await bindApple();
      dispatch({ type: 'setCloudUser', userId, bound: true });
      alert(tr('绑定成功'), tr('以后换手机，用 Apple 登录就能找回这个家庭。'));
    } catch (e: any) {
      if (String(e?.code) === 'ERR_REQUEST_CANCELED') return;
      alert(tr('绑定失败'), String(e?.message ?? e));
    } finally { setBusy(false); }
  };
  const removeAccount = () => alert(tr('删除账号'), me?.role === 'mom' ? tr('这会删除整个家庭在云端的全部记录，家人也会一起失去。此操作不可恢复。') : tr('你会退出这个家庭，并删除你的登录账号。此操作不可恢复。'), [
    { text: tr('取消'), style: 'cancel' },
    { text: tr('删除'), style: 'destructive', onPress: () => alert(tr('再确认一次'), tr('真的要删除吗？'), [
      { text: tr('取消'), style: 'cancel' },
      { text: tr('确定删除'), style: 'destructive', onPress: async () => {
        setBusy(true);
        try { await deleteAccount(); dispatch({ type: 'reset' }); AsyncStorage.clear().catch(() => {}); }
        catch (e: any) { alert(tr('删除失败'), String(e?.message ?? e)); }
        finally { setBusy(false); }
      } },
    ]) },
  ]);
  if (!me) return null;

  const stats = (id: string) => {
    const acc = state.checkups.filter((c) => c.companionId === id).length;
    const meds = state.supplementLogs.filter((l) => l.byId === id).length;
    const logs = state.logs.filter((l) => l.byId === id).length;
    return { acc, meds, logs };
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }}>
        <Card style={{ backgroundColor: colors.pineSoft, borderColor: colors.pineSoft }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Caption style={{ color: colors.pine }}>{tr('家庭邀请码')}</Caption>
              <Text style={{ fontSize: 26, fontWeight: '700', color: colors.pine, letterSpacing: 4, fontVariant: ['tabular-nums'] }}>{state.familyCode}</Text>
            </View>
            {me.role === 'mom' && !state.cloud && <Button title={tr("添加成员")} small onPress={() => router.push('/member/new')} />}
          </Row>
          <Row style={{ gap: 8, marginTop: space.md }}>
            <Button title={copied ? tr('已复制') : tr('复制')} small kind="ghost" onPress={async () => { await Clipboard.setStringAsync(state.familyCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }} />
            <Button title={tr("二维码 / 分享")} small onPress={() => router.push('/invite' as never)} />
          </Row>
          <Caption style={{ color: colors.pine, marginTop: 6 }}>
            {state.cloud
              ? tr('把邀请码发给准爸爸和家人，他们在 App 首页选「我有邀请码」加入。')
              : tr('本机模式：可以先添加成员，切换身份体验各角色视角。配置云同步后，家人凭邀请码从自己的手机加入。')}
          </Caption>
          {state.cloud && (
            <Pressable onPress={refresh} style={{ marginTop: 6 }}>
              <Caption style={{ color: sync === 'offline' ? colors.warn : colors.pine }}>
                {sync === 'syncing' ? tr('同步中…') : sync === 'offline' ? tr('暂时没同步上（{err}），会自动重试 · 点此立即重试', { err: syncError || tr('网络不通') }) : tr('已同步 · 点此刷新')}
              </Caption>
            </Pressable>
          )}
        </Card>

        <Section title={`${tr('成员')} · ${state.members.length}`}>
          {state.members.map((m) => {
            const st = stats(m.id);
            const isMe = m.id === me.id;
            return (
              <Card key={m.id} style={{ marginBottom: space.sm }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Row>
                    <Avatar name={m.name} role={m.role} />
                    <View>
                      <Row>
                        <Body style={{ fontWeight: '700' }}>{m.name}</Body>
                        <Pill text={tr(m.relation ?? roleLabel(m.role, state.pregnancy.stage))} tone={m.role === 'mom' ? 'pine' : m.role === 'dad' ? 'apricot' : 'slate'} />
                        {isMe && <Caption>{tr('（我）')}</Caption>}
                      </Row>
                      <Caption>
                        {m.role === 'mom'
                          ? tr('记录了 {a} 条 · 打卡 {b} 次', { a: st.logs, b: st.meds })
                          : m.role === 'dad'
                          ? tr('陪了 {a} 次产检 · 替她打卡 {b} 次', { a: st.acc, b: st.meds })
                          : tr('看得到孕周、动态和产检日程')}
                      </Caption>
                    </View>
                  </Row>
                  {!isMe && !state.cloud && (
                    <Pressable onPress={() => dispatch({ type: 'switchMe', id: m.id })}>
                      <Caption style={{ color: colors.pine, fontWeight: '700' }}>{tr('以TA的视角看')}</Caption>
                    </Pressable>
                  )}
                </Row>
                {me.role === 'mom' && !isMe && (
                  <>
                    <Divider />
                    <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <Caption style={{ flex: 1, minWidth: 160 }}>{m.role === 'dad' ? tr('可见：动态、产检、数值、用药') : tr('可见：孕周、动态、产检日程')}</Caption>
                      <Button title={tr('移出家庭')} small kind="danger" onPress={() => alert(tr('移出家庭'), tr('确定把 {name} 移出家庭？TA 将看不到任何记录，之后可凭邀请码重新加入。', { name: m.name }), [{ text: tr('取消'), style: 'cancel' }, { text: tr('移出'), style: 'destructive', onPress: () => dispatch({ type: 'removeMember', id: m.id }) }])} />
                    </Row>
                  </>
                )}
              </Card>
            );
          })}
        </Section>

        <Section title={tr("动态")}>
          <Card style={{ marginBottom: space.md, padding: space.md }}>
            <Row>
              <Avatar name={me.name} role={me.role} size={28} />
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={me.role === 'mom' ? tr('今天感觉怎么样…') : tr('给她说句话…')}
                placeholderTextColor={colors.ink3}
                style={{ flex: 1, color: colors.ink, fontSize: 15 }}
                returnKeyType="send"
                onSubmitEditing={() => {
                  if (!draft.trim()) return;
                  dispatch({ type: 'post', byId: me.id, text: draft.trim() });
                  setDraft('');
                }}
              />
            </Row>
          </Card>
          <Feed />
        </Section>

        {state.cloud && (
          <Card style={{ marginTop: space.xl, backgroundColor: state.cloud.bound ? colors.card : colors.apricotSoft, borderColor: state.cloud.bound ? colors.line : colors.apricotSoft }}>
            <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flex: 1, minWidth: 180 }}>
                <Body style={{ fontWeight: '700' }}>{state.cloud.bound ? tr('账号已绑定 Apple ID') : tr('绑定账号，换手机不丢')}</Body>
                <Caption>{state.cloud.bound ? tr('换手机时在首页用 Apple 登录即可恢复。') : tr('现在的数据只认这台手机。绑定 Apple ID 后，换手机或重装都能找回。')}</Caption>
              </View>
              {!state.cloud.bound && Platform.OS === 'ios' && <Button title={busy ? '…' : tr('通过 Apple 绑定')} small onPress={bind} disabled={busy} />}
            </Row>
            {!state.cloud.bound && !emailMode && (
              <Pressable onPress={() => setEmailMode(true)} style={{ marginTop: space.sm }}>
                <Caption style={{ color: colors.pine, fontWeight: '700' }}>{Platform.OS === 'ios' ? tr('或用邮箱绑定（安卓也能用）') : tr('用邮箱绑定')}</Caption>
              </Pressable>
            )}
            {!state.cloud.bound && emailMode && (
              <EmailOtp sendLabel={tr('发绑定链接')} onSend={bindEmailStart} />
            )}
            {state.cloud.bound && (
              <Pressable onPress={removeAccount} style={{ marginTop: space.sm }}>
                <Caption style={{ color: colors.warn }}>{tr('删除账号')}</Caption>
              </Pressable>
            )}
          </Card>
        )}
        {me.role !== 'family' && (state.pregnancy.stage ?? 'pregnant') === 'pregnant' && (
          <Card style={{ marginTop: space.md }} onPress={() => router.push('/pregnancy' as never)}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Body style={{ fontWeight: '700' }}>{tr('孕期信息')}</Body>
                <Caption>{tr('预产期 {d} · 改预产期、末次月经、宝宝小名', { d: state.pregnancy.dueDate })}</Caption>
              </View>
              <Caption style={{ color: colors.pine }}>{tr('修改')}</Caption>
            </Row>
          </Card>
        )}
        <Card style={{ marginTop: space.md }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Body style={{ fontWeight: '700' }}>语言 · Language</Body>
              <Caption>{tr('只影响这台手机')}</Caption>
            </View>
            <LangToggle compact />
          </Row>
        </Card>
        <Card style={{ marginTop: space.md }} onPress={() => router.push('/settings' as never)}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Body style={{ fontWeight: '700' }}>{tr('外观与字号')}</Body>
              <Caption>{tr('深色模式给夜里起夜用；字号可以调大给长辈')}</Caption>
            </View>
            <Caption style={{ color: colors.pine }}>{tr('设置')}</Caption>
          </Row>
        </Card>
        <Row style={{ gap: 16, marginTop: space.xl, justifyContent: 'center' }}>
          <Pressable onPress={openPrivacy}><Caption style={{ color: colors.pine }}>{tr('隐私政策')}</Caption></Pressable>
          <Pressable onPress={openTerms}><Caption style={{ color: colors.pine }}>{tr('用户协议')}</Caption></Pressable>
        </Row>
        <Pressable style={{ marginTop: space.lg, alignItems: 'center' }} onPress={() => alert(
          me.role === 'mom' ? tr('清空数据') : tr('退出家庭'),
          me.role === 'mom' ? tr('删除本机全部记录并重新开始？云端的家庭会保留，家人不受影响。') : tr('退出后本机记录清空，家人那边会看到你已退出。之后可以凭邀请码重新加入。'),
          [{ text: tr('取消') }, { text: me.role === 'mom' ? tr('清空') : tr('退出'), style: 'destructive', onPress: async () => { await leaveFamily(me.id, me.role); dispatch({ type: 'reset' }); } }],
        )}>
          <Caption style={{ color: colors.warn }}>{me.role === 'mom' ? tr('清空本机数据') : tr('退出家庭并清空本机数据')}</Caption>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
