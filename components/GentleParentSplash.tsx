import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onDone: () => void;
  theme: any;
}

export default function GentleParentSplash({ onDone, theme }: Props) {
  const opacity  = useRef(new Animated.Value(0)).current;
  const slideUp  = useRef(new Animated.Value(40)).current;
  const taglineO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 500 }),
      Animated.timing(slideUp, { toValue: 0, useNativeDriver: true, duration: 500 }),
    ]).start(() => {
      Animated.timing(taglineO, { toValue: 1, useNativeDriver: true, duration: 500, delay: 100 }).start(() => {
        setTimeout(onDone, 800);
      });
    });
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View style={{ alignItems: 'center', opacity, transform: [{ translateY: slideUp }] }}>
        <Text style={styles.gpEmoji}>🌱</Text>
        <Text style={[styles.gpName, { color: theme.logoText }]}>GentleParent</Text>
      </Animated.View>
      <Animated.Text style={[styles.gpTagline, { color: theme.logoTagline, opacity: taglineO }]}>
        Raising kind humans
      </Animated.Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  gpEmoji:   { fontSize: 72, marginBottom: 12 },
  gpName:    { fontSize: 40, fontWeight: 'bold', letterSpacing: 1 },
  gpTagline: { fontSize: 16, fontStyle: 'italic', marginTop: 16, position: 'absolute', bottom: 80 },
});
