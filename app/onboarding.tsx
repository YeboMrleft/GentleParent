import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// ─── Onboarding slides ────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'welcome',
    gradient: ['#0F0C29', '#302B63', '#24243E'] as const,
    emoji: '👋',
    title: 'Welcome to\nGentleParent',
    subtitle: 'Your AI-powered companion for the parenting journey — and everything in between.',
    accentColor: '#A78BFA',
  },
  {
    id: 'brak',
    gradient: ['#1A1A2E', '#16213E', '#0F3460'] as const,
    emoji: '🤙',
    title: 'Meet Bra K',
    subtitle: 'Your witty, straight-talking companion for guy talk — sports, cars, business, and life. Powered by AI, built for dads.',
    accentColor: '#38BDF8',
    tag: 'AI Companion',
  },
  {
    id: 'lesedi',
    gradient: ['#2D1B69', '#11998E', '#38EF7D'] as const,
    emoji: '✨',
    title: 'Meet Lesedi',
    subtitle: 'A warm, knowledgeable companion for parenting support, lifestyle, celebrity chat, and everyday conversation.',
    accentColor: '#6EE7B7',
    tag: 'AI Companion',
  },
  {
    id: 'disclosure',
    gradient: ['#1A1A2E', '#1A1A2E', '#2C2C54'] as const,
    emoji: '🤖',
    title: 'Important:\nAI Disclosure',
    subtitle: 'Bra K and Lesedi are entirely AI-generated characters — not real people. Their responses are produced by artificial intelligence and are for informational and entertainment purposes only.',
    accentColor: '#FFD200',
    isDisclosure: true,
  },
  {
    id: 'profile',
    gradient: ['#0F2027', '#203A43', '#2C5364'] as const,
    emoji: '👤',
    title: 'Quick\nIntroduction',
    subtitle: 'Help us personalise your experience — you can update this anytime in Settings.',
    accentColor: '#34D399',
    isProfile: true,
  },
  {
    id: 'terms',
    gradient: ['#0F0C29', '#302B63', '#24243E'] as const,
    emoji: '📋',
    title: 'Before You Begin',
    subtitle: 'Please review and accept our terms to continue.',
    accentColor: '#A78BFA',
    isTerms: true,
  },
];

// ─── Slide component ──────────────────────────────────────────────────────────

type Profile = { userName: string; childName: string; parentGender: 'mom' | 'dad' };

const Slide = ({
  slide,
  isActive,
  slideIndex,
  totalSlides,
  onNext,
  onAccept,
  accepted,
  setAccepted,
  profile,
  setProfile,
}: {
  slide: typeof SLIDES[0];
  isActive: boolean;
  slideIndex: number;
  totalSlides: number;
  onNext: () => void;
  onAccept: () => void;
  accepted: { terms: boolean; privacy: boolean; ai: boolean };
  setAccepted: (v: { terms: boolean; privacy: boolean; ai: boolean }) => void;
  profile: Profile;
  setProfile: (v: Profile) => void;
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const emojiScale = useRef(new Animated.Value(0.5)).current;
  const emojiRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.spring(emojiScale, { toValue: 1, tension: 55, friction: 8, delay: 200, useNativeDriver: true }),
        Animated.spring(emojiRotate, { toValue: 1, tension: 55, friction: 8, delay: 200, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      emojiScale.setValue(0.5);
      emojiRotate.setValue(0);
    }
  }, [isActive]);

  const rotate = emojiRotate.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '0deg'] });
  const isLast = slideIndex === totalSlides - 1;
  const allAccepted = accepted.terms && accepted.privacy && accepted.ai;

  const CheckRow = ({
    label,
    checked,
    onToggle,
    linkLabel,
    linkUrl,
  }: {
    label: string;
    checked: boolean;
    onToggle: () => void;
    linkLabel?: string;
    linkUrl?: string;
  }) => (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.8}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={styles.checkLabel}>
        {label}{' '}
        {linkLabel && linkUrl && (
          <Text
            style={styles.checkLink}
            onPress={(e) => {
              e.stopPropagation?.();
              Linking.openURL(linkUrl);
            }}
          >
            {linkLabel}
          </Text>
        )}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={[styles.slide, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Emoji */}
      <Animated.View style={[styles.emojiWrap, { transform: [{ scale: emojiScale }, { rotate }] }]}>
        <View style={[styles.emojiCircle, { borderColor: slide.accentColor + '40' }]}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
      </Animated.View>

      {/* AI / Companion tag */}
      {'tag' in slide && slide.tag && (
        <View style={[styles.tag, { backgroundColor: slide.accentColor + '25', borderColor: slide.accentColor + '50' }]}>
          <Ionicons name="sparkles" size={11} color={slide.accentColor} />
          <Text style={[styles.tagText, { color: slide.accentColor }]}>{slide.tag}</Text>
        </View>
      )}

      {/* Title */}
      <Text style={styles.slideTitle}>{slide.title}</Text>

      {/* Subtitle */}
      <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>

      {/* Disclosure extras */}
      {'isDisclosure' in slide && slide.isDisclosure && (
        <View style={styles.disclosurePoints}>
          {[
            { icon: 'information-circle', text: 'Not real people — 100% AI generated' },
            { icon: 'shield-checkmark', text: 'Not a substitute for professional advice' },
            { icon: 'alert-circle', text: 'In emergencies, call 10177 or 10111' },
            { icon: 'chatbubble-ellipses', text: 'Conversations are not permanently stored' },
          ].map((point, i) => (
            <View key={i} style={styles.disclosureRow}>
              <View style={[styles.disclosureIcon, { backgroundColor: slide.accentColor + '20' }]}>
                <Ionicons name={point.icon as any} size={15} color={slide.accentColor} />
              </View>
              <Text style={styles.disclosureText}>{point.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Profile fields */}
      {'isProfile' in slide && (slide as any).isProfile && (
        <View style={{ width: '100%', gap: 14, marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: '600', letterSpacing: 0.5 }}>
              YOUR NAME (OPTIONAL)
            </Text>
            <TextInput
              value={profile.userName}
              onChangeText={(t) => setProfile({ ...profile, userName: t })}
              placeholder="e.g. Thabo"
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 14, padding: 14,
                color: '#fff', fontSize: 15,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontWeight: '600', letterSpacing: 0.5 }}>
              CHILD'S NAME (OPTIONAL)
            </Text>
            <TextInput
              value={profile.childName}
              onChangeText={(t) => setProfile({ ...profile, childName: t })}
              placeholder="e.g. Amara"
              placeholderTextColor="rgba(255,255,255,0.25)"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderRadius: 14, padding: 14,
                color: '#fff', fontSize: 15,
                borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
              }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 8, fontWeight: '600', letterSpacing: 0.5 }}>
              I AM A
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(['mom', 'dad'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  onPress={() => setProfile({ ...profile, parentGender: g })}
                  style={{
                    flex: 1, paddingVertical: 14, borderRadius: 14,
                    alignItems: 'center',
                    backgroundColor: profile.parentGender === g
                      ? (slide.accentColor + '30')
                      : 'rgba(255,255,255,0.06)',
                    borderWidth: 2,
                    borderColor: profile.parentGender === g
                      ? slide.accentColor
                      : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <Text style={{ fontSize: 26, marginBottom: 4 }}>{g === 'mom' ? '👩' : '👨'}</Text>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, textTransform: 'capitalize' }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Terms checkboxes */}
      {'isTerms' in slide && slide.isTerms && (
        <View style={styles.termsSection}>
          <CheckRow
            label="I agree to the"
            checked={accepted.terms}
            onToggle={() => setAccepted({ ...accepted, terms: !accepted.terms })}
            linkLabel="Terms of Service"
            linkUrl="https://yebomrleft.github.io/gentleparent-legal/terms_of_service"
          />
          <CheckRow
            label="I have read the"
            checked={accepted.privacy}
            onToggle={() => setAccepted({ ...accepted, privacy: !accepted.privacy })}
            linkLabel="Privacy Policy"
            linkUrl="https://yebomrleft.github.io/gentleparent-legal/privacy_policy"
          />
          <CheckRow
            label="I understand Bra K and Lesedi are AI companions, not real people"
            checked={accepted.ai}
            onToggle={() => setAccepted({ ...accepted, ai: !accepted.ai })}
          />
        </View>
      )}

      {/* CTA button */}
      <TouchableOpacity
        style={[styles.ctaWrap, isLast && !allAccepted && { opacity: 0.4 }]}
        onPress={isLast ? onAccept : onNext}
        disabled={isLast && !allAccepted}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={[slide.accentColor, slide.accentColor + 'AA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaBtn}
        >
          <Text style={styles.ctaText}>
            {isLast ? "Let's Go! 🚀" : 'Continue'}
          </Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" />}
        </LinearGradient>
      </TouchableOpacity>

      {isLast && !allAccepted && (
        <Text style={styles.ctaHint}>Please accept all three items above to continue</Text>
      )}
    </Animated.View>
  );
};

// ─── Main Onboarding Screen ───────────────────────────────────────────────────

const ONBOARDING_KEY = 'gentleparent_onboarding_complete';

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [accepted, setAccepted] = useState({ terms: false, privacy: false, ai: false });
  const [profile, setProfile] = useState<Profile>({ userName: '', childName: '', parentGender: 'mom' });
  const bgAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Decorative floating orbs
  const orb1 = useRef(new Animated.Value(0)).current;
  const orb2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating orb animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(orb2, { toValue: 1, duration: 5500, useNativeDriver: true }),
        Animated.timing(orb2, { toValue: 0, duration: 5500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (currentSlide + 1) / SLIDES.length,
      tension: 60,
      friction: 10,
      useNativeDriver: false,
    }).start();
  }, [currentSlide]);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide((s) => s + 1);
    }
  };

  const handleAccept = async () => {
    const childId = `child_${Date.now()}`;
    const childName = profile.childName.trim();
    const entries: [string, string][] = [
      [ONBOARDING_KEY, 'true'],
      ['user_name', profile.userName.trim()],
      ['parent_gender', profile.parentGender],
    ];
    if (childName) {
      entries.push(
        ['children_v1', JSON.stringify([{ id: childId, name: childName }])],
        ['active_child_id', childId],
        ['child_name', childName],
      );
    }
    await AsyncStorage.multiSet(entries);
    router.replace('/');
  };

  const orb1Y = orb1.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const orb2Y = orb2.interpolate({ inputRange: [0, 1], outputRange: [0, 15] });
  const slide = SLIDES[currentSlide];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />

      {/* Background gradient */}
      <LinearGradient
        colors={slide.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative orbs */}
      <Animated.View style={[styles.orb, styles.orb1, { transform: [{ translateY: orb1Y }] }]} />
      <Animated.View style={[styles.orb, styles.orb2, { transform: [{ translateY: orb2Y }] }]} />

      {/* Skip button (not on last slide) */}
      {currentSlide < SLIDES.length - 1 && (
        <TouchableOpacity
          style={styles.skipBtn}
          onPress={() => setCurrentSlide(SLIDES.length - 1)}
        >
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
        </TouchableOpacity>
      )}

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: slide.accentColor,
              },
            ]}
          />
        </View>
      </View>

      {/* Dot indicators */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === currentSlide && [styles.dotActive, { backgroundColor: slide.accentColor }],
            ]}
          />
        ))}
      </View>

      {/* Slide content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {SLIDES.map((s, i) =>
          i === currentSlide ? (
            <Slide
              key={s.id}
              slide={s}
              isActive={true}
              slideIndex={i}
              totalSlides={SLIDES.length}
              onNext={handleNext}
              onAccept={handleAccept}
              accepted={accepted}
              setAccepted={setAccepted}
              profile={profile}
              setProfile={setProfile}
            />
          ) : null
        )}
      </ScrollView>

      {/* Bottom brand */}
      <View style={styles.brandRow}>
        <Text style={styles.brandText}>GentleParent by Inka-Tech Solutions</Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Check if onboarding is complete (use in _layout.tsx) ─────────────────────
// Add this to your root layout to auto-skip onboarding for returning users:
//
// useEffect(() => {
//   AsyncStorage.getItem('gentleparent_onboarding_complete').then((val) => {
//     if (val === 'true') router.replace('/home');
//     else router.replace('/onboarding');
//   });
// }, []);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F0C29' },

  // Orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.12,
  },
  orb1: {
    width: 300,
    height: 300,
    backgroundColor: '#A78BFA',
    top: -80,
    right: -80,
  },
  orb2: {
    width: 250,
    height: 250,
    backgroundColor: '#38BDF8',
    bottom: 100,
    left: -80,
  },

  // Skip
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: '600' },

  // Progress
  progressWrap: { paddingHorizontal: 24, paddingTop: 60 },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: { height: 3, borderRadius: 999 },

  // Dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: { width: 20, borderRadius: 3 },

  // Scroll
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 20,
  },

  // Slide
  slide: { flex: 1, alignItems: 'center', paddingTop: 20 },

  emojiWrap: { marginBottom: 20 },
  emojiCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 56 },

  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    marginBottom: 14,
  },
  tagText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  slideTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.8,
    lineHeight: 40,
    marginBottom: 16,
  },
  slideSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  // Disclosure
  disclosurePoints: { width: '100%', gap: 10, marginBottom: 28 },
  disclosureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 14,
    padding: 12,
  },
  disclosureIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclosureText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    lineHeight: 18,
  },

  // Terms
  termsSection: { width: '100%', gap: 12, marginBottom: 24 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: '#A78BFA',
    borderColor: '#A78BFA',
  },
  checkLabel: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
    lineHeight: 20,
  },
  checkLink: {
    color: '#A78BFA',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // CTA
  ctaWrap: { width: '100%', borderRadius: 999, overflow: 'hidden', marginBottom: 10 },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  ctaText: { fontSize: 16, fontWeight: '900', color: '#fff', letterSpacing: -0.3 },
  ctaHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Brand
  brandRow: { alignItems: 'center', paddingBottom: 12 },
  brandText: { fontSize: 11, color: 'rgba(255,255,255,0.25)', fontWeight: '600' },
});
