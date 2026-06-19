import { useState } from 'react';
import { Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { PanelShell } from '@/components/PanelShell';
import { useStore } from '@/store/useStore';
import { useUiStore } from '@/store/uiStore';
import { fonts } from '@/theme/fonts';
import { useTheme } from '@/theme/useTheme';

/** Export the wardrobe as a text backup (Share sheet) or restore one by pasting it. */
export function BackupPanel() {
  const t = useTheme();
  const closePanel = useUiStore((s) => s.closePanel);
  const showToast = useUiStore((s) => s.showToast);
  const exportData = useStore((s) => s.exportData);
  const importData = useStore((s) => s.importData);
  const [paste, setPaste] = useState('');

  const onExport = async () => {
    try {
      await Share.share({ message: exportData() });
    } catch {
      showToast("Couldn't open the share sheet");
    }
  };
  const onImport = () => {
    if (importData(paste.trim())) {
      setPaste('');
      showToast('Wardrobe restored');
      closePanel();
    } else {
      showToast('That backup didn’t look right');
    }
  };

  return (
    <PanelShell title="Backup & restore" onClose={closePanel}>
      <Text style={[styles.p, { color: t.muted, fontFamily: fonts.uiRegular }]}>
        Your wardrobe lives only on this phone. Export a backup to keep it safe (or move to a new device),
        and paste one back to restore.
      </Text>

      <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>BACK UP</Text>
      <Button title="Export backup" onPress={onExport} icon={<Icon name="download" size={18} color={t.onGold} />} />
      <Text style={[styles.hint, { color: t.faint, fontFamily: fonts.uiRegular }]}>
        Shares a text backup — save it to your notes, email or cloud drive.
      </Text>

      <Text style={[styles.label, { color: t.faint, fontFamily: fonts.mono }]}>RESTORE</Text>
      <TextInput
        value={paste}
        onChangeText={setPaste}
        multiline
        placeholder="Paste your backup text here"
        placeholderTextColor={t.faint}
        style={[styles.input, { backgroundColor: t.glass, borderColor: t.line, color: t.ink, fontFamily: fonts.mono }]}
      />
      <View style={{ marginTop: 12 }}>
        <Button title="Restore from text" variant="goldline" onPress={onImport} disabled={!paste.trim()} />
      </View>
      <Text style={[styles.warn, { color: t.faint, fontFamily: fonts.uiRegular }]}>
        Restoring replaces your current colours, worn history and saved looks.
      </Text>
    </PanelShell>
  );
}

const styles = StyleSheet.create({
  p: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 10, letterSpacing: 1.6, marginTop: 24, marginBottom: 10 },
  hint: { fontSize: 11.5, lineHeight: 17, marginTop: 10 },
  input: { minHeight: 110, borderWidth: 1, borderRadius: 14, padding: 13, fontSize: 11.5, textAlignVertical: 'top' },
  warn: { fontSize: 11.5, lineHeight: 17, marginTop: 12 },
});
