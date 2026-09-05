import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Body2, Button, Screen } from '../src/components/ui';
import { colors, space } from '../src/theme';
import { extractCode } from '../src/lib/invite';

/** 扫邀请二维码 */
export default function Scan() {
  const [perm, request] = useCameraPermissions();
  const [done, setDone] = useState(false);
  const router = useRouter();
  useEffect(() => { if (perm && !perm.granted && perm.canAskAgain) request(); }, [perm]);

  if (!perm) return <Screen><View /></Screen>;
  if (!perm.granted) {
    return (
      <Screen style={{ padding: space.xl, justifyContent: 'center' }}>
        <Body2 style={{ textAlign: 'center', marginBottom: space.lg }}>需要相机权限来扫二维码。也可以回去手动输入 6 位邀请码。</Body2>
        <Button title="允许使用相机" onPress={request} />
        <Button title="返回" kind="ghost" onPress={() => router.back()} style={{ marginTop: 10 }} />
      </Screen>
    );
  }
  return (
    <Screen>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={({ data }) => {
          if (done) return;
          const code = extractCode(data);
          if (!code) return;
          setDone(true);
          router.replace({ pathname: '/onboarding', params: { code } } as never);
        }}
      />
      <View style={{ position: 'absolute', left: 0, right: 0, top: '20%', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>对准家人分享的二维码</Text>
      </View>
      <View style={{ position: 'absolute', left: '15%', right: '15%', top: '32%', aspectRatio: 1, borderWidth: 3, borderColor: colors.apricot, borderRadius: 16 }} />
      <View style={{ position: 'absolute', left: space.lg, right: space.lg, bottom: 40 }}>
        <Button title="取消" kind="ghost" onPress={() => router.back()} style={{ backgroundColor: 'rgba(255,255,255,0.9)' }} />
      </View>
    </Screen>
  );
}
