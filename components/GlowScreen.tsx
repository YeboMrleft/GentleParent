import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlowScreenProps {
  children: React.ReactNode;
  colors?: [string, string, ...string[]];
  style?: ViewStyle;
}

export const GlowScreen = ({
  children,
  colors = ['#0f0c29', '#302b63', '#24243e'],
  style,
}: GlowScreenProps) => (
  <LinearGradient
    colors={colors}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[styles.screen, style]}
  >
    {children}
  </LinearGradient>
);

const styles = StyleSheet.create({
  screen: { flex: 1 },
});