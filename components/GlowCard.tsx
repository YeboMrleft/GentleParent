import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GlowCardProps {
  children: React.ReactNode;
  colors?: [string, string, ...string[]];
  style?: ViewStyle;
}

export const GlowCard = ({
  children,
  colors = ['#1e1b4b', '#312e81'],
  style,
}: GlowCardProps) => (
  <View style={[styles.shadow, style]}>
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      {children}
    </LinearGradient>
  </View>
);

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 20,
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  card: {
    borderRadius: 20,
    padding: 20,
  },
});