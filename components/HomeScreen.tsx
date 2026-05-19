import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import React, { useRef, useState } from 'react';
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { playClickSound } from '../utils/sounds';
import BirthdayWidget, { parseBirthday } from './BirthdayWidget';
import MoodCheckIn from './MoodCheckIn';
import { NotificationBell } from './NotificationBell';
import WeatherWidget from './WeatherWidget';

// ── Floating button with subtle entrance animation ──────────────────────────
function FloatingButton({ children, style, onPress, floatDelay = 0 }: any) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 350, delay: floatDelay, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1, duration: 350, delay: floatDelay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Online indicator ──────────────────────────────────────────────────────────
function OnlineIndicator({ style = {} }: any) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5 }, style]}>
      <View style={{
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: '#4CAF50',
        shadowColor: '#4CAF50',
        shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4,
      }} />
      <Text style={{ fontSize: 11, color: '#4CAF50', fontWeight: '600' }}>Online</Text>
    </View>
  );
}

interface Props {
  userName: string;
  childName: string;
  childNames?: string[];
  parentGender: string;
  theme: any;
  isDarkMode: boolean;
  childBirthday: string;
  soundEnabled: boolean;
  onSelectCategory: (cat: any) => void;
  onGirlTalk: () => void;
  onTracker: () => void;
  onLearnPlay: () => void;
  onCompanions: () => void;
  onSchoolHub: () => void;
  onChoreChart: () => void;
  onMedicationReminders: () => void;
  onNovels: () => void;
  onClinicCard: () => void;
  onAbout: () => void;
  onSettings: () => void;
  onNotifications: () => void;
  onSaveBirthday: (iso: string) => void;
}

export default function HomeScreen({
  userName, childName, childNames, parentGender, theme, isDarkMode, childBirthday, soundEnabled,
  onSelectCategory, onGirlTalk, onTracker, onLearnPlay,
  onCompanions, onSchoolHub, onChoreChart, onMedicationReminders, onNovels, onClinicCard, onAbout, onSettings, onNotifications, onSaveBirthday,
}: Props) {
  if (!theme) return null;

  const insets = useSafeAreaInsets();
  const isMom        = parentGender === 'mom';
  const headerBg     = theme.header;
  const headerShadow = theme.headerShadow;

  // Dark mode overrides computed directly from isDarkMode (same pattern as SettingsScreen)
  const homeBg      = isDarkMode ? '#111111' : theme.background;
  const cardBg      = isDarkMode ? '#1E1E1E' : theme.botBubble;
  const cardText    = isDarkMode ? '#EEEEEE' : theme.cardText;
  const cardSubText = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderColor = isDarkMode ? '#333333' : theme.quickQuestionsBorder;
  const footerColor = isDarkMode ? '#888888' : theme.footerText;

  // Set navigation bar color for edge-to-edge
  React.useEffect(() => {
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(headerBg);
    }
  }, [headerBg]);

  const [showBirthdayPrompt, setShowBirthdayPrompt] = useState(false);
  const [bdDay,   setBdDay]   = useState('');
  const [bdMonth, setBdMonth] = useState('');
  const [bdYear,  setBdYear]  = useState('');
  const [birthdayError, setBirthdayError] = useState('');

  const bdMonthRef      = useRef<any>(null);
  const bdYearRef       = useRef<any>(null);
  const bdDayRef        = useRef<any>(null);
  const scrollRef       = useRef<ScrollView>(null);
  const scrollSaveTimer = useRef<any>(null);

  // Restore last scroll position on mount
  React.useEffect(() => {
    AsyncStorage.getItem('scroll_home').then((val) => {
      if (val) {
        const y = parseFloat(val);
        if (y > 0) setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 100);
      }
    });
  }, []);

  const openBirthdayModal = () => {
    if (childBirthday) {
      const parts = childBirthday.split('-');
      if (parts.length === 3) {
        const [yyyy, mm, dd] = parts;
        setBdDay(dd); setBdMonth(mm); setBdYear(yyyy);
      }
    } else {
      setBdDay(''); setBdMonth(''); setBdYear('');
    }
    setShowBirthdayPrompt(true);
  };

  const handleSaveBirthday = async () => {
    setBirthdayError('');
    if (!bdDay && !bdMonth && !bdYear) {
      setShowBirthdayPrompt(false);
      return;
    }
    const parsed = parseBirthday(`${bdDay}/${bdMonth}/${bdYear}`);
    if (!parsed) { setBirthdayError('Please enter a valid date'); return; }
    if (parsed > new Date()) { setBirthdayError("Birthday can't be in the future 😊"); return; }
    const isoString = parsed.toISOString().split('T')[0];
    await AsyncStorage.setItem('child_birthday', isoString);
    onSaveBirthday(isoString);
    setShowBirthdayPrompt(false);
    setBdDay(''); setBdMonth(''); setBdYear('');
    setBirthdayError('');
  };

  const categories = [
    {
      id: 'tantrums', icon: '🌊', label: 'CALM', title: 'Tantrums & Meltdowns', description: 'Calm the storm',
      glassColor: '#FFE4EE', accentColor: '#FF6B9D', textColor: '#5A0020',
      color: '#FFB3C6', shadowColor: '#e8849a',
      questions: ['My 2-year-old is having a tantrum in public', 'How do I stay calm during meltdowns?', 'Tantrums after being told "no"'],
    },
    {
      id: 'sleep', icon: '🌙', label: 'SLEEP', title: 'Sleep & Bedtime', description: 'Peaceful nights',
      glassColor: '#E4EEFF', accentColor: '#6395FF', textColor: '#001A5A',
      color: isMom ? '#B5D5FF' : '#A8C5D8',
      shadowColor: isMom ? '#7aaee8' : '#5B8FA8',
      featureBadge: '🎧 White noise player',
      questions: ["My toddler won't stay in bed", 'Bedtime battles every night', 'Baby wakes up multiple times'],
    },
    {
      id: 'eating', icon: '🥦', label: 'EAT', title: 'Picky Eating', description: 'Joyful mealtimes',
      glassColor: '#FFF3E0', accentColor: '#FFA000', textColor: '#3D1F00',
      color: isMom ? '#FFD6A5' : '#D4C5A9',
      shadowColor: isMom ? '#e8b46e' : '#a8956e',
      questions: ['My child only eats 3 foods', 'How to introduce new foods?', 'Mealtime power struggles'],
    },
    {
      id: 'activities', icon: '🎯', label: 'PLAY', title: 'Activities & Play', description: 'Fun & development',
      glassColor: '#E8F5E9', accentColor: '#4CAF50', textColor: '#1A3D00',
      color: isMom ? '#C5F0A4' : '#C5D8B8',
      shadowColor: isMom ? '#8ed466' : '#7aaa6e',
      questions: ['Activities for a rainy day', 'Screen time alternatives', 'Learning through play ideas'],
    },
    {
      id: 'emotions', icon: '💛', label: 'FEEL', title: 'Big Emotions', description: 'Understand feelings',
      glassColor: '#F3E5F5', accentColor: '#9C27B0', textColor: '#2D004A',
      color: isMom ? '#FFB3C6' : '#B8D4C8',
      shadowColor: isMom ? '#e8849a' : '#7aaa94',
      questions: ['My child hits when angry', 'Teaching emotional vocabulary', 'Sibling jealousy'],
    },
    {
      id: 'discipline', icon: '🌿', label: 'GUIDE', title: 'Gentle Discipline', description: 'Boundaries with love',
      glassColor: '#E0F7FA', accentColor: '#00BCD4', textColor: '#003D45',
      color: isMom ? '#B5D5FF' : '#A8C5D8',
      shadowColor: isMom ? '#7aaee8' : '#5B8FA8',
      questions: ['Alternatives to time-out', 'Setting limits without yelling', 'Natural consequences'],
    },
  ];

  const actionButtons = [
    ...(isMom ? [{ icon: '💅', title: 'Girl Talk', sub: 'Just you & Lesedi', color: '#FFB3C6', onPress: onGirlTalk, delay: 0 }] : []),
    { icon: '🌱', title: `${childName}'s Development`, sub: 'Milestones & growth', color: '#C5F0A4', onPress: onTracker, delay: 100 },
    { icon: '🧸', title: 'Learn & Play', sub: 'Toys, activities & DIY', color: '#FFD6A5', onPress: onLearnPlay, delay: 200 },
    { icon: '🤝', title: 'Our Companions', sub: 'Lesedi & Bra K', color: '#B5D5FF', onPress: onCompanions, delay: 300, extra: '🌱😎' },
    { icon: '📚', title: 'School Hub', sub: 'Report cards, homework & teacher comms', color: '#C8E6C9', onPress: onSchoolHub, delay: 400 },
    { icon: '✅', title: `${childName ? childName + "'s" : ''} Chore Chart`, sub: 'Daily chores & star rewards', color: '#FFE0B2', onPress: onChoreChart, delay: 500 },
    { icon: '💊', title: 'Meds & Vitamins', sub: 'Set reminders with notifications', color: '#E8F5E9', onPress: onMedicationReminders, delay: 600 },
    { icon: '📚', title: 'Novel Corner', sub: 'Classics & Mom Lit · Premium', color: '#FFE4EE', onPress: onNovels, delay: 700 },
    { icon: '🏥', title: 'Clinic Card Scanner', sub: 'Doctor visits & vaccination records · Premium', color: '#E0F2F1', onPress: onClinicCard, delay: 800 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: homeBg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{
        backgroundColor: headerBg,
        paddingTop: Platform.OS === 'android' ? insets.top + 16 : 36,
        paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        shadowColor: headerShadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
      }}>
        <Text style={{ fontSize: 28 }}>🌱</Text>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: 'white' }}>
            Hi {userName}! {isMom ? '💕' : '👋'}
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>
            What's on your mind today?
          </Text>
          <OnlineIndicator style={{ marginTop: 4 }} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <NotificationBell onPress={onNotifications} />
          <TouchableOpacity onPress={() => { playClickSound(soundEnabled); onSettings(); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={{ fontSize: 22 }}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={{ backgroundColor: homeBg }}
        contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
          scrollSaveTimer.current = setTimeout(() => {
            AsyncStorage.setItem('scroll_home', String(y));
          }, 500);
        }}
        scrollEventThrottle={16}
      >
        {/* Birthday Widget */}
        <BirthdayWidget
          childName={childName}
          childBirthday={childBirthday}
          theme={theme}
          onSetBirthday={openBirthdayModal}
        />

        {/* Weather Widget */}
        <WeatherWidget
          childName={childName}
          childNames={childNames}
          theme={theme}
        />

        {/* Mood Check-In */}
        <MoodCheckIn
          userName={userName}
          theme={theme}
          isDarkMode={isDarkMode}
        />

        {/* Birthday Modal */}
        <Modal visible={showBirthdayPrompt} transparent animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: theme.background }]}>
              <Text style={styles.modalEmoji}>🎂</Text>
              <Text style={[styles.modalTitle, { color: theme.cardText }]}>{childName}'s Birthday</Text>
              <Text style={[styles.modalSubtitle, { color: theme.cardSubText }]}>
                Enter their birth date so we can count down to the big day!
              </Text>
              <View style={styles.dateRow}>
                <View style={styles.dateSegment}>
                  <Text style={[styles.dateSegLabel, { color: theme.cardSubText }]}>Day</Text>
                  <TextInput
                    ref={bdDayRef}
                    style={[styles.dateSegInput, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.cardText }]}
                    value={bdDay}
                    onChangeText={(t) => {
                      const d = t.replace(/\D/g, '').slice(0, 2);
                      setBdDay(d); setBirthdayError('');
                      if (d.length === 2) bdMonthRef.current?.focus();
                    }}
                    placeholder="DD"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => bdMonthRef.current?.focus()}
                  />
                </View>
                <Text style={[styles.dateSep, { color: theme.cardSubText }]}>/</Text>
                <View style={styles.dateSegment}>
                  <Text style={[styles.dateSegLabel, { color: theme.cardSubText }]}>Month</Text>
                  <TextInput
                    ref={bdMonthRef}
                    style={[styles.dateSegInput, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.cardText }]}
                    value={bdMonth}
                    onChangeText={(t) => {
                      const m = t.replace(/\D/g, '').slice(0, 2);
                      setBdMonth(m); setBirthdayError('');
                      if (m.length === 2) bdYearRef.current?.focus();
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && bdMonth === '') bdDayRef.current?.focus();
                    }}
                    placeholder="MM"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={2}
                    returnKeyType="next"
                    onSubmitEditing={() => bdYearRef.current?.focus()}
                  />
                </View>
                <Text style={[styles.dateSep, { color: theme.cardSubText }]}>/</Text>
                <View style={[styles.dateSegment, { flex: 2 }]}>
                  <Text style={[styles.dateSegLabel, { color: theme.cardSubText }]}>Year</Text>
                  <TextInput
                    ref={bdYearRef}
                    style={[styles.dateSegInput, { borderColor: theme.inputBorder, backgroundColor: theme.inputBackground, color: theme.cardText }]}
                    value={bdYear}
                    onChangeText={(t) => {
                      const y = t.replace(/\D/g, '').slice(0, 4);
                      setBdYear(y); setBirthdayError('');
                    }}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && bdYear === '') bdMonthRef.current?.focus();
                    }}
                    placeholder="YYYY"
                    placeholderTextColor="#bbb"
                    keyboardType="numeric"
                    maxLength={4}
                    returnKeyType="done"
                    onSubmitEditing={handleSaveBirthday}
                  />
                </View>
              </View>
              {birthdayError ? <Text style={styles.errorText}>{birthdayError}</Text> : null}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalCancel, { borderColor: theme.inputBorder }]}
                  onPress={() => { playClickSound(soundEnabled); setShowBirthdayPrompt(false); setBirthdayError(''); setBdDay(''); setBdMonth(''); setBdYear(''); }}
                >
                  <Text style={[styles.modalCancelText, { color: theme.cardSubText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalSave, { backgroundColor: theme.header, shadowColor: theme.headerShadow }]}
                  onPress={() => { playClickSound(soundEnabled); handleSaveBirthday(); }}
                >
                  <Text style={styles.modalSaveText}>Save 🎂</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Category grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 8 }}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => { playClickSound(soundEnabled); onSelectCategory(category); }}
              activeOpacity={0.82}
              style={{
                width: '48%', borderRadius: 20, padding: 16, marginBottom: 14,
                backgroundColor: isDarkMode ? '#1C1C1C' : category.glassColor,
                borderTopWidth: 4, borderTopColor: category.accentColor,
                borderWidth: 1, borderColor: isDarkMode ? '#333333' : category.accentColor + '40',
                shadowColor: category.accentColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
                minHeight: 140,
              }}
            >
              <View style={{
                alignSelf: 'flex-start', backgroundColor: category.accentColor,
                paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 10,
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 }}>
                  {category.label}
                </Text>
              </View>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{category.icon}</Text>
              <Text style={{ fontSize: 13, fontWeight: 'bold', color: isDarkMode ? '#EEEEEE' : category.textColor, marginBottom: 3 }}>
                {category.title}
              </Text>
              <Text style={{ fontSize: 11, color: isDarkMode ? '#AAAAAA' : category.textColor, opacity: isDarkMode ? 1 : 0.75, lineHeight: 16 }}>
                {category.description}
              </Text>
              {(category as any).featureBadge ? (
                <View style={{
                  marginTop: 8,
                  alignSelf: 'flex-start',
                  backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFFCC',
                  borderWidth: 1,
                  borderColor: category.accentColor + '55',
                  borderRadius: 10,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#CCCCCC' : category.textColor }}>
                    {(category as any).featureBadge}
                  </Text>
                </View>
              ) : null}
              <Text style={{
                position: 'absolute',
                ...(category.id === 'sleep' ? { top: 12 } : { bottom: 12 }),
                right: 14,
                fontSize: 16,
                fontWeight: 'bold', color: category.accentColor,
              }}>→</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Action buttons */}
        {actionButtons.map((btn, i) => (
          <FloatingButton
            key={i}
            style={{
              marginBottom: 10, borderRadius: 18,
              backgroundColor: cardBg,
              borderWidth: 1, borderColor: borderColor,
              shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
            }}
            onPress={() => { playClickSound(soundEnabled); btn.onPress(); }}
            floatDelay={btn.delay}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
              <View style={{
                width: 44, height: 44, borderRadius: 12,
                backgroundColor: btn.color,
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>
                <Text style={{ fontSize: 22 }}>{btn.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: cardText, marginBottom: 2 }}>{btn.title}</Text>
                <Text style={{ fontSize: 11, color: cardSubText }}>{btn.sub}</Text>
              </View>
              {(btn as any).extra && <Text style={{ fontSize: 16, marginRight: 6 }}>{(btn as any).extra}</Text>}
              <Text style={{ fontSize: 20, color: '#CCC', fontWeight: '300' }}>›</Text>
            </View>
          </FloatingButton>
        ))}

        {/* About button */}
        <TouchableOpacity
          onPress={() => { playClickSound(soundEnabled); onAbout(); }}
          activeOpacity={0.85}
          style={{
            marginBottom: 10, borderRadius: 18, backgroundColor: cardBg,
            borderWidth: 1, borderColor: borderColor, elevation: 2,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{
              width: 44, height: 44, borderRadius: 12, backgroundColor: isDarkMode ? '#2A2A2A' : theme.aboutButton,
              alignItems: 'center', justifyContent: 'center', marginRight: 14,
            }}>
              <Text style={{ fontSize: 22 }}>ℹ️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: cardText, marginBottom: 2 }}>About GentleParent</Text>
              <Text style={{ fontSize: 11, color: cardSubText }}>Version 1.1.0</Text>
            </View>
            <Text style={{ fontSize: 20, color: cardSubText }}>›</Text>
          </View>
        </TouchableOpacity>

        <Text style={{ textAlign: 'center', fontSize: 12, color: footerColor, marginTop: 8, marginBottom: 20, fontStyle: 'italic' }}>
          Built with 💕 by Inka-Tech Solutions
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    width: '100%', borderRadius: 24, padding: 24,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  modalEmoji:    { fontSize: 44, marginBottom: 12 },
  modalTitle:    { fontSize: 20, fontWeight: 'bold', marginBottom: 6, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 20 },
  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 8, width: '100%' },
  dateSegment: { flex: 1, alignItems: 'center' },
  dateSegLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' },
  dateSegInput: {
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 13,
    fontSize: 18, fontWeight: '700', textAlign: 'center', width: '100%',
  },
  dateSep: { fontSize: 22, fontWeight: '700', paddingBottom: 11 },

  modalInput: {
    width: '100%', borderWidth: 1.5, borderRadius: 12,
    padding: 14, fontSize: 18, textAlign: 'center', letterSpacing: 2, marginBottom: 8,
  },
  errorText: { fontSize: 13, color: '#FF5252', marginBottom: 8 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancel: {
    flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600' },
  modalSave: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  modalSaveText: { fontSize: 15, fontWeight: '700', color: 'white' },
});
