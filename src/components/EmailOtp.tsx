import React, { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Body2, Button, Caption, Field, Row } from './ui';
import { colors, space } from '../theme';
import { tr } from '../i18n';
import { alert } from '../lib/alert';

/** 邮箱链接：输入邮箱 → 去邮件里点链接 → 回到 App 自动完成。iOS 和安卓通用 */
export function EmailOtp({ onSend, sendLabel }: { onSend: (email: string) => Promise<void>; sendLabel: string; doneLabel?: string; onVerify?: unknown }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const valid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());
  const send = async () => {
    setBusy(true);
    try { await onSend(email); setSent(true); }
    catch (e: any) { alert(tr('发送失败'), String(e?.message ?? e)); }
    finally { setBusy(false); }
  };
  return (
    <View style={{ marginTop: space.md }}>
      <Field label={tr('邮箱')} value={email} onChange={setEmail} placeholder="name@example.com" />
      {busy ? <ActivityIndicator color={colors.pine} /> : (
        <Row style={{ gap: 8 }}>
          <Button title={sent ? tr('重新发送') : sendLabel} small kind={sent ? 'ghost' : 'primary'} onPress={send} disabled={!valid} />
        </Row>
      )}
      {sent
        ? <Body2 style={{ marginTop: 8, color: colors.pine }}>{tr('已发送。在这台手机上打开邮件，点里面的链接，会自动回到 App 完成。')}</Body2>
        : <Body2 style={{ marginTop: 6 }}>{tr('安卓和 iPhone 都能用邮箱。')}</Body2>}
      {sent && <Caption style={{ marginTop: 4 }}>{tr('没收到？看看垃圾邮件；一小时内最多发 2 封。')}</Caption>}
    </View>
  );
}
