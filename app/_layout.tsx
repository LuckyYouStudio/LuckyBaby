import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '../src/store/store';
import { applyTheme, colors, isDark, setFontScale } from '../src/theme';
import { useColorScheme } from 'react-native';

function Gate() {
  const { state, ready } = useStore();
  const scheme = useColorScheme();
  const mode = state.settings?.theme ?? 'system';
  applyTheme(mode === 'dark' || (mode === 'system' && scheme === 'dark'));
  setFontScale(state.settings?.fontScale ?? 1);
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = ['onboarding', 'demo', 'join', 'scan'].includes(segments[0]);
    if (!state.onboarded && !inOnboarding) router.replace('/onboarding');
    if (state.onboarded && inOnboarding) router.replace('/');
  }, [ready, state.onboarded, segments]);

  return (
    <>
    <StatusBar style={isDark ? 'light' : 'dark'} />
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="demo" options={{ headerShown: false }} />
      <Stack.Screen name="checkup/[id]" options={{ title: '产检', presentation: 'card' }} />
      <Stack.Screen name="log/new" options={{ title: '记一笔', presentation: 'modal' }} />
      <Stack.Screen name="member/new" options={{ title: '邀请家人', presentation: 'modal' }} />
      <Stack.Screen name="kicks" options={{ title: '数胎动', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="contractions" options={{ title: '宫缩计时', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="packing" options={{ title: '待产包' }} />
      <Stack.Screen name="settings" options={{ title: '外观与字号' }} />
      <Stack.Screen name="invite" options={{ title: '邀请家人', presentation: 'modal' }} />
      <Stack.Screen name="scan" options={{ title: '扫码加入', presentation: 'fullScreenModal' }} />
      <Stack.Screen name="join" options={{ headerShown: false }} />
    </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Gate />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
