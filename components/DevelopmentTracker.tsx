import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MILESTONES } from '../constants/milestones';
import ChildSelector from './ChildSelector';

// ── Animated progress bar with shimmer ───────────────────────────────────────
function AnimatedProgressBar({ progress, color, glowColor }: { progress: number; color: string; glowColor: string }) {
  const anim    = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: progress, useNativeDriver: false, duration: 1000, delay: 200 }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1,  useNativeDriver: true, duration: 1200 }),
        Animated.timing(shimmer, { toValue: -1, useNativeDriver: true, duration: 0 }),
      ])
    ).start();
  }, [progress]);

  const width    = anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const shimmerX = shimmer.interpolate({ inputRange: [-1, 1], outputRange: ['-100%', '200%'] });

  return (
    <View style={{ height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginVertical: 6 }}>
      <Animated.View style={{
        width: width as any, height: '100%', backgroundColor: color, borderRadius: 5, overflow: 'hidden',
        shadowColor: glowColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4,
      }}>
        <Animated.View style={{
          position: 'absolute', top: 0, bottom: 0, width: '40%',
          backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 5,
          transform: [{ translateX: shimmerX as any }],
        }} />
      </Animated.View>
    </View>
  );
}

// ── Range map ─────────────────────────────────────────────────────────────────
const AGE_RANGES: Record<string, [number, number]> = {
  '0–3 months':   [0, 3],   '4–6 months':  [4, 6],
  '7–9 months':   [7, 9],   '10–12 months':[10, 12],
  '1–2 years':    [13, 24], '2–3 years':   [25, 36],
  '3–4 years':    [37, 48], '4–5 years':   [49, 60],
};

// ── Glass band card ──────────────────────────────────────────────────────────
function GlassBandCard({
  band, isCurrent, isOpen, onPress, ageMonths,
}: {
  band: any; isCurrent: boolean; isOpen: boolean;
  onPress: () => void; ageMonths: number | null;
}) {
  const scaleAnim  = useRef(new Animated.Value(1)).current;
  const expandAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: isOpen ? 1 : 0, useNativeDriver: false, duration: 300,
    }).start();
  }, [isOpen]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, useNativeDriver: true, duration: 80 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 200, friction: 8 }),
    ]).start();
    onPress();
  };

  const r = AGE_RANGES[band.ageLabel];
  const progress = ageMonths !== null && r
    ? Math.max(0, Math.min(1, (ageMonths - r[0]) / (r[1] - r[0])))
    : 0;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginBottom: 10 }}>
      <TouchableOpacity onPress={handlePress} activeOpacity={1}>
        {/* Glass header */}
        <View style={[styles.bandGlass, {
          backgroundColor: band.glassColor,
          borderColor: band.accentColor,
          borderWidth: isCurrent ? 2 : 1,
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.bandEmoji}>{band.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bandLabel, { color: band.textColor }]}>{band.ageLabel}</Text>
              {isCurrent && ageMonths !== null && (
                <AnimatedProgressBar progress={progress} color={band.accentColor} glowColor={band.accentColor} />
              )}
            </View>
            {isCurrent && (
              <Text style={[styles.nowBadge, { backgroundColor: band.accentColor }]}>📍 Now</Text>
            )}
            <Text style={[styles.chevron, { color: band.textColor }]}>{isOpen ? '▲' : '▼'}</Text>
          </View>
        </View>

        {/* Expanded milestones */}
        {isOpen && (
          <View style={[styles.milestonesGlass, { backgroundColor: band.glassColor, borderColor: band.accentColor }]}>
            {band.milestones.map((m: any, i: number) => (
              <View key={i} style={styles.milestoneRow}>
                <Text style={styles.milestoneIcon}>{m.icon}</Text>
                <Text style={[styles.milestoneText, { color: band.textColor }]}>{m.text}</Text>
              </View>
            ))}
            <Text style={[styles.disclaimer, { color: band.textColor, opacity: 0.7 }]}>
              Every child develops at their own pace 💕
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Glass colour palettes ─────────────────────────────────────────────────────
const PALETTES_LIGHT = [
  { glassColor: '#FFE4EE', accentColor: '#FF6B9D', textColor: '#4A0020', glow: '#FF6B9D' },
  { glassColor: '#FFF3E0', accentColor: '#FF9500', textColor: '#3D1F00', glow: '#FF9500' },
  { glassColor: '#E8F5E9', accentColor: '#4CAF50', textColor: '#1A3D00', glow: '#4CAF50' },
  { glassColor: '#E3F2FD', accentColor: '#2979FF', textColor: '#002060', glow: '#2979FF' },
  { glassColor: '#F3E5F5', accentColor: '#9C27B0', textColor: '#2D004A', glow: '#9C27B0' },
  { glassColor: '#FFE4EE', accentColor: '#E91E63', textColor: '#4A0020', glow: '#E91E63' },
  { glassColor: '#FFF3E0', accentColor: '#FF6D00', textColor: '#3D1F00', glow: '#FF6D00' },
  { glassColor: '#E0F2F1', accentColor: '#00BFA5', textColor: '#003D33', glow: '#00BFA5' },
];

const PALETTES_DARK = [
  { glassColor: '#2A1020', accentColor: '#FF6B9D', textColor: '#FFB3D0', glow: '#FF6B9D' },
  { glassColor: '#2A1E0A', accentColor: '#FF9500', textColor: '#FFD080', glow: '#FF9500' },
  { glassColor: '#0E2410', accentColor: '#4CAF50', textColor: '#A5D6A7', glow: '#4CAF50' },
  { glassColor: '#0A1628', accentColor: '#2979FF', textColor: '#90CAF9', glow: '#2979FF' },
  { glassColor: '#1C0A28', accentColor: '#9C27B0', textColor: '#CE93D8', glow: '#9C27B0' },
  { glassColor: '#2A0A18', accentColor: '#E91E63', textColor: '#F48FB1', glow: '#E91E63' },
  { glassColor: '#2A1400', accentColor: '#FF6D00', textColor: '#FFAB40', glow: '#FF6D00' },
  { glassColor: '#001A18', accentColor: '#00BFA5', textColor: '#80CBC4', glow: '#00BFA5' },
];

interface Props {
  onClose: () => void;
  childName: string;
  childBirthday: string;  // ISO YYYY-MM-DD or ''
  allChildren?: { name: string; birthday: string }[];
  theme: any;
  isDarkMode: boolean;
}

export default function DevelopmentTracker({ onClose, childName, childBirthday, allChildren = [], theme, isDarkMode }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const childNames = allChildren.length > 0 ? allChildren.map((c) => c.name) : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || childNames[0] || '');

  const selectedBirthday = allChildren.find((c) => c.name === selectedChild)?.birthday ?? childBirthday;

  const getAgeMonths = (): number | null => {
    if (!selectedBirthday) return null;
    const bday = new Date(selectedBirthday);
    const now  = new Date();
    return (now.getFullYear() - bday.getFullYear()) * 12 + (now.getMonth() - bday.getMonth());
  };

  const ageMonths = getAgeMonths();

  const isCurrentBand = (label: string): boolean => {
    if (ageMonths === null) return false;
    const r = AGE_RANGES[label];
    return r ? ageMonths >= r[0] && ageMonths <= r[1] : false;
  };

  const PALETTES = isDarkMode ? PALETTES_DARK : PALETTES_LIGHT;
  const glassBands = MILESTONES.map((band, i) => ({ ...band, ...PALETTES[i % PALETTES.length] }));

  const bg        = isDarkMode ? '#111111' : '#F2F4F7';
  const headerBg  = isDarkMode ? 'rgba(30,30,30,0.95)' : 'rgba(255,255,255,0.7)';
  const headerBorder = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const backBtnBg = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const backBtnBorder = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)';
  const textPrimary = isDarkMode ? '#EEEEEE' : '#222222';
  const textSecondary = isDarkMode ? '#AAAAAA' : '#666666';
  const bannerBg  = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)';
  const bannerBorder = isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: headerBg, borderBottomColor: headerBorder }]}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: backBtnBg, borderColor: backBtnBorder }]}>
            <Text style={[styles.backBtnText, { color: isDarkMode ? '#EEEEEE' : '#333333' }]}>← Back</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: textPrimary }]}>🌱 Development</Text>
            <Text style={[styles.headerSub, { color: textSecondary }]}>
              {selectedBirthday ? `${selectedChild}'s milestones` : 'Tap a stage to explore'}
            </Text>
          </View>
          <View style={{ width: 70 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 15, paddingBottom: insets.bottom + 30 }}>
          <ChildSelector
            childNames={childNames}
            selected={selectedChild}
            onSelect={(n) => { setSelectedChild(n); setExpanded(null); }}
            accentColor={theme.header}
            isDarkMode={isDarkMode}
          />
          {ageMonths !== null && (
            <View style={[styles.ageBanner, { backgroundColor: bannerBg, borderColor: bannerBorder }]}>
              <Text style={[styles.ageBannerText, { color: isDarkMode ? '#EEEEEE' : '#333333' }]}>
                🎯 {selectedChild} is {Math.floor(ageMonths / 12) > 0
                  ? `${Math.floor(ageMonths / 12)}yr ${ageMonths % 12}mo`
                  : `${ageMonths} months`} old
              </Text>
            </View>
          )}

          {glassBands.map((band) => (
            <GlassBandCard
              key={band.ageLabel}
              band={band}
              isCurrent={isCurrentBand(band.ageLabel)}
              isOpen={expanded === band.ageLabel}
              onPress={() => setExpanded(expanded === band.ageLabel ? null : band.ageLabel)}
              ageMonths={ageMonths}
            />
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 4,
  },
  backBtn: {
    borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, width: 80,
  },
  backBtnText:  { fontWeight: 'bold', fontSize: 14 },
  headerTitle:  { fontSize: 18, fontWeight: 'bold' },
  headerSub:    { fontSize: 12, marginTop: 2 },
  ageBanner: {
    borderRadius: 16, padding: 12, marginBottom: 14, alignItems: 'center',
    borderWidth: 1,
  },
  ageBannerText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },

  bandGlass: {
    borderRadius: 18, padding: 16, borderWidth: 1,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
  },
  bandEmoji: { fontSize: 26, marginRight: 12 },
  bandLabel: { fontSize: 15, fontWeight: 'bold' },
  nowBadge: {
    fontSize: 11, color: 'white', fontWeight: 'bold',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginRight: 8, overflow: 'hidden',
  },
  chevron: { fontSize: 13, fontWeight: 'bold' },
  milestonesGlass: {
    borderRadius: 18, borderTopLeftRadius: 0, borderTopRightRadius: 0,
    padding: 16, marginTop: -8,
    borderWidth: 1, borderTopWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  milestoneRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  milestoneIcon:{ fontSize: 20, marginRight: 10, marginTop: 1 },
  milestoneText:{ fontSize: 14, flex: 1, lineHeight: 20, fontWeight: '500' },
  disclaimer:   { fontSize: 11, fontStyle: 'italic', marginTop: 8, lineHeight: 16 },
});
