// Sign in with Apple 官方按钮（原生 ASAuthorizationAppleIDButton）。
// 苹果审核要求：必须用 Apple Design Resources 的官方图标与配色，不能自己画按钮。
// 规则（expo-apple-authentication 文档）：
//   - 只在 isAvailableAsync() 为真时渲染，否则什么都不显示；
//   - 不能用 style 设 backgroundColor / borderRadius，只能用 buttonStyle 和 cornerRadius；
//   - 必须显式给宽和高，否则原生按钮不出现。
import React, { useEffect, useState } from 'react';
import { View, type ViewStyle } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { isAppleSignInAvailable } from '../lib/account';
import { isDark } from '../theme';

type Kind = 'signIn' | 'continue';

export function AppleButton({ kind = 'signIn', onPress, disabled, style }: { kind?: Kind; onPress: () => void; disabled?: boolean; style?: ViewStyle }) {
  const [ok, setOk] = useState(false);
  useEffect(() => { let alive = true; isAppleSignInAvailable().then((v) => { if (alive) setOk(v); }); return () => { alive = false; }; }, []);
  if (!ok) return null;
  return (
    <View style={[{ width: '100%', maxWidth: 320, opacity: disabled ? 0.4 : 1 }, style]} pointerEvents={disabled ? 'none' : 'auto'}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={kind === 'continue' ? AppleAuthentication.AppleAuthenticationButtonType.CONTINUE : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
        buttonStyle={isDark ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={10}
        style={{ width: '100%', height: 48 }}
        onPress={onPress}
      />
    </View>
  );
}
