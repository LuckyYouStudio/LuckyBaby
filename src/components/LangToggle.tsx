import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useStore } from '../store/store';
import { getLang } from '../i18n';
import { colors } from '../theme';

/** 中文 / English 两段切换，点了立刻生效并记住 */
export function LangToggle({ compact }: { compact?: boolean }) {
  const { dispatch } = useStore();
  const cur = getLang();
  const Item = ({ v, label }: { v: 'zh' | 'en'; label: string }) => {
    const on = cur === v;
    return (
      <Pressable onPress={() => dispatch({ type: 'setSettings', settings: { lang: v } })} style={{ paddingVertical: compact ? 4 : 8, paddingHorizontal: compact ? 10 : 14, backgroundColor: on ? colors.pine : 'transparent' }}>
        <Text style={{ fontSize: compact ? 13 : 15, fontWeight: '700', color: on ? colors.onPine : colors.pine }}>{label}</Text>
      </Pressable>
    );
  };
  return (
    <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.pine, borderRadius: 8, overflow: 'hidden', alignSelf: 'flex-start' }}>
      <Item v="zh" label="中文" />
      <Item v="en" label="English" />
    </View>
  );
}
