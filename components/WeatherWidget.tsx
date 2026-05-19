import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { fetchWeather, getOutfitSuggestion, WeatherData } from '../services/weather';
import { weatherCache } from '../utils/weatherCache';

interface Props {
  childName: string;
  childNames?: string[];
  theme: any;
  onPress?: () => void;
}

const joinChildNames = (names: string[]): string => {
  const valid = names.filter(Boolean);
  if (valid.length === 0) return '';
  if (valid.length === 1) return valid[0];
  if (valid.length === 2) return `${valid[0]} and ${valid[1]}`;
  return `${valid.slice(0, -1).join(', ')} and ${valid[valid.length - 1]}`;
};

export default function WeatherWidget({ childName, childNames, theme, onPress }: Props) {
  const displayName = childNames && childNames.length > 0 ? joinChildNames(childNames) : childName;
  const [weather,  setWeather]  = useState<WeatherData | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadWeather();
  }, []);

  const loadWeather = async (forceRefresh = false) => {
    // ── Use session cache unless user manually refreshes ──────────────────
    if (!forceRefresh && weatherCache.hasFetched()) {
      const cached = weatherCache.get();
      if (cached) {
        setWeather(cached as unknown as WeatherData);
        setLoading(false);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
        return;
      }
    }

    setLoading(true);
    setError(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setError(true); setLoading(false); return; }

      const loc  = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const data = await fetchWeather(loc.coords.latitude, loc.coords.longitude);

      if (data) {
        weatherCache.set(data as any); // store in session cache
        setWeather(data);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    }
    setLoading(false);
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: theme.botBubble, shadowColor: theme.botBubbleShadow }]}>
        <ActivityIndicator size="small" color={theme.header} />
        <Text style={[styles.loadingText, { color: theme.subText }]}>Fetching weather…</Text>
      </View>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error || !weather) {
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.botBubble, shadowColor: theme.botBubbleShadow }]}
        onPress={() => loadWeather(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.errorEmoji}>🌐</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.errorTitle, { color: theme.cardText }]}>Weather unavailable</Text>
          <Text style={[styles.errorSub,   { color: theme.subText }]}>Tap to retry</Text>
        </View>
      </TouchableOpacity>
    );
  }

  const outfit = getOutfitSuggestion(weather, displayName);

  // ── Weather card ──────────────────────────────────────────────────────────
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[styles.card, { backgroundColor: theme.botBubble, shadowColor: theme.botBubbleShadow }]}
        onPress={onPress || (() => loadWeather(true))}
        activeOpacity={0.88}
      >
        {/* Top row — icon, temp, location */}
        <View style={styles.topRow}>
          <Text style={styles.weatherIcon}>{weather.icon}</Text>
          <View style={{ flex: 1 }}>
            <View style={styles.tempRow}>
              <Text style={[styles.temp, { color: theme.cardText }]}>{weather.temp}°C</Text>
              <Text style={[styles.hiLo, { color: theme.subText }]}>
                ↑{weather.high}° ↓{weather.low}°
              </Text>
            </View>
            <Text style={[styles.location, { color: theme.subText }]}>
              {weather.city}, {weather.country}
            </Text>
            <Text style={[styles.description, { color: theme.cardSubText }]}>
              {weather.description} · Feels like {weather.feelsLike}°C
            </Text>
          </View>
          <View style={[styles.refreshBtn, { backgroundColor: theme.header + '22' }]}>
            <Text style={{ fontSize: 14 }}>🔄</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: theme.quickQuestionsBorder }]} />

        {/* Outfit suggestion */}
        <Text style={[styles.outfitText, { color: theme.cardText }]}>{outfit}</Text>

        {/* Disclaimer */}
        <Text style={[styles.disclaimer, { color: theme.subText }]}>
          ⚠️ Weather conditions may change later
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20, padding: 16, marginBottom: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
    flexDirection: 'column',
  },
  loadingText: { fontSize: 13, marginTop: 8, textAlign: 'center', fontStyle: 'italic' },
  errorEmoji:  { fontSize: 28, marginRight: 12 },
  errorTitle:  { fontSize: 14, fontWeight: '600' },
  errorSub:    { fontSize: 12, marginTop: 2 },

  topRow:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  weatherIcon:  { fontSize: 40, marginRight: 12 },
  tempRow:      { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  temp:         { fontSize: 28, fontWeight: '800' },
  hiLo:         { fontSize: 13 },
  location:     { fontSize: 13, fontWeight: '600', marginTop: 2 },
  description:  { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  refreshBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },

  divider:     { height: 1, marginBottom: 10 },
  outfitText:  { fontSize: 13, lineHeight: 20 },
  disclaimer:  { fontSize: 11, marginTop: 8, fontStyle: 'italic', opacity: 0.7 },
});
