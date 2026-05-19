import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { playClickSound } from '../utils/sounds';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Step {
  emoji: string;
  color: string;
  colorDark: string;
  colorLight: string;
  title: string;
  description: string;
  badge: string;
}

const STEPS: Step[] = [
  {
    emoji: '🌱',
    color: '#E75480',
    colorDark: '#c0396a',
    colorLight: '#FFB3C6',
    title: 'Welcome to GentleParent',
    description: "Your gentle parenting companion for families everywhere. Let's take a quick look at what's inside.",
    badge: '👋 Quick tour',
  },
  {
    emoji: '💬',
    color: '#F43F5E',
    colorDark: '#be123c',
    colorLight: '#FDA4AF',
    title: 'Ask Anything',
    description: 'Tap any topic card on the home screen — tantrums, sleep, eating, big emotions — for instant AI parenting advice.',
    badge: '🏠 Home · Topic cards',
  },
  {
    emoji: '🤝',
    color: '#6366F1',
    colorDark: '#4338CA',
    colorLight: '#A5B4FC',
    title: 'Your Companions',
    description: 'Lesedi and Bra K are your AI friends for real talk and encouragement. Girl Talk is a safe space just for moms.',
    badge: '🏠 Home · Our Companions',
  },
  {
    emoji: '📚',
    color: '#0EA5E9',
    colorDark: '#0369A1',
    colorLight: '#7DD3FC',
    title: 'School Hub',
    description: 'Scan report cards, get homework help, draft teacher messages, and track Grade R readiness — all in one place.',
    badge: '🏠 Home · School Hub',
  },
  {
    emoji: '✅',
    color: '#F59E0B',
    colorDark: '#B45309',
    colorLight: '#FCD34D',
    title: 'Track & Reward',
    description: "Follow your child's milestones, manage daily chores with star rewards, and set medication reminders.",
    badge: '🏠 Home · Tracker & Chore Chart',
  },
  {
    emoji: '⚙️',
    color: '#8B5CF6',
    colorDark: '#6D28D9',
    colorLight: '#C4B5FD',
    title: 'Make it Yours',
    description: 'Pick your theme, set morning weather alerts, manage family profiles, and send us feedback — all in Settings.',
    badge: '⚙️ Top right on the home screen',
  },
];

interface Props {
  visible: boolean;
  parentGender: string;
  onDone: () => void;
}

export default function WalkthroughModal({ visible, parentGender, onDone }: Props) {
  const [step, setStep] = useState(0);

  const overlayFade = useRef(new Animated.Value(0)).current;
  const cardScale   = useRef(new Animated.Value(0.92)).current;
  const cardFade    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(0)).current;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;

  useEffect(() => {
    if (visible) {
      setStep(0);
      slideAnim.setValue(0);
      Animated.parallel([
        Animated.timing(overlayFade, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.spring(cardScale,   { toValue: 1, tension: 60, friction: 10, useNativeDriver: true }),
        Animated.timing(cardFade,    { toValue: 1, duration: 350, useNativeDriver: true }),
      ]).start();
    } else {
      overlayFade.setValue(0);
      cardScale.setValue(0.92);
      cardFade.setValue(0);
    }
  }, [visible]);

  const animateToStep = (direction: 'forward' | 'back', nextStep: number) => {
    const exitTo    = direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH;
    const enterFrom = direction === 'forward' ?  SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(slideAnim, { toValue: exitTo, duration: 220, useNativeDriver: true }).start(() => {
      setStep(nextStep);
      slideAnim.setValue(enterFrom);
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
  };

  const goNext = () => {
    playClickSound();
    if (isLast) { onDone(); return; }
    animateToStep('forward', step + 1);
  };

  const goBack = () => {
    playClickSound();
    if (step === 0) return;
    animateToStep('back', step - 1);
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: overlayFade }]}>

        {/* Skip */}
        <TouchableOpacity style={styles.skipBtn} onPress={() => { playClickSound(); onDone(); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.skipText}>Skip tour</Text>
        </TouchableOpacity>

        {/* Card */}
        <Animated.View style={[
          styles.card,
          {
            opacity: cardFade,
            transform: [{ scale: cardScale }, { translateX: slideAnim }],
          },
        ]}>

          {/* ── Illustration area ── */}
          <View style={[styles.illustration, { backgroundColor: current.color }]}>
            {/* Decorative rings */}
            <View style={[styles.ring, { width: 220, height: 220, borderColor: current.colorLight + '25' }]} />
            <View style={[styles.ring, { width: 160, height: 160, borderColor: current.colorLight + '40' }]} />
            <View style={[styles.ring, { width: 110, height: 110, borderColor: current.colorLight + '60' }]} />

            {/* Emoji in frosted bubble */}
            <View style={styles.emojiBubble}>
              <Text style={styles.emoji}>{current.emoji}</Text>
            </View>

            {/* Step pill - bottom right of illustration */}
            <View style={styles.stepPill}>
              <Text style={styles.stepPillText}>{step + 1} / {STEPS.length}</Text>
            </View>
          </View>

          {/* ── Content ── */}
          <View style={styles.content}>
            <View style={[styles.badge, { backgroundColor: current.color + '18' }]}>
              <Text style={[styles.badgeText, { color: current.color }]}>{current.badge}</Text>
            </View>

            <Text style={styles.title}>{current.title}</Text>
            <Text style={styles.description}>{current.description}</Text>
          </View>

          {/* ── Progress dots ── */}
          <View style={styles.dotsRow}>
            {STEPS.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === step ? current.color : '#E8E8E8',
                    width: i === step ? 24 : 7,
                  },
                ]}
              />
            ))}
          </View>

          {/* ── Actions ── */}
          <View style={styles.actions}>
            {step > 0 ? (
              <TouchableOpacity
                style={[styles.backBtn, { borderColor: current.color + '50' }]}
                onPress={goBack}
                activeOpacity={0.8}
              >
                <Text style={[styles.backBtnText, { color: current.color }]}>←</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.backBtnPlaceholder} />
            )}

            <TouchableOpacity
              style={[
                styles.nextBtn,
                {
                  backgroundColor: current.color,
                  shadowColor: current.colorDark,
                  borderBottomColor: current.colorDark,
                },
              ]}
              onPress={goNext}
              activeOpacity={0.88}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? "Let's Go! 🌱" : 'Next  →'}
              </Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10,10,20,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  skipBtn: {
    position: 'absolute',
    top: 54,
    right: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  skipText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },

  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 20,
  },

  // ── Illustration ──────────────────────────────────────────────────────
  illustration: {
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
  emojiBubble: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  emoji: { fontSize: 46 },
  stepPill: {
    position: 'absolute',
    bottom: 12,
    right: 14,
    backgroundColor: 'rgba(0,0,0,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  stepPillText: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontWeight: '700' },

  // ── Content ───────────────────────────────────────────────────────────
  content: { paddingHorizontal: 26, paddingTop: 24, paddingBottom: 8 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 14,
  },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  title: {
    fontSize: 23,
    fontWeight: '900',
    color: '#111',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },

  // ── Dots ──────────────────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 22,
    paddingBottom: 6,
  },
  dot: { height: 7, borderRadius: 4 },

  // ── Actions ───────────────────────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 26,
    paddingBottom: 28,
    paddingTop: 12,
  },
  backBtn: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText:        { fontSize: 20, fontWeight: '700' },
  backBtnPlaceholder: { width: 46 },

  nextBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.35,
    shadowRadius: 0,
    elevation: 5,
    borderBottomWidth: 4,
  },
  nextBtnText: { color: 'white', fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
});
