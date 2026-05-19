import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyzeImageWithPrompt } from '../services/vision';
import ChildSelector from './ChildSelector';

const storageKey = (childName: string) =>
  `school_schedule_v1_${childName.trim().toLowerCase() || 'default'}`;

interface SchoolEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  category: 'exam' | 'holiday' | 'sports' | 'cultural' | 'parent' | 'other';
  notifIds?: string[]; // [3-day-before id, 1-day-before id]
}

const CATEGORY_CONFIG: Record<SchoolEvent['category'], { emoji: string; color: string; label: string }> = {
  exam:     { emoji: '📝', color: '#EDE4FF', label: 'Exam'      },
  holiday:  { emoji: '🎉', color: '#FFF3CD', label: 'Holiday'   },
  sports:   { emoji: '⚽', color: '#D4EDDA', label: 'Sports'    },
  cultural: { emoji: '🎭', color: '#FFE4EE', label: 'Cultural'  },
  parent:   { emoji: '👨‍👩‍👧', color: '#D1ECF1', label: 'Parents'  },
  other:    { emoji: '📅', color: '#F0F0F0', label: 'Event'     },
};

const PREP_MESSAGES: Record<SchoolEvent['category'], (child: string, title: string) => string> = {
  sports:   (c, t) => `Have you organised all the sports gear for ${c}'s ${t}? Check uniform, shoes and equipment.`,
  exam:     (c, t) => `Is ${c} prepared for their ${t}? Set aside time tonight to go over notes and revision.`,
  cultural: (c, t) => `${c}'s ${t} is in 3 days — have you sorted the costume, props or any cultural items needed?`,
  parent:   (c, t) => `${t} is coming up — have you confirmed your attendance and arranged anything needed?`,
  holiday:  (c, t) => `${t} is just 3 days away! Any plans to make it special for ${c}?`,
  other:    (c, t) => `${c}'s ${t} is in 3 days — is everything organised and ready?`,
};

const SCAN_PROMPT = `This is a school year schedule or calendar. Extract ALL events, dates, holidays, exams, sports days, cultural days, parent meetings, and activities visible.

Return ONLY a valid JSON array. No explanation, no markdown, just the raw JSON array.

Format: [{"title":"Event Name","date":"YYYY-MM-DD","category":"exam|holiday|sports|cultural|parent|other"}]

Rules:
- Use the current or upcoming school year (2025 or 2026) for dates
- If only a month and day are visible, use 2025 or 2026 as appropriate
- category must be exactly one of: exam, holiday, sports, cultural, parent, other
- Include every visible event, even minor ones
- If a date range is given, create one entry for the start date`;

interface Props {
  childName: string;
  childNames?: string[];
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

export default function SchoolScheduleScanner({ childName, childNames = [], theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const allChildren = childNames.length > 0 ? childNames : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || allChildren[0] || '');
  const [imageUri, setImageUri]       = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [events, setEvents]           = useState<SchoolEvent[]>([]);
  const [loadError, setLoadError]     = useState('');

  const bg       = isDarkMode ? '#111111' : theme.background;
  const cardBg   = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol  = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol   = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const accent   = theme.header ?? '#5B8FA8';

  useEffect(() => {
    AsyncStorage.getItem(storageKey(selectedChild)).then((val) => {
      setEvents(val ? JSON.parse(val) : []);
    });
  }, [selectedChild]);

  const persist = async (next: SchoolEvent[]) => {
    setEvents(next);
    await AsyncStorage.setItem(storageKey(selectedChild), JSON.stringify(next));
  };

  const pickImage = async (fromCamera: boolean) => {
    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.9, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 ?? null);
      setLoadError('');
    }
  };

  const scanSchedule = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setLoadError('');

    try {
      const result = await analyzeImageWithPrompt(imageBase64, SCAN_PROMPT, 'image/jpeg', 2500, 'gpt-4o-mini');
      if (!result.success) throw new Error(result.fallback);

      // Extract JSON array from response — handle markdown code blocks
      const raw  = result.data.trim();
      const json = raw.startsWith('[') ? raw : raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1);
      const parsed: any[] = JSON.parse(json);

      const newEvents: SchoolEvent[] = parsed
        .filter((e) => e.title && e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date))
        .map((e) => ({
          id:       `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          title:    String(e.title).trim(),
          date:     e.date,
          category: (['exam','holiday','sports','cultural','parent','other'].includes(e.category)
            ? e.category : 'other') as SchoolEvent['category'],
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Merge with existing — keep existing reminders, replace duplicate dates+titles
      const merged = [...events];
      for (const ev of newEvents) {
        const idx = merged.findIndex((e) => e.title === ev.title && e.date === ev.date);
        if (idx === -1) merged.push(ev);
      }
      merged.sort((a, b) => a.date.localeCompare(b.date));
      await persist(merged);
      setImageUri(null);
      setImageBase64(null);
    } catch (e: any) {
      setLoadError("Couldn't read the schedule. Try a clearer photo with better lighting.");
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (ev: SchoolEvent) => {
    if (ev.notifIds?.length) {
      await Promise.all(ev.notifIds.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
      await persist(events.map((e) => e.id === ev.id ? { ...e, notifIds: undefined } : e));
      return;
    }

    const cfg   = CATEGORY_CONFIG[ev.category];
    const child = selectedChild || 'your child';
    const now   = new Date();
    const ids: string[] = [];

    try {
      // 3 days before at 8 AM — actionable prep reminder
      const threeDayBefore = new Date(ev.date + 'T08:00:00');
      threeDayBefore.setDate(threeDayBefore.getDate() - 3);
      if (threeDayBefore > now) {
        ids.push(await Notifications.scheduleNotificationAsync({
          content: {
            title:  `${cfg.emoji} ${ev.title} — 3 days to go`,
            body:   PREP_MESSAGES[ev.category](child, ev.title),
            sound:  false,
            data:   { type: 'school_event', eventId: ev.id },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: threeDayBefore },
        }));
      }

      // 1 day before at 8 AM — final reminder
      const oneDayBefore = new Date(ev.date + 'T08:00:00');
      oneDayBefore.setDate(oneDayBefore.getDate() - 1);
      if (oneDayBefore > now) {
        ids.push(await Notifications.scheduleNotificationAsync({
          content: {
            title:  `${cfg.emoji} Tomorrow: ${ev.title}`,
            body:   `Last reminder — ${child}'s ${ev.title} is tomorrow. You've got this! 💪`,
            sound:  true,
            data:   { type: 'school_event', eventId: ev.id },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: oneDayBefore },
        }));
      }

      if (ids.length === 0) {
        Alert.alert('Too soon', 'This event is today or has already passed.');
        return;
      }
      await persist(events.map((e) => e.id === ev.id ? { ...e, notifIds: ids } : e));
    } catch {
      Alert.alert('Error', 'Could not set reminders for this event.');
    }
  };

  const deleteEvent = (ev: SchoolEvent) => {
    Alert.alert('Remove event', `Remove "${ev.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          if (ev.notifIds?.length) ev.notifIds.forEach((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {}));
          await persist(events.filter((e) => e.id !== ev.id));
        },
      },
    ]);
  };

  // Group events by month
  const grouped = events.reduce<Record<string, SchoolEvent[]>>((acc, ev) => {
    const month = ev.date.slice(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = [];
    acc[month].push(ev);
    return acc;
  }, {});

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'long' });
  };

  const formatMonth = (ym: string) => {
    const d = new Date(ym + '-01T12:00:00');
    return d.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });
  };

  const isPast = (iso: string) => new Date(iso + 'T23:59:00') < new Date();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{
        backgroundColor: accent,
        paddingTop: Platform.OS === 'android' ? insets.top + 16 : 20,
        paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        shadowColor: accent, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
      }}>
        <TouchableOpacity onPress={onClose} style={{ marginRight: 12 }}>
          <Text style={{ fontSize: 22, color: 'white' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>📅 School Year Planner</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            Scan your school calendar · Set event reminders
          </Text>
        </View>
        {events.length > 0 && (
          <View style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}>
            <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>{events.length} events</Text>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <ChildSelector
          childNames={allChildren} selected={selectedChild}
          onSelect={(n) => { setSelectedChild(n); setImageUri(null); setImageBase64(null); }}
          accentColor={accent} isDarkMode={isDarkMode}
        />

        {/* Scan card */}
        <View style={{
          backgroundColor: cardBg, borderRadius: 20, padding: 18, marginBottom: 20,
          borderWidth: 1, borderColor: isDarkMode ? '#2A2A2A' : '#EEEEEE',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: textCol, marginBottom: 4 }}>
            📸 Scan a New Schedule
          </Text>
          <Text style={{ fontSize: 12, color: subCol, marginBottom: 14, lineHeight: 18 }}>
            Take a photo of your school's year planner or pick one from your gallery. AI will extract all the events automatically.
          </Text>

          {imageUri ? (
            <View>
              <Image source={{ uri: imageUri }} style={{ width: '100%', height: 180, borderRadius: 14, marginBottom: 12 }} resizeMode="cover" />
              {loadError ? (
                <View style={{ backgroundColor: '#FEE2E2', borderRadius: 12, padding: 12, marginBottom: 12 }}>
                  <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600' }}>{loadError}</Text>
                </View>
              ) : null}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  onPress={scanSchedule}
                  disabled={loading}
                  style={{
                    flex: 1, backgroundColor: accent, borderRadius: 14,
                    paddingVertical: 13, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
                    borderBottomWidth: 3, borderBottomColor: accent + 'AA',
                  }}
                >
                  {loading
                    ? <ActivityIndicator size="small" color="white" />
                    : <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>✨ Extract Events</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { setImageUri(null); setImageBase64(null); setLoadError(''); }}
                  style={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0', borderRadius: 14, paddingHorizontal: 16, justifyContent: 'center' }}
                >
                  <Text style={{ color: subCol, fontWeight: '700', fontSize: 13 }}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => pickImage(true)}
                style={{
                  flex: 1, backgroundColor: accent + '15', borderRadius: 14,
                  paddingVertical: 14, alignItems: 'center', gap: 4,
                  borderWidth: 1.5, borderColor: accent + '40',
                }}
              >
                <Text style={{ fontSize: 24 }}>📷</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => pickImage(false)}
                style={{
                  flex: 1, backgroundColor: accent + '15', borderRadius: 14,
                  paddingVertical: 14, alignItems: 'center', gap: 4,
                  borderWidth: 1.5, borderColor: accent + '40',
                }}
              >
                <Text style={{ fontSize: 24 }}>🖼️</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: accent }}>Gallery</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Event list */}
        {events.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Text style={{ fontSize: 52, marginBottom: 14 }}>📅</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textCol, marginBottom: 8 }}>No events yet</Text>
            <Text style={{ fontSize: 12, color: subCol, textAlign: 'center', lineHeight: 18, paddingHorizontal: 24 }}>
              Scan your school's year planner above and all events will appear here, grouped by month.
            </Text>
          </View>
        ) : (
          Object.entries(grouped).map(([month, monthEvents]) => (
            <View key={month} style={{ marginBottom: 8 }}>
              {/* Month header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: accent, letterSpacing: 0.4 }}>
                  {formatMonth(month).toUpperCase()}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: isDarkMode ? '#2A2A2A' : '#EBEBEB' }} />
              </View>

              {monthEvents.map((ev) => {
                const cfg     = CATEGORY_CONFIG[ev.category];
                const past    = isPast(ev.date);
                const hasAlarm = !!ev.notifIds?.length;

                return (
                  <View
                    key={ev.id}
                    style={{
                      backgroundColor: isDarkMode ? '#1A1A1A' : cfg.color,
                      borderRadius: 16, padding: 14, marginBottom: 8,
                      flexDirection: 'row', alignItems: 'center', gap: 12,
                      opacity: past ? 0.5 : 1,
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#2A2A2A' : 'rgba(0,0,0,0.05)',
                    }}
                  >
                    {/* Category emoji */}
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 20 }}>{cfg.emoji}</Text>
                    </View>

                    {/* Info */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? '#EEE' : '#1A1A1A', marginBottom: 2 }} numberOfLines={2}>
                        {ev.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 11, color: subCol, fontWeight: '600' }}>
                          {formatDate(ev.date)}
                        </Text>
                        <View style={{ backgroundColor: 'rgba(0,0,0,0.08)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: isDarkMode ? '#AAA' : '#555' }}>
                            {cfg.label.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Reminder bell */}
                    {!past && (
                      <TouchableOpacity
                        onPress={() => toggleReminder(ev)}
                        style={{
                          width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                          backgroundColor: hasAlarm ? accent : (isDarkMode ? '#2A2A2A' : 'rgba(255,255,255,0.7)'),
                        }}
                      >
                        <Text style={{ fontSize: 16 }}>{hasAlarm ? '🔔' : '🔕'}</Text>
                      </TouchableOpacity>
                    )}

                    {/* Delete */}
                    <TouchableOpacity
                      onPress={() => deleteEvent(ev)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ fontSize: 16, opacity: 0.4 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
