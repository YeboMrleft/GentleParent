import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STORAGE_KEY_V1 = 'medication_reminders_v1';
const STORAGE_KEY = 'medication_reminders_v2';
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Reminder {
  id: string;
  name: string;
  dose: string;
  hour: number;
  minute: number;
  days: number[];
  forWhom: string; // 'me' or child's name
  active: boolean;
  notifIds: string[];
}

type ReminderForm = Omit<Reminder, 'id' | 'notifIds'>;

const BLANK_FORM: ReminderForm = {
  name: '', dose: '', hour: 8, minute: 0,
  days: [], forWhom: 'me', active: true,
};

// ── Notification helpers ──────────────────────────────────────────────────────

async function cancelNotifs(ids: string[]) {
  for (const id of ids) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch {}
  }
}

async function scheduleNotifs(r: Reminder): Promise<string[]> {
  // Ensure permissions are granted before scheduling
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: asked } = await Notifications.requestPermissionsAsync();
    if (asked !== 'granted') {
      Alert.alert(
        'Notifications blocked',
        'Please enable notifications for GentleParent in your device Settings so reminders can fire.',
      );
      return [];
    }
  }

  const title = r.forWhom !== 'me'
    ? `💊 ${r.forWhom}'s reminder`
    : '💊 Medication reminder';
  const body = r.dose ? `${r.name} — ${r.dose}` : r.name;

  try {
    const isEveryDay = r.days.length === 0 || r.days.length === 7;

    if (isEveryDay) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true, data: { type: 'medication' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: r.hour,
          minute: r.minute,
        },
      });
      return [id];
    }

    const ids: string[] = [];
    for (const weekday of r.days) {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true, data: { type: 'medication' } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: r.hour,
          minute: r.minute,
        },
      });
      ids.push(id);
    }
    return ids;
  } catch (e: any) {
    Alert.alert('Reminder failed', `Could not schedule the notification: ${e?.message ?? 'unknown error'}. Please try again.`);
    return [];
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  childNames: string[];
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function MedicationReminders({ childNames, theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [form, setForm] = useState<ReminderForm>(BLANK_FORM);

  const bg        = isDarkMode ? '#111111' : theme.background;
  const cardBg    = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol   = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol    = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;

  // Load reminders — migrate from v1 if needed
  useEffect(() => {
    (async () => {
      const v2 = await AsyncStorage.getItem(STORAGE_KEY);
      if (v2) {
        try { setReminders(JSON.parse(v2)); } catch {}
        return;
      }
      // Migrate from v1: 'child' → first child name (or keep as 'child' if no children)
      const v1 = await AsyncStorage.getItem(STORAGE_KEY_V1);
      if (v1) {
        try {
          const parsed: any[] = JSON.parse(v1);
          const migrated = parsed.map((r) => ({
            ...r,
            forWhom: r.forWhom === 'child'
              ? (childNames[0] ?? 'child')
              : r.forWhom,
          }));
          setReminders(migrated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        } catch {}
      }
    })();
  }, []);

  const persist = async (next: Reminder[]) => {
    setReminders(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const openAdd = () => {
    setEditing(null);
    setForm(BLANK_FORM);
    setShowModal(true);
  };

  const openEdit = (r: Reminder) => {
    setEditing(r);
    setForm({ name: r.name, dose: r.dose, hour: r.hour, minute: r.minute, days: [...r.days], forWhom: r.forWhom, active: r.active });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter a medication or vitamin name.');
      return;
    }
    if (editing) {
      await cancelNotifs(editing.notifIds);
      const notifIds = form.active
        ? await scheduleNotifs({ ...editing, ...form })
        : [];
      await persist(reminders.map((r) => r.id === editing.id ? { ...editing, ...form, notifIds } : r));
    } else {
      const newReminder: Reminder = { id: `med_${Date.now()}`, ...form, notifIds: [] };
      newReminder.notifIds = form.active ? await scheduleNotifs(newReminder) : [];
      await persist([...reminders, newReminder]);
    }
    setShowModal(false);
  };

  const handleToggle = async (r: Reminder) => {
    const next = !r.active;
    const notifIds = next
      ? await scheduleNotifs(r)
      : (await cancelNotifs(r.notifIds), []);
    await persist(reminders.map((rem) => rem.id === r.id ? { ...rem, active: next, notifIds } : rem));
  };

  const handleDelete = (r: Reminder) => {
    Alert.alert('Delete reminder', `Remove "${r.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await cancelNotifs(r.notifIds);
          await persist(reminders.filter((rem) => rem.id !== r.id));
        },
      },
    ]);
  };

  const toggleDay = (day: number) =>
    setForm((f) => ({
      ...f,
      days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day].sort((a, b) => a - b),
    }));

  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${hh}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const formatDays = (days: number[]) => {
    if (days.length === 0 || days.length === 7) return 'Every day';
    return days.map((d) => DAY_LABELS[d - 1]).join(', ');
  };

  // Sections: Me first, then each child in order
  const sections: { key: string; label: string; emoji: string; data: Reminder[] }[] = [
    { key: 'me', label: 'Me', emoji: '👤', data: reminders.filter((r) => r.forWhom === 'me') },
    ...childNames.map((name) => ({
      key: name,
      label: name,
      emoji: '👶',
      data: reminders.filter((r) => r.forWhom === name),
    })),
  ];

  const forWhomOptions = ['me', ...childNames];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
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
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>💊 Meds & Vitamins</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            Reminders for everyone in the family
          </Text>
        </View>
        <TouchableOpacity
          onPress={openAdd}
          style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Grouped list */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {reminders.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <Text style={{ fontSize: 56, marginBottom: 16 }}>💊</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textCol, marginBottom: 8 }}>No reminders yet</Text>
            <Text style={{ fontSize: 13, color: subCol, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 }}>
              Tap "+ Add" to set up a medication or vitamin reminder for yourself or any of your children.
            </Text>
          </View>
        ) : (
          sections.map((section) => {
            if (section.data.length === 0) return null;
            return (
              <View key={section.key} style={{ marginBottom: 8 }}>
                {/* Section header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: 4 }}>
                  <Text style={{ fontSize: 15 }}>{section.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: subCol, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                    {section.label}
                  </Text>
                  <View style={{ flex: 1, height: 1, backgroundColor: isDarkMode ? '#2A2A2A' : '#ECECEC', marginLeft: 4 }} />
                </View>

                {section.data.map((r) => (
                  <TouchableOpacity
                    key={r.id}
                    onPress={() => openEdit(r)}
                    activeOpacity={0.85}
                    style={{
                      backgroundColor: r.active ? (isDarkMode ? '#0F2010' : '#F1FDF1') : cardBg,
                      borderRadius: 18, padding: 18, marginBottom: 10,
                      borderWidth: 1.5,
                      borderColor: r.active ? (isDarkMode ? '#2E7D32' : '#A5D6A7') : borderCol,
                      shadowColor: '#4CAF50', shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: r.active ? 0.12 : 0, shadowRadius: 6, elevation: r.active ? 3 : 0,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: r.active ? (isDarkMode ? '#81C784' : '#2E7D32') : textCol, marginBottom: 4 }}>
                          {r.name}
                        </Text>
                        {!!r.dose && (
                          <Text style={{ fontSize: 13, color: subCol, marginBottom: 8 }}>{r.dose}</Text>
                        )}
                        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: r.active ? '#4CAF50' : subCol }}>
                            🕐 {formatTime(r.hour, r.minute)}
                          </Text>
                          <Text style={{ fontSize: 13, color: subCol }}>
                            📅 {formatDays(r.days)}
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 12 }}>
                        <Switch
                          value={r.active}
                          onValueChange={() => handleToggle(r)}
                          trackColor={{ false: isDarkMode ? '#333' : '#DDD', true: '#4CAF50' }}
                          thumbColor={r.active ? '#fff' : '#aaa'}
                        />
                        <TouchableOpacity onPress={() => handleDelete(r)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={{ fontSize: 18 }}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#111' : '#F5F5F5' }}>
          {/* Modal header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
            borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#2A2A2A' : '#E8E8E8',
          }}>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={{ fontSize: 16, color: isDarkMode ? '#AAA' : '#666', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800', color: textCol }}>
              {editing ? 'Edit Reminder' : 'New Reminder'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={{ fontSize: 16, color: '#4CAF50', fontWeight: '800' }}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
            {/* Name */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 6, letterSpacing: 0.5 }}>
                MEDICATION / VITAMIN NAME
              </Text>
              <TextInput
                value={form.name}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                placeholder="e.g. Vitamin D, Iron, Omega-3"
                placeholderTextColor={isDarkMode ? '#555' : '#BBB'}
                style={{
                  backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF',
                  borderRadius: 14, padding: 14,
                  color: textCol, fontSize: 15,
                  borderWidth: 1, borderColor: isDarkMode ? '#333' : '#E0E0E0',
                }}
              />
            </View>

            {/* Dose */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 6, letterSpacing: 0.5 }}>
                DOSAGE (OPTIONAL)
              </Text>
              <TextInput
                value={form.dose}
                onChangeText={(t) => setForm((f) => ({ ...f, dose: t }))}
                placeholder="e.g. 1 tablet, 5ml, 2 capsules"
                placeholderTextColor={isDarkMode ? '#555' : '#BBB'}
                style={{
                  backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF',
                  borderRadius: 14, padding: 14,
                  color: textCol, fontSize: 15,
                  borderWidth: 1, borderColor: isDarkMode ? '#333' : '#E0E0E0',
                }}
              />
            </View>

            {/* Time picker */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 10, letterSpacing: 0.5 }}>
                REMINDER TIME
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF',
                borderRadius: 14, paddingVertical: 16, paddingHorizontal: 24,
                borderWidth: 1, borderColor: isDarkMode ? '#333' : '#E0E0E0',
                gap: 16,
              }}>
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setForm((f) => ({ ...f, hour: (f.hour + 1) % 24 }))} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 20, color: '#4CAF50' }}>▲</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 36, fontWeight: '900', color: textCol, minWidth: 54, textAlign: 'center' }}>
                    {form.hour.toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity onPress={() => setForm((f) => ({ ...f, hour: (f.hour - 1 + 24) % 24 }))} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 20, color: '#4CAF50' }}>▼</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 36, fontWeight: '900', color: textCol, marginBottom: 4 }}>:</Text>

                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => setForm((f) => ({ ...f, minute: (f.minute + 5) % 60 }))} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 20, color: '#4CAF50' }}>▲</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 36, fontWeight: '900', color: textCol, minWidth: 54, textAlign: 'center' }}>
                    {form.minute.toString().padStart(2, '0')}
                  </Text>
                  <TouchableOpacity onPress={() => setForm((f) => ({ ...f, minute: (f.minute - 5 + 60) % 60 }))} style={{ padding: 8 }}>
                    <Text style={{ fontSize: 20, color: '#4CAF50' }}>▼</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 20, fontWeight: '800', color: '#4CAF50', marginBottom: 4 }}>
                  {form.hour >= 12 ? 'PM' : 'AM'}
                </Text>
              </View>
            </View>

            {/* Day selector */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 10, letterSpacing: 0.5 }}>
                REPEAT ON (leave unselected for every day)
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DAY_LABELS.map((label, idx) => {
                  const dayNum = idx + 1;
                  const selected = form.days.includes(dayNum);
                  return (
                    <TouchableOpacity
                      key={label}
                      onPress={() => toggleDay(dayNum)}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
                        backgroundColor: selected ? '#4CAF50' : (isDarkMode ? '#1E1E1E' : '#FFF'),
                        borderWidth: 1.5,
                        borderColor: selected ? '#4CAF50' : (isDarkMode ? '#333' : '#E0E0E0'),
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '700', color: selected ? '#FFF' : subCol }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={{ fontSize: 11, color: '#4CAF50', marginTop: 8, fontWeight: '600' }}>
                📅 {formatDays(form.days)}
              </Text>
            </View>

            {/* For whom */}
            <View>
              <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 10, letterSpacing: 0.5 }}>
                FOR WHOM
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {forWhomOptions.map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => setForm((f) => ({ ...f, forWhom: val }))}
                    style={{
                      paddingVertical: 12, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center',
                      backgroundColor: form.forWhom === val
                        ? (isDarkMode ? '#0F2010' : '#E8F5E9')
                        : (isDarkMode ? '#1E1E1E' : '#FFF'),
                      borderWidth: 2,
                      borderColor: form.forWhom === val ? '#4CAF50' : (isDarkMode ? '#333' : '#E0E0E0'),
                    }}
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>{val === 'me' ? '👤' : '👶'}</Text>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: form.forWhom === val ? '#4CAF50' : subCol }}>
                      {val === 'me' ? 'Me' : val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Active toggle */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF',
              borderRadius: 14, padding: 16,
              borderWidth: 1, borderColor: isDarkMode ? '#333' : '#E0E0E0',
            }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: textCol }}>Enable notification</Text>
                <Text style={{ fontSize: 12, color: subCol, marginTop: 2 }}>
                  {form.active ? 'Will notify at the set time' : 'Saved silently — no notification'}
                </Text>
              </View>
              <Switch
                value={form.active}
                onValueChange={(v) => setForm((f) => ({ ...f, active: v }))}
                trackColor={{ false: isDarkMode ? '#333' : '#DDD', true: '#4CAF50' }}
                thumbColor={form.active ? '#fff' : '#aaa'}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
