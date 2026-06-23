import { useRouter } from 'expo-router';
import { useState, type ReactElement } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MST_SWATCHES, SOURCES, shadeHex, tierOf } from '@/engine';
import { Button } from '@/components/Button';
import { GarmentSilhouette } from '@/components/GarmentSilhouette';
import { Icon } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { useStore } from '@/store/useStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

type ThemeT = ReturnType<typeof useTheme>;

interface Slide {
  key: string;
  eyebrow: string;
  title: string;
  body: string;
  Visual: (p: { t: ThemeT }) => ReactElement;
}

const SLIDES: Slide[] = [
  {
    key: 'hero',
    eyebrow: 'WELCOME TO',
    title: 'ColorCloset',
    body: 'Know exactly what to wear to the office — put together from the colours already hanging in your wardrobe.',
    Visual: HeroVisual,
  },
  {
    key: 'deck',
    eyebrow: 'STYLE ME',
    title: 'A deck of looks, from your own colours.',
    body: 'Swipe a stack of office colour pairings built only from what you own. Save the ones you love, mark what you’ve worn.',
    Visual: DeckVisual,
  },
  {
    key: 'wardrobes',
    eyebrow: 'FOUR WARDROBES',
    title: 'Formal and casual. For him and her.',
    body: 'Separate wardrobes for work and weekends — Men & Women, Formal & Casual — each with its own colours and looks.',
    Visual: WardrobeVisual,
  },
  {
    key: 'skin',
    eyebrow: 'MADE FOR YOU',
    title: 'Tuned to your skin tone.',
    body: 'Pick your shade on the 10‑point Monk Skin Tone scale; we lean into the colours that flatter you most near the face — never ruling any out.',
    Visual: SkinVisual,
  },
  {
    key: 'science',
    eyebrow: 'NO GUESSWORK',
    title: 'Grounded in real colour science.',
    body: 'Built on Pantone, the Monk Skin Tone research and trusted menswear & style sources — so every suggestion has a reason.',
    Visual: ScienceVisual,
  },
];

export default function Welcome() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const markWelcomeSeen = useStore((s) => s.markWelcomeSeen);

  const aref = useAnimatedRef<Animated.ScrollView>();
  const scrollX = useSharedValue(0);
  const [index, setIndex] = useState(0);
  const last = SLIDES.length - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  const goToPage = (i: number) => {
    runOnUI(() => {
      'worklet';
      scrollTo(aref, i * width, 0, true);
    })();
  };

  const finish = () => {
    markWelcomeSeen();
    router.replace('/onboarding');
  };

  const onCta = () => (index < last ? goToPage(index + 1) : finish());

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <View style={styles.top}>
        <View style={{ width: 60 }} />
        <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" onPress={finish} hitSlop={10} style={styles.skip}>
          <Text style={[styles.skipTxt, { color: t.muted, fontFamily: fonts.ui }]}>Skip</Text>
        </Pressable>
      </View>

      <Animated.ScrollView
        ref={aref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {SLIDES.map((s, i) => (
          <SlideView key={s.key} slide={s} index={i} scrollX={scrollX} width={width} t={t} />
        ))}
      </Animated.ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <Dot key={i} index={i} scrollX={scrollX} width={width} t={t} />
          ))}
        </View>
        <Button
          title={index < last ? 'Next' : 'Get started'}
          onPress={onCta}
          icon={<Icon name="chevron-right" size={18} color={t.onGold} strokeWidth={2.6} />}
        />
      </View>
    </View>
  );
}

/* ---------- slide shell (focus fade/slide on scroll) ---------- */

function SlideView({
  slide,
  index,
  scrollX,
  width,
  t,
}: {
  slide: Slide;
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  t: ThemeT;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollX.value, inputRange, [34, 0, 34], Extrapolation.CLAMP) }],
  }));
  const visualStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, inputRange, [0, 1, 0], Extrapolation.CLAMP),
    // gentle parallax: visual drifts slower than the page
    transform: [
      { translateX: interpolate(scrollX.value, inputRange, [width * 0.18, 0, -width * 0.18], Extrapolation.CLAMP) },
      { scale: interpolate(scrollX.value, inputRange, [0.9, 1, 0.9], Extrapolation.CLAMP) },
    ],
  }));

  const { Visual } = slide;
  const isHero = slide.key === 'hero';

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.visualWrap, visualStyle]}>
        <Visual t={t} />
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle]}>
        <Text style={[styles.eyebrow, { color: t.accent, fontFamily: fonts.mono }]}>{slide.eyebrow}</Text>
        {isHero ? (
          <Text style={[styles.heroTitle, { color: t.ink, fontFamily: fonts.display }]}>
            Color<Text style={{ color: t.accent }}>Closet</Text>
          </Text>
        ) : (
          <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>{slide.title}</Text>
        )}
        <Text style={[styles.body, { color: t.muted, fontFamily: fonts.uiRegular }]}>{slide.body}</Text>
      </Animated.View>
    </View>
  );
}

function Dot({
  index,
  scrollX,
  width,
  t,
}: {
  index: number;
  scrollX: SharedValue<number>;
  width: number;
  t: ThemeT;
}) {
  const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
  const style = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, inputRange, [7, 22, 7], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[styles.dot, { backgroundColor: t.accent }, style]} />;
}

/* ---------- per-slide hero visuals (reuse the real design system) ---------- */

function HeroVisual({ t }: { t: ThemeT }) {
  const bob = useSharedValue(0);
  bob.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }), -1, true);
  const glow = useAnimatedStyle(() => ({
    opacity: interpolate(bob.value, [0, 1], [0.5, 0.9]),
    transform: [{ scale: interpolate(bob.value, [0, 1], [0.96, 1.06]) }],
  }));
  const float = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bob.value, [0, 1], [4, -4]) }],
  }));
  const swatches: string[] = ['Navy', 'Burgundy', 'Forest Green', 'Mustard', 'Beige', 'Light Blue', 'Charcoal'];
  return (
    <View style={styles.hero}>
      <View style={styles.heroLogoWrap}>
        <Animated.View style={[styles.heroGlow, { backgroundColor: t.gold }, glow]} />
        <Logo size={104} />
      </View>
      <Animated.View style={[styles.heroSwatches, float]}>
        {swatches.map((k, i) => (
          <View
            key={k}
            style={[
              styles.heroSwatch,
              {
                backgroundColor: shadeHex(k, null),
                borderColor: t.line2,
                transform: [{ translateY: i % 2 === 0 ? -6 : 6 }, { rotate: `${(i - 3) * 4}deg` }],
              },
            ]}
          />
        ))}
      </Animated.View>
    </View>
  );
}

function DeckVisual({ t }: { t: ThemeT }) {
  return (
    <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.line }]}>
      <Text style={[styles.cardCat, { color: t.accent, fontFamily: fonts.mono }]}>CLASSIC</Text>
      <Text style={[styles.cardName, { color: t.ink, fontFamily: fonts.display }]}>Quiet Confidence</Text>
      <View style={styles.cardSils}>
        <Garment t={t} base="Light Blue" sub="SHIRT" />
        <Text style={[styles.plus, { color: t.faint, fontFamily: fonts.display }]}>+</Text>
        <Garment t={t} base="Navy" sub="TROUSERS" />
      </View>
    </View>
  );
}

function Garment({ t, base, sub }: { t: ThemeT; base: string; sub: string }) {
  return (
    <View style={styles.garment}>
      <View style={styles.garmentBox}>
        <GarmentSilhouette kind={sub === 'SHIRT' ? 'top' : 'bottom'} color={shadeHex(base, null)} duration={650} />
      </View>
      <Text style={[styles.garmentLab, { color: t.ink, fontFamily: fonts.uiBold }]}>{base}</Text>
      <Text style={[styles.garmentSub, { color: t.muted, fontFamily: fonts.mono }]}>{sub}</Text>
    </View>
  );
}

function WardrobeVisual({ t }: { t: ThemeT }) {
  const tiles: { label: string; top: string; bottom: string }[] = [
    { label: 'Men · Formal', top: 'White', bottom: 'Navy' },
    { label: 'Men · Casual', top: 'Olive', bottom: 'Khaki' },
    { label: 'Women · Formal', top: 'Burgundy', bottom: 'Charcoal' },
    { label: 'Women · Casual', top: 'Light Blue', bottom: 'Beige' },
  ];
  return (
    <View style={styles.grid}>
      {tiles.map((tile) => (
        <View key={tile.label} style={[styles.tile, { backgroundColor: t.glass, borderColor: t.line }]}>
          <View style={[styles.tilePair, { borderColor: t.line2 }]}>
            <View style={{ flex: 1, backgroundColor: shadeHex(tile.top, null) }} />
            <View style={{ flex: 1, backgroundColor: shadeHex(tile.bottom, null) }} />
          </View>
          <Text style={[styles.tileLab, { color: t.ink, fontFamily: fonts.uiSemi }]}>{tile.label}</Text>
        </View>
      ))}
    </View>
  );
}

function SkinVisual({ t }: { t: ThemeT }) {
  const selected = 5; // mst 5 — a mid Medium tone, for the demo
  return (
    <View style={styles.skinWrap}>
      <View style={styles.skinRow}>
        {MST_SWATCHES.map((sw, i) => {
          const on = i + 1 === selected;
          return (
            <View
              key={sw.mst}
              style={[
                styles.mst,
                { backgroundColor: sw.hex, borderColor: on ? t.accent : t.line2, borderWidth: on ? 2.5 : 1 },
              ]}
            >
              {on && (
                <View style={[styles.mstCheck, { backgroundColor: t.accent }]}>
                  <Icon name="check" size={9} color={t.onGold} strokeWidth={3} />
                </View>
              )}
            </View>
          );
        })}
      </View>
      <Text style={[styles.skinCap, { color: t.muted, fontFamily: fonts.mono }]}>
        {tierOf(selected).toUpperCase()} TONES
      </Text>
    </View>
  );
}

function ScienceVisual({ t }: { t: ThemeT }) {
  return (
    <View style={[styles.sources, { borderColor: t.line }]}>
      {SOURCES.slice(0, 5).map((s) => {
        // Drop the parenthetical attribution for the teaser (the full credit lives in the
        // "Colour science" panel) so long names like the Monk Skin Tone scale fit on one line.
        const label = s.name.replace(/\s*\([^)]*\)/g, '').trim();
        return (
          <View key={s.name} style={styles.sourceRow}>
            <View style={[styles.sourceDot, { backgroundColor: t.accent }]} />
            <Text numberOfLines={1} style={[styles.sourceName, { color: t.ink, fontFamily: fonts.displaySemi }]}>
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8, height: 44 },
  skip: { paddingVertical: 6, paddingHorizontal: 6 },
  skipTxt: { fontSize: 14 },

  slide: { flex: 1, paddingHorizontal: 30, justifyContent: 'center' },
  visualWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', maxHeight: 340 },
  textWrap: { paddingBottom: 8 },
  eyebrow: { fontSize: 11, letterSpacing: 2.4, marginBottom: 12 },
  heroTitle: { fontSize: 40, letterSpacing: -0.6, marginBottom: 14 },
  title: { fontSize: 30, lineHeight: 36, letterSpacing: -0.4, marginBottom: 14 },
  body: { fontSize: 14.5, lineHeight: 22, maxWidth: 360 },

  footer: { paddingHorizontal: 30, paddingTop: 12, gap: 20 },
  dots: { flexDirection: 'row', gap: 7, alignSelf: 'center' },
  dot: { height: 7, borderRadius: 99 },

  /* hero */
  hero: { alignItems: 'center', gap: 30 },
  // Fixed to the glow's size so the absolutely-positioned glow fills the wrap and stays
  // centred behind the (smaller) logo — without it the wrap shrank to the logo and the
  // glow pinned to the top-left, sitting off-centre.
  heroLogoWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  heroGlow: { position: 'absolute', width: 150, height: 150, borderRadius: 80, opacity: 0.5 },
  heroSwatches: { flexDirection: 'row', gap: 8, marginTop: 6 },
  heroSwatch: { width: 30, height: 42, borderRadius: 8, borderWidth: 1 },

  /* deck card */
  card: { width: 280, borderRadius: 24, borderWidth: 1, paddingTop: 16, paddingBottom: 18, paddingHorizontal: 14, alignItems: 'center' },
  cardCat: { fontSize: 10, letterSpacing: 2, marginBottom: 5 },
  cardName: { fontSize: 22, marginBottom: 6 },
  cardSils: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center', gap: 8, width: '100%' },
  garment: { width: 104, alignItems: 'center' },
  garmentBox: { width: '100%', height: 150, justifyContent: 'flex-end', overflow: 'hidden' },
  garmentLab: { marginTop: 6, fontSize: 12 },
  garmentSub: { fontSize: 8, letterSpacing: 0.8, marginTop: 2 },
  plus: { fontSize: 20, alignSelf: 'center', marginTop: 56 },

  /* wardrobe grid */
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, maxWidth: 300 },
  tile: { width: 132, borderRadius: 16, borderWidth: 1, padding: 12, alignItems: 'center', gap: 10 },
  tilePair: { width: 64, height: 64, borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
  tileLab: { fontSize: 11.5 },

  /* skin */
  skinWrap: { alignItems: 'center', gap: 18 },
  skinRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 9, maxWidth: 320 },
  mst: { width: 40, height: 40, borderRadius: 20 },
  mstCheck: { position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  skinCap: { fontSize: 11, letterSpacing: 1.6 },

  /* sources */
  sources: { borderLeftWidth: 2, paddingLeft: 18, gap: 16 },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sourceDot: { width: 7, height: 7, borderRadius: 4, transform: [{ rotate: '45deg' }] },
  sourceName: { fontSize: 16 },
});
