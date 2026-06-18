import { type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Full-bleed slide-over panel (in-tree overlay, not a router modal). */
export function PanelShell({ title, onClose, children }: Props) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutRight.duration(220)}
      style={[styles.panel, { backgroundColor: t.bg, paddingTop: insets.top }]}
    >
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={[styles.close, { backgroundColor: t.glass, borderColor: t.line }]}
        >
          <Icon name="chevron-left" size={17} color={t.ink} />
        </Pressable>
        <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>{title}</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 70 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  close: { width: 38, height: 38, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 21 },
  body: { paddingHorizontal: 20, paddingTop: 10 },
});
