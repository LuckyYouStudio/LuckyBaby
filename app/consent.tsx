import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store/store';
import { Body, Body2, Button, Caption, Card, H1, Row, Screen } from '../src/components/ui';
import { LangToggle } from '../src/components/LangToggle';
import { colors, space } from '../src/theme';
import { tr } from '../src/i18n';
import { openPrivacy, openTerms } from '../src/lib/legal';

/** 首次启动：隐私政策 + 健康数据单独同意 */
export default function Consent() {
  const { dispatch } = useStore();
  const insets = useSafeAreaInsets();
  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: space.xl, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
          <Caption style={{ flex: 1, marginRight: 8 }} numberOfLines={1}>{tr('幸运宝贝 · 一家人一起记录的孕期')}</Caption>
          <LangToggle compact />
        </Row>
        <H1 style={{ marginBottom: 12 }}>{tr('开始之前')}</H1>
        <Body2 style={{ marginBottom: space.lg }}>{tr('这个 App 会保存你记录的孕期健康信息（产检结果、体重、症状、用药等）。这类信息属于敏感个人信息，需要你单独同意我们才会处理。')}</Body2>
        <Card>
          <Body style={{ fontWeight: '700' }}>{tr('我们承诺')}</Body>
          <Body2 style={{ marginTop: 6 }}>{tr('· 数据只在你的家庭内可见，可见范围由准妈妈决定')}</Body2>
          <Body2>{tr('· 不做广告，不做社区，不卖数据，不接第三方统计')}</Body2>
          <Body2>{tr('· 随时可以删除任何记录，或删除整个账号')}</Body2>
          <Body2>{tr('· 不是医疗器械，参考范围仅供了解，一切以医生为准')}</Body2>
        </Card>
        <Row style={{ gap: 16, marginTop: space.lg, justifyContent: 'center' }}>
          <Pressable onPress={openPrivacy}><Text style={{ color: colors.pine, fontWeight: '700' }}>{tr('隐私政策')}</Text></Pressable>
          <Pressable onPress={openTerms}><Text style={{ color: colors.pine, fontWeight: '700' }}>{tr('用户协议')}</Text></Pressable>
        </Row>
        <Button title={tr('同意并继续')} onPress={() => dispatch({ type: 'consent' })} style={{ marginTop: space.xl }} />
        <Caption style={{ marginTop: space.md, textAlign: 'center' }}>{tr('点击"同意并继续"即表示你已阅读隐私政策与用户协议，并同意我们按其中说明处理你的健康信息。')}</Caption>
      </ScrollView>
    </Screen>
  );
}
