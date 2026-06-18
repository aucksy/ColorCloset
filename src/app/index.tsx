import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';

/** Onboarding gate: a returning user with a finished setup skips straight to the app. */
export default function Index() {
  const setupComplete = useStore((s) => s.setupComplete);
  const hasWardrobe = useStore((s) => s.tops.length > 0 && s.bottoms.length > 0);
  const done = setupComplete && hasWardrobe;
  return <Redirect href={done ? '/main' : '/onboarding'} />;
}
