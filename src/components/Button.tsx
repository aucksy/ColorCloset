import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

type Variant = 'primary' | 'ghost' | 'goldline';

interface Props {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  icon?: ReactNode;
  style?: ViewStyle;
}

export function Button({ title, onPress, variant = 'primary', disabled, icon, style }: Props) {
  const t = useTheme();

  const content = (color: string) => (
    <View style={styles.row}>
      {icon}
      <Text style={[styles.label, { color, fontFamily: fonts.uiSemi }]}>{title}</Text>
    </View>
  );

  if (variant === 'primary') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled }}
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          { opacity: disabled ? 0.4 : pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.975 : 1 }] },
          style,
        ]}
      >
        <LinearGradient
          colors={t.goldGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          {content(t.onGold)}
        </LinearGradient>
      </Pressable>
    );
  }

  const bg = variant === 'goldline' ? 'rgba(201,168,106,0.09)' : 'transparent';
  const border = variant === 'goldline' ? t.gold : t.line2;
  const color = variant === 'goldline' ? t.goldSoft : t.ink;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles.outlined,
        { backgroundColor: bg, borderColor: border, borderWidth: variant === 'goldline' ? 1.5 : 1 },
        { opacity: disabled ? 0.4 : 1, transform: [{ scale: pressed ? 0.975 : 1 }] },
        style,
      ]}
    >
      {content(color)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: 18, width: '100%', overflow: 'hidden' },
  outlined: { paddingVertical: 17, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  fill: { paddingVertical: 17, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  label: { fontSize: 15.5 },
});
