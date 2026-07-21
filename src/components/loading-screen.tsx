import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

/**
 * In-app loading screen shown while the store hydrates. The native splash
 * (app.json) covers real builds; this covers Expo Go, where the configured
 * splash image isn't used. Background matches the logo's field so there's no
 * seam between this and the native splash.
 */
export function LoadingScreen() {
  return (
    <View style={styles.screen}>
      <Image
        source={require('@/assets/images/bm-splash.png')}
        style={styles.logo}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#E4E2DD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
});
