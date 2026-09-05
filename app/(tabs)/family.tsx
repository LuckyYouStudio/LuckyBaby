import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, Divider, Pill, Row, Screen, Section } from '../../src/components/ui';
import { Feed } from '../../src/components/Feed';
import { colors, roleColor, space } from '../../src/theme';

export default function Family() {
  const { state, dispatch } = useStore();
  const { me } = useDerived();
  const router = useRouter();
  const [draft, setDraft] = useState('');
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
            {me.role === 'mom' && <Button title="邀请家人" small onPress={() => router.push('/member/new')} />}
          </Row>
          <Caption style={{ color: colors.pine, marginTop: 6 }}>家人输入邀请码加入。云端同步在下一版本开放，当前版本可在本机切换身份体验各角色视角。</Caption>
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
                  {!isMe && (
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
                      <Pressable onPress={() => Alert.alert('移除成员', `确定把 ${m.name} 移出家庭？`, [{ text: '取消' }, { text: '移除', style: 'destructive', onPress: () => dispatch({ type: 'removeMember', id: m.id }) }])}>
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

        {me.role === 'mom' && (
          <Pressable style={{ marginTop: space.xxl, alignItems: 'center' }} onPress={() => Alert.alert('清空数据', '删除本机全部记录并重新开始？', [{ text: '取消' }, { text: '清空', style: 'destructive', onPress: () => dispatch({ type: 'reset' }) }])}>
            <Caption style={{ color: colors.warn }}>清空本机数据</Caption>
          </Pressable>
        )}
      </ScrollView>
    </Screen>
  );
}
