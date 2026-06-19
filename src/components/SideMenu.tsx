import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { uniStats, skinObj } from '@/engine';
import { Icon, type IconName } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { useStore } from '@/store/useStore';
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

  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const saved = useStore((s) => s.saved.length);
  const tops = useStore((s) => s.tops);
  const bottoms = useStore((s) => s.bottoms);
  const depth = useStore((s) => s.depth);
  const worn = useStore((s) => s.worn);
  const dismissed = useStore((s) => s.dismissed);
  const resetWardrobe = useStore((s) => s.resetWardrobe);

  // Match the rotation panel: exclude "not for me" combos from the count.
  const active = uniStats(tops, bottoms, skinObj(depth), worn).uni.filter((c) => !dismissed[c.id]);
  const total = active.length;
  const wornCount = active.filter((c) => worn[c.id]).length;

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
        style={[styles.sheet, { backgroundColor: t.surface, borderRightColor: t.line, paddingTop: insets.top + 22, paddingBottom: insets.bottom + 4 }]}
      >
        <View style={styles.brand}>
          <Logo size={30} />
          <Text style={[styles.brandTxt, { color: t.ink, fontFamily: fonts.uiBold }]}>ColorCloset</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 12 }}>
          <Item t={t} icon="grid" label="Add more colours" onPress={addColours} />
          <Item t={t} icon="list" label="Your rotation" onPress={() => openPanel('combos')} right={`${wornCount}/${total}`} />
          <Item t={t} icon="heart" label="Saved looks" onPress={() => openPanel('saved')} right={String(saved)} />
          <Item t={t} icon="bell" label="Daily reminder" onPress={() => openPanel('reminder')} />

          <Toggle t={t} icon={theme === 'dark' ? 'moon' : 'sun'} label={theme === 'dark' ? 'Dark mode' : 'Light mode'} on={theme === 'light'} onPress={toggleTheme} />

          <View style={[styles.div, { backgroundColor: t.line }]} />

          <Item t={t} icon="pencil" label="Skin tone" onPress={() => openPanel('skin')} />
          <Item t={t} icon="setup" label="Set up again" onPress={setupAgain} />
          <Item t={t} icon="download" label="Backup & restore" onPress={() => openPanel('backup')} />
          <Item t={t} icon="info" label="How it works" onPress={() => openPanel('about')} />
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
}: {
  t: ReturnType<typeof useTheme>;
  icon: IconName;
  label: string;
  onPress: () => void;
  right?: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.item, { opacity: pressed ? 0.6 : 1 }]}>
      <Icon name={icon} size={19} color={t.muted} />
      <Text style={[styles.itemTxt, { color: t.ink, fontFamily: fonts.ui }]}>{label}</Text>
      {right != null && <Text style={[styles.right, { color: t.muted, fontFamily: fonts.uiSemi }]}>{right}</Text>}
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
    borderRightWidth: 1,
    paddingHorizontal: 18,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, paddingBottom: 22 },
  brandTxt: { fontSize: 17 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14 },
  itemTxt: { fontSize: 14.5 },
  right: { marginLeft: 'auto', fontSize: 12 },
  switch: { marginLeft: 'auto', width: 42, height: 24, borderRadius: 99, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  div: { height: 1, marginVertical: 10, marginHorizontal: 6 },
  foot: { paddingHorizontal: 8, paddingVertical: 16, fontSize: 11, lineHeight: 17 },
});
