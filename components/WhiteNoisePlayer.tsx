import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SOUNDS, TIMERS } from '../constants/sounds';

interface Props {
  theme: any;
}

export default function WhiteNoisePlayer({ theme }: Props) {
  const [selectedSound, setSelectedSound] = useState(SOUNDS[0]);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [volume,        setVolume]        = useState(0.8);
  const [selectedTimer, setSelectedTimer] = useState(TIMERS[3]); // ∞ default
  const [timeLeft,      setTimeLeft]      = useState(0);
  const [loading,       setLoading]       = useState(false);
  const soundRef  = useRef<Audio.Sound | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse while playing
  useEffect(() => {
    if (isPlaying) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, useNativeDriver: true, duration: 900 }),
          Animated.timing(pulseAnim, { toValue: 1,    useNativeDriver: true, duration: 900 }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1, useNativeDriver: true, duration: 200 }).start();
    }
  }, [isPlaying]);

  // Audio mode setup
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
    });
    return () => { stopSound(); };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isPlaying && selectedTimer.minutes > 0) {
      setTimeLeft(selectedTimer.minutes * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            stopSound();
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, selectedTimer]);

  const stopSound = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const togglePlay = async () => {
    if (isPlaying) { await stopSound(); return; }
    setLoading(true);
    try {
      const { sound } = await Audio.Sound.createAsync(
        selectedSound.url,
        { shouldPlay: true, isLooping: true, volume }
      );
      soundRef.current = sound;
      setIsPlaying(true);
    } catch {
      Alert.alert('Oops!', 'Could not load sound. Please check your connection 🌐');
    }
    setLoading(false);
  };

  const handleSoundSelect = async (s: typeof SOUNDS[0]) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) await stopSound();
    setSelectedSound(s);
    if (wasPlaying) {
      setLoading(true);
      try {
        const { sound } = await Audio.Sound.createAsync(
          s.url,
          { shouldPlay: true, isLooping: true, volume }
        );
        soundRef.current = sound;
        setIsPlaying(true);
      } catch {}
      setLoading(false);
    }
  };

  const handleVolumeChange = async (val: number) => {
    setVolume(val);
    if (soundRef.current) await soundRef.current.setVolumeAsync(val);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const accentColor = theme.header;

  return (
    <View style={[styles.container, { backgroundColor: theme.botBubble, borderColor: theme.inputBorder }]}>
      <View style={styles.titleRow}>
        <Text style={styles.titleEmoji}>😴</Text>
        <Text style={[styles.title, { color: theme.cardText }]}>White Noise</Text>
        {isPlaying && timeLeft > 0 && (
          <View style={[styles.timerBadge, { backgroundColor: accentColor }]}>
            <Text style={styles.timerBadgeText}>{formatTime(timeLeft)}</Text>
          </View>
        )}
      </View>

      {/* Sound selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
        {SOUNDS.map((s) => (
          <TouchableOpacity
            key={s.id}
            onPress={() => handleSoundSelect(s)}
            style={[styles.soundBtn, {
              backgroundColor: selectedSound.id === s.id ? accentColor : theme.background,
              borderColor: accentColor,
            }]}
          >
            <Text style={styles.soundEmoji}>{s.emoji}</Text>
            <Text style={[styles.soundLabel, {
              color: selectedSound.id === s.id ? 'white' : theme.cardText,
            }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Play button + volume */}
      <View style={styles.playRow}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            onPress={togglePlay}
            disabled={loading}
            style={[styles.playBtn, { backgroundColor: accentColor }]}
          >
            <Text style={styles.playBtnText}>
              {loading ? '⏳' : isPlaying ? '⏸' : '▶'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <Text style={[styles.volumeLabel, { color: theme.cardSubText }]}>🔊 Volume</Text>
          <View style={styles.volumeRow}>
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => handleVolumeChange(v)}
                style={[styles.volumeDot, {
                  backgroundColor: volume >= v ? accentColor : theme.quickQuestionsBorder,
                  width:  10 + v * 14,
                  height: 10 + v * 14,
                }]}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Timer selector */}
      <View style={styles.timerRow}>
        <Text style={[styles.timerLabel, { color: theme.cardSubText }]}>⏱</Text>
        {TIMERS.map((t) => (
          <TouchableOpacity
            key={t.label}
            onPress={() => setSelectedTimer(t)}
            style={[styles.timerBtn, {
              backgroundColor: selectedTimer.label === t.label ? accentColor : theme.background,
              borderColor: accentColor,
            }]}
          >
            <Text style={[styles.timerBtnText, {
              color: selectedTimer.label === t.label ? 'white' : theme.cardText,
            }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isPlaying && (
        <Text style={[styles.nowPlaying, { color: theme.subText }]}>
          {selectedSound.emoji} {selectedSound.label}
          {selectedTimer.minutes > 0 ? ` · ${formatTime(timeLeft)} left` : ' · playing until stopped'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20, padding: 16, marginHorizontal: 12, marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  titleRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 8 },
  titleEmoji:    { fontSize: 22 },
  title:         { fontSize: 16, fontWeight: '700', flex: 1 },
  timerBadge:    { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  timerBadgeText:{ color: 'white', fontSize: 13, fontWeight: '700' },

  soundBtn: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16,
    marginRight: 8, borderWidth: 1.5, minWidth: 72,
  },
  soundEmoji:  { fontSize: 22, marginBottom: 4 },
  soundLabel:  { fontSize: 11, fontWeight: '600' },

  playRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  playBtn: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  playBtnText: { fontSize: 22, color: 'white' },
  volumeLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  volumeRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  volumeDot:   { borderRadius: 20 },

  timerRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  timerLabel:   { fontSize: 16 },
  timerBtn:     { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5 },
  timerBtnText: { fontSize: 13, fontWeight: '600' },

  nowPlaying: { fontSize: 12, fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
});
