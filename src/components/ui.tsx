import React from 'react';
import { Pressable, Text, TextInput, View, ViewStyle, TextStyle } from 'react-native';
import { colors, fontScale, radius, roleColor, space, type } from '../theme';
import type { Role } from '../data/types';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flex: 1, backgroundColor: colors.paper }, style]}>{children}</View>;
}

export function H1({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[type.h1, style]}>{children}</Text>;
}
export function H2({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[type.h2, style]}>{children}</Text>;
}
export function H3({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[type.h3, style]}>{children}</Text>;
}
export function Body({ children, style, numberOfLines }: { children: React.ReactNode; style?: TextStyle; numberOfLines?: number }) {
  return <Text style={[type.body, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Body2({ children, style, numberOfLines }: { children: React.ReactNode; style?: TextStyle; numberOfLines?: number }) {
  return <Text style={[type.body2, style]} numberOfLines={numberOfLines}>{children}</Text>;
}
export function Caption({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[type.caption, style]}>{children}</Text>;
}

export function Card({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) {
  const inner = <View style={[s.card, style]}>{children}</View>;
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, flex: (style as any)?.flex }]}>
      {inner}
    </Pressable>
  );
}

export function Section({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space.xl }}>
      <View style={s.sectionHead}>
        <Text style={s.sectionTitle}>{title}</Text>
        {right}
      </View>
      {children}
    </View>
  );
}

export function Button({ title, onPress, kind = 'primary', small, disabled, style }: { title: string; onPress: () => void; kind?: 'primary' | 'ghost' | 'danger'; small?: boolean; disabled?: boolean; style?: ViewStyle }) {
  const bg = kind === 'primary' ? colors.pine : kind === 'danger' ? colors.warnSoft : 'transparent';
  const fg = kind === 'primary' ? colors.onPine : kind === 'danger' ? colors.warn : colors.pine;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, borderColor: kind === 'ghost' ? colors.pine : bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        small && { paddingVertical: 6, paddingHorizontal: 12 },
        style,
      ]}
    >
      <Text style={{ color: fg, fontWeight: '700', fontSize: Math.round((small ? 14 : 16) * fontScale) }}>{title}</Text>
    </Pressable>
  );
}

export function Pill({ text, tone = 'pine' }: { text: string; tone?: 'pine' | 'apricot' | 'slate' | 'warn' | 'grey' }) {
  const map = {
    pine: [colors.pineSoft, colors.pine],
    apricot: [colors.apricotSoft, colors.apricot],
    slate: [colors.slateSoft, colors.slate],
    warn: [colors.warnSoft, colors.warn],
    grey: [colors.paper2, colors.ink2],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm, alignSelf: 'flex-start' }}>
      <Text style={{ color: fg, fontSize: Math.round(12 * fontScale), fontWeight: '600' }}>{text}</Text>
    </View>
  );
}

export function Avatar({ name, role, size = 36 }: { name: string; role: Role; size?: number }) {
  const c = roleColor[role];
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: c.fg }}>
      <Text style={{ color: c.fg, fontWeight: '700', fontSize: size * 0.42 }}>{name.slice(0, 1)}</Text>
    </View>
  );
}

export function Field({ label, value, onChange, placeholder, keyboardType, multiline }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'decimal-pad'; multiline?: boolean }) {
  return (
    <View style={{ marginBottom: space.lg }}>
      <Caption style={{ marginBottom: 6 }}>{label}</Caption>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.ink3}
        keyboardType={keyboardType}
        multiline={multiline}
        style={[s.input, multiline && { height: 88, textAlignVertical: 'top' }]}
      />
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap: space.sm }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.line, marginVertical: space.md }} />;
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={{ padding: space.xl, alignItems: 'center' }}>
      <Body2 style={{ textAlign: 'center' }}>{text}</Body2>
    </View>
  );
}

const s = {
  get card() { return { backgroundColor: colors.card, borderRadius: radius.md, padding: space.lg, borderWidth: 1, borderColor: colors.line }; },
  get sectionHead() { return { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'baseline' as const, marginBottom: space.sm }; },
  get sectionTitle() { return { fontSize: Math.round(13 * fontScale), fontWeight: '700' as const, color: colors.ink3, letterSpacing: 1 }; },
  get btn() { return { paddingVertical: 12, paddingHorizontal: 18, borderRadius: radius.md, alignItems: 'center' as const, borderWidth: 1 }; },
  get input() { return { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 10, fontSize: Math.round(16 * fontScale), color: colors.ink }; },
};
