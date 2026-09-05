import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../src/store/store';
import { extractCode } from '../src/lib/invite';
import { alert } from '../src/lib/alert';

/** 处理 luckybaby://join?code=XXXXXX 深链接 */
export default function Join() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { state, ready } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    const c = extractCode(code ?? '');
    if (!state.onboarded) {
      router.replace(c ? ({ pathname: '/onboarding', params: { code: c } } as never) : ('/onboarding' as never));
      return;
    }
    if (c && c === state.familyCode) alert('这是你自己家庭的邀请码', '把它发给还没加入的家人就行。');
    else alert('你已经在一个家庭里了', '一部手机只能加入一个家庭。想换家庭，先在「家庭」页清空本机数据。');
    router.replace('/' as never);
  }, [ready]);
  return null;
}
