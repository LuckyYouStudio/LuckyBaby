import React, { useEffect, useState } from 'react';
import { alert } from '../../src/lib/alert';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ReportPhoto } from '../../src/components/ReportPhoto';
import { deleteReportPhoto, uploadReportPhoto } from '../../src/lib/photos';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDerived, useStore } from '../../src/store/store';
import { Avatar, Body, Body2, Button, Caption, Card, Divider, Field, Pill, Row, Screen, Section } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { METRIC_DEFS, defaultBring, metricFlag } from '../../src/data/schedule';
import type { Checkup, Visibility } from '../../src/data/types';
import { tr } from '../../src/i18n';

export default function CheckupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, dispatch } = useStore();
  const { me, byId } = useDerived();
  const router = useRouter();
  const original = state.checkups.find((c) => c.id === id);
  const [c, setC] = useState<Checkup | undefined>(original);
  const [metrics, setMetrics] = useState<Record<string, string>>(() => Object.fromEntries((original?.metrics ?? []).map((m) => [m.key, String(m.value)])));
  const [itemsText, setItemsText] = useState(original?.items.map((x) => tr(x)).join('\n') ?? '');
  const [bring, setBring] = useState(original?.bringItems?.length ? original.bringItems : defaultBring(original?.notes));
  const [newBring, setNewBring] = useState('');
  const [viewer, setViewer] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => {
    // 直接通过链接打开时，本地数据可能晚于页面初始化才恢复
    if (!c && original) {
      setC(original);
      setMetrics(Object.fromEntries(original.metrics.map((m) => [m.key, String(m.value)])));
      setItemsText(original.items.map((x) => tr(x)).join('\n'));
      setBring(original.bringItems?.length ? original.bringItems : defaultBring(original.notes));
    }
  }, [original]);
  if (!c || !me) return null;
  const readonly = me.role === 'family';

  const save = (markDone?: boolean) => {
    const ms = METRIC_DEFS.filter((d) => metrics[d.key]?.trim()).map((d) => ({ key: d.key, value: Number(metrics[d.key]), unit: d.unit }));
    const next: Checkup = { ...c, items: itemsText.split('\n').map((s) => s.trim()).filter(Boolean), metrics: ms, done: markDone ?? c.done, bringItems: bring };
    const activity = markDone && !c.done ? `完成了「${c.title}」${ms.length ? tr('，记录了 ') + ms.length + tr(' 项数值') : ''}${next.result ? '：' + next.result : ''}` : undefined;
    dispatch({ type: 'upsertCheckup', checkup: next, activity });
    router.back();
  };

  const addPhoto = async (fromCamera: boolean) => {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { alert(tr('没有权限'), fromCamera ? tr('需要相机权限来拍报告单。') : tr('需要相册权限来选照片。')); return; }
    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsMultipleSelection: true, selectionLimit: 6 });
    if (res.canceled) return;
    setUploading(true);
    const paths: string[] = [];
    let failed = 0;
    for (const a of res.assets) {
      if (state.cloud) {
        try { paths.push(await uploadReportPhoto(state.cloud.familyId, c.id, a.uri)); }
        catch { failed++; paths.push(a.uri); } // 传不上去先留本机，之后再试
      } else paths.push(a.uri);
    }
    setUploading(false);
    const next = { ...c, photos: [...(c.photos ?? []), ...paths] };
    setC(next);
    dispatch({ type: 'upsertCheckup', checkup: next }); // 照片立刻保存，不用等点保存
    if (failed) alert(tr('有照片没传到云端'), tr('已先存在这台手机上，家人暂时看不到。网络好了再加一次即可。'));
  };
  const removePhoto = (uri: string) => {
    const next = { ...c, photos: (c.photos ?? []).filter((p) => p !== uri) };
    setC(next);
    dispatch({ type: 'upsertCheckup', checkup: next });
    deleteReportPhoto(uri).catch(() => {});
  };

  const vis: { v: Visibility; t: string }[] = [
    { v: 'self', t: tr('仅自己') },
    { v: 'partner', t: tr('伴侣') },
    { v: 'family', t: tr('全家') },
  ];

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }} keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
          <Row style={{ justifyContent: 'space-between' }}>
            <Pill text={tr('孕 {w} 周', { w: c.weekTo !== c.weekFrom ? `${c.weekFrom}–${c.weekTo}` : c.weekFrom })} />
            {c.done && <Pill text={tr("已完成")} tone="grey" />}
          </Row>

          {readonly ? (
            <>
              <Text style={{ fontSize: 24, fontWeight: '700', marginTop: 8, color: colors.ink }}>{tr(c.title)}</Text>
              <Body2>{c.date ?? tr('未定')}{c.hospital ? ' · ' + c.hospital : ''}</Body2>
            </>
          ) : (
            <>
              <TextInput value={tr(c.title)} onChangeText={(t) => setC({ ...c, title: t })} style={{ fontSize: 24, fontWeight: '700', marginTop: 8, color: colors.ink }} />
              <Row style={{ gap: 8, marginTop: 8 }}>
                <View style={{ flex: 1 }}><Field label={tr("日期")} value={c.date ?? ''} onChange={(t) => setC({ ...c, date: t })} placeholder="YYYY-MM-DD" keyboardType="numeric" /></View>
                <View style={{ flex: 1 }}><Field label={tr("医院")} value={c.hospital ?? ''} onChange={(t) => setC({ ...c, hospital: t })} placeholder={tr("例如：协和")} /></View>
              </Row>
            </>
          )}

          {!!c.notes && (
            <Card style={{ backgroundColor: colors.apricotSoft, borderColor: colors.apricotSoft, marginTop: 4 }}>
              <Caption style={{ color: colors.apricot }}>{tr('注意')}</Caption>
              <Body2 style={{ color: colors.ink }}>{tr(c.notes)}</Body2>
            </Card>
          )}

          <Section title={tr("检查项目")}>
            {readonly ? (
              c.items.map((it, i) => <Body key={i}>· {tr(it)}</Body>)
            ) : (
              <TextInput value={itemsText} onChangeText={setItemsText} multiline placeholder={tr("一行一项")} placeholderTextColor={colors.ink3} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 12, minHeight: 80, fontSize: 15, color: colors.ink, textAlignVertical: 'top' }} />
            )}
          </Section>

          {!c.done && (
            <Section title={tr("带什么")}>
              <Card style={{ padding: 0 }}>
                {bring.map((b, i) => (
                  <Pressable key={i} disabled={readonly} onPress={() => setBring(bring.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} style={{ flexDirection: 'row', alignItems: 'center', padding: space.md, paddingHorizontal: space.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line }}>
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: b.done ? colors.pine : colors.line, backgroundColor: b.done ? colors.pine : 'transparent', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                      {b.done && <Text style={{ color: colors.onPine, fontSize: 13, fontWeight: '700' }}>✓</Text>}
                    </View>
                    <Body style={{ flex: 1, color: b.done ? colors.ink3 : colors.ink }}>{tr(b.text)}</Body>
                    {!readonly && <Pressable onPress={() => setBring(bring.filter((_, j) => j !== i))} hitSlop={8}><Caption>{tr('移除')}</Caption></Pressable>}
                  </Pressable>
                ))}
                {!readonly && (
                  <Row style={{ padding: space.md, paddingHorizontal: space.lg, borderTopWidth: bring.length ? 1 : 0, borderTopColor: colors.line }}>
                    <TextInput value={newBring} onChangeText={setNewBring} placeholder={tr("再加一样…")} placeholderTextColor={colors.ink3} style={{ flex: 1, fontSize: 15, color: colors.ink }} returnKeyType="done" onSubmitEditing={() => { if (newBring.trim()) { setBring([...bring, { text: newBring.trim(), done: false }]); setNewBring(''); } }} />
                  </Row>
                )}
              </Card>
              <Caption style={{ marginTop: 6 }}>{tr('开了提醒的话，前一天晚上 8 点会把没勾的念一遍。')}</Caption>
            </Section>
          )}

          <Section title={tr("报告照片")} right={!readonly ? <Row style={{ gap: 12 }}><Pressable onPress={() => addPhoto(true)}><Caption style={{ color: colors.pine }}>{tr('拍照')}</Caption></Pressable><Pressable onPress={() => addPhoto(false)}><Caption style={{ color: colors.pine }}>{tr('相册')}</Caption></Pressable></Row> : undefined}>
            {(c.photos ?? []).length === 0 ? (
              <Body2>{tr('把报告单拍下来放在这里，复诊时医生要看上次的，一翻就有。')}</Body2>
            ) : (
              <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                {(c.photos ?? []).map((uri) => (
                  <Pressable key={uri} onPress={() => setViewer(uri)} onLongPress={() => !readonly && alert(tr('删除这张照片？'), undefined, [{ text: tr('取消'), style: 'cancel' }, { text: tr('删除'), style: 'destructive', onPress: () => removePhoto(uri) }])}>
                    <ReportPhoto path={uri} style={{ width: 96, height: 96, borderRadius: 8 }} />
                  </Pressable>
                ))}
              </Row>
            )}
            {uploading && <Row style={{ marginTop: 8 }}><ActivityIndicator color={colors.pine} /><Caption>{tr('正在传到云端…')}</Caption></Row>}
            {(c.photos ?? []).length > 0 && <Caption style={{ marginTop: 6 }}>{state.cloud ? tr('家人也能看到；长按可删除。') : tr('照片只存在本机；长按可删除。')}</Caption>}
          </Section>

          <Section title={tr("谁陪同")}>
            <Row style={{ flexWrap: 'wrap', gap: 8 }}>
              {state.members.filter((m) => m.role !== 'mom').map((m) => {
                const on = c.companionId === m.id;
                return (
                  <Pressable key={m.id} disabled={readonly} onPress={() => setC({ ...c, companionId: on ? undefined : m.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, borderWidth: 1, borderColor: on ? colors.apricot : colors.line, backgroundColor: on ? colors.apricotSoft : colors.card }}>
                    <Avatar name={m.name} role={m.role} size={22} />
                    <Body2 style={{ color: on ? colors.apricot : colors.ink2, fontWeight: on ? '700' : '400' }}>{m.name}</Body2>
                  </Pressable>
                );
              })}
              {state.members.length <= 1 && <Caption>{tr('先去「家庭」邀请准爸爸或家人。')}</Caption>}
            </Row>
          </Section>

          {!readonly && <Section title={tr("数值")}>
            <Card style={{ padding: 0 }}>
              {METRIC_DEFS.map((d, i) => {
                const raw = metrics[d.key] ?? '';
                const flag = raw.trim() ? metricFlag(d.key, Number(raw)) : 'na';
                return (
                  <Row key={d.key} style={{ padding: space.md, paddingHorizontal: space.lg, borderTopWidth: i ? 1 : 0, borderTopColor: colors.line, justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Body>{tr(d.label)}</Body>
                      <Caption>{tr('参考')} {tr(d.ref)}</Caption>
                    </View>
                    {readonly ? (
                      <Body style={{ fontWeight: '700' }}>{raw ? `${raw} ${d.unit}` : '—'}</Body>
                    ) : (
                      <Row>
                        <TextInput value={raw} onChangeText={(t) => setMetrics({ ...metrics, [d.key]: t })} keyboardType="decimal-pad" placeholder="—" placeholderTextColor={colors.ink3} style={{ width: 72, textAlign: 'right', fontSize: 17, fontWeight: '700', color: flag === 'ok' ? colors.pine : flag === 'na' ? colors.ink : colors.apricot, borderBottomWidth: 1, borderBottomColor: colors.line, paddingVertical: 4 }} />
                        <Caption style={{ width: 44 }}>{d.unit}</Caption>
                      </Row>
                    )}
                    {flag === 'high' && <Pill text={tr("高于参考")} tone="apricot" />}
                    {flag === 'low' && <Pill text={tr("低于参考")} tone="apricot" />}
                  </Row>
                );
              })}
            </Card>
            <Caption style={{ marginTop: 6 }}>{tr('参考范围只是常见区间，超出不等于有问题，下次产检问问医生就好。')}</Caption>
          </Section>}

          {!readonly && <Section title={tr("结果与备注")}>
            {(
              <TextInput value={c.result ?? ''} onChangeText={(t) => setC({ ...c, result: t })} multiline placeholder={tr("例如：一切正常，医生说下次 4 周后来")} placeholderTextColor={colors.ink3} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 6, padding: 12, minHeight: 72, fontSize: 15, color: colors.ink, textAlignVertical: 'top' }} />
            )}
          </Section>}
          {readonly && <Caption style={{ marginTop: space.xl }}>{tr('检查数值和结果只对准妈妈和准爸爸可见。')}</Caption>}

          {me.role === 'mom' && (
            <Section title={tr("谁能看到")}>
              <Row style={{ gap: 8 }}>
                {vis.map((o) => (
                  <Pressable key={o.v} onPress={() => setC({ ...c, visibility: o.v })} style={{ flex: 1, padding: 10, borderRadius: 8, borderWidth: 1, borderColor: c.visibility === o.v ? colors.pine : colors.line, backgroundColor: c.visibility === o.v ? colors.pineSoft : colors.card, alignItems: 'center' }}>
                    <Text style={{ fontWeight: '700', color: c.visibility === o.v ? colors.pine : colors.ink2 }}>{o.t}</Text>
                  </Pressable>
                ))}
              </Row>
            </Section>
          )}

          {!readonly && (
            <View style={{ marginTop: space.xxl, gap: 10 }}>
              {!c.done && <Button title={tr("标记完成并保存")} onPress={() => save(true)} />}
              <Button title={c.done ? tr('保存') : tr('仅保存')} kind="ghost" onPress={() => save()} />
              {c.done && <Button title={tr("改回未完成")} kind="ghost" onPress={() => { setC({ ...c, done: false }); dispatch({ type: 'upsertCheckup', checkup: { ...c, done: false } }); }} />}
              <Pressable style={{ alignItems: 'center', marginTop: 8 }} onPress={() => alert(tr('删除这次产检'), c.title, [{ text: tr('取消') }, { text: tr('删除'), style: 'destructive', onPress: () => { dispatch({ type: 'deleteCheckup', id: c.id }); router.back(); } }])}>
                <Caption style={{ color: colors.warn }}>{tr('删除')}</Caption>
              </Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal visible={!!viewer} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' }} onPress={() => setViewer(null)}>
          {viewer && <ReportPhoto path={viewer} style={{ width: '100%', height: '85%' }} resizeMode="contain" />}
          <Caption style={{ color: colors.onPine, marginTop: 8 }}>{tr('点任意处关闭')}</Caption>
        </Pressable>
      </Modal>
    </Screen>
  );
}
