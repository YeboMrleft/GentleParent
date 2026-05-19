import React from 'react';
import { Text, TextStyle } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

interface GlowTextProps {
  text: string;
  style?: TextStyle;
  colors?: [string, string, ...string[]];
}

export const GlowText = ({
  text,
  style,
  colors = ['#a78bfa', '#38bdf8'],
}: GlowTextProps) => (
  <MaskedView maskElement={<Text style={[style, { backgroundColor: 'transparent' }]}>{text}</Text>}>
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <Text style={[style, { opacity: 0 }]}>{text}</Text>
    </LinearGradient>
  </MaskedView>
);