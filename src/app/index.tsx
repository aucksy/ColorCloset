import { Redirect } from 'expo-router';
import { useStore } from '@/store/useStore';

/**
 * Gender-aware onboarding gate (spec §13.1).
 * - Finished setup + a gender → straight to the app. We DON'T require the ACTIVE bucket to
 *   be stocked: completing setup always stocks `${gender}-formal`, and an empty Casual
 *   bucket is meant to show main's lazy "Add casual colours" CTA — not bounce the user
 *   back through full onboarding on every cold start.
 * - Finished setup but no gender (a migrated v5 user) → a one-step gender micro-onboarding.
 * - Otherwise → full onboarding.
 */
export default function Index() {
  const gender = useStore((s) => s.gender);
  const setupComplete = useStore((s) => s.setupComplete);

  if (setupComplete && gender != null) {
    return <Redirect href="/main" />;
  }
  if (setupComplete && gender == null) {
    return <Redirect href={{ pathname: '/onboarding', params: { genderOnly: '1' } }} />;
  }
  return <Redirect href="/onboarding" />;
}
