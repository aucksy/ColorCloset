import { useRef } from 'react';
import { ScrollView, StyleSheet, Text, View, type LayoutChangeEvent, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

const ITEM_H = 40;
const VISIBLE = 5; // odd, so one row is centred
const PAD = ITEM_H * ((VISIBLE - 1) / 2);

interface ColumnProps {
  items: string[];
  value: number; // selected index
  onChange: (i: number) => void;
  width: number;
}

/** A single snapping wheel column (iOS-style): the centred row is the selection. */
function Column({ items, value, onChange, width }: ColumnProps) {
  const t = useTheme();
  const ref = useRef<ScrollView>(null);
  const didInit = useRef(false);

  const onLayout = (_e: LayoutChangeEvent) => {
    if (didInit.current) return;
    didInit.current = true;
    ref.current?.scrollTo({ y: value * ITEM_H, animated: false });
  };
  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.y / ITEM_H)));
    if (i !== value) onChange(i);
  };

  return (
    <View style={{ width, height: ITEM_H * VISIBLE }} onLayout={onLayout}>
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: PAD }}
        onMomentumScrollEnd={settle}
      >
        {items.map((it, i) => (
          <View key={i} style={styles.cell}>
            <Text style={[styles.label, { color: i === value ? t.ink : t.faint, fontFamily: fonts.displaySemi }]}>{it}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const AMPM = ['AM', 'PM'];

interface Props {
  hour: number; // 0..23
  minute: number; // 0..59
  onChange: (hour: number, minute: number) => void;
}

/** iPhone-style three-wheel time picker (hour · minute · AM/PM). */
export function WheelTimePicker({ hour, minute, onChange }: Props) {
  const t = useTheme();
  const isPM = hour >= 12;
  const hour12Index = (hour % 12 === 0 ? 12 : hour % 12) - 1; // 0..11

  const emit = (h12i: number, mi: number, pm: boolean) => {
    const h12 = h12i + 1;
    const h24 = pm ? (h12 % 12) + 12 : h12 % 12;
    onChange(h24, mi);
  };

  return (
    <View style={[styles.wrap, { backgroundColor: t.glass, borderColor: t.line }]}>
      {/* centre selection band */}
      <View pointerEvents="none" style={[styles.band, { borderColor: t.line2, backgroundColor: t.glass2 }]} />
      <View style={styles.row}>
        <Column items={HOURS} value={hour12Index} width={56} onChange={(i) => emit(i, minute, isPM)} />
        <Text style={[styles.colon, { color: t.muted, fontFamily: fonts.displaySemi }]}>:</Text>
        <Column items={MINUTES} value={minute} width={56} onChange={(i) => emit(hour12Index, i, isPM)} />
        <Column items={AMPM} value={isPM ? 1 : 0} width={56} onChange={(i) => emit(hour12Index, minute, i === 1)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 16, paddingVertical: 6, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  cell: { height: ITEM_H, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 21 },
  colon: { fontSize: 21, marginTop: -2 },
  band: { position: 'absolute', left: 16, right: 16, top: ITEM_H * 2 + 6, height: ITEM_H, borderRadius: 10, borderTopWidth: 1, borderBottomWidth: 1 },
});
