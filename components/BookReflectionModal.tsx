import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { cancelNovelReminder, cancelUnfinishedReadReminder } from '../utils/notifications';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface Reflection {
  novelId: string;
  novelTitle: string;
  moodEmoji: string;
  moodLabel: string;
  question: string;
  answer: string;
  takeaway: string;
  date: string;
}

const MOODS = [
  { emoji: '🥹', label: 'Moved' },
  { emoji: '💕', label: 'Warm' },
  { emoji: '✨', label: 'Inspired' },
  { emoji: '🤔', label: 'Thoughtful' },
  { emoji: '😂', label: 'Joyful' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '💔', label: 'Heartbroken' },
  { emoji: '🌟', label: 'Uplifted' },
  { emoji: '😌', label: 'Peaceful' },
  { emoji: '🔥', label: 'Fired up' },
];

const BOOK_QUESTIONS: Record<string, string> = {
  pride:            'Which character reminded you most of yourself — and why?',
  jane_eyre:        "What did Jane's resilience teach you about your own strength?",
  little_women:     'Which of the March sisters are you most like?',
  secret_garden:    'What hidden garden in your own life needs tending?',
  sense:            'Heart or head — which guides you more in life?',
  wuthering:        "Have you ever loved something that wasn't good for you?",
  night_feed:       'What would you whisper to a new mother in the 3am quiet?',
  village_mum:      "Who is your 'village mum' — the one who just gets it?",
  her_story:        'What passion have you been quietly putting off for yourself?',
  first_day_back:   'What part of yourself comes alive when you get time alone?',
  saturday_morning: "What's your favourite chaotic, beautiful moment with your children?",
  the_group_chat:   'Who in your life turned out to be an unexpected ally?',
  letting_go:       "What's one thing you're slowly, bravely learning to let go of?",
};

// ── Sparkle particle ──────────────────────────────────────────────────────────
function Sparkle({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const v = useRef({
    angle:  Math.random() * Math.PI * 2,
    dist:   80 + Math.random() * 90,
    size:   14 + Math.random() * 14,
    symbol: ['✨', '⭐', '💫', '🌟', '🎊', '✦'][Math.floor(Math.random() * 6)],
  }).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.Text style={{
      position: 'absolute',
      fontSize: v.size,
      opacity: anim.interpolate({ inputRange: [0, 0.15, 0.65, 1], outputRange: [0, 1, 1, 0] }),
      transform: [
        { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(v.angle) * v.dist] }) },
        { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(v.angle) * v.dist] }) },
        { scale: anim.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0.3, 1.6, 1] }) },
      ],
    }}>
      {v.symbol}
    </Animated.Text>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  novel: { id: string; title: string; cover: string; color: string; textColor: string } | null;
  accentColor: string;
  isDarkMode: boolean;
  onClose: () => void;
  onReflected: (novelId: string) => void;
}

export default function BookReflectionModal({ visible, novel, accentColor, isDarkMode, onClose, onReflected }: Props) {
  const [step, setStep] = useState(0);
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null);
  const [answer, setAnswer] = useState('');
  const [takeaway, setTakeaway] = useState('');

  const cardAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setStep(0);
      setSelectedMood(null);
      setAnswer('');
      setTakeaway('');
      cardAnim.setValue(0);
      checkAnim.setValue(0);
      Animated.spring(cardAnim, {
        toValue: 1, useNativeDriver: true, tension: 55, friction: 9,
      }).start();
    }
  }, [visible]);

  const transitionTo = (next: number) => {
    Animated.timing(stepAnim, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setStep(next);
      stepAnim.setValue(0);
      Animated.timing(stepAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      if (next === 3) {
        Animated.spring(checkAnim, {
          toValue: 1, useNativeDriver: true, tension: 50, friction: 8,
        }).start();
      }
    });
  };

  const handleSave = async () => {
    if (!novel) return;
    const reflection: Reflection = {
      novelId: novel.id,
      novelTitle: novel.title,
      moodEmoji: selectedMood?.emoji ?? '',
      moodLabel: selectedMood?.label ?? '',
      question: BOOK_QUESTIONS[novel.id] ?? 'What moment in this story stayed with you the most?',
      answer,
      takeaway,
      date: new Date().toISOString(),
    };
    const existing = await AsyncStorage.getItem('book_reflections_v1');
    const all: Reflection[] = existing ? JSON.parse(existing) : [];
    const updated = [...all.filter((r) => r.novelId !== novel.id), reflection];
    await AsyncStorage.setItem('book_reflections_v1', JSON.stringify(updated));
    await AsyncStorage.setItem(`novel_reflected_${novel.id}`, 'true');
    await cancelNovelReminder();
    await cancelUnfinishedReadReminder();
    onReflected(novel.id);
    transitionTo(3);
  };

  if (!novel) return null;

  const bookQuestion = BOOK_QUESTIONS[novel.id] ?? 'What moment in this story stayed with you the most?';
  const canContinue = (step === 0 && !!selectedMood) || (step === 1 && answer.trim().length > 0) || step === 2;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <BlurView
        intensity={70}
        tint={isDarkMode ? 'dark' : 'light'}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
      >
        <Animated.View style={{
          width: '100%',
          maxWidth: 390,
          borderRadius: 28,
          overflow: 'hidden',
          backgroundColor: '#FFF',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.28,
          shadowRadius: 28,
          elevation: 20,
          opacity: cardAnim,
          transform: [
            { scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.84, 1] }) },
            { translateY: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
          ],
        }}>
          {/* Gradient header */}
          <LinearGradient
            colors={[novel.color, '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 28, paddingBottom: 22, paddingHorizontal: 24, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 40, marginBottom: 8 }}>{novel.cover}</Text>
            <Text style={{ fontSize: 10, fontWeight: '800', color: novel.textColor, letterSpacing: 1, opacity: 0.6 }}>
              {novel.title.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 18, fontWeight: '900', color: novel.textColor, marginTop: 5, textAlign: 'center' }}>
              📓 Your Reflection
            </Text>

            {/* Step dots */}
            {step < 3 && (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 16 }}>
                {[0, 1, 2].map((i) => (
                  <Animated.View key={i} style={{
                    height: 8, borderRadius: 4,
                    width: i === step ? 22 : 8,
                    backgroundColor: i <= step ? accentColor : (novel.textColor + '25'),
                  }} />
                ))}
              </View>
            )}
          </LinearGradient>

          {/* Step content */}
          <Animated.View style={{
            opacity: stepAnim,
            transform: [{ translateX: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            paddingHorizontal: 24,
            paddingTop: 22,
            minHeight: 230,
          }}>

            {/* Step 0 — Mood */}
            {step === 0 && (
              <View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 3 }}>
                  How did this book make you feel?
                </Text>
                <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 18 }}>
                  Pick the one that fits best
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
                  {MOODS.map((mood) => {
                    const selected = selectedMood?.emoji === mood.emoji;
                    return (
                      <TouchableOpacity
                        key={mood.emoji}
                        onPress={() => setSelectedMood(mood)}
                        activeOpacity={0.8}
                        style={{
                          alignItems: 'center',
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          borderRadius: 16,
                          borderWidth: 2,
                          borderColor: selected ? accentColor : 'transparent',
                          backgroundColor: selected ? accentColor + '18' : '#F5F5F5',
                          minWidth: 62,
                          transform: [{ scale: selected ? 1.1 : 1 }],
                        }}
                      >
                        <Text style={{ fontSize: 26 }}>{mood.emoji}</Text>
                        <Text style={{ fontSize: 9, fontWeight: '700', color: selected ? accentColor : '#999', marginTop: 4 }}>
                          {mood.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Step 1 — Book question */}
            {step === 1 && (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', lineHeight: 22, marginBottom: 4 }}>
                  {bookQuestion}
                </Text>
                <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 16 }}>
                  There's no right answer — just yours
                </Text>
                <TextInput
                  value={answer}
                  onChangeText={setAnswer}
                  multiline
                  placeholder="Write your thoughts here..."
                  placeholderTextColor="#CCC"
                  style={{
                    backgroundColor: '#F8F8F8',
                    borderRadius: 16,
                    padding: 14,
                    fontSize: 14,
                    color: '#1A1A1A',
                    lineHeight: 22,
                    borderWidth: 1.5,
                    borderColor: answer.trim() ? accentColor + '70' : '#EAEAEA',
                    minHeight: 110,
                    textAlignVertical: 'top',
                  }}
                />
              </KeyboardAvoidingView>
            )}

            {/* Step 2 — Takeaway */}
            {step === 2 && (
              <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', marginBottom: 4 }}>
                  One thing I'm taking away from this...
                </Text>
                <Text style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 16 }}>
                  A word, a feeling, or an intention
                </Text>
                <TextInput
                  value={takeaway}
                  onChangeText={setTakeaway}
                  multiline
                  placeholder={`e.g. "to be more patient", "call my sister", "courage"...`}
                  placeholderTextColor="#CCC"
                  style={{
                    backgroundColor: '#F8F8F8',
                    borderRadius: 16,
                    padding: 14,
                    fontSize: 14,
                    color: '#1A1A1A',
                    lineHeight: 22,
                    borderWidth: 1.5,
                    borderColor: takeaway.trim() ? accentColor + '70' : '#EAEAEA',
                    minHeight: 90,
                    textAlignVertical: 'top',
                  }}
                />
              </KeyboardAvoidingView>
            )}

            {/* Step 3 — Celebration */}
            {step === 3 && (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                {/* Sparkle burst */}
                <View style={{ width: 100, height: 100, alignItems: 'center', justifyContent: 'center' }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <Sparkle key={i} delay={i * 35} />
                  ))}
                  <Animated.Text style={{
                    fontSize: 44,
                    transform: [{ scale: checkAnim.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 1.25, 1] }) }],
                    opacity: checkAnim,
                  }}>
                    📓
                  </Animated.Text>
                </View>

                <Animated.View style={{ opacity: checkAnim, alignItems: 'center', marginTop: 12 }}>
                  <Text style={{ fontSize: 20, fontWeight: '900', color: '#1A1A1A', marginBottom: 6 }}>
                    Reflection Saved ✓
                  </Text>
                  <Text style={{ fontSize: 13, color: '#999', textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 }}>
                    Your thoughts have been saved. You can revisit them anytime from the library.
                  </Text>
                  {selectedMood && (
                    <View style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
                      backgroundColor: accentColor + '18', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                    }}>
                      <Text style={{ fontSize: 18 }}>{selectedMood.emoji}</Text>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: accentColor }}>
                        You felt {selectedMood.label.toLowerCase()}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              </View>
            )}
          </Animated.View>

          {/* Buttons */}
          <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, gap: 10 }}>
            {step < 2 && (
              <TouchableOpacity
                onPress={() => transitionTo(step + 1)}
                disabled={!canContinue}
                activeOpacity={0.85}
                style={{
                  backgroundColor: canContinue ? accentColor : '#E8E8E8',
                  borderRadius: 16, paddingVertical: 15, alignItems: 'center',
                  shadowColor: canContinue ? accentColor : 'transparent',
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.4, shadowRadius: 10, elevation: canContinue ? 6 : 0,
                  borderBottomWidth: 4,
                  borderBottomColor: canContinue ? accentColor + 'BB' : '#D8D8D8',
                }}
              >
                <Text style={{ color: canContinue ? '#FFF' : '#BBB', fontSize: 15, fontWeight: '800' }}>
                  Continue →
                </Text>
              </TouchableOpacity>
            )}

            {step === 2 && (
              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.85}
                style={{
                  backgroundColor: accentColor,
                  borderRadius: 16, paddingVertical: 15, alignItems: 'center',
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
                  borderBottomWidth: 4, borderBottomColor: accentColor + 'BB',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>
                  Save Reflection ✓
                </Text>
              </TouchableOpacity>
            )}

            {step === 3 && (
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.85}
                style={{
                  backgroundColor: accentColor,
                  borderRadius: 16, paddingVertical: 15, alignItems: 'center',
                  borderBottomWidth: 4, borderBottomColor: accentColor + 'BB',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>
                  Back to Reading
                </Text>
              </TouchableOpacity>
            )}

            {step < 3 && (
              <TouchableOpacity
                onPress={step === 0 ? onClose : () => transitionTo(step - 1)}
                style={{ alignItems: 'center', paddingVertical: 8 }}
              >
                <Text style={{ color: '#BBB', fontSize: 13 }}>
                  {step === 0 ? 'Maybe later' : '← Back'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}
