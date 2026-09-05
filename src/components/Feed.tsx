import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useDerived, useStore } from '../store/store';
import { Avatar, Body, Body2, Caption, Card, Empty, Pill, Row } from './ui';
import { colors, roleColor, space } from '../theme';
import { fmtTime } from '../lib/pregnancy';
import type { Activity } from '../data/types';
import { tr } from '../i18n';

function Item({ a }: { a: Activity }) {
  const { state, dispatch } = useStore();
  const { me, byId } = useDerived();
  const [draft, setDraft] = useState('');
  const [open, setOpen] = useState(false);
  const who = byId(a.byId);
  if (!who || !me) return null;
  const liked = a.likes.includes(me.id);
  const kindTone = a.kind === 'checkup' ? 'pine' : a.kind === 'supplement' ? 'apricot' : a.kind === 'family' ? 'slate' : 'grey';
  const kindText = { checkup: tr('产检'), supplement: tr('用药'), log: tr('记录'), family: tr('家庭'), system: tr('系统') }[a.kind];
  return (
    <Card style={{ marginBottom: space.sm }}>
      <Row style={{ alignItems: 'flex-start' }}>
        <Avatar name={who.name} role={who.role} size={34} />
        <View style={{ flex: 1 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row>
              <Text style={{ fontWeight: '700', color: roleColor[who.role].fg }}>{who.name}</Text>
              <Pill text={kindText} tone={kindTone} />
            </Row>
            <Caption>{fmtTime(a.at)}</Caption>
          </Row>
          <Body style={{ marginTop: 4 }}>{a.text}</Body>
          {a.comments.map((c) => {
            const cm = byId(c.byId);
            return (
              <Body2 key={c.id} style={{ marginTop: 6 }}>
                <Text style={{ fontWeight: '700', color: cm ? roleColor[cm.role].fg : colors.ink2 }}>{cm?.name ?? '?'}：</Text>
                {c.text}
              </Body2>
            );
          })}
          <Row style={{ marginTop: 8, gap: 16 }}>
            <Pressable onPress={() => dispatch({ type: 'like', activityId: a.id, byId: me.id })}>
              <Text style={{ color: liked ? colors.apricot : colors.ink3, fontWeight: '600' }}>
                {liked ? '♥' : '♡'} {a.likes.length > 0 ? a.likes.length : tr('赞')}
              </Text>
            </Pressable>
            <Pressable onPress={() => setOpen((o) => !o)}>
              <Text style={{ color: colors.ink3, fontWeight: '600' }}>{tr('留言')}</Text>
            </Pressable>
          </Row>
          {open && (
            <Row style={{ marginTop: 8 }}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={tr("说点什么…")}
                placeholderTextColor={colors.ink3}
                style={{ flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, color: colors.ink, backgroundColor: colors.paper }}
                onSubmitEditing={() => {
                  if (!draft.trim()) return;
                  dispatch({ type: 'comment', activityId: a.id, byId: me.id, text: draft.trim() });
                  setDraft('');
                  setOpen(false);
                }}
                returnKeyType="send"
              />
            </Row>
          )}
        </View>
      </Row>
    </Card>
  );
}

export function Feed({ limit }: { limit?: number }) {
  const { state } = useStore();
  const { canSee } = useDerived();
  const list = state.activities.filter((a) => canSee(a.visibility)).slice(0, limit ?? 200);
  if (list.length === 0) return <Empty text={tr("还没有动态。记一笔产检、吃药或心情，家人就能看到。")} />;
  return (
    <View>
      {list.map((a) => (
        <Item key={a.id} a={a} />
      ))}
    </View>
  );
}
