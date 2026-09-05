import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '../src/store/store';
import { colors } from '../src/theme';

function Gate() {
  const { state, ready } = useStore();
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding' || segments[0] === 'demo';
    if (!state.onboarded && !inOnboarding) router.replace('/onboarding');
    if (state.onboarded && inOnboarding) router.replace('/');
  }, [ready, state.onboarded, segments]);

  return (
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
      <Stack.Screen name="packing" options={{ title: '待产包' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Gate />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
