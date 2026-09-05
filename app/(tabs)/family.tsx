import React, { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { alert } from '../../src/lib/alert';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, Divider, Pill, Row, Screen, Section } from '../../src/components/ui';
import { Feed } from '../../src/components/Feed';
import { colors, roleColor, space } from '../../src/theme';

export default function Family() {
  const { state, dispatch, sync, syncError, refresh } = useStore();
  const { me } = useDerived();
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
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
              <Caption style={{ color: colors.pine }}>家庭邀请码</Caption>
              <Text style={{ fontSize: 26, fontWeight: '700', color: colors.pine, letterSpacing: 4, fontVariant: ['tabular-nums'] }}>{state.familyCode}</Text>
            </View>
            {me.role === 'mom' && !state.cloud && <Button title="添加成员" small onPress={() => router.push('/member/new')} />}
          </Row>
          <Row style={{ gap: 8, marginTop: space.md }}>
            <Button title={copied ? '已复制' : '复制'} small kind="ghost" onPress={async () => { await Clipboard.setStringAsync(state.familyCode); setCopied(true); setTimeout(() => setCopied(false), 1500); }} />
            <Button title="二维码 / 分享" small onPress={() => router.push('/invite' as never)} />
          </Row>
          <Caption style={{ color: colors.pine, marginTop: 6 }}>
            {state.cloud
              ? '把邀请码发给准爸爸和家人，他们在 App 首页选「我有邀请码」加入。'
              : '本机模式：可以先添加成员，切换身份体验各角色视角。配置云同步后，家人凭邀请码从自己的手机加入。'}
          </Caption>
          {state.cloud && (
            <Pressable onPress={refresh} style={{ marginTop: 6 }}>
              <Caption style={{ color: sync === 'offline' ? colors.warn : colors.pine }}>
                {sync === 'syncing' ? '同步中…' : sync === 'offline' ? `暂时没同步上（${syncError || '网络不通'}），会自动重试 · 点此立即重试` : '已同步 · 点此刷新'}
              </Caption>
            </Pressable>
          )}
        </Card>

        <Section title={`成员 · ${state.members.length}`}>
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
                        <Pill text={m.relation ?? roleColor[m.role].label} tone={m.role === 'mom' ? 'pine' : m.role === 'dad' ? 'apricot' : 'slate'} />
                        {isMe && <Caption>（我）</Caption>}
                      </Row>
                      <Caption>
                        {m.role === 'mom'
                          ? `记录了 ${st.logs} 条 · 打卡 ${st.meds} 次`
                          : m.role === 'dad'
                          ? `陪了 ${st.acc} 次产检 · 替她打卡 ${st.meds} 次`
                          : `看得到孕周、动态和产检日程`}
                      </Caption>
                    </View>
                  </Row>
                  {!isMe && !state.cloud && (
                    <Pressable onPress={() => dispatch({ type: 'switchMe', id: m.id })}>
                      <Caption style={{ color: colors.pine, fontWeight: '700' }}>以TA的视角看</Caption>
                    </Pressable>
                  )}
                </Row>
                {me.role === 'mom' && !isMe && (
                  <>
                    <Divider />
                    <Row style={{ justifyContent: 'space-between' }}>
                      <Caption>{m.role === 'dad' ? '可见：动态、产检、数值、用药' : '可见：孕周、动态、产检日程'}</Caption>
                      <Pressable onPress={() => alert('移除成员', `确定把 ${m.name} 移出家庭？`, [{ text: '取消' }, { text: '移除', style: 'destructive', onPress: () => dispatch({ type: 'removeMember', id: m.id }) }])}>
                        <Caption style={{ color: colors.warn }}>移除</Caption>
                      </Pressable>
                    </Row>
                  </>
                )}
              </Card>
            );
          })}
        </Section>

        <Section title="动态">
          <Card style={{ marginBottom: space.md, padding: space.md }}>
            <Row>
              <Avatar name={me.name} role={me.role} size={28} />
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={me.role === 'mom' ? '今天感觉怎么样…' : '给她说句话…'}
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

        <Card style={{ marginTop: space.xl }} onPress={() => router.push('/settings' as never)}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Body style={{ fontWeight: '700' }}>外观与字号</Body>
              <Caption>深色模式给夜里起夜用；字号可以调大给长辈</Caption>
            </View>
            <Caption style={{ color: colors.pine }}>设置</Caption>
          </Row>
        </Card>
        {me.role === 'mom' && (
          <Pressable style={{ marginTop: space.xxl, alignItems: 'center' }} onPress={() => alert('清空数据', '删除本机全部记录并重新开始？', [{ text: '取消' }, { text: '清空', style: 'destructive', onPress: () => dispatch({ type: 'reset' }) }])}>
            <Caption style={{ color: colors.warn }}>清空本机数据</Caption>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}
