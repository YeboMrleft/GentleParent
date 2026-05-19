import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ── Birthday helpers ──────────────────────────────────────────────────────────
const parseBirthday = (ddmmyyyy: string): Date | null => {
  const parts = ddmmyyyy.replace(/\//g, '-').split('-');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const date = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
  return isNaN(date.getTime()) ? null : date;
};

const getBirthdayInfo = (birthdayStr: string) => {
  if (!birthdayStr) return null;
  const birthday = new Date(birthdayStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let age = today.getFullYear() - birthday.getFullYear();
  const hadBirthdayThisYear =
    today.getMonth() > birthday.getMonth() ||
    (today.getMonth() === birthday.getMonth() && today.getDate() >= birthday.getDate());
  if (!hadBirthdayThisYear) age--;

  const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
  if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
  const daysUntil = Math.round((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return { age, daysUntil, isTodayBirthday: daysUntil === 0 };
};

interface Props {
  childName: string;
  childBirthday: string;  // ISO YYYY-MM-DD or ''
  theme: any;
  onSetBirthday: () => void;
}

export default function BirthdayWidget({ childName, childBirthday, theme, onSetBirthday }: Props) {
  if (!childBirthday) {
    return (
      <TouchableOpacity
        style={[styles.setupCard, { backgroundColor: theme.botBubble, borderColor: theme.inputBorder }]}
        onPress={onSetBirthday}
        activeOpacity={0.85}
      >
        <Text style={styles.setupEmoji}>🎂</Text>
        <View style={styles.setupTextContainer}>
          <Text style={[styles.setupTitle, { color: theme.cardText }]}>
            When is {childName}'s birthday?
          </Text>
          <Text style={[styles.setupSubtitle, { color: theme.cardSubText }]}>
            Tap to set up the countdown ✨
          </Text>
        </View>
        <Text style={[styles.setupArrow, { color: theme.subText }]}>→</Text>
      </TouchableOpacity>
    );
  }

  const info = getBirthdayInfo(childBirthday);
  if (!info) return null;

  if (info.isTodayBirthday) {
    return (
      <View style={[styles.widget, styles.widgetCelebration]}>
        <Text style={styles.celebrationEmoji}>🎉🎂🎉</Text>
        <Text style={styles.celebrationTitle}>Happy Birthday {childName}!</Text>
        <Text style={styles.celebrationSubtitle}>
          Turning {info.age + 1} today — what a special day! 🎈
        </Text>
      </View>
    );
  }

  const progress = Math.max(0, Math.min(1, (365 - info.daysUntil) / 365));
  const isClose  = info.daysUntil <= 30;

  return (
    <TouchableOpacity
      style={[styles.widget, { backgroundColor: theme.botBubble, shadowColor: theme.botBubbleShadow }]}
      onPress={onSetBirthday}
      activeOpacity={0.92}
    >
      {/* Left: cake + age badge */}
      <View style={styles.leftSection}>
        <Text style={styles.cakeEmoji}>🎂</Text>
        <View style={[styles.ageBadge, { backgroundColor: theme.header }]}>
          <Text style={styles.ageNumber}>{info.age}</Text>
          <Text style={styles.ageLabel}>yrs</Text>
        </View>
      </View>

      {/* Middle: name, countdown, progress bar */}
      <View style={styles.middleSection}>
        <Text style={[styles.childLabel, { color: theme.cardSubText }]}>
          {childName}'s next birthday
        </Text>
        <Text style={[styles.daysCount, { color: theme.cardText }]}>
          {info.daysUntil === 1 ? '🎈 Tomorrow!' : `${info.daysUntil} days`}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: theme.quickQuestionsBorder }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%` as any,
                backgroundColor: isClose ? '#FF6B6B' : theme.header,
              },
            ]}
          />
        </View>
        {isClose && (
          <Text style={styles.soCloseText}>🎈 So close!</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  setupCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  setupEmoji:         { fontSize: 28, marginRight: 12 },
  setupTextContainer: { flex: 1 },
  setupTitle:         { fontSize: 14, fontWeight: '600' },
  setupSubtitle:      { fontSize: 12, marginTop: 2 },
  setupArrow:         { fontSize: 18 },

  widget: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16, marginBottom: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 4,
  },
  widgetCelebration: {
    backgroundColor: '#FFF3CD', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
  },
  celebrationEmoji:    { fontSize: 36, marginBottom: 6 },
  celebrationTitle:    { fontSize: 18, fontWeight: 'bold', color: '#7A5C00' },
  celebrationSubtitle: { fontSize: 13, color: '#9B7A00', marginTop: 4 },

  leftSection:  { alignItems: 'center', marginRight: 14 },
  cakeEmoji:    { fontSize: 32, marginBottom: 4 },
  ageBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignItems: 'center',
  },
  ageNumber: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  ageLabel:  { color: 'rgba(255,255,255,0.8)', fontSize: 10 },

  middleSection: { flex: 1 },
  childLabel:    { fontSize: 12, marginBottom: 2 },
  daysCount:     { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%' as any, borderRadius: 3 },
  soCloseText:   { fontSize: 11, color: '#FF6B6B', marginTop: 4 },
});

// ── Birthday Modal (used by HomeScreen) ─────────────────────────────────────
export { parseBirthday };
