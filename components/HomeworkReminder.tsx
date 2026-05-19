import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { playClickSound } from '../utils/sounds';
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
import ChildSelector from './ChildSelector';

const slug = (n: string) => n.trim().toLowerCase().replace(/\s+/g, '_') || 'default';
const ITEMS_KEY   = (c: string) => `hw_items_v1_${slug(c)}`;
const NOTIF_KEY   = (c: string) => `hw_notif_id_${slug(c)}`;
const HOUR_KEY    = (c: string) => `hw_notif_hour_${slug(c)}`;
const MIN_KEY     = (c: string) => `hw_notif_min_${slug(c)}`;
const ENABLED_KEY = (c: string) => `hw_notif_enabled_${slug(c)}`;

interface HomeworkItem {
  id: string;
  subject: string;
  task: string;
  completed: boolean;
}

interface Props {
  childName:   string;
  childNames?: string[];
  theme:       any;
  isDarkMode:  boolean;
  onClose:     () => void;
}

async function cancelHwNotif(child: string) {
  const raw = await AsyncStorage.getItem(NOTIF_KEY(child));
  if (raw) {
    try {
      const ids: string[] = JSON.parse(raw);
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    } catch {
      // legacy single-ID format
      try { await Notifications.cancelScheduledNotificationAsync(raw); } catch {}
    }
    await AsyncStorage.removeItem(NOTIF_KEY(child));
  }
}

// Weekdays only: Mon=2, Tue=3, Wed=4, Thu=5, Fri=6 (Expo: Sun=1)
async function scheduleHwNotif(hour: number, minute: number, child: string, pendingCount: number) {
  await cancelHwNotif(child);
  const label = child ? `${child}'s` : 'Homework';
  const body  = pendingCount > 0
    ? `${pendingCount} task${pendingCount > 1 ? 's' : ''} still to go — you've got this! 💪`
    : `Time to check in on today's homework. 📖`;

  const ids = await Promise.all(
    [2, 3, 4, 5, 6].map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content: {
          title: `📚 ${label} homework time!`,
          body,
          sound: true,
          data: { type: 'homework_reminder' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
        },
      }),
    ),
  );
  await AsyncStorage.setItem(NOTIF_KEY(child), JSON.stringify(ids));
}

function pad(n: number) { return n.toString().padStart(2, '0'); }

function formatTime(hour: number, minute: number) {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h}:${pad(minute)} ${period}`;
}

export default function HomeworkReminder({ childName, childNames = [], theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const allChildren = childNames.length > 0 ? childNames : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || allChildren[0] || '');

  const [items,       setItems]       = useState<HomeworkItem[]>([]);
  const [notifOn,     setNotifOn]     = useState(false);
  const [hour,        setHour]        = useState(18);
  const [minute,      setMinute]      = useState(0);
  const [showAdd,     setShowAdd]     = useState(false);
  const [newSubject,  setNewSubject]  = useState('');
  const [newTask,     setNewTask]     = useState('');

  const bg       = isDarkMode ? '#111111' : theme.background;
  const cardBg   = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol  = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol   = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;
  const accent   = '#FFA000';

  useEffect(() => {
    (async () => {
      const [stored, en, h, m] = await Promise.all([
        AsyncStorage.getItem(ITEMS_KEY(selectedChild)),
        AsyncStorage.getItem(ENABLED_KEY(selectedChild)),
        AsyncStorage.getItem(HOUR_KEY(selectedChild)),
        AsyncStorage.getItem(MIN_KEY(selectedChild)),
      ]);
      setItems(stored ? JSON.parse(stored) : []);
      setNotifOn(en === 'true');
      if (h) setHour(parseInt(h));
      if (m) setMinute(parseInt(m));
    })();
  }, [selectedChild]);

  const persistItems = async (next: HomeworkItem[]) => {
    setItems(next);
    await AsyncStorage.setItem(ITEMS_KEY(selectedChild), JSON.stringify(next));
  };

  const toggleItem = async (id: string) => {
    const next = items.map((it) => it.id === id ? { ...it, completed: !it.completed } : it);
    await persistItems(next);
  };

  const deleteItem = (id: string) => {
    Alert.alert('Remove task', 'Delete this homework task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => persistItems(items.filter((it) => it.id !== id)) },
    ]);
  };

  const resetAll = () => {
    if (items.length === 0) return;
    Alert.alert('Reset homework', 'Uncheck all tasks for a fresh start?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', onPress: () => persistItems(items.map((it) => ({ ...it, completed: false }))) },
    ]);
  };

  const addTask = async () => {
    if (!newSubject.trim() && !newTask.trim()) return;
    const next: HomeworkItem = {
      id: `hw_${Date.now()}`,
      subject: newSubject.trim() || 'General',
      task:    newTask.trim(),
      completed: false,
    };
    await persistItems([...items, next]);
    setNewSubject('');
    setNewTask('');
    setShowAdd(false);
  };

  const saveNotifSettings = async (enabled: boolean, h: number, m: number) => {
    await AsyncStorage.setItem(ENABLED_KEY(selectedChild), String(enabled));
    await AsyncStorage.setItem(HOUR_KEY(selectedChild),    String(h));
    await AsyncStorage.setItem(MIN_KEY(selectedChild),     String(m));
    if (enabled) {
      const pending = items.filter((it) => !it.completed).length;
      await scheduleHwNotif(h, m, selectedChild, pending);
    } else {
      await cancelHwNotif(selectedChild);
    }
  };

  const handleToggleNotif = async (val: boolean) => {
    setNotifOn(val);
    await saveNotifSettings(val, hour, minute);
  };

  const adjustHour = async (delta: number) => {
    const next = (hour + delta + 24) % 24;
    setHour(next);
    if (notifOn) await saveNotifSettings(true, next, minute);
  };

  const adjustMinute = async (delta: number) => {
    const next = (minute + delta + 60) % 60;
    setMinute(next);
    if (notifOn) await saveNotifSettings(true, hour, next);
  };

  const pending = items.filter((it) => !it.completed).length;
  const done    = items.filter((it) =>  it.completed).length;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* ── Header ── */}
      <View style={{
        backgroundColor: theme.header,
        paddingTop: Platform.OS === 'android' ? insets.top + 16 : 20,
        paddingBottom: 16, paddingHorizontal: 20,
        flexDirection: 'row', alignItems: 'center',
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        shadowColor: theme.headerShadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
      }}>
        <TouchableOpacity onPress={() => { playClickSound(); onClose(); }} style={{ padding: 4, marginRight: 12 }}>
          <Text style={{ fontSize: 22, color: 'white' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>📚 Homework Reminder</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            {selectedChild ? `${selectedChild}'s daily tasks` : 'Daily homework tracker'}
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity onPress={() => { playClickSound(); resetAll(); }} style={{
            backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
            paddingHorizontal: 10, paddingVertical: 6,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <ChildSelector
          childNames={allChildren} selected={selectedChild}
          onSelect={(n) => setSelectedChild(n)}
          accentColor={accent} isDarkMode={isDarkMode}
        />

        {/* ── Progress summary ── */}
        {items.length > 0 && (
          <View style={{
            backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 14,
            flexDirection: 'row', alignItems: 'center',
            borderLeftWidth: 4, borderLeftColor: pending === 0 ? '#4CAF50' : accent,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
          }}>
            <Text style={{ fontSize: 32, marginRight: 14 }}>
              {pending === 0 ? '🎉' : '📋'}
            </Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: textCol }}>
                {pending === 0 ? 'All done! Great work!' : `${pending} task${pending > 1 ? 's' : ''} to go`}
              </Text>
              <Text style={{ fontSize: 13, color: subCol, marginTop: 2 }}>
                {done} completed · {items.length} total
              </Text>
            </View>
          </View>
        )}

        {/* ── Notification settings ── */}
        <View style={{
          backgroundColor: cardBg, borderRadius: 16, padding: 16, marginBottom: 14,
          borderTopWidth: 4, borderTopColor: '#9C27B0',
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08, shadowRadius: 4, elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: notifOn ? 16 : 0 }}>
            <Text style={{ fontSize: 20, marginRight: 10 }}>🔔</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textCol }}>Daily reminder</Text>
              <Text style={{ fontSize: 12, color: subCol }}>
                {notifOn ? `Weekdays at ${formatTime(hour, minute)}` : 'Off'}
              </Text>
            </View>
            <Switch
              value={notifOn}
              onValueChange={handleToggleNotif}
              trackColor={{ false: '#ccc', true: '#9C27B0' }}
              thumbColor="white"
            />
          </View>

          {notifOn && (
            <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
              {/* Hour picker */}
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: subCol, marginBottom: 4, fontWeight: '600' }}>HOUR</Text>
                <TouchableOpacity onPress={() => adjustHour(1)} style={arrowBtn}><Text style={arrowTxt}>▲</Text></TouchableOpacity>
                <View style={[timeBox, { borderColor: borderCol }]}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: textCol }}>{pad(hour)}</Text>
                </View>
                <TouchableOpacity onPress={() => adjustHour(-1)} style={arrowBtn}><Text style={arrowTxt}>▼</Text></TouchableOpacity>
              </View>
              <View style={{ justifyContent: 'center', paddingBottom: 4 }}>
                <Text style={{ fontSize: 28, fontWeight: '700', color: textCol }}>:</Text>
              </View>
              {/* Minute picker */}
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: subCol, marginBottom: 4, fontWeight: '600' }}>MIN</Text>
                <TouchableOpacity onPress={() => adjustMinute(5)} style={arrowBtn}><Text style={arrowTxt}>▲</Text></TouchableOpacity>
                <View style={[timeBox, { borderColor: borderCol }]}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: textCol }}>{pad(minute)}</Text>
                </View>
                <TouchableOpacity onPress={() => adjustMinute(-5)} style={arrowBtn}><Text style={arrowTxt}>▼</Text></TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* ── Task list ── */}
        {items.map((item) => (
          <View key={item.id} style={{
            backgroundColor: cardBg, borderRadius: 14, padding: 14, marginBottom: 10,
            flexDirection: 'row', alignItems: 'center',
            opacity: item.completed ? 0.6 : 1,
            borderLeftWidth: 3, borderLeftColor: item.completed ? '#4CAF50' : accent,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
          }}>
            <TouchableOpacity onPress={() => { playClickSound(); toggleItem(item.id); }} style={{ marginRight: 12 }}>
              <View style={{
                width: 26, height: 26, borderRadius: 13,
                borderWidth: 2, borderColor: item.completed ? '#4CAF50' : accent,
                backgroundColor: item.completed ? '#4CAF50' : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {item.completed && <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>}
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: 12, fontWeight: '700', color: accent,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
              }}>
                {item.subject}
              </Text>
              <Text style={{
                fontSize: 14, color: textCol, lineHeight: 19,
                textDecorationLine: item.completed ? 'line-through' : 'none',
              }}>
                {item.task}
              </Text>
            </View>

            <TouchableOpacity onPress={() => { playClickSound(); deleteItem(item.id); }} style={{ padding: 6, marginLeft: 8 }}>
              <Text style={{ fontSize: 16 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Empty state ── */}
        {items.length === 0 && (
          <View style={{
            backgroundColor: cardBg, borderRadius: 16, padding: 28,
            alignItems: 'center', marginBottom: 14,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
          }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>📝</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textCol, marginBottom: 6 }}>
              No homework yet
            </Text>
            <Text style={{ fontSize: 13, color: subCol, textAlign: 'center', lineHeight: 20 }}>
              Add today's tasks below and tick them off as {childName || 'your child'} completes them.
            </Text>
          </View>
        )}

        {/* ── Add button ── */}
        <TouchableOpacity
          onPress={() => { playClickSound(); setShowAdd(true); }}
          style={{
            backgroundColor: accent, borderRadius: 14, paddingVertical: 14,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            shadowColor: accent, shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3, shadowRadius: 6, elevation: 5,
          }}
        >
          <Text style={{ fontSize: 18, color: 'white' }}>+</Text>
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>Add homework task</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Add task modal ── */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{
          flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
          justifyContent: 'flex-end',
        }}>
          <View style={{
            backgroundColor: cardBg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, paddingBottom: insets.bottom + 24,
          }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: textCol, marginBottom: 18 }}>
              📝 New homework task
            </Text>

            <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 6 }}>
              SUBJECT (e.g. Maths, Reading)
            </Text>
            <TextInput
              value={newSubject}
              onChangeText={setNewSubject}
              placeholder="e.g. Maths"
              placeholderTextColor={subCol}
              style={{
                borderWidth: 1.5, borderColor: borderCol, borderRadius: 12,
                padding: 12, color: textCol, fontSize: 15, marginBottom: 14,
                backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9',
              }}
            />

            <Text style={{ fontSize: 12, fontWeight: '700', color: subCol, marginBottom: 6 }}>
              TASK DESCRIPTION
            </Text>
            <TextInput
              value={newTask}
              onChangeText={setNewTask}
              placeholder="e.g. Pages 12–14, count to 50"
              placeholderTextColor={subCol}
              multiline
              style={{
                borderWidth: 1.5, borderColor: borderCol, borderRadius: 12,
                padding: 12, color: textCol, fontSize: 15, marginBottom: 20,
                minHeight: 70, textAlignVertical: 'top',
                backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9',
              }}
            />

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => { playClickSound(); setShowAdd(false); setNewSubject(''); setNewTask(''); }}
                style={{
                  flex: 1, borderWidth: 1.5, borderColor: borderCol,
                  borderRadius: 12, paddingVertical: 13, alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, color: subCol, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { playClickSound(); addTask(); }}
                style={{
                  flex: 2, backgroundColor: accent,
                  borderRadius: 12, paddingVertical: 13, alignItems: 'center',
                  shadowColor: accent, shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.3, shadowRadius: 5, elevation: 4,
                }}
              >
                <Text style={{ fontSize: 15, color: 'white', fontWeight: '700' }}>Add task</Text>
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

const arrowBtn = { padding: 8 };
const arrowTxt = { fontSize: 16, color: '#9C27B0', fontWeight: '700' as const };
const timeBox  = {
  width: 64, height: 52, borderRadius: 12, borderWidth: 1.5,
  alignItems: 'center' as const, justifyContent: 'center' as const,
  marginVertical: 4,
};
