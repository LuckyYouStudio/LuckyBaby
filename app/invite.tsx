import React, { useRef, useState } from 'react';
import { Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import ViewShot, { type ViewShotRef } from 'react-native-view-shot';
import QRCode from 'react-native-qrcode-svg';
import { useDerived, useStore } from '../src/store/store';
import { Body2, Button, Caption, Card, Screen } from '../src/components/ui';
import { colors, space } from '../src/theme';
import { inviteMessage, inviteUrl } from '../src/lib/invite';
import { alert } from '../src/lib/alert';

/** 邀请家人：二维码 + 邀请码，复制 / 分享 */
export default function Invite() {
  const { state } = useStore();
  const { me } = useDerived();
  const shot = useRef<ViewShotRef>(null);
  const [copied, setCopied] = useState(false);
  const code = state.familyCode;
  const from = state.pregnancy.momName || me?.name || '';
  const url = inviteUrl(code, from);

  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  const shareText = async () => {
    try { await Share.share({ message: inviteMessage(code, from) }); } catch {}
  };
  const shareQr = async () => {
    try {
      const uri = await shot.current!.capture();
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '分享邀请二维码' });
      else await Share.share({ url: uri, message: inviteMessage(code, from) });
    } catch (e: any) { alert('分享失败', String(e?.message ?? e)); }
  };

  return (
    <Screen style={{ padding: space.lg }}>
      <Body2 style={{ textAlign: 'center', marginTop: space.sm }}>家人用手机相机扫这个码，或者收到链接后点开，就能加入。{'\n'}加入后能看到什么，由准妈妈决定。</Body2>

      <ViewShot ref={shot} options={{ format: 'png', quality: 1, result: 'tmpfile' }} style={{ alignItems: 'center', marginTop: space.xl }}>
        <Card style={{ alignItems: 'center', padding: space.xl, backgroundColor: '#FFFFFF', borderColor: '#D5D9D1' }}>
          <QRCode value={url} size={200} color="#1F2A24" backgroundColor="#FFFFFF" />
          <Text style={{ marginTop: space.lg, fontSize: 30, fontWeight: '700', letterSpacing: 6, color: '#2E5E4E', fontVariant: ['tabular-nums'] }}>{code}</Text>
          <Text style={{ fontSize: 13, color: '#4B5750', marginTop: 2 }}>{from ? `${from} 的家庭邀请码` : '家庭邀请码'} · 幸运宝贝</Text>
        </Card>
      </ViewShot>

      <View style={{ gap: 10, marginTop: space.xl }}>
        <Button title={copied ? '已复制' : '复制邀请码'} kind="ghost" onPress={copy} />
        <Button title="分享邀请链接（微信 / 短信）" onPress={shareText} />
        <Button title="分享二维码图片" kind="ghost" onPress={shareQr} />
      </View>
      <Caption style={{ marginTop: space.lg, textAlign: 'center' }}>链接打开是一个网页：已装 App 的人一点就进家庭；没装的人看到邀请码和安装说明。</Caption>
      <Caption style={{ marginTop: 4, textAlign: 'center', color: colors.ink3 }}>{url}</Caption>
    </Screen>
  );
}
