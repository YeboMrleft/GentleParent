import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── SA School Terms 2026 ──────────────────────────────────────────────────────
const TERMS_2026 = [
  { term: 1, start: new Date(2026, 0, 14), end: new Date(2026, 2, 27), color: '#E91E63', bg: '#FCE4EC', label: 'Term 1' },
  { term: 2, start: new Date(2026, 3, 14), end: new Date(2026, 5, 26), color: '#2196F3', bg: '#E3F2FD', label: 'Term 2' },
  { term: 3, start: new Date(2026, 6, 14), end: new Date(2026, 8, 25), color: '#FF9800', bg: '#FFF3E0', label: 'Term 3' },
  { term: 4, start: new Date(2026, 9, 6),  end: new Date(2026, 11, 4), color: '#4CAF50', bg: '#E8F5E9', label: 'Term 4' },
];

const PUBLIC_HOLIDAYS = [
  { date: new Date(2026, 2, 21), name: 'Human Rights Day',       emoji: '✊' },
  { date: new Date(2026, 3, 3),  name: 'Good Friday',           emoji: '✝️' },
  { date: new Date(2026, 3, 6),  name: 'Family Day',            emoji: '👨‍👩‍👧' },
  { date: new Date(2026, 3, 27), name: 'Freedom Day',           emoji: '🇿🇦' },
  { date: new Date(2026, 4, 1),  name: "Workers' Day",          emoji: '⚒️' },
  { date: new Date(2026, 5, 16), name: 'Youth Day',             emoji: '🌟' },
  { date: new Date(2026, 7, 9),  name: "National Women's Day",  emoji: '💪' },
  { date: new Date(2026, 8, 24), name: 'Heritage Day',          emoji: '🌍' },
  { date: new Date(2026, 11, 16), name: 'Day of Reconciliation', emoji: '🕊️' },
  { date: new Date(2026, 11, 25), name: 'Christmas Day',        emoji: '🎄' },
];

const EVENTS_KEY = 'term_planner_events_v1';

interface CustomEvent {
  id: string;
  date: string;
  label: string;
  termIndex: number;
}

const fmt = (d: Date) =>
  d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });

// Parse YYYY-MM-DD as local midnight (avoids UTC-shift off-by-one)
const parseLocalDate = (iso: string): Date => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const daysBetween = (a: Date, b: Date) =>
  Math.max(0, Math.ceil((b.getTime() - a.getTime()) / 86400000));

const getCurrentTerm = () => {
  const now = new Date();
  for (let i = 0; i < TERMS_2026.length; i++) {
    const t = TERMS_2026[i];
    if (now >= t.start && now <= t.end) return i;
  }
  return -1;
};

const getNextTerm = () => {
  const now = new Date();
  for (let i = 0; i < TERMS_2026.length; i++) {
    if (TERMS_2026[i].start > now) return i;
  }
  return -1;
};

interface Props {
  childName: string;
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

export default function TermPlanner({ childName, theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<CustomEvent[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newDate, setNewDate] = useState('');
  const [selectedTermIdx, setSelectedTermIdx] = useState(0);
  const [addError, setAddError] = useState('');

  const bg       = isDarkMode ? '#111111' : theme.background;
  const cardBg   = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol  = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol   = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;

  React.useEffect(() => {
    AsyncStorage.getItem(EVENTS_KEY).then((val) => {
      if (val) try { setEvents(JSON.parse(val)); } catch {}
    });
  }, []);

  const saveEvents = async (next: CustomEvent[]) => {
    setEvents(next);
    await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(next));
  };

  const addEvent = async () => {
    setAddError('');
    if (!newLabel.trim()) { setAddError('Please enter an event name'); return; }
    const parts = newDate.trim().split('/');
    if (parts.length !== 3 || parts.some((p) => !p || isNaN(Number(p)))) {
      setAddError('Use DD/MM/YYYY format');
      return;
    }
    const [dd, mm, yyyy] = parts.map(Number);
    const parsed = new Date(yyyy, mm - 1, dd);
    if (isNaN(parsed.getTime())) { setAddError('Invalid date'); return; }

    const ev: CustomEvent = {
      id: `ev_${Date.now()}`,
      date: `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`,
      label: newLabel.trim(),
      termIndex: selectedTermIdx,
    };
    await saveEvents([...events, ev]);
    setShowAddModal(false);
    setNewLabel('');
    setNewDate('');
  };

  const removeEvent = async (id: string) => {
    await saveEvents(events.filter((e) => e.id !== id));
  };

  const now     = new Date();
  const current = getCurrentTerm();
  const next    = getNextTerm();

  const holidaysInTerm = (termIdx: number) =>
    PUBLIC_HOLIDAYS.filter((h) => {
      const t = TERMS_2026[termIdx];
      return h.date >= t.start && h.date <= t.end;
    });

  const eventsInTerm = (termIdx: number) =>
    events.filter((e) => e.termIndex === termIdx);

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={{
        backgroundColor: theme.header,
        paddingTop: Platform.OS === 'android' ? insets.top + 16 : 20,
        paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        shadowColor: theme.headerShadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
      }}>
        <TouchableOpacity onPress={onClose} style={{ padding: 4, marginRight: 12 }}>
          <Text style={{ fontSize: 22, color: 'white' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>📅 Term Planner</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            School terms & holidays 2026
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => { setSelectedTermIdx(current >= 0 ? current : 0); setShowAddModal(true); }}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

        {/* Current status banner */}
        {current >= 0 ? (
          <View style={{
            backgroundColor: isDarkMode ? '#1A2816' : '#F1F8E9',
            borderRadius: 16, padding: 16, marginBottom: 16,
            borderWidth: 1.5, borderColor: '#66BB6A',
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <Text style={{ fontSize: 28 }}>📚</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#2E7D32' }}>
                Currently in {TERMS_2026[current].label}
              </Text>
              <Text style={{ fontSize: 12, color: subCol, marginTop: 2 }}>
                {daysBetween(now, TERMS_2026[current].end)} days until end of term
              </Text>
            </View>
          </View>
        ) : next >= 0 ? (
          <View style={{
            backgroundColor: isDarkMode ? '#1A1F2E' : '#E3F2FD',
            borderRadius: 16, padding: 16, marginBottom: 16,
            borderWidth: 1.5, borderColor: '#2196F3',
            flexDirection: 'row', alignItems: 'center', gap: 12,
          }}>
            <Text style={{ fontSize: 28 }}>🏖️</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#1565C0' }}>School holidays</Text>
              <Text style={{ fontSize: 12, color: subCol, marginTop: 2 }}>
                {TERMS_2026[next].label} starts in {daysBetween(now, TERMS_2026[next].start)} days
              </Text>
            </View>
          </View>
        ) : null}

        {/* Term cards */}
        {TERMS_2026.map((term, idx) => {
          const isCurrent  = idx === current;
          const isPast     = term.end < now;
          const holidays   = holidaysInTerm(idx);
          const myEvents   = eventsInTerm(idx);
          const totalDays  = daysBetween(term.start, term.end);
          const donedays   = isCurrent ? daysBetween(term.start, now) : (isPast ? totalDays : 0);
          const pct        = Math.min(100, Math.round((donedays / totalDays) * 100));

          return (
            <View
              key={idx}
              style={{
                backgroundColor: isDarkMode ? '#1C1C1C' : term.bg,
                borderRadius: 20, padding: 18, marginBottom: 14,
                borderTopWidth: 4, borderTopColor: term.color,
                borderWidth: 1, borderColor: isDarkMode ? '#333' : term.color + '40',
                shadowColor: term.color, shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
                opacity: isPast ? 0.65 : 1,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '900', color: isDarkMode ? '#EEEEEE' : '#111' }}>
                      {term.label}
                    </Text>
                    {isCurrent && (
                      <View style={{ backgroundColor: term.color, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
                        <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>CURRENT</Text>
                      </View>
                    )}
                    {isPast && (
                      <Text style={{ fontSize: 11, color: subCol }}>✓ Complete</Text>
                    )}
                  </View>
                  <Text style={{ fontSize: 13, color: subCol, marginTop: 3 }}>
                    {fmt(term.start)} – {fmt(term.end)} · {totalDays} days
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => { setSelectedTermIdx(idx); setShowAddModal(true); }}
                  style={{ padding: 6 }}
                >
                  <Text style={{ fontSize: 18, color: term.color }}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Progress bar */}
              {(isCurrent || isPast) && (
                <View style={{ marginBottom: 12 }}>
                  <View style={{ height: 6, backgroundColor: isDarkMode ? '#333' : term.color + '30', borderRadius: 3, overflow: 'hidden' }}>
                    <View style={{ height: 6, width: `${pct}%` as any, backgroundColor: term.color, borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontSize: 10, color: subCol, marginTop: 4 }}>
                    {isPast ? '100% complete' : `${pct}% through`}
                  </Text>
                </View>
              )}

              {/* Public holidays in this term */}
              {holidays.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: subCol, marginBottom: 6, letterSpacing: 0.5 }}>
                    PUBLIC HOLIDAYS
                  </Text>
                  {holidays.map((h, hi) => (
                    <View key={hi} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <Text style={{ fontSize: 14 }}>{h.emoji}</Text>
                      <Text style={{ fontSize: 12, color: isDarkMode ? '#CCCCCC' : '#333', flex: 1 }}>
                        {h.name}
                      </Text>
                      <Text style={{ fontSize: 11, color: subCol }}>{fmt(h.date)}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Custom events */}
              {myEvents.length > 0 && (
                <View style={{ marginTop: 4 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: subCol, marginBottom: 6, letterSpacing: 0.5 }}>
                    YOUR EVENTS
                  </Text>
                  {myEvents.map((ev) => (
                    <View key={ev.id} style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
                      backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFFCC',
                      borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
                    }}>
                      <Text style={{ fontSize: 13 }}>📌</Text>
                      <Text style={{ fontSize: 12, color: textCol, flex: 1 }}>{ev.label}</Text>
                      <Text style={{ fontSize: 11, color: subCol }}>
                        {fmt(parseLocalDate(ev.date))}
                      </Text>
                      <TouchableOpacity onPress={() => removeEvent(ev.id)} style={{ padding: 4 }}>
                        <Text style={{ fontSize: 12, color: '#FF5252' }}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Add event modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF', borderRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: textCol, marginBottom: 4 }}>Add Event</Text>
            <Text style={{ fontSize: 13, color: subCol, marginBottom: 16 }}>
              {TERMS_2026[selectedTermIdx].label} — pick a date for {childName || 'your child'}
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 6 }}>EVENT NAME</Text>
            <TextInput
              style={{
                borderWidth: 1.5, borderColor: borderCol, borderRadius: 12,
                padding: 12, fontSize: 14, color: textCol,
                backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8',
                marginBottom: 12,
              }}
              placeholder="e.g. Mid-year exam, Sports day..."
              placeholderTextColor="#999"
              value={newLabel}
              onChangeText={(t) => { setNewLabel(t); setAddError(''); }}
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 6 }}>DATE</Text>
            <TextInput
              style={{
                borderWidth: 1.5, borderColor: borderCol, borderRadius: 12,
                padding: 12, fontSize: 14, color: textCol,
                backgroundColor: isDarkMode ? '#2A2A2A' : '#F8F8F8',
                marginBottom: 8,
              }}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#999"
              keyboardType="numeric"
              maxLength={10}
              value={newDate}
              onChangeText={(t) => { setNewDate(t); setAddError(''); }}
            />
            {addError ? <Text style={{ color: '#FF5252', fontSize: 12, marginBottom: 8 }}>{addError}</Text> : null}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
              <TouchableOpacity
                onPress={() => { setShowAddModal(false); setNewLabel(''); setNewDate(''); setAddError(''); }}
                style={{ flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: borderCol, alignItems: 'center' }}
              >
                <Text style={{ color: subCol, fontWeight: '700' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={addEvent}
                style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: theme.header, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Add 📌</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
