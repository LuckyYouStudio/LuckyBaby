// 账号页：当前登录状态、绑定登录方式、删除账号。
// 苹果 5.1.1(v) 要求「删除账号」在 App 内必须能找到，且不能藏在只有绑定后才出现的地方，
// 所以这一页对任何状态都可进入（含示例家庭、匿名账号）。
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDerived, useStore } from '../src/store/store';
import { Body, Body2, Button, Caption, Card, Row, Screen, Section } from '../src/components/ui';
import { AppleButton } from '../src/components/AppleButton';
import { EmailOtp } from '../src/components/EmailOtp';
import { bindApple, bindEmailStart, deleteAccount } from '../src/lib/account';
import { supabase } from '../src/lib/supabase';
import { alert } from '../src/lib/alert';
import { colors, space } from '../src/theme';
import { tr } from '../src/i18n';

type Provider = 'apple' | 'email' | null;

export default function Account() {
  const { state, dispatch } = useStore();
  const { me } = useDerived();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [emailMode, setEmailMode] = useState(false);
  const [bound, setBound] = useState(!!state.cloud?.bound);
  const [provider, setProvider] = useState<Provider>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      const u = data.user;
      if (!u) { setBound(false); setProvider(null); return; }
      const ids = (u.identities ?? []).map((i: any) => i.provider);
      setBound(!u.is_anonymous);
      setProvider(ids.includes('apple') ? 'apple' : u.email ? 'email' : null);
    })();
    return () => { alive = false; };
  }, [state.cloud?.bound]);

  const bind = async () => {
    setBusy(true);
    try {
      const userId = await bindApple();
      dispatch({ type: 'setCloudUser', userId, bound: true });
      setBound(true);
      setProvider('apple');
      alert(tr('绑定成功'), tr('以后换手机，用 Apple 登录就能找回这个家庭。'));
    } catch (e: any) {
      if (String(e?.code) === 'ERR_REQUEST_CANCELED') return;
      alert(tr('绑定失败'), String(e?.message ?? e));
    } finally { setBusy(false); }
  };

  const isMom = me?.role === 'mom';
  const whatGetsDeleted = isMom
    ? tr('这个家庭在云端的全部记录会被永久删除：产检、用药、经期、报告照片、动态和留言。家人也会一起失去这些内容。')
    : tr('你会退出这个家庭，你的登录账号和这台手机上的记录会被永久删除。家里其他人的记录不受影响。');

  const doDelete = async () => {
    setBusy(true);
    try {
      await deleteAccount();
      dispatch({ type: 'reset' });
      AsyncStorage.clear().catch(() => {});
      router.replace('/onboarding');
    } catch (e: any) {
      alert(tr('删除失败'), String(e?.message ?? e));
    } finally { setBusy(false); }
  };

  const confirmDelete = () => alert(tr('删除账号'), `${whatGetsDeleted}\n\n${tr('此操作不可恢复。')}`, [
    { text: tr('取消'), style: 'cancel' },
    { text: tr('删除账号'), style: 'destructive', onPress: () => alert(tr('再确认一次'), tr('真的要删除吗？删除后无法恢复。'), [
      { text: tr('取消'), style: 'cancel' },
      { text: tr('确定删除'), style: 'destructive', onPress: doDelete },
    ]) },
  ]);

  const statusTitle = !bound ? tr('还没有绑定登录方式')
    : provider === 'apple' ? tr('已绑定 Apple ID')
    : provider === 'email' ? tr('已绑定邮箱')
    : tr('已绑定登录方式');
  const statusBody = bound
    ? tr('换手机或重装 App 后，用同样的方式登录就能找回这个家庭。')
    : tr('现在的记录只认这台手机。绑定之后，换手机或重装都能找回。');

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Section title={tr('当前状态')}>
          <Card>
            <Body style={{ fontWeight: '700' }}>{statusTitle}</Body>
            <Body2 style={{ marginTop: 4 }}>{statusBody}</Body2>
          </Card>
        </Section>

        {!bound && (
          <Section title={tr('绑定登录方式')}>
            <Card>
              <AppleButton kind="continue" onPress={bind} disabled={busy} style={{ alignSelf: 'center' }} />
              {!emailMode ? (
                <Pressable onPress={() => setEmailMode(true)} disabled={busy} style={{ marginTop: space.md, alignItems: 'center' }}>
                  <Caption style={{ color: colors.pine, fontWeight: '700' }}>{tr('用邮箱绑定（安卓也能用）')}</Caption>
                </Pressable>
              ) : (
                <View style={{ marginTop: space.md }}>
                  <EmailOtp sendLabel={tr('发绑定链接')} onSend={bindEmailStart} />
                </View>
              )}
            </Card>
          </Section>
        )}

        <Section title={tr('删除账号')}>
          <Card>
            <Body2>{whatGetsDeleted}</Body2>
            <Body2 style={{ marginTop: 6, color: colors.warn }}>{tr('此操作不可恢复。')}</Body2>
            {busy ? (
              <Row style={{ justifyContent: 'center', marginTop: space.lg }}><ActivityIndicator color={colors.warn} /></Row>
            ) : (
              <Button title={tr('删除账号')} kind="danger" onPress={confirmDelete} style={{ marginTop: space.lg }} />
            )}
          </Card>
        </Section>
      </ScrollView>
    </Screen>
  );
}
