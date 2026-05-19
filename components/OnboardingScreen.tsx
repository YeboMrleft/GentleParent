import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Linking,
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
import { playClickSound } from '../utils/sounds';

const TERMS_URL   = 'https://yeboMrleft.github.io/gentleparent-legal/terms_of_service';
const PRIVACY_URL = 'https://yeboMrleft.github.io/gentleparent-legal/privacy_policy';

interface Props {
  onComplete: (name: string, childName: string, gender: string) => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const [name,         setName]         = useState('');
  const [child,        setChild]        = useState('');
  const [gender,       setGender]       = useState('');
  const [agreedLegal,  setAgreedLegal]  = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleDone = async () => {
    if (!name.trim() || !child.trim() || !gender) {
      Alert.alert('Almost there! 💕', "Please fill in your name, your child's name, and whether you're a mom or dad.");
      return;
    }
    if (!agreedLegal) {
      Alert.alert('One more thing 🔒', 'Please agree to our Terms of Service and Privacy Policy to continue.');
      return;
    }
    await AsyncStorage.setItem('user_name',     name.trim());
    await AsyncStorage.setItem('child_name',    child.trim());
    await AsyncStorage.setItem('parent_gender', gender);
    onComplete(name.trim(), child.trim(), gender);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#E75480" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.logoRing}>
            <Text style={styles.logoEmoji}>🌱</Text>
          </View>
          <Text style={styles.appName}>GentleParent</Text>
          <Text style={styles.heroTagline}>
            Your gentle parenting companion{'\n'}for modern families everywhere
          </Text>
        </View>

        {/* ── Form sheet ───────────────────────────────────────────────── */}
        <Animated.View style={[
          styles.sheet,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.sectionTitle}>Let's get to know you</Text>

            {/* ── Your name ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Your name 😊</Text>
              <TextInput
                style={[styles.input, focusedField === 'name' && styles.inputFocused]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Thandi"
                placeholderTextColor="#C8C8C8"
                autoCapitalize="words"
                returnKeyType="next"
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* ── Child's name ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Your little one's name 🌟</Text>
              <TextInput
                style={[styles.input, focusedField === 'child' && styles.inputFocused]}
                value={child}
                onChangeText={setChild}
                placeholder="e.g. Liam"
                placeholderTextColor="#C8C8C8"
                autoCapitalize="words"
                returnKeyType="done"
                onFocus={() => setFocusedField('child')}
                onBlur={() => setFocusedField(null)}
              />
            </View>

            {/* ── Gender ── */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>I am a... 👨‍👩‍👧</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderCard, gender === 'mom' && styles.genderCardMomActive]}
                  onPress={() => { playClickSound(); setGender('mom'); }}
                  activeOpacity={0.85}
                >
                  {gender === 'mom' && <View style={[styles.selectedDot, { backgroundColor: '#E75480' }]} />}
                  <Text style={styles.genderEmoji}>👩</Text>
                  <Text style={[styles.genderLabel, gender === 'mom' && { color: '#E75480', fontWeight: '800' }]}>
                    Mom
                  </Text>
                  <Text style={[styles.genderSub, gender === 'mom' && { color: '#E75480', opacity: 0.8 }]}>
                    I'm a mother
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.genderCard, gender === 'dad' && styles.genderCardDadActive]}
                  onPress={() => { playClickSound(); setGender('dad'); }}
                  activeOpacity={0.85}
                >
                  {gender === 'dad' && <View style={[styles.selectedDot, { backgroundColor: '#2C5F8A' }]} />}
                  <Text style={styles.genderEmoji}>👨</Text>
                  <Text style={[styles.genderLabel, gender === 'dad' && { color: '#2C5F8A', fontWeight: '800' }]}>
                    Dad
                  </Text>
                  <Text style={[styles.genderSub, gender === 'dad' && { color: '#2C5F8A', opacity: 0.8 }]}>
                    I'm a father
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── Legal ── */}
            <TouchableOpacity
              style={styles.legalRow}
              onPress={() => { playClickSound(); setAgreedLegal((v) => !v); }}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, agreedLegal && styles.checkboxChecked]}>
                {agreedLegal && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.legalText}>
                  By continuing, I agree to the{' '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => Linking.openURL(TERMS_URL)}
                  >
                    Terms of Service
                  </Text>
                  {' '}and{' '}
                  <Text
                    style={styles.legalLink}
                    onPress={() => Linking.openURL(PRIVACY_URL)}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </View>
            </TouchableOpacity>

            {/* ── CTA ── */}
            <TouchableOpacity
              style={[styles.ctaButton, !agreedLegal && styles.ctaButtonDisabled]}
              onPress={() => { playClickSound(); handleDone(); }}
              activeOpacity={0.88}
            >
              <Text style={styles.ctaText}>Let's go! 💕</Text>
            </TouchableOpacity>

            <Text style={styles.privacyNote}>
              🔒 Your data is stored privately on your device and never sold
            </Text>
          </ScrollView>
        </Animated.View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#E75480' },

  // ── Hero ──────────────────────────────────────────────────────────────
  hero: {
    backgroundColor: '#E75480',
    paddingTop: Platform.OS === 'android' ? 24 : 20,
    paddingBottom: 52,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoRing: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  logoEmoji:   { fontSize: 42 },
  appName:     { fontSize: 30, fontWeight: '900', color: 'white', letterSpacing: 0.5, marginBottom: 8 },
  heroTagline: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 20 },

  // ── Sheet ─────────────────────────────────────────────────────────────
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 14,
  },
  scrollContent: {
    padding: 28,
    paddingTop: 34,
    paddingBottom: 44,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 26,
  },

  // ── Fields ────────────────────────────────────────────────────────────
  fieldGroup: { marginBottom: 22 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#EEE',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1A1A2E',
    backgroundColor: '#FAFAFA',
  },
  inputFocused: {
    borderColor: '#E75480',
    backgroundColor: '#FFF5F8',
    shadowColor: '#E75480',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },

  // ── Gender ────────────────────────────────────────────────────────────
  genderRow: { flexDirection: 'row', gap: 12 },
  genderCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    backgroundColor: '#FAFAFA',
    position: 'relative',
    overflow: 'hidden',
  },
  genderCardMomActive: {
    borderColor: '#E75480',
    backgroundColor: '#FFF0F5',
    shadowColor: '#E75480',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  genderCardDadActive: {
    borderColor: '#2C5F8A',
    backgroundColor: '#F0F5FF',
    shadowColor: '#2C5F8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  selectedDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  genderEmoji: { fontSize: 38, marginBottom: 10 },
  genderLabel: { fontSize: 16, fontWeight: '700', color: '#888', marginBottom: 4 },
  genderSub:   { fontSize: 11, color: '#BBBBBB', fontWeight: '500' },

  // ── Legal ─────────────────────────────────────────────────────────────
  legalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 26,
    marginTop: 6,
    padding: 16,
    backgroundColor: '#FFF9FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F5DDE6',
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: '#DDD',
    alignItems: 'center', justifyContent: 'center',
    marginTop: 1,
    backgroundColor: 'white',
  },
  checkboxChecked: {
    backgroundColor: '#E75480',
    borderColor: '#E75480',
  },
  checkmark: { color: 'white', fontSize: 12, fontWeight: '900' },
  legalText: { flex: 1, fontSize: 12, color: '#777', lineHeight: 19 },
  legalLink: { color: '#E75480', fontWeight: '700', textDecorationLine: 'underline' },

  // ── CTA ───────────────────────────────────────────────────────────────
  ctaButton: {
    backgroundColor: '#E75480',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#c0396a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 6,
    borderBottomWidth: 5,
    borderBottomColor: '#c0396a',
    marginBottom: 20,
  },
  ctaButtonDisabled: {
    backgroundColor: '#F4BFCE',
    shadowOpacity: 0.1,
    borderBottomColor: '#eaaabb',
    elevation: 2,
  },
  ctaText: { fontSize: 18, fontWeight: '900', color: 'white', letterSpacing: 0.5 },

  privacyNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#CCCCCC',
    lineHeight: 17,
  },
});
