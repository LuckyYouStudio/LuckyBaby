import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, View, type ImageStyle } from 'react-native';
import { resolvePhotoUrl } from '../lib/photos';
import { colors } from '../theme';

/** 显示一张报告照片：本地 URI 直接显示，云端路径换成签名链接 */
export function ReportPhoto({ path, style, resizeMode }: { path: string; style: ImageStyle; resizeMode?: 'cover' | 'contain' }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setUrl(null); setFailed(false);
    resolvePhotoUrl(path).then((u) => alive && setUrl(u)).catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [path]);
  if (failed) return <View style={[style, { backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }]} />;
  if (!url) return <View style={[style, { backgroundColor: colors.paper2, alignItems: 'center', justifyContent: 'center' }]}><ActivityIndicator color={colors.pine} /></View>;
  return <Image source={{ uri: url }} style={style} resizeMode={resizeMode} onError={() => setFailed(true)} />;
}
