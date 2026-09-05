import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider, useStore } from '../src/store/store';
import { applyTheme, colors, isDark, setFontScale } from '../src/theme';
import { getLocales } from 'expo-localization';
import { setLang } from '../src/i18n';
import { useColorScheme } from 'react-native';
import { tr } from '../src/i18n';

function Gate() {
  const { state, ready } = useStore();
  const scheme = useColorScheme();
  const mode = state.settings?.theme ?? 'system';
  applyTheme(mode === 'dark' || (mode === 'system' && scheme === 'dark'));
  setFontScale(state.settings?.fontScale ?? 1);
  const langPref = state.settings?.lang ?? 'system';
  setLang(langPref === 'system' ? (getLocales()[0]?.languageCode?.startsWith('zh') ? 'zh' : 'en') : langPref);
  const segments = useSegments() as string[];
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = ['onboarding', 'demo', 'join', 'scan', 'auth', 'consent'].includes(segments[0]);
    if (!state.consentAt && segments[0] !== 'consent') { router.replace('/consent' as never); return; }
    if (state.consentAt && segments[0] === 'consent') { router.replace(state.onboarded ? '/' : ('/onboarding' as never)); return; }
    if (!state.onboarded && !inOnboarding) router.replace('/onboarding');
    if (state.onboarded && inOnboarding) router.replace('/');
  }, [ready, state.onboarded, state.consentAt, segments]);

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
      <Stack.Screen name="checkup/[id]" options={{ title: tr('产检'), presentation: 'card' }} />
      <Stack.Screen name="log/new" options={{ title: tr('记一笔'), presentation: 'modal' }} />
      <Stack.Screen name="member/new" options={{ title: tr('邀请家人'), presentation: 'modal' }} />
      <Stack.Screen name="kicks" options={{ title: tr('数胎动'), presentation: 'fullScreenModal' }} />
      <Stack.Screen name="contractions" options={{ title: tr('宫缩计时'), presentation: 'fullScreenModal' }} />
      <Stack.Screen name="packing" options={{ title: tr('待产包') }} />
      <Stack.Screen name="settings" options={{ title: tr('外观与字号') }} />
      <Stack.Screen name="invite" options={{ title: tr('邀请家人'), presentation: 'modal' }} />
      <Stack.Screen name="scan" options={{ title: tr('扫码加入'), presentation: 'fullScreenModal' }} />
      <Stack.Screen name="join" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="consent" options={{ headerShown: false }} />
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
