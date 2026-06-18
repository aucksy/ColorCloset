/**
 * Font role map. Fraunces is a variable font; the @expo-google-fonts package
 * exposes static named cuts, so we load the weights actually used and accept the
 * loss of CSS `font-optical-sizing:auto` (negligible at our display sizes).
 */
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';

/** Pass to `useFonts(...)` in the root layout. */
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
