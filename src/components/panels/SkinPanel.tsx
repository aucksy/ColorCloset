import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeOut, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { skinNote } from '@/engine';
import { PanelShell } from '@/components/PanelShell';
import { SkinGrid } from '@/components/SkinGrid';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export function SkinPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const mst = useStore((s) => s.mst);
  const setMst = useStore((s) => s.setMst);

  // Show a brief "recalibrating" beat each time the skin swatch changes, so it's clear the
  // recommendations are being re-ranked (skin tone genuinely reshuffles the deck).
  const [recalKey, setRecalKey] = useState(0);
  const [recal, setRecal] = useState(false);
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 850, easing: Easing.linear }), -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (recalKey === 0) return;
    setRecal(true);
    const id = setTimeout(() => setRecal(false), 1100);
    return () => clearTimeout(id);
  }, [recalKey]);

  const onSelect = (n: number) => {
    setMst(n);
    setRecalKey((k) => k + 1);
  };

  const ringStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));

  return (
    <PanelShell title="Your skin tone" onClose={closePanel}>
      <Text style={[styles.p, { color: t.muted, fontFamily: fonts.uiRegular }]}>
        Used to rank your combinations — your swatch maps to a tone tier (light, medium or deep). Deeper
        tones lean into crisp, saturated colour; lighter tones into softer contrast. It never rules a colour out.
      </Text>

      {recal && (
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(240)} style={[styles.recal, { backgroundColor: t.glass2, borderColor: t.line2 }]}>
          <Animated.View style={[styles.ring, { borderColor: t.line, borderTopColor: t.accent }, ringStyle]} />
          <Text style={[styles.recalTxt, { color: t.ink, fontFamily: fonts.uiSemi }]}>Recalibrating your palette…</Text>
        </Animated.View>
      )}

      <View style={{ marginTop: 14 }}>
        <SkinGrid value={mst} onSelect={onSelect} />
      </View>
      <Text style={[styles.note, { color: t.muted, borderLeftColor: t.accent, fontFamily: fonts.uiRegular }]}>
        {skinNote(mst)}
      </Text>
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 13, lineHeight: 20, marginBottom: 6 },
  recal: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, marginTop: 14 },
  ring: { width: 20, height: 20, borderRadius: 10, borderWidth: 2.5 },
  recalTxt: { fontSize: 13 },
  note: { fontSize: 12.5, lineHeight: 19, marginTop: 18, borderLeftWidth: 2, paddingLeft: 12 },
});
