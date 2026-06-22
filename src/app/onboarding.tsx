import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GENDERS, GENDER_LABEL, comboUniverse, skinNote, skinObj, type Gender, type Mode } from '@/engine';
import { BuildingOverlay } from '@/components/BuildingOverlay';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { SkinGrid } from '@/components/SkinGrid';
import { SwatchGrid } from '@/components/SwatchGrid';
import { useActiveWardrobe, useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { isDriveConfigured, restoreFromDrive, signInToDrive } from '@/lib/drive';
import { syncReminders } from '@/lib/notify';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

type StepId = 'gender' | 'skin' | 'tops' | 'bottoms';

export default function Onboarding() {
  const t = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string; genderOnly?: string }>();
  const addMode = params.mode === 'add'; // launched from "Add more colours" — active bucket, no gender/skin

  const gender = useStore((s) => s.gender);
  const mode = useStore((s) => s.mode);
  const mst = useStore((s) => s.mst);
  const setupComplete = useStore((s) => s.setupComplete);
  const setGender = useStore((s) => s.setGender);
  const setMst = useStore((s) => s.setMst);
  const completeSetup = useStore((s) => s.completeSetup);
  const regenerate = useStore((s) => s.regenerate);

  // A migrated v5 user has finished setup but never chose a gender — show only the gender step.
  const genderOnly = params.genderOnly === '1' || (setupComplete && gender == null);

  // The step sequence for this flow.
  const steps: StepId[] = useMemo<StepId[]>(() => {
    if (genderOnly) return ['gender'];
    if (addMode) return ['tops', 'bottoms'];
    return ['gender', 'skin', 'tops', 'bottoms'];
  }, [genderOnly, addMode]);
  const totalSteps = steps.length;

  const [step, setStep] = useState(0);
  const [building, setBuilding] = useState(false);
  const [restoreOpen, setRestoreOpen] = useState(false);
  // Local gender choice — committed to the store only on Continue, so pendingWardrobe lands once.
  const [genderChoice, setGenderChoice] = useState<Gender | null>(gender);

  const w = useActiveWardrobe();

  // Universe size before any edits this session — drives the "+N new" delta in add mode.
  const [beforeTotal] = useState(() => comboUniverse(w.tops, w.bottoms, skinObj(mst), gender ?? undefined, mode).length);
  const total = useMemo(
    () => comboUniverse(w.tops, w.bottoms, skinObj(mst), gender ?? undefined, mode).length,
    [w.tops, w.bottoms, mst, gender, mode]
  );

  const current = steps[step];

  // Android back: step back through the flow; on the first step exit to main (add/genderOnly).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (building) return true;
      if (step > 0) { setStep(step - 1); return true; }
      if (addMode || genderOnly) { router.back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [step, building, addMode, genderOnly, router]);

  const back = () => {
    if (step > 0) setStep(step - 1);
    else if (addMode || genderOnly) router.back();
  };

  // Advance the gender step: commit the choice so the active bucket exists for tops/bottoms.
  const onGenderContinue = () => {
    if (!genderChoice) return;
    setGender(genderChoice);
    if (genderOnly) { router.replace('/main'); return; }
    setStep(step + 1);
  };

  const finish = () => setBuilding(true);
  const onBuilt = () => {
    if (!addMode) {
      completeSetup();
      // Ask for notification permission and arm the (on-by-default) daily reminder.
      // Fire-and-forget so the system dialog pops over the main screen, not the overlay.
      syncReminders(useStore.getState().notify).then((ok) => {
        if (!ok) useStore.getState().setNotify({ enabled: false });
      });
    }
    regenerate();
    if (addMode) router.back();
    else router.replace('/main');
  };

  const eyebrow = `Step ${step + 1} of ${totalSteps}`;
  const canBack = step > 0 || addMode || genderOnly;
  const isLast = step === totalSteps - 1;

  return (
    <View style={[styles.root, { backgroundColor: t.bg, paddingTop: insets.top }]}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={(addMode || genderOnly) && step === 0 ? 'Close' : 'Back'}
          onPress={back}
          style={[styles.back, { opacity: canBack ? 1 : 0 }]}
          disabled={!canBack}
        >
          <Icon name="chevron-left" size={15} color={t.muted} />
          <Text style={[styles.backTxt, { color: t.muted, fontFamily: fonts.ui }]}>
            {(addMode || genderOnly) && step === 0 ? 'Close' : 'Back'}
          </Text>
        </Pressable>
        <View style={styles.dots}>
          {Array.from({ length: totalSteps }).map((_, nm) => (
            <View key={nm} style={[styles.dot, { backgroundColor: nm <= step ? t.accent : t.track, width: nm === step ? 22 : 7 }]} />
          ))}
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={step} entering={FadeInDown.duration(420)}>
          <Text style={[styles.eyebrow, { color: t.accent, fontFamily: fonts.mono }]}>{eyebrow.toUpperCase()}</Text>

          {current === 'gender' && (
            <>
              <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>
                Who are we <Text style={{ color: t.accent, fontFamily: fonts.displayItalic }}>dressing?</Text>
              </Text>
              <Lead t={t}>This shapes the curated combinations we build for you. You can keep separate formal and casual wardrobes later.</Lead>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => {
                  const on = genderChoice === g;
                  return (
                    <Pressable
                      key={g}
                      accessibilityRole="button"
                      accessibilityLabel={GENDER_LABEL[g]}
                      accessibilityState={{ selected: on }}
                      onPress={() => setGenderChoice(g)}
                      style={({ pressed }) => [
                        styles.genderCard,
                        {
                          backgroundColor: on ? t.glass2 : t.glass,
                          borderColor: on ? t.accent : t.line2,
                          borderWidth: on ? 2 : 1,
                          transform: [{ scale: pressed ? 0.98 : 1 }],
                        },
                      ]}
                    >
                      <Text style={[styles.genderInitial, { color: on ? t.accent : t.faint, fontFamily: fonts.displayItalic }]}>
                        {GENDER_LABEL[g].charAt(0)}
                      </Text>
                      <Text style={[styles.genderLabel, { color: on ? t.ink : t.muted, fontFamily: fonts.uiSemi }]}>
                        {GENDER_LABEL[g]}
                      </Text>
                      {on && (
                        <View style={[styles.genderCheck, { backgroundColor: t.accent }]}>
                          <Icon name="check" size={12} color={t.onGold} strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Already set up? Restore a backup"
                onPress={() => setRestoreOpen(true)}
                hitSlop={8}
                style={styles.restoreLink}
              >
                <Text style={[styles.restoreLinkTxt, { color: t.muted, fontFamily: fonts.uiRegular }]}>
                  Already set up?{' '}
                  <Text style={{ color: t.accent, fontFamily: fonts.uiSemi }}>Restore a backup</Text>
                </Text>
              </Pressable>
            </>
          )}

          {current === 'skin' && (
            <>
              <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>
                Now, your <Text style={{ color: t.accent, fontFamily: fonts.displayItalic }}>skin tone.</Text>
              </Text>
              <Lead t={t}>Pick the swatch closest to yours — we use it gently to nudge what flatters you. It never rules a colour out.</Lead>
              <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>PICK YOUR TONE</Text>
              <SkinGrid value={mst} onSelect={setMst} />
              {mst != null && (
                <Text style={[styles.note, { color: t.muted, borderLeftColor: t.accent, fontFamily: fonts.uiRegular }]}>
                  {skinNote(mst)}
                </Text>
              )}
            </>
          )}

          {current === 'tops' && (
            <WardrobeStep
              t={t}
              slot="tops"
              title={addMode ? 'Add tops.' : 'Your tops.'}
              lead="Tap every colour you own — pick more than one shade per colour if you like."
            />
          )}

          {current === 'bottoms' && (
            <WardrobeStep
              t={t}
              slot="bottoms"
              title={addMode ? 'Add bottoms.' : 'Now your bottoms.'}
              lead="Your trousers, jeans and chinos — tap the colours you own."
            />
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.foot, { paddingBottom: insets.bottom + 18 }]}>
        {current === 'gender' && (
          <Button
            title="Continue"
            onPress={onGenderContinue}
            disabled={!genderChoice}
            icon={<Icon name="chevron-right" size={18} color={t.onGold} />}
          />
        )}
        {current === 'skin' && (
          <Button
            title="Continue"
            onPress={() => setStep(step + 1)}
            disabled={mst == null}
            icon={<Icon name="chevron-right" size={18} color={t.onGold} />}
          />
        )}
        {current === 'tops' && (
          <Button
            title="Continue"
            onPress={() => setStep(step + 1)}
            disabled={w.tops.length === 0}
            icon={<Icon name="chevron-right" size={18} color={t.onGold} />}
          />
        )}
        {current === 'bottoms' && (
          <Button
            title={addMode ? 'Update my combinations' : 'See my combinations'}
            onPress={finish}
            disabled={w.bottoms.length === 0}
            icon={<Icon name="chevron-right" size={18} color={t.onGold} />}
          />
        )}
      </View>

      {building && <BuildingOverlay total={total} addedFrom={addMode ? beforeTotal : undefined} onDone={onBuilt} />}

      <RestoreSheet
        t={t}
        visible={restoreOpen}
        onClose={() => setRestoreOpen(false)}
        onRestored={() => {
          setRestoreOpen(false);
          router.replace('/main');
        }}
      />
    </View>
  );
}

type ThemeT = ReturnType<typeof useTheme>;

function WardrobeStep({ t, slot, title, lead }: { t: ThemeT; slot: 'tops' | 'bottoms'; title: string; lead: string }) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const modeLabel = mode === 'formal' ? 'Formal' : 'Casual';
  return (
    <>
      <Text style={[styles.title, { color: t.ink, fontFamily: fonts.display }]}>{title}</Text>
      <Lead t={t}>{lead}</Lead>

      <ModeToggle t={t} mode={mode} onChange={setMode} />
      <Text style={[styles.modeHint, { color: t.faint, fontFamily: fonts.uiRegular }]}>
        Adding to your <Text style={{ color: t.muted, fontFamily: fonts.uiSemi }}>{modeLabel}</Text> wardrobe
      </Text>

      <View style={{ marginTop: 18 }}>
        <SwatchGrid slot={slot} />
      </View>
    </>
  );
}

/** Small segmented Formal/Casual control that drives the active wardrobe bucket. */
function ModeToggle({ t, mode, onChange }: { t: ThemeT; mode: Mode; onChange: (m: Mode) => void }) {
  const opts: { key: Mode; label: string }[] = [
    { key: 'formal', label: 'Formal' },
    { key: 'casual', label: 'Casual' },
  ];
  return (
    <View style={[styles.modeToggle, { backgroundColor: t.glass, borderColor: t.line2 }]}>
      {opts.map((o) => {
        const on = mode === o.key;
        return (
          <Pressable
            key={o.key}
            accessibilityRole="button"
            accessibilityLabel={`${o.label} wardrobe`}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.key)}
            style={[styles.modeSeg, on && { backgroundColor: t.glass2, borderColor: t.accent }]}
          >
            <Text style={[styles.modeSegTxt, { color: on ? t.ink : t.muted, fontFamily: on ? fonts.uiSemi : fonts.ui }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type RestoreBusy = null | 'drive' | 'text';

/** A small Modal sheet that lets a returning user restore from Drive or a pasted text backup. */
function RestoreSheet({
  t,
  visible,
  onClose,
  onRestored,
}: {
  t: ThemeT;
  visible: boolean;
  onClose: () => void;
  onRestored: () => void;
}) {
  const importData = useStore((s) => s.importData);
  const setDriveEmail = useStore((s) => s.setDriveEmail);
  const setDriveAuto = useStore((s) => s.setDriveAuto);
  const showToast = useUiStore((s) => s.showToast);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState<RestoreBusy>(null);
  const driveOn = isDriveConfigured();
  const anyBusy = busy !== null;

  const onDrive = async () => {
    setBusy('drive');
    try {
      const email = await signInToDrive();
      if (!email) {
        setBusy(null);
        return; // cancelled
      }
      // Logged in during onboarding → remember the account and turn auto-backup on by default.
      setDriveEmail(email);
      setDriveAuto(true);
      const json = await restoreFromDrive();
      if (!json) {
        showToast('No backup found in Drive yet');
      } else if (importData(json)) {
        showToast('Wardrobe restored from Drive');
        onRestored();
        return;
      } else {
        showToast('That Drive backup looked corrupted');
      }
    } catch (e: any) {
      showToast(e?.message ?? "Restore didn't complete");
    } finally {
      setBusy(null);
    }
  };

  const onText = () => {
    if (importData(paste.trim())) {
      setPaste('');
      showToast('Wardrobe restored');
      onRestored();
    } else {
      showToast('That backup didn’t look right');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: t.surface, borderColor: t.line2 }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: t.ink, fontFamily: fonts.display }]}>Restore a backup</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={10}>
              <Icon name="x" size={18} color={t.muted} />
            </Pressable>
          </View>
          <Text style={[styles.sheetLead, { color: t.muted, fontFamily: fonts.uiRegular }]}>
            Returning, or reinstalled? Bring back your colours, worn history and saved looks.
          </Text>

          {driveOn && (
            <View style={{ marginTop: 18 }}>
              <Button
                title={busy === 'drive' ? 'Restoring…' : 'Restore from Google Drive'}
                onPress={onDrive}
                disabled={anyBusy}
                icon={
                  busy === 'drive' ? (
                    <ActivityIndicator size="small" color={t.onGold} />
                  ) : (
                    <Icon name="cloud" size={18} color={t.onGold} />
                  )
                }
              />
            </View>
          )}

          <Text style={[styles.sheetLabel, { color: t.faint, fontFamily: fonts.mono }]}>
            {driveOn ? 'OR — PASTE A TEXT BACKUP' : 'PASTE A TEXT BACKUP'}
          </Text>
          <TextInput
            value={paste}
            onChangeText={setPaste}
            multiline
            editable={!anyBusy}
            placeholder="Paste your text backup here…"
            placeholderTextColor={t.faint}
            style={[styles.sheetInput, { backgroundColor: t.glass, borderColor: t.line, color: t.ink, fontFamily: fonts.mono }]}
          />
          <View style={{ marginTop: 12 }}>
            <Button title="Restore from text" variant="goldline" onPress={onText} disabled={!paste.trim() || anyBusy} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Lead({ children, t }: { children: React.ReactNode; t: ThemeT }) {
  return <Text style={[styles.lead, { color: t.muted, fontFamily: fonts.uiRegular }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 5, width: 60 },
  backTxt: { fontSize: 13 },
  dots: { flexDirection: 'row', gap: 7 },
  dot: { height: 7, borderRadius: 99 },
  body: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 26 },
  eyebrow: { fontSize: 10, letterSpacing: 2.4, marginTop: 8 },
  title: { fontSize: 30, lineHeight: 33, marginTop: 14, marginBottom: 8, letterSpacing: -0.4 },
  lead: { fontSize: 14, lineHeight: 21, maxWidth: 340 },
  label: { fontSize: 10, letterSpacing: 1.6, marginTop: 22, marginBottom: 9 },
  note: { fontSize: 12.5, lineHeight: 19, marginTop: 18, borderLeftWidth: 2, paddingLeft: 12 },
  foot: { paddingHorizontal: 22, paddingTop: 12 },
  genderRow: { flexDirection: 'row', gap: 14, marginTop: 26 },
  genderCard: {
    flex: 1,
    borderRadius: 20,
    paddingVertical: 34,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  genderInitial: { fontSize: 38, lineHeight: 42 },
  genderLabel: { fontSize: 17, letterSpacing: 0.2 },
  genderCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreLink: { marginTop: 26, alignSelf: 'center', paddingVertical: 6 },
  restoreLinkTxt: { fontSize: 13 },
  modeToggle: {
    flexDirection: 'row',
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
    gap: 3,
    alignSelf: 'flex-start',
  },
  modeSeg: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeSegTxt: { fontSize: 13, letterSpacing: 0.2 },
  modeHint: { fontSize: 12, lineHeight: 18, marginTop: 9 },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  sheet: { borderWidth: 1, borderRadius: 22, padding: 20 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 22, letterSpacing: -0.3 },
  sheetLead: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  sheetLabel: { fontSize: 10, letterSpacing: 1.6, marginTop: 22, marginBottom: 10 },
  sheetInput: {
    minHeight: 90,
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    fontSize: 11.5,
    textAlignVertical: 'top',
  },
});
