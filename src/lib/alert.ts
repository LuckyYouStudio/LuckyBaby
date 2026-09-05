import { Alert, Platform } from 'react-native';

type Btn = { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };

/** RN 的 Alert 在 Web 上是空实现；这里在 Web 用原生 alert/confirm 兜底 */
export function alert(title: string, message?: string, buttons?: Btn[]) {
  if (Platform.OS !== 'web') return Alert.alert(title, message, buttons);
  const text = message ? `${title}\n\n${message}` : title;
  if (!buttons || buttons.length <= 1) { window.alert(text); buttons?.[0]?.onPress?.(); return; }
  const primary = buttons[buttons.length - 1];
  const cancel = buttons.find((b) => b.style === 'cancel') ?? buttons[0];
  if (window.confirm(`${text}\n\n[确定] ${primary.text}   [取消] ${cancel.text}`)) primary.onPress?.(); else cancel.onPress?.();
}
