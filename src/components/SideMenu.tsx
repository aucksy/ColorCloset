import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GENDER_LABEL, MODE_LABEL, skinObj, uniStats } from '@/engine';
import { Icon, type IconName } from '@/components/Icon';
import { LogoBadge } from '@/components/LogoBadge';
import { useActiveWardrobe, useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

export function SideMenu() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const open = useUiStore((s) => s.drawerOpen);
  const closeDrawer = useUiStore((s) => s.closeDrawer);
  const openPanel = useUiStore((s) => s.openPanel);

  const setTheme = useStore((s) => s.setTheme);
  const gender = useStore((s) => s.gender);
  const mode = useStore((s) => s.mode);
  const mst = useStore((s) => s.mst);
  const resetWardrobe = useStore((s) => s.resetWardrobe);

  // All counts read the ACTIVE gender×mode bucket.
  const w = useActiveWardrobe();

  // Match the rotation panel: exclude "not for me" combos from the count.
  const active = uniStats(w.tops, w.bottoms, skinObj(mst), w.worn, gender, mode).uni.filter((c) => !w.dismissed[c.id]);
  const total = active.length;
  const wornCount = active.filter((c) => w.worn[c.id]).length;

  if (!open) return null;

  const setupAgain = () => {
    closeDrawer();
    router.replace('/onboarding');
  };
  const addColours = () => {
    closeDrawer();
    router.push({ pathname: '/onboarding', params: { mode: 'add' } });
  };
  const reset = () => {
    Alert.alert('Reset wardrobe?', 'This clears your colours, saved looks and worn history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetWardrobe();
          closeDrawer();
          router.replace('/onboarding');
        },
      },
    ]);
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(250)} style={styles.scrimWrap}>
        <Pressable style={[StyleSheet.absoluteFill, styles.scrim]} onPress={closeDrawer} />
      </Animated.View>
      <Animated.View
        entering={SlideInLeft.springify().damping(17).stiffness(150).mass(0.7)}
        exiting={SlideOutLeft.duration(240)}
        style={[styles.sheet, { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 4 }]}
      >
        {/* Themed background on a plain (non-layout-animated) child: a Reanimated
            layout-animated view caches its own style and would lag a theme switch by a
            frame, so the panel must paint its surface here instead. */}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: t.surface, borderRightWidth: 1, borderRightColor: t.line }]}
        />
        <View style={styles.brand}>
          <LogoBadge size={34} />
          <Text style={[styles.brandTxt, { color: t.ink, fontFamily: fonts.uiBold }]}>ColorCloset</Text>
        </View>

        {gender && (
          <Text style={[styles.caption, { color: t.faint, fontFamily: fonts.uiSemi }]}>
            {`${GENDER_LABEL[gender]} · ${MODE_LABEL[mode]}`}
          </Text>
        )}

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
          <Item t={t} icon="bag" label="Colours to buy" onPress={() => openPanel('buy')} highlight />
          <Item t={t} icon="grid" label="Add more colours" onPress={addColours} />
          <Item t={t} icon="list" label="Your rotation" onPress={() => openPanel('combos')} right={`${wornCount}/${total}`} />
          <Item t={t} icon="heart" label="Saved looks" onPress={() => openPanel('saved')} right={String(w.saved.length)} />
          <Item t={t} icon="bell" label="Daily reminder" onPress={() => openPanel('reminder')} />

          <Toggle t={t} icon={t.name === 'dark' ? 'moon' : 'sun'} label={t.name === 'dark' ? 'Dark mode' : 'Light mode'} on={t.name === 'light'} onPress={() => setTheme(t.name === 'dark' ? 'light' : 'dark')} />

          <View style={[styles.div, { backgroundColor: t.line }]} />

          <Item t={t} icon="pencil" label="Skin tone" onPress={() => openPanel('skin')} />
          <Item t={t} icon="setup" label="Set up again" onPress={setupAgain} />
          <Item t={t} icon="download" label="Backup & restore" onPress={() => openPanel('backup')} />
          <Item t={t} icon="info" label="How it works" onPress={() => openPanel('about')} />
          <Item t={t} icon="star" label="Colour science" onPress={() => openPanel('sources')} highlight />
          <Item t={t} icon="reset" label="Reset wardrobe" onPress={reset} />

          <Text style={[styles.foot, { color: t.faint, fontFamily: fonts.uiRegular }]}>
            One job, done well: what to wear to the office from what you own.
          </Text>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

function Item({
  t,
  icon,
  label,
  onPress,
  right,
  highlight,
  badge,
}: {
  t: ReturnType<typeof useTheme>;
  icon: IconName;
  label: string;
  onPress: () => void;
  right?: string;
  /** Draw attention to an important entry (accent icon + tint). */
  highlight?: boolean;
  /** Optional small pill on the right (e.g. "NEW"). Independent of `highlight`. */
  badge?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        highlight && { backgroundColor: 'rgba(201,168,106,0.12)', borderWidth: 1, borderColor: t.accent },
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      <Icon name={icon} size={19} color={highlight ? t.accent : t.muted} />
      <Text style={[styles.itemTxt, { color: t.ink, fontFamily: highlight ? fonts.uiSemi : fonts.ui }]}>{label}</Text>
      {right != null ? (
        <Text style={[styles.right, { color: t.muted, fontFamily: fonts.uiSemi }]}>{right}</Text>
      ) : badge ? (
        <View style={[styles.newBadge, { backgroundColor: t.accent }]}>
          <Text style={[styles.newTxt, { color: t.onGold, fontFamily: fonts.monoBold }]}>{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function Toggle({
  t,
  icon,
  label,
  on,
  onPress,
}: {
  t: ReturnType<typeof useTheme>;
  icon: IconName;
  label: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="switch" accessibilityState={{ checked: on }} style={styles.item}>
      <Icon name={icon} size={19} color={t.muted} />
      <Text style={[styles.itemTxt, { color: t.ink, fontFamily: fonts.ui }]}>{label}</Text>
      <View style={[styles.switch, { backgroundColor: on ? t.accent : t.track }]}>
        <View style={[styles.knob, { left: on ? 21 : 3 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scrimWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50 },
  scrim: { backgroundColor: 'rgba(5,5,8,0.5)' },
  sheet: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '80%',
    maxWidth: 320,
    zIndex: 60,
    overflow: 'hidden',
    paddingHorizontal: 18,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, paddingBottom: 8 },
  brandTxt: { fontSize: 17 },
  caption: { paddingHorizontal: 8, paddingBottom: 14, fontSize: 11.5, letterSpacing: 0.3 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14 },
  itemTxt: { fontSize: 14.5 },
  right: { marginLeft: 'auto', fontSize: 12 },
  newBadge: { marginLeft: 'auto', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  newTxt: { fontSize: 8.5, letterSpacing: 0.6 },
  switch: { marginLeft: 'auto', width: 42, height: 24, borderRadius: 99, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  div: { height: 1, marginVertical: 10, marginHorizontal: 6 },
  foot: { paddingHorizontal: 8, paddingVertical: 16, fontSize: 11, lineHeight: 17 },
});
