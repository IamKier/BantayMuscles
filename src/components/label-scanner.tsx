import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { readLabel, type LabelResult } from '@/lib/ocr';

type LabelScannerProps = {
  onClose: () => void;
  onRead: (result: LabelResult) => void;
};

/**
 * Photographs a nutrition-facts panel and reads its numbers via OCR. The capture
 * is resized and compressed first so it stays under the OCR service's free-tier
 * size limit and uploads quickly.
 */
export function LabelScanner({ onClose, onRead }: LabelScannerProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function capture() {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    setMessage(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error('capture failed');

      // Shrink + compress so the upload is small and fast.
      const shrunk = await manipulateAsync(photo.uri, [{ resize: { width: 1200 } }], {
        compress: 0.6,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (!shrunk.base64) throw new Error('encode failed');

      const outcome = await readLabel(shrunk.base64);
      if (outcome.ok) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onRead(outcome.result);
        return;
      }
      setMessage(outcome.error);
    } catch {
      setMessage('Something went wrong reading the label. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Scan nutrition label</ThemedText>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close scanner">
              <Ionicons name="close" size={26} color={theme.text} />
            </Pressable>
          </View>

          <View style={styles.cameraArea}>
            {!permission ? (
              <ActivityIndicator color={theme.accent} />
            ) : !permission.granted ? (
              <View style={styles.centered}>
                <Ionicons name="camera-outline" size={40} color={theme.textSecondary} />
                <ThemedText type="small" themeColor="textSecondary" style={styles.centeredText}>
                  Camera access is needed to read labels.
                </ThemedText>
                <Pressable
                  onPress={requestPermission}
                  style={[styles.button, { backgroundColor: theme.accent }]}
                  android_ripple={{ color: '#00000022' }}>
                  <ThemedText style={styles.buttonText}>Allow camera</ThemedText>
                </Pressable>
              </View>
            ) : (
              <View style={styles.cameraWrap}>
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} />
                <View style={styles.overlay} pointerEvents="none">
                  <View style={[styles.reticle, { borderColor: theme.accent }]} />
                </View>
                {busy ? (
                  <View style={styles.statusBar}>
                    <ActivityIndicator color="#fff" />
                    <ThemedText type="small" style={styles.statusText}>
                      Reading label…
                    </ThemedText>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {message ? (
            <ThemedText type="small" themeColor="danger" style={styles.message}>
              {message}
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              Frame the Nutrition Facts panel, hold steady, and tap the button.
            </ThemedText>
          )}

          {permission?.granted ? (
            <Pressable
              onPress={capture}
              disabled={busy}
              style={[styles.shutter, { borderColor: theme.accent, opacity: busy ? 0.5 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Capture label"
              android_ripple={{ color: theme.backgroundSelected, borderless: true, radius: 44 }}>
              <View style={[styles.shutterInner, { backgroundColor: theme.accent }]} />
            </Pressable>
          ) : null}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  cameraArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  cameraWrap: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: '82%',
    height: '58%',
    borderWidth: 3,
    borderRadius: 12,
  },
  statusBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    backgroundColor: '#000000B0',
  },
  statusText: { color: '#fff' },
  centered: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  centeredText: { textAlign: 'center' },
  message: {
    textAlign: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
  },
  shutter: {
    alignSelf: 'center',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.three,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  button: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.five,
    overflow: 'hidden',
  },
  buttonText: {
    color: '#04120A',
    fontSize: 15,
    fontWeight: '700',
  },
});
