import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChildSelector from './ChildSelector';

interface Chore {
  id: string;
  name: string;
  completedDates: string[];
}

const todayStr = () => new Date().toISOString().split('T')[0];
const slug = (n: string) => n.trim().toLowerCase().replace(/\s+/g, '_') || 'default';
const CHORES_KEY = (child: string) => `chore_chart_v1_${slug(child)}`;
const STARS_KEY  = (child: string) => `chore_stars_v1_${slug(child)}`;

const SUGGESTIONS = [
  'Make bed 🛏️', 'Pack school bag 🎒', 'Tidy toys 🧸',
  'Wash hands 🧼', 'Help set the table 🍽️', 'Water plants 🌱',
  'Feed the pet 🐾', 'Put clothes away 👕',
];

interface Props {
  childName: string;
  childNames?: string[];
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

export default function ChoreChart({ childName, childNames = [], theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const allChildren = childNames.length > 0 ? childNames : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || allChildren[0] || '');
  const [chores, setChores] = useState<Chore[]>([]);
  const [stars, setStars] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newChoreName, setNewChoreName] = useState('');

  const bg = isDarkMode ? '#111111' : theme.background;
  const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(CHORES_KEY(selectedChild));
      setChores(raw ? JSON.parse(raw) : []);
      const s = await AsyncStorage.getItem(STARS_KEY(selectedChild));
      setStars(s ? parseInt(s, 10) : 0);
    })();
  }, [selectedChild]);

  const saveChores = async (next: Chore[]) => {
    setChores(next);
    await AsyncStorage.setItem(CHORES_KEY(selectedChild), JSON.stringify(next));
  };

  const addChore = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const next: Chore[] = [...chores, { id: `c_${Date.now()}`, name: trimmed, completedDates: [] }];
    await saveChores(next);
    setNewChoreName('');
    setShowAdd(false);
  };

  const toggleChore = async (id: string) => {
    const today = todayStr();
    const chore = chores.find((c) => c.id === id);
    if (!chore) return;

    const alreadyDone = chore.completedDates.includes(today);
    const next = chores.map((c) =>
      c.id !== id ? c : {
        ...c,
        completedDates: alreadyDone
          ? c.completedDates.filter((d) => d !== today)
          : [...c.completedDates, today],
      }
    );
    await saveChores(next);

    const newStars = alreadyDone ? Math.max(0, stars - 1) : stars + 1;
    setStars(newStars);
    await AsyncStorage.setItem(STARS_KEY(selectedChild), String(newStars));
  };

  const deleteChore = (id: string) => {
    Alert.alert('Remove Chore', 'Delete this chore from the chart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveChores(chores.filter((c) => c.id !== id)) },
    ]);
  };

  const isCompleted = (chore: Chore) => chore.completedDates.includes(todayStr());
  const completedToday = chores.filter(isCompleted).length;
  const availableSuggestions = SUGGESTIONS.filter((s) => !chores.find((c) => c.name === s));

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
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
            ✅ {selectedChild ? `${selectedChild}'s Chores` : 'Chore Chart'}
          </Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            {chores.length > 0
              ? `${completedToday} of ${chores.length} done today`
              : 'Tap a chore to earn a ⭐'}
          </Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 26 }}>⭐</Text>
          <Text style={{ fontSize: 15, fontWeight: 'bold', color: 'white' }}>{stars}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <ChildSelector
          childNames={allChildren} selected={selectedChild}
          onSelect={(n) => setSelectedChild(n)}
          accentColor={theme.header} isDarkMode={isDarkMode}
        />
        {chores.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Text style={{ fontSize: 52, marginBottom: 12 }}>🧹</Text>
            <Text style={{ fontSize: 16, fontWeight: '700', color: textCol, marginBottom: 6 }}>No chores yet!</Text>
            <Text style={{ fontSize: 13, color: subCol, textAlign: 'center', lineHeight: 20 }}>
              Add chores below. {selectedChild || 'Your child'} earns a ⭐ for each one done today.
            </Text>
          </View>
        )}

        {chores.map((chore) => {
          const done = isCompleted(chore);
          return (
            <TouchableOpacity
              key={chore.id}
              onPress={() => toggleChore(chore.id)}
              onLongPress={() => deleteChore(chore.id)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: done ? (isDarkMode ? '#162516' : '#F0FFF0') : cardBg,
                borderRadius: 14, padding: 16, marginBottom: 10,
                borderWidth: 1.5, borderColor: done ? '#4CAF50' : borderCol,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
              }}
            >
              <View style={{
                width: 28, height: 28, borderRadius: 14,
                backgroundColor: done ? '#4CAF50' : 'transparent',
                borderWidth: done ? 0 : 2, borderColor: borderCol,
                alignItems: 'center', justifyContent: 'center', marginRight: 14,
              }}>
                {done && <Text style={{ fontSize: 16, color: 'white' }}>✓</Text>}
              </View>
              <Text style={{
                flex: 1, fontSize: 15, fontWeight: '600',
                color: done ? '#4CAF50' : textCol,
                textDecorationLine: done ? 'line-through' : 'none',
              }}>
                {chore.name}
              </Text>
              {done && <Text style={{ fontSize: 18, marginLeft: 8 }}>⭐</Text>}
            </TouchableOpacity>
          );
        })}

        {availableSuggestions.length > 0 && chores.length < 5 && (
          <View style={{ marginTop: 8, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: subCol, marginBottom: 8, letterSpacing: 0.5 }}>
              QUICK ADD
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {availableSuggestions.slice(0, 4).map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => addChore(s)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: 7,
                    backgroundColor: cardBg, borderRadius: 20,
                    borderWidth: 1, borderColor: borderCol,
                  }}
                >
                  <Text style={{ fontSize: 12, color: textCol }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={() => setShowAdd(true)}
          style={{
            backgroundColor: theme.header, borderRadius: 14,
            padding: 16, alignItems: 'center', marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: 'white' }}>+ Add Chore</Text>
        </TouchableOpacity>

        {chores.length > 0 && (
          <Text style={{ textAlign: 'center', fontSize: 11, color: subCol, marginTop: 14, fontStyle: 'italic' }}>
            Long press a chore to remove it
          </Text>
        )}
      </ScrollView>

      <Modal visible={showAdd} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <View style={[styles.modal, { backgroundColor: isDarkMode ? '#1E1E1E' : theme.background }]}>
            <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 8 }}>🧹</Text>
            <Text style={[styles.modalTitle, { color: textCol }]}>New Chore</Text>
            <TextInput
              style={[styles.input, {
                borderColor: borderCol,
                backgroundColor: isDarkMode ? '#2A2A2A' : theme.inputBackground,
                color: textCol,
              }]}
              value={newChoreName}
              onChangeText={setNewChoreName}
              placeholder="e.g. Make bed 🛏️"
              placeholderTextColor="#aaa"
              autoFocus
              onSubmitEditing={() => addChore(newChoreName)}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.btnCancel, { borderColor: borderCol }]}
                onPress={() => { setShowAdd(false); setNewChoreName(''); }}
              >
                <Text style={{ color: subCol, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnSave, { backgroundColor: theme.header }]}
                onPress={() => addChore(newChoreName)}
              >
                <Text style={{ color: 'white', fontWeight: '700' }}>Add ✅</Text>
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

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modal: { width: '100%', borderRadius: 20, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  input: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 16 },
  btnCancel: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  btnSave: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
});
