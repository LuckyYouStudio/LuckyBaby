import { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useStore } from '../src/store/store';

/** 开发用：/demo?as=d1 载入示例家庭并以某个成员身份进入 */
export default function Demo() {
  const { dispatch, ready } = useStore();
  const { as } = useLocalSearchParams<{ as?: string }>();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    dispatch({ type: 'seedDemo' });
    if (as) dispatch({ type: 'switchMe', id: as });
    router.replace('/');
  }, [ready]);
  return null;
}
