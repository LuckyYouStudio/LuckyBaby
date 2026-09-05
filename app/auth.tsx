import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useStore } from '../src/store/store';
import { completeEmailLink } from '../src/lib/account';
import { loadMyFamily } from '../src/lib/restore';
import { alert } from '../src/lib/alert';
import { tr } from '../src/i18n';

/** 邮件链接打开：luckybaby://auth?code=... */
export default function AuthCallback() {
  const { state, ready, dispatch } = useStore();
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    (async () => {
      try {
        const url = (await Linking.getInitialURL()) ?? '';
        const userId = await completeEmailLink(url);
        if (state.onboarded && state.cloud) {
          dispatch({ type: 'setCloudUser', userId, bound: true });
          alert(tr('绑定成功'), tr('以后换手机，用这个邮箱登录就能找回这个家庭。'));
        } else {
          const payload = await loadMyFamily(userId);
          if (payload) dispatch(payload);
          else alert(tr('这个账号还没有绑定过家庭'), tr('如果你是准妈妈，请建立家庭；如果是家人，请用邀请码加入。'));
        }
      } catch (e: any) {
        alert(tr('登录失败'), String(e?.message ?? e));
      }
      router.replace('/' as never);
    })();
  }, [ready]);
  return null;
}
