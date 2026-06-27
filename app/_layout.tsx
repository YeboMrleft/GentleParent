import { Stack } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';

export default function RootLayout() {
  const stack = <Stack screenOptions={{ headerShown: false }} />;

  // On web (PC/desktop) the app renders phone-width; centre it in a phone-style
  // frame so it looks intentional rather than stretched. Native is a passthrough.
  if (Platform.OS !== 'web') return stack;

  return (
    <View style={styles.backdrop}>
      <View style={styles.frame}>{stack}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#EFE3EA',
    alignItems: 'center',
    justifyContent: 'center',
    // @ts-ignore web-only
    minHeight: '100vh',
  },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    // @ts-ignore web-only
    boxShadow: '0 24px 70px rgba(60,32,48,0.22)',
    // @ts-ignore web-only
    maxHeight: '100vh',
  },
});
