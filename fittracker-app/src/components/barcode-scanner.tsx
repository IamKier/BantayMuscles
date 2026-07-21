import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Food } from '@/lib/nutrition';
import { lookupBarcode } from '@/lib/online-search';

type BarcodeScannerProps = {
  onClose: () => void;
  onFound: (food: Food) => void;
};

/**
 * Scans a product barcode and resolves it to a food via Open Food Facts.
 * expo-camera ships inside Expo Go, so this works with no native build.
 */
export function BarcodeScanner({ onClose, onFound }: BarcodeScannerProps) {
  const theme = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [status, setStatus] = useState<'scanning' | 'looking' | 'error'>('scanning');
  const [message, setMessage] = useState<string | null>(null);
  // Guards against the camera firing the same barcode dozens of times a second.
  const handled = useRef(false);

  async function onScanned(code: string) {
    if (handled.current) return;
    handled.current = true;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setStatus('looking');
    setMessage(null);

    const result = await lookupBarcode(code);
    if (result.ok) {
      onFound(result.food);
      return;
    }
    setStatus('error');
    setMessage(result.error);
  }

  function scanAgain() {
    handled.current = false;
    setStatus('scanning');
    setMessage(null);
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.screen}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Scan barcode</ThemedText>
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
                  Camera access is needed to scan barcodes.
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
                <CameraView
                  style={StyleSheet.absoluteFill}
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                  }}
                  onBarcodeScanned={
                    status === 'scanning' ? ({ data }) => void onScanned(data) : undefined
                  }
                />
                {/* Reticle to aim with. */}
                <View style={styles.overlay} pointerEvents="none">
                  <View style={[styles.reticle, { borderColor: theme.accent }]} />
                </View>

                {status !== 'scanning' ? (
                  <View style={styles.statusBar}>
                    {status === 'looking' ? (
                      <>
                        <ActivityIndicator color="#fff" />
                        <ThemedText type="small" style={styles.statusText}>
                          Looking it up…
                        </ThemedText>
                      </>
                    ) : (
                      <>
                        <ThemedText type="small" style={styles.statusText}>
                          {message}
                        </ThemedText>
                        <Pressable onPress={scanAgain} hitSlop={8}>
                          <ThemedText type="smallBold" style={{ color: theme.accent }}>
                            Scan again
                          </ThemedText>
                        </Pressable>
                      </>
                    )}
                  </View>
                ) : null}
              </View>
            )}
          </View>

          <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
            Point the camera at a product barcode. Packaged groceries only — values come per 100 g
            from Open Food Facts.
          </ThemedText>
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
    width: '78%',
    height: '38%',
    borderWidth: 3,
    borderRadius: 16,
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
    paddingHorizontal: Spacing.four,
    backgroundColor: '#000000B0',
  },
  statusText: {
    color: '#fff',
    flexShrink: 1,
  },
  centered: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  centeredText: {
    textAlign: 'center',
  },
  hint: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    textAlign: 'center',
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
