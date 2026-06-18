import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CLOTH, hx, shadeHex, type ClothType, type ColorKey } from '@/engine';
import { PanelShell } from '@/components/PanelShell';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export function TypeTaggingPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const shadeTops = useStore((s) => s.shadeTops);
  const shadeBottoms = useStore((s) => s.shadeBottoms);
  const types = useStore((s) => s.types);
  const toggleType = useStore((s) => s.toggleType);

  const Row = ({ color, hex }: { color: ColorKey; hex: string }) => {
    const tags = types[color] ?? [];
    return (
      <View style={[styles.row, { borderBottomColor: t.line }]}>
        <View style={[styles.sw, { backgroundColor: hex, borderColor: t.line2 }]} />
        <Text style={[styles.nm, { color: t.ink, fontFamily: fonts.uiSemi }]}>{color}</Text>
        <View style={styles.chips}>
          {CLOTH.map((ct) => {
            const on = tags.includes(ct.id as ClothType);
            return (
              <Pressable
                key={ct.id}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                onPress={() => toggleType(color, ct.id as ClothType)}
                style={{ borderRadius: 99 }}
              >
                {on ? (
                  <LinearGradient colors={t.goldGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip}>
                    <Text style={[styles.chipTxt, { color: t.onGold, fontFamily: fonts.uiSemi }]}>{ct.name}</Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.chip, { backgroundColor: t.glass, borderWidth: 1, borderColor: t.line }]}>
                    <Text style={[styles.chipTxt, { color: t.muted, fontFamily: fonts.uiSemi }]}>{ct.name}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  };

  const uniqTops = [...new Set(tops)];
  const uniqBottoms = [...new Set(bottoms)];

  return (
    <PanelShell title="Label by type" onClose={closePanel}>
      <Text style={[styles.p, { color: t.muted, fontFamily: fonts.uiRegular }]}>
        Optional. Tag pieces as casual, formal or gym, then filter your combinations by what fits the
        moment. Untagged colours show everywhere.
      </Text>

      <Text style={[styles.secH, { color: t.accent, fontFamily: fonts.mono }]}>TOPS</Text>
      {uniqTops.map((c) => (
        <Row key={`t-${c}`} color={c} hex={shadeHex(c, shadeTops[c]?.[0])} />
      ))}

      <Text style={[styles.secH, { color: t.accent, fontFamily: fonts.mono }]}>BOTTOMS</Text>
      {uniqBottoms.map((c) => (
        <Row key={`b-${c}`} color={c} hex={shadeHex(c, shadeBottoms[c]?.[0])} />
      ))}
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 13, lineHeight: 20, marginBottom: 6 },
  secH: { fontSize: 11, letterSpacing: 1.4, marginTop: 20, marginBottom: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11, borderBottomWidth: 1 },
  sw: { width: 30, height: 30, borderRadius: 9, borderWidth: 1 },
  nm: { fontSize: 13, minWidth: 60 },
  chips: { flexDirection: 'row', gap: 7, marginLeft: 'auto', flexWrap: 'wrap', justifyContent: 'flex-end' },
  chip: { paddingVertical: 6, paddingHorizontal: 11, borderRadius: 99 },
  chipTxt: { fontSize: 11 },
});
