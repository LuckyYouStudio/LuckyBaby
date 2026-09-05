import React from 'react';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '../../src/theme';

const ICONS: Record<string, string> = { index: '今', checkups: '检', meds: '药', life: '记', family: '家' };

function Icon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 18, fontWeight: '700', color: focused ? colors.pine : colors.ink3, lineHeight: 22 }}>{ICONS[name]}</Text>
  );
}

export default function TabLayout() {
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
      <Tabs.Screen name="index" options={{ title: '今天', headerShown: false }} />
      <Tabs.Screen name="checkups" options={{ title: '产检' }} />
      <Tabs.Screen name="meds" options={{ title: '用药' }} />
      <Tabs.Screen name="life" options={{ title: '记录' }} />
      <Tabs.Screen name="family" options={{ title: '家庭' }} />
    </Tabs>
  );
}
