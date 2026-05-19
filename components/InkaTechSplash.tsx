import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  onDone: () => void;
}

export default function InkaTechSplash({ onDone }: Props) {
  const scale     = useRef(new Animated.Value(0.3)).current;
  const opacity   = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(30)).current;
  const presentsO = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo pops in
    Animated.parallel([
      Animated.spring(scale,   { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(opacity, { toValue: 1, useNativeDriver: true, duration: 400 }),
    ]).start(() => {
      // Name slides up
      Animated.parallel([
        Animated.timing(slideUp,   { toValue: 0, useNativeDriver: true, duration: 400 }),
        Animated.timing(presentsO, { toValue: 1, useNativeDriver: true, duration: 600, delay: 200 }),
      ]).start(() => {
        // Hold then hand off
        setTimeout(onDone, 900);
      });
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Hexagonal IT logo */}
      <Animated.View style={[styles.hexWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.hex}>
          <Text style={styles.hexText}>IT</Text>
        </View>
        <View style={styles.hexGlow} />
      </Animated.View>

      {/* Company name */}
      <Animated.Text style={[styles.companyName, { transform: [{ translateY: slideUp }], opacity }]}>
        Inka-Tech Solutions
      </Animated.Text>

      {/* Presents */}
      <Animated.Text style={[styles.presents, { opacity: presentsO }]}>
        presents
      </Animated.Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0A1628',
    justifyContent: 'center', alignItems: 'center',
  },
  hexWrap: { alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  hex: {
    width: 90, height: 90, borderRadius: 22,
    backgroundColor: '#1E88E5',
    alignItems: 'center', justifyContent: 'center',
    transform: [{ rotate: '15deg' }],
    shadowColor: '#1E88E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 20, elevation: 12,
  },
  hexGlow: {
    position: 'absolute', width: 110, height: 110, borderRadius: 28,
    backgroundColor: '#1E88E5', opacity: 0.15,
  },
  hexText: {
    color: 'white', fontSize: 32, fontWeight: 'bold',
    letterSpacing: 2, transform: [{ rotate: '-15deg' }],
  },
  companyName: {
    color: 'white', fontSize: 22, fontWeight: 'bold',
    letterSpacing: 1, marginBottom: 8,
  },
  presents: {
    color: 'rgba(255,255,255,0.5)', fontSize: 14,
    fontStyle: 'italic', letterSpacing: 2,
  },
});
