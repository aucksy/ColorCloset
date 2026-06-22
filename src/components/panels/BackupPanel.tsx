import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PanelShell } from '@/components/PanelShell';
import { agoStr } from '@/lib/date';
import {
  backupToDrive,
  getCurrentDriveUser,
  isDriveConfigured,
  restoreFromDrive,
  signInToDrive,
  signOutDrive,
} from '@/lib/drive';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

type Busy = null | 'signin' | 'backup' | 'restore';

/** Back up the wardrobe to Google Drive (or to a text backup) and restore either. */
export function BackupPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const showToast = useUiStore((s) => s.showToast);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const drive = useStore((s) => s.drive);
  const setDriveEmail = useStore((s) => s.setDriveEmail);
  const setDriveLastBackup = useStore((s) => s.setDriveLastBackup);
  const setDriveAuto = useStore((s) => s.setDriveAuto);

  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState<Busy>(null);
  const configured = isDriveConfigured();

  // Reconcile the stored email with the live Google session on open.
  useEffect(() => {
    if (!configured) return;
    getCurrentDriveUser().then((email) => {
      if (email !== drive.email) setDriveEmail(email);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doBackup = async () => {
    setBusy('backup');
    try {
      const iso = await backupToDrive(exportData());
      setDriveLastBackup(iso);
      showToast('Backed up to Google Drive');
    } catch (e: any) {
      showToast(e?.message ?? "Backup didn't complete");
    } finally {
      setBusy(null);
    }
  };

  const onConnect = async () => {
    setBusy('signin');
    try {
      const email = await signInToDrive();
      if (!email) {
        setBusy(null);
        return; // cancelled
      }
      setDriveEmail(email);
      setDriveAuto(true); // connecting opts you into auto-backup by default (toggle off below)
      // First connect = immediate backup so there's something to restore.
      const iso = await backupToDrive(exportData());
      setDriveLastBackup(iso);
      showToast('Connected — backed up to Drive');
    } catch (e: any) {
      showToast(e?.message ?? "Couldn't connect to Google Drive");
    } finally {
      setBusy(null);
    }
  };

  const onRestore = async () => {
    setBusy('restore');
    try {
      const json = await restoreFromDrive();
      if (!json) {
        showToast('No backup found in Drive yet');
      } else if (importData(json)) {
        showToast('Wardrobe restored from Drive');
        closePanel();
      } else {
        showToast('That Drive backup looked corrupted');
      }
    } catch (e: any) {
      showToast(e?.message ?? "Restore didn't complete");
    } finally {
      setBusy(null);
    }
  };

  const onSignOut = async () => {
    await signOutDrive();
    setDriveEmail(null);
    showToast('Signed out of Google Drive');
  };

  const onExportText = async () => {
    try {
      await Share.share({ message: exportData() });
    } catch {
      showToast("Couldn't open the share sheet");
    }
  };
  const onImportText = () => {
    if (importData(paste.trim())) {
      setPaste('');
      showToast('Wardrobe restored');
      closePanel();
    } else {
      showToast('That backup didn’t look right');
    }
  };

  const anyBusy = busy !== null;

  return (
    <PanelShell title="Backup & restore" onClose={closePanel}>
      <Text style={[styles.p, { color: t.muted, fontFamily: fonts.uiRegular }]}>
        Your wardrobe lives only on this phone. Back it up to Google Drive so you can restore it on a
        new phone or after reinstalling.
      </Text>

      {/* ---------- Google Drive ---------- */}
      <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>GOOGLE DRIVE</Text>

      {!configured ? (
        <View style={[styles.card, { backgroundColor: t.glass, borderColor: t.line }]}>
          <Text style={[styles.cardTxt, { color: t.muted, fontFamily: fonts.uiRegular }]}>
            Google Drive backup isn’t enabled in this build yet. The plain-text backup below works
            today.
          </Text>
        </View>
      ) : drive.email ? (
        <View style={[styles.card, { backgroundColor: t.glass, borderColor: t.line }]}>
          <View style={styles.acct}>
            <View style={[styles.dot, { backgroundColor: t.accent }]}>
              <Icon name="cloud" size={16} color={t.onGold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.acctEmail, { color: t.ink, fontFamily: fonts.uiSemi }]} numberOfLines={1}>
                {drive.email}
              </Text>
              <Text style={[styles.acctSub, { color: t.faint, fontFamily: fonts.uiRegular }]}>
                {drive.lastBackup ? `Last backup ${agoStr(drive.lastBackup)}` : 'Not backed up yet'}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onSignOut} disabled={anyBusy} hitSlop={8} style={styles.signout}>
              <Icon name="logout" size={18} color={t.muted} />
            </Pressable>
          </View>

          <View style={{ height: 14 }} />
          <Button
            title={busy === 'backup' ? 'Backing up…' : 'Back up now'}
            onPress={doBackup}
            disabled={anyBusy}
            icon={busy === 'backup' ? <ActivityIndicator size="small" color={t.onGold} /> : <Icon name="cloud" size={18} color={t.onGold} />}
          />
          <View style={{ height: 10 }} />
          <Button
            title={busy === 'restore' ? 'Restoring…' : 'Restore from Drive'}
            variant="goldline"
            onPress={onRestore}
            disabled={anyBusy}
            icon={busy === 'restore' ? <ActivityIndicator size="small" color={t.goldSoft} /> : <Icon name="download" size={18} color={t.goldSoft} />}
          />

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: drive.auto }}
            onPress={() => setDriveAuto(!drive.auto)}
            disabled={anyBusy}
            style={[styles.autoRow, { borderTopColor: t.line }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.autoTitle, { color: t.ink, fontFamily: fonts.ui }]}>Auto-back up</Text>
              <Text style={[styles.autoSub, { color: t.faint, fontFamily: fonts.uiRegular }]}>
                After you change colours, mark worn or save a look.
              </Text>
            </View>
            <View style={[styles.switch, { backgroundColor: drive.auto ? t.accent : t.track }]}>
              <View style={[styles.knob, { left: drive.auto ? 21 : 3 }]} />
            </View>
          </Pressable>
        </View>
      ) : (
        <>
          <Button
            title={busy === 'signin' ? 'Connecting…' : 'Connect Google Drive'}
            onPress={onConnect}
            disabled={anyBusy}
            icon={busy === 'signin' ? <ActivityIndicator size="small" color={t.onGold} /> : <Icon name="cloud" size={18} color={t.onGold} />}
          />
          <Text style={[styles.hint, { color: t.faint, fontFamily: fonts.uiRegular }]}>
            Signs in once and saves a single backup file to your Drive. ColorCloset can only see that
            one file — nothing else in your Drive.
          </Text>
        </>
      )}

      {/* ---------- Plain text ---------- */}
      <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>OR — PLAIN TEXT</Text>
      <Button title="Export as text" variant="goldline" onPress={onExportText} disabled={anyBusy} icon={<Icon name="download" size={18} color={t.goldSoft} />} />
      <Text style={[styles.hint, { color: t.faint, fontFamily: fonts.uiRegular }]}>
        Shares a text backup — save it to your notes, email or cloud drive.
      </Text>

      <TextInput
        value={paste}
        onChangeText={setPaste}
        multiline
        placeholder="…or paste a text backup here to restore"
        placeholderTextColor={t.faint}
        style={[styles.input, { backgroundColor: t.glass, borderColor: t.line, color: t.ink, fontFamily: fonts.mono }]}
      />
      <View style={{ marginTop: 12 }}>
        <Button title="Restore from text" variant="goldline" onPress={onImportText} disabled={!paste.trim() || anyBusy} />
      </View>
      <Text style={[styles.warn, { color: t.faint, fontFamily: fonts.uiRegular }]}>
        Restoring replaces your current colours, worn history and saved looks.
      </Text>
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 10, letterSpacing: 1.6, marginTop: 26, marginBottom: 10 },
  hint: { fontSize: 11.5, lineHeight: 17, marginTop: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  cardTxt: { fontSize: 12.5, lineHeight: 19 },
  acct: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dot: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  acctEmail: { fontSize: 14 },
  acctSub: { fontSize: 11.5, marginTop: 2 },
  signout: { padding: 4 },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, paddingTop: 14, borderTopWidth: 1 },
  autoTitle: { fontSize: 14 },
  autoSub: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  switch: { width: 42, height: 24, borderRadius: 99, justifyContent: 'center' },
  knob: { position: 'absolute', top: 3, width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  input: { minHeight: 96, borderWidth: 1, borderRadius: 14, padding: 13, fontSize: 11.5, textAlignVertical: 'top', marginTop: 16 },
  warn: { fontSize: 11.5, lineHeight: 17, marginTop: 12 },
});
