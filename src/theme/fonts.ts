/**
 * Font role map. We import the specific weight files directly (instead of
 * importing from the package roots) so Metro bundles ONLY the cuts we use —
 * the root imports drag in all ~40 weights and bloat the APK by several MB.
 *
 * Fraunces is variable; the package ships static named cuts, so we accept the
 * loss of CSS `font-optical-sizing:auto` (negligible at our display sizes).
 */
import Fraunces_400Regular from '@expo-google-fonts/fraunces/400Regular/Fraunces_400Regular.ttf';
import Fraunces_500Medium from '@expo-google-fonts/fraunces/500Medium/Fraunces_500Medium.ttf';
import Fraunces_500Medium_Italic from '@expo-google-fonts/fraunces/500Medium_Italic/Fraunces_500Medium_Italic.ttf';
import Fraunces_600SemiBold from '@expo-google-fonts/fraunces/600SemiBold/Fraunces_600SemiBold.ttf';
import PlusJakartaSans_400Regular from '@expo-google-fonts/plus-jakarta-sans/400Regular/PlusJakartaSans_400Regular.ttf';
import PlusJakartaSans_500Medium from '@expo-google-fonts/plus-jakarta-sans/500Medium/PlusJakartaSans_500Medium.ttf';
import PlusJakartaSans_600SemiBold from '@expo-google-fonts/plus-jakarta-sans/600SemiBold/PlusJakartaSans_600SemiBold.ttf';
import PlusJakartaSans_700Bold from '@expo-google-fonts/plus-jakarta-sans/700Bold/PlusJakartaSans_700Bold.ttf';
import SpaceMono_400Regular from '@expo-google-fonts/space-mono/400Regular/SpaceMono_400Regular.ttf';
import SpaceMono_700Bold from '@expo-google-fonts/space-mono/700Bold/SpaceMono_700Bold.ttf';

/** Pass to `useFonts(...)` in the root layout. Keys are the font family names. */
export const fontMap = {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  SpaceMono_400Regular,
  SpaceMono_700Bold,
};

/** Reference fonts by role, never by raw name. */
export const fonts = {
  display: 'Fraunces_500Medium',
  displayRegular: 'Fraunces_400Regular',
  displaySemi: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  ui: 'PlusJakartaSans_500Medium',
  uiRegular: 'PlusJakartaSans_400Regular',
  uiSemi: 'PlusJakartaSans_600SemiBold',
  uiBold: 'PlusJakartaSans_700Bold',
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;
