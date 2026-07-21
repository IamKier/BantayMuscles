import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { exportData, importData } from '@/hooks/use-store';
import { useTheme } from '@/hooks/use-theme';

function ImportSheet({ onClose }: { onClose: () => void }) {
  const theme = useTheme();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function pasteFromClipboard() {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setValue(text);
      setError(null);
    }
  }

  async function chooseFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', 'text/plain', '*/*'],
        copyToCacheDirectory: true,
      });
      const asset = result.assets?.[0];
      if (result.canceled || !asset) return;
      // Read the picked file. fetch handles the cache file:// URI without
      // depending on the version-specific expo-file-system API.
      const text = await (await fetch(asset.uri)).text();
      setValue(text);
      setError(null);
    } catch {
      setError('Couldn’t read that file. Try paste instead.');
    }
  }

  function confirm() {
    if (importData(value)) {
      onClose();
      Alert.alert('Restored', 'Your backup has been imported.');
    } else {
      setError('That doesn’t look like a valid BantayMuscles backup.');
    }
  }

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <ThemedView style={[styles.sheet, { borderColor: theme.border }]}>
        <View style={[styles.grabber, { backgroundColor: theme.track }]} />
        <ThemedText style={styles.sheetTitle}>Import backup</ThemedText>
        <ThemedText type="small" themeColor="danger">
          This replaces everything currently on this device.
        </ThemedText>

        <View style={styles.sourceRow}>
          <Pressable
            onPress={chooseFile}
            style={[styles.pasteButton, { borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="Choose a backup file"
            android_ripple={{ color: theme.backgroundSelected }}>
            <Ionicons name="document-outline" size={16} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Choose file
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={pasteFromClipboard}
            style={[styles.pasteButton, { borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="Paste from clipboard"
            android_ripple={{ color: theme.backgroundSelected }}>
            <Ionicons name="clipboard-outline" size={16} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Paste
            </ThemedText>
          </Pressable>
        </View>

        <TextInput
          value={value}
          onChangeText={(text) => {
            setValue(text);
            if (error) setError(null);
          }}
          placeholder="Paste backup text here"
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[
            styles.input,
            { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
          ]}
        />

        {error ? (
          <ThemedText type="small" themeColor="danger">
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={confirm}
          disabled={!value.trim()}
          style={[styles.button, { backgroundColor: theme.accent, opacity: value.trim() ? 1 : 0.5 }]}
          accessibilityRole="button"
          android_ripple={{ color: '#00000022' }}>
          <ThemedText style={styles.buttonText}>Restore</ThemedText>
        </Pressable>
      </ThemedView>
    </Modal>
  );
}

/** Copy-out / paste-in backup, since data is device-local with no account. */
export function BackupCard() {
  const theme = useTheme();
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    await Clipboard.setStringAsync(JSON.stringify(exportData()));
    Alert.alert(
      'Backup copied',
      'Your data is on the clipboard as text. Paste it somewhere safe — a note to yourself, an email, or a file.'
    );
  }

  return (
    <>
      <Card>
        <ThemedText style={styles.cardTitle}>Backup</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Your diary lives on this device only. Copy a backup before switching phones or clearing
          the app.
        </ThemedText>

        <View style={styles.row}>
          <Pressable
            onPress={handleExport}
            style={[styles.action, { borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="Export backup"
            android_ripple={{ color: theme.backgroundSelected }}>
            <Ionicons name="download-outline" size={18} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Export
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => setImporting(true)}
            style={[styles.action, { borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel="Import backup"
            android_ripple={{ color: theme.backgroundSelected }}>
            <Ionicons name="cloud-upload-outline" size={18} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Import
            </ThemedText>
          </Pressable>
        </View>
      </Card>

      {importing && <ImportSheet onClose={() => setImporting(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  action: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 46,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000080',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  grabber: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  sourceRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  pasteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    height: 44,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: Spacing.three,
    minHeight: 90,
    maxHeight: 160,
    fontSize: 13,
    textAlignVertical: 'top',
  },
  button: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonText: {
    color: '#04120A',
    fontSize: 16,
    fontWeight: '700',
  },
});
