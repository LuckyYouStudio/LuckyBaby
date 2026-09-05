import React, { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import * as Haptics from 'expo-haptics';
import { useDerived, useStore } from '../src/store/store';
import { Body2, Button, Caption, Screen } from '../src/components/ui';
import { colors, space } from '../src/theme';
import { uid } from '../src/lib/pregnancy';

const SESSION_MIN = 60;

/** 数胎动：整屏大按钮，一只手就能按；一小时自动结束 */
export default function Kicks() {
  useKeepAwake();
  const { dispatch } = useStore();
  const { me, today } = useDerived();
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!startedAt) return;
    timer.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [startedAt]);

  const finish = () => {
    if (!me) return;
    const mins = Math.max(1, Math.round(elapsed / 60));
    dispatch({
      type: 'addLog',
      log: { id: uid(), kind: 'kick', date: today, value: count, text: `用时 ${mins} 分钟`, byId: me.id, at: new Date().toISOString(), visibility: 'partner' },
      activity: `数了胎动 ${count} 次（${mins} 分钟）`,
    });
    router.back();
  };

  useEffect(() => {
    if (elapsed >= SESSION_MIN * 60 && startedAt) finish();
  }, [elapsed]);

  const tap = () => {
    if (!startedAt) setStartedAt(Date.now());
    setCount((c) => c + 1);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  return (
    <Screen style={{ padding: space.lg }}>
      <Body2 style={{ textAlign: 'center', marginTop: space.md }}>
        宝宝动一下就按一下。连续的一串动算一次。{'\n'}早、中、晚各数 1 小时，每小时 3 次以上通常是正常的。
      </Body2>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Pressable
          onPress={tap}
          style={({ pressed }) => ({ width: 260, height: 260, borderRadius: 130, backgroundColor: pressed ? colors.pine : colors.pineSoft, borderWidth: 6, borderColor: colors.pine, alignItems: 'center', justifyContent: 'center' })}
        >
          {({ pressed }) => (
            <>
              <Text style={{ fontSize: 96, fontWeight: '700', color: pressed ? '#fff' : colors.pine, fontVariant: ['tabular-nums'], lineHeight: 104 }}>{count}</Text>
              <Text style={{ fontSize: 18, color: pressed ? '#fff' : colors.pine, fontWeight: '600' }}>{startedAt ? '动了，按一下' : '按这里开始'}</Text>
            </>
          )}
        </Pressable>
        <Text style={{ marginTop: space.xl, fontSize: 28, color: colors.ink2, fontVariant: ['tabular-nums'] }}>{mm}:{ss}</Text>
        <Caption>屏幕会保持常亮 · 满 60 分钟自动保存</Caption>
      </View>
      <View style={{ gap: 10, marginBottom: space.xl }}>
        <Button title={startedAt ? `结束并保存（${count} 次）` : '返回'} onPress={startedAt ? finish : () => router.back()} />
        {startedAt && <Button title="放弃这次" kind="ghost" onPress={() => router.back()} />}
      </View>
    </Screen>
  );
}
