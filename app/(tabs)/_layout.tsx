import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/theme';
import { useStore } from '../../src/store/store';
import { tr } from '../../src/i18n';

const ICONS: Record<string, string> = { index: tr('今'), checkups: tr('检'), meds: tr('药'), life: tr('记'), family: tr('家'), calendar: tr('历') };

function Icon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, fontWeight: '700', color: focused ? colors.pine : colors.ink3, lineHeight: 22 }}>{tr(ICONS[name])}</Text>
  );
}

export default function TabLayout() {
  const { state } = useStore(); // 主题切换时重渲染
  const cyc = (state.pregnancy.stage ?? 'pregnant') === 'cycle';
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.paper },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', color: colors.ink },
        tabBarActiveTintColor: colors.pine,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ focused }) => <Icon name={route.name} focused={focused} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: tr('今天'), headerShown: false }} />
      <Tabs.Screen name="calendar" options={{ title: tr('日历'), href: cyc ? undefined : null }} />
      <Tabs.Screen name="checkups" options={{ title: tr('产检'), href: cyc ? null : undefined }} />
      <Tabs.Screen name="meds" options={{ title: tr('用药'), href: cyc ? null : undefined }} />
      <Tabs.Screen name="life" options={{ title: tr('记录') }} />
      <Tabs.Screen name="family" options={{ title: tr('家庭') }} />
    </Tabs>
  );
}
