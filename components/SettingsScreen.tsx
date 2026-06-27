import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    cancelWeatherNotification,
    formatNotifTime,
    getNotifSettings,
    requestNotificationPermission,
    saveNotifSettings,
    scheduleWeatherNotification,
} from '../utils/notifications';
import { playClickSound } from '../utils/sounds';
import ThemeSettingsSection from './ThemeSettingsSection';

// parseBirthday helper (mirrors the one in source)
const parseBirthday = (ddmmyyyy: string): Date | null => {
  const parts = ddmmyyyy.replace(/\//g, '-').split('-');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const date = new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
  return isNaN(date.getTime()) ? null : date;
};

interface Props {
  onClose: () => void;
  userName: string;
  childName: string;
  childBirthday: string;   // ISO YYYY-MM-DD or ''
  children: Array<{ id: string; name: string; birthday?: string }>;
  activeChildId: string;
  isDarkMode: boolean;
  themeMode: 'light' | 'dark' | 'system';
  soundEnabled: boolean;
  parentGender: string;
  onSetThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  onToggleSound: () => void;
  onSaveName: (name: string) => void;
  onSaveChild: (name: string) => void;
  onSaveBirthday: (iso: string) => void;
  onSetActiveChild: (childId: string) => void;
  onAddChild: (name: string) => void;
  onFAQs: () => void;
  onAccount?: () => void;
  onRestartWalkthrough: () => void;
  onReset: () => void;
}

export default function SettingsScreen({
  onClose, userName, childName, childBirthday,
  children, activeChildId,
  isDarkMode, themeMode, soundEnabled, parentGender,
  onSetThemeMode, onToggleSound, onSaveName, onSaveChild, onSaveBirthday, onSetActiveChild, onAddChild, onFAQs, onAccount, onRestartWalkthrough, onReset,
}: Props) {
  const [editName,    setEditName]    = useState(userName);
  const [editChild,   setEditChild]   = useState(childName);

  const parsedBday = (() => {
    if (!childBirthday) return { dd: '', mm: '', yyyy: '' };
    const parts = childBirthday.split('-');
    if (parts.length !== 3) return { dd: '', mm: '', yyyy: '' };
    const [y, m, d] = parts;
    return { dd: d, mm: m, yyyy: y };
  })();
  const [editBDay,   setEditBDay]   = useState(parsedBday.dd);
  const [editBMonth, setEditBMonth] = useState(parsedBday.mm);
  const [editBYear,  setEditBYear]  = useState(parsedBday.yyyy);
  const [birthdayErr, setBirthdayErr] = useState('');

  const bDayRef   = useRef<any>(null);
  const bMonthRef = useRef<any>(null);
  const bYearRef  = useRef<any>(null);
  const [newChildName, setNewChildName] = useState('');

  // ── Notification state ────────────────────────────────────────────────────
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifHour,    setNotifHour]    = useState(7);
  const [notifMinute,  setNotifMinute]  = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour,     setTempHour]     = useState('7');
  const [tempMinute,   setTempMinute]   = useState('00');

  const insets = useSafeAreaInsets();


  useEffect(() => {
    setEditChild(childName);
    if (!childBirthday) {
      setEditBDay(''); setEditBMonth(''); setEditBYear('');
      return;
    }
    const parts = childBirthday.split('-');
    if (parts.length !== 3) {
      setEditBDay(''); setEditBMonth(''); setEditBYear('');
      return;
    }
    const [yyyy, mm, dd] = parts;
    setEditBDay(dd); setEditBMonth(mm); setEditBYear(yyyy);
  }, [childName, childBirthday, activeChildId]);

  // Load notification settings on mount
  useEffect(() => {
    (async () => {
      const settings = await getNotifSettings();
      setNotifEnabled(settings.enabled);
      setNotifHour(settings.hour);
      setNotifMinute(settings.minute);
    })();
  }, []);

  const accentColor = parentGender === 'dad' ? '#5B8FA8' : '#FFB3C6';
  const accentDark  = parentGender === 'dad' ? '#3d6b82' : '#e8849a';
  const textColor   = isDarkMode ? '#EEE' : '#222';
  const subColor    = isDarkMode ? '#AAA' : '#666';
  const bg          = isDarkMode ? '#111' : '#F7F7F7';
  const cardBg      = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const borderColor = isDarkMode ? '#333' : '#E8E8E8';

  const handleSaveBirthday = () => {
    setBirthdayErr('');
    if (!editBDay && !editBMonth && !editBYear) { onSaveBirthday(''); return; }
    const parsed = parseBirthday(`${editBDay}/${editBMonth}/${editBYear}`);
    if (!parsed) { setBirthdayErr('Please enter a valid date'); return; }
    if (parsed > new Date()) { setBirthdayErr("Can't be in the future 😊"); return; }
    onSaveBirthday(parsed.toISOString().split('T')[0]);
  };

  const handleToggleNotif = async () => {
    if (notifEnabled) {
      await cancelWeatherNotification();
      await saveNotifSettings(notifHour, notifMinute, false);
      setNotifEnabled(false);
      Alert.alert('Notifications off', 'Morning weather notifications disabled.');
    } else {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Please allow notifications in your device settings.');
        return;
      }
      const success = await scheduleWeatherNotification(notifHour, notifMinute, childName, userName);
      if (success) {
        await saveNotifSettings(notifHour, notifMinute, true);
        setNotifEnabled(true);
        Alert.alert('✅ Notifications on!', `You'll get a morning weather update at ${formatNotifTime(notifHour, notifMinute)} every day.`);
      } else {
        Alert.alert('Oops', 'Could not schedule notification. Make sure location is enabled.');
      }
    }
  };

  const handleSaveTime = async () => {
    const h = parseInt(tempHour);
    const m = parseInt(tempMinute);
    if (isNaN(h) || h < 0 || h > 23) { Alert.alert('Invalid hour', 'Enter a hour between 0 and 23.'); return; }
    if (isNaN(m) || m < 0 || m > 59) { Alert.alert('Invalid minute', 'Enter a minute between 0 and 59.'); return; }
    setNotifHour(h);
    setNotifMinute(m);
    setShowTimePicker(false);
    if (notifEnabled) {
      await scheduleWeatherNotification(h, m, childName, userName);
      await saveNotifSettings(h, m, true);
      Alert.alert('⏰ Updated!', `Notifications rescheduled for ${formatNotifTime(h, m)}.`);
    } else {
      await saveNotifSettings(h, m, false);
    }
  };

  const handleSendFeedback = async () => {
    const subject = encodeURIComponent('GentleParent Feedback');
    const body = encodeURIComponent(
      'Hi GentleParent team,\n\nHere is my feedback:\n\n'
    );
    const url = `mailto:inkateck.solutions@gmail.com?subject=${subject}&body=${body}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No email app found', 'Please email us at inkateck.solutions@gmail.com');
    }
  };

  const handleRateApp = async () => {
    const url = 'market://details?id=com.mrnxele.GentleParent';
    const fallback = 'https://play.google.com/store/apps/details?id=com.mrnxele.GentleParent';
    const canOpen = await Linking.canOpenURL(url);
    await Linking.openURL(canOpen ? url : fallback);
  };

  const handleShare = async () => {
    await Share.share({
      message:
        '🌱 I\'ve been using GentleParent — a gentle parenting app for modern families. Check it out!\nhttps://play.google.com/store/apps/details?id=com.mrnxele.GentleParent',
    });
  };

  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: accentColor, shadowColor: accentDark }]}>
          <TouchableOpacity onPress={() => { playClickSound(); onClose(); }} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>⚙️  Settings</Text>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">

          {/* ── Appearance ── */}
          <Text style={[styles.sectionLabel, { color: subColor }]}>APPEARANCE</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.rowTitle, { color: textColor, marginBottom: 4 }]}>Theme</Text>
            <Text style={[styles.rowSub, { color: subColor, marginBottom: 14 }]}>
              {themeMode === 'system'
                ? `Following device setting (${isDarkMode ? 'dark' : 'light'})`
                : themeMode === 'dark'
                  ? 'Easy on the eyes at night'
                  : 'Bright and cheerful'}
            </Text>
            <View style={styles.segmentRow}>
              {([
                { key: 'light',  label: '☀️ Light'  },
                { key: 'dark',   label: '🌙 Dark'   },
                { key: 'system', label: '📱 System' },
              ] as const).map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.segment,
                    { borderColor: accentColor },
                    themeMode === key && { backgroundColor: accentColor },
                  ]}
                  onPress={() => { playClickSound(); onSetThemeMode(key); }}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.segmentText,
                    { color: themeMode === key ? 'white' : (isDarkMode ? '#CCC' : '#555') },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* App Theme Selector */}
          <ThemeSettingsSection theme={{ background: cardBg, cardText: textColor, cardSubText: subColor }} />

          {/* Sound Toggle */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.row}>
              <View>
                <Text style={[styles.rowTitle, { color: textColor }]}>
                  {soundEnabled ? '🔊 Sound Effects' : '🔇 Sound Effects'}
                </Text>
                <Text style={[styles.rowSub, { color: subColor }]}>
                  {soundEnabled ? 'Click sounds enabled' : 'Click sounds disabled'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, { backgroundColor: soundEnabled ? accentColor : '#E0E0E0' }]}
                onPress={() => { playClickSound(); onToggleSound(); }}
                activeOpacity={0.8}
              >
                <View style={[styles.toggleKnob, { transform: [{ translateX: soundEnabled ? 22 : 2 }] }]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Profile ── */}
          <Text style={[styles.sectionLabel, { color: subColor }]}>YOUR PROFILE</Text>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.fieldLabel, { color: subColor }]}>Your name</Text>
            <TextInput
              style={[styles.input, {
                color: textColor, borderColor,
                backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
              }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accentColor, shadowColor: accentDark }]}
              onPress={() => { playClickSound(); onSaveName(editName.trim()); }}
            >
              <Text style={styles.saveBtnText}>Save name</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}> 
            <Text style={[styles.fieldLabel, { color: subColor }]}>Children</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.childChipRow}>
              {children.map((child) => {
                const isActive = child.id === activeChildId;
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childChip,
                      {
                        borderColor: isActive ? accentColor : borderColor,
                        backgroundColor: isActive ? `${accentColor}22` : (isDarkMode ? '#2A2A2A' : '#F5F5F5'),
                      },
                    ]}
                    onPress={() => { playClickSound(); onSetActiveChild(child.id); }}
                  >
                    <Text style={[styles.childChipText, { color: textColor }]}>{child.name}</Text>
                    {isActive ? <Text style={[styles.childChipActive, { color: accentDark }]}>Active</Text> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.addChildRow}>
              <TextInput
                style={[styles.input, styles.addChildInput, {
                  color: textColor,
                  borderColor,
                  backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
                }]}
                value={newChildName}
                onChangeText={setNewChildName}
                placeholder="Add another child"
                placeholderTextColor="#999"
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.addChildBtn, { backgroundColor: accentColor }]}
                onPress={() => {
                  const trimmed = newChildName.trim();
                  if (!trimmed) return;
                  playClickSound();
                  onAddChild(trimmed);
                  setNewChildName('');
                }}
              >
                <Text style={styles.addChildBtnText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.fieldLabel, { color: subColor }]}>Child's name</Text>
            <TextInput
              style={[styles.input, {
                color: textColor, borderColor,
                backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5',
              }]}
              value={editChild}
              onChangeText={setEditChild}
              placeholder="Child's name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accentColor, shadowColor: accentDark }]}
              onPress={() => { playClickSound(); onSaveChild(editChild.trim()); }}
            >
              <Text style={styles.saveBtnText}>Save name</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.fieldLabel, { color: subColor }]}>Child's birthday</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateSegment}>
                <Text style={[styles.dateSegLabel, { color: subColor }]}>Day</Text>
                <TextInput
                  ref={bDayRef}
                  style={[styles.dateSegInput, { color: textColor, borderColor, backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }]}
                  value={editBDay}
                  onChangeText={(t) => {
                    const d = t.replace(/\D/g, '').slice(0, 2);
                    setEditBDay(d); setBirthdayErr('');
                    if (d.length === 2) bMonthRef.current?.focus();
                  }}
                  placeholder="DD"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={2}
                  returnKeyType="next"
                  onSubmitEditing={() => bMonthRef.current?.focus()}
                />
              </View>
              <Text style={[styles.dateSep, { color: subColor }]}>/</Text>
              <View style={styles.dateSegment}>
                <Text style={[styles.dateSegLabel, { color: subColor }]}>Month</Text>
                <TextInput
                  ref={bMonthRef}
                  style={[styles.dateSegInput, { color: textColor, borderColor, backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }]}
                  value={editBMonth}
                  onChangeText={(t) => {
                    const m = t.replace(/\D/g, '').slice(0, 2);
                    setEditBMonth(m); setBirthdayErr('');
                    if (m.length === 2) bYearRef.current?.focus();
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && editBMonth === '') bDayRef.current?.focus();
                  }}
                  placeholder="MM"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={2}
                  returnKeyType="next"
                  onSubmitEditing={() => bYearRef.current?.focus()}
                />
              </View>
              <Text style={[styles.dateSep, { color: subColor }]}>/</Text>
              <View style={[styles.dateSegment, { flex: 2 }]}>
                <Text style={[styles.dateSegLabel, { color: subColor }]}>Year</Text>
                <TextInput
                  ref={bYearRef}
                  style={[styles.dateSegInput, { color: textColor, borderColor, backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }]}
                  value={editBYear}
                  onChangeText={(t) => {
                    const y = t.replace(/\D/g, '').slice(0, 4);
                    setEditBYear(y); setBirthdayErr('');
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && editBYear === '') bMonthRef.current?.focus();
                  }}
                  placeholder="YYYY"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  maxLength={4}
                  returnKeyType="done"
                  onSubmitEditing={() => { playClickSound(); handleSaveBirthday(); }}
                />
              </View>
            </View>
            {birthdayErr ? <Text style={styles.errorText}>{birthdayErr}</Text> : null}
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: accentColor, shadowColor: accentDark }]}
              onPress={() => { playClickSound(); handleSaveBirthday(); }}
            >
              <Text style={styles.saveBtnText}>Save birthday 🎂</Text>
            </TouchableOpacity>
          </View>

          {/* ── Notifications ── */}
          <Text style={[styles.sectionLabel, { color: subColor }]}>MORNING WEATHER</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: textColor }]}>🌤️ Daily Weather Alert</Text>
                <Text style={[styles.rowSub, { color: subColor }]}>
                  {notifEnabled
                    ? `On · ${formatNotifTime(notifHour, notifMinute)} every morning`
                    : 'Get weather + outfit tips each morning'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, { backgroundColor: notifEnabled ? accentColor : '#E0E0E0' }]}
                onPress={() => { playClickSound(); handleToggleNotif(); }}
                activeOpacity={0.8}
              >
                <View style={[styles.toggleKnob, { transform: [{ translateX: notifEnabled ? 22 : 2 }] }]} />
              </TouchableOpacity>
            </View>

            {notifEnabled && (
              <>
                <View style={[styles.dividerLine, { backgroundColor: borderColor, marginVertical: 12 }]} />
                <View style={styles.row}>
                  <Text style={[styles.fieldLabel, { color: subColor }]}>Notification time</Text>
                  <TouchableOpacity
                    style={[styles.timeBtn, { backgroundColor: accentColor }]}
                    onPress={() => {
                      playClickSound();
                      setTempHour(String(notifHour));
                      setTempMinute(notifMinute.toString().padStart(2, '0'));
                      setShowTimePicker(true);
                    }}
                  >
                    <Text style={styles.timeBtnText}>{formatNotifTime(notifHour, notifMinute)}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* ── Time picker modal ── */}
          <Modal visible={showTimePicker} transparent animationType="fade">
            <View style={styles.pickerOverlay}>
              <View style={[styles.pickerCard, { backgroundColor: cardBg }]}>
                <Text style={[styles.pickerTitle, { color: textColor }]}>⏰ Set notification time</Text>
                <View style={styles.pickerRow}>
                  <View style={styles.pickerField}>
                    <Text style={[styles.pickerLabel, { color: subColor }]}>Hour (0–23)</Text>
                    <TextInput
                      style={[styles.pickerInput, { color: textColor, borderColor, backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }]}
                      value={tempHour}
                      onChangeText={setTempHour}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="7"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <Text style={[styles.pickerColon, { color: textColor }]}>:</Text>
                  <View style={styles.pickerField}>
                    <Text style={[styles.pickerLabel, { color: subColor }]}>Minute (0–59)</Text>
                    <TextInput
                      style={[styles.pickerInput, { color: textColor, borderColor, backgroundColor: isDarkMode ? '#2A2A2A' : '#F5F5F5' }]}
                      value={tempMinute}
                      onChangeText={setTempMinute}
                      keyboardType="numeric"
                      maxLength={2}
                      placeholder="00"
                      placeholderTextColor="#999"
                    />
                  </View>
                </View>
                <View style={styles.pickerActions}>
                  <TouchableOpacity
                    style={[styles.pickerCancel, { borderColor }]}
                    onPress={() => { playClickSound(); setShowTimePicker(false); }}
                  >
                    <Text style={[styles.pickerCancelText, { color: subColor }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.pickerSave, { backgroundColor: accentColor }]}
                    onPress={() => { playClickSound(); handleSaveTime(); }}
                  >
                    <Text style={styles.pickerSaveText}>Save ✓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* ── Account & Subscription (web) ── */}
          {onAccount && (
            <>
              <Text style={[styles.sectionLabel, { color: subColor }]}>ACCOUNT</Text>
              <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
                <TouchableOpacity
                  style={styles.feedbackRow}
                  onPress={() => { playClickSound(); onAccount(); }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.feedbackIcon, { backgroundColor: '#FDE8F2' }]}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: textColor }]}>Account & Subscription</Text>
                    <Text style={[styles.rowSub, { color: subColor }]}>Sign in, manage your Premium plan</Text>
                  </View>
                  <Text style={{ color: subColor, fontSize: 18 }}>›</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Help ── */}
          <Text style={[styles.sectionLabel, { color: subColor }]}>HELP</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <TouchableOpacity
              style={styles.feedbackRow}
              onPress={() => { playClickSound(); onFAQs(); }}
              activeOpacity={0.75}
            >
              <View style={[styles.feedbackIcon, { backgroundColor: '#E4F4FF' }]}>
                <Text style={{ fontSize: 20 }}>❓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: textColor }]}>Help & FAQs</Text>
                <Text style={[styles.rowSub, { color: subColor }]}>Common questions, answered</Text>
              </View>
              <Text style={{ color: subColor, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── Feedback ── */}
          <Text style={[styles.sectionLabel, { color: subColor }]}>FEEDBACK</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>

            <TouchableOpacity
              style={styles.feedbackRow}
              onPress={() => { playClickSound(); handleSendFeedback(); }}
              activeOpacity={0.75}
            >
              <View style={[styles.feedbackIcon, { backgroundColor: accentColor + '22' }]}>
                <Text style={{ fontSize: 20 }}>💌</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: textColor }]}>Send Feedback</Text>
                <Text style={[styles.rowSub, { color: subColor }]}>Tell us what you love or what needs work</Text>
              </View>
              <Text style={{ color: subColor, fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            <View style={[styles.dividerLine, { backgroundColor: borderColor, marginVertical: 10 }]} />

            <TouchableOpacity
              style={styles.feedbackRow}
              onPress={() => { playClickSound(); handleRateApp(); }}
              activeOpacity={0.75}
            >
              <View style={[styles.feedbackIcon, { backgroundColor: '#FFF9C4' }]}>
                <Text style={{ fontSize: 20 }}>⭐</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: textColor }]}>Rate GentleParent</Text>
                <Text style={[styles.rowSub, { color: subColor }]}>Enjoying the app? Leave us a review</Text>
              </View>
              <Text style={{ color: subColor, fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            <View style={[styles.dividerLine, { backgroundColor: borderColor, marginVertical: 10 }]} />

            <TouchableOpacity
              style={styles.feedbackRow}
              onPress={() => { playClickSound(); handleShare(); }}
              activeOpacity={0.75}
            >
              <View style={[styles.feedbackIcon, { backgroundColor: '#E8F5E9' }]}>
                <Text style={{ fontSize: 20 }}>📤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: textColor }]}>Share with a Friend</Text>
                <Text style={[styles.rowSub, { color: subColor }]}>Know a parent who'd love this?</Text>
              </View>
              <Text style={{ color: subColor, fontSize: 18 }}>›</Text>
            </TouchableOpacity>

            <View style={[styles.dividerLine, { backgroundColor: borderColor, marginVertical: 10 }]} />

            <TouchableOpacity
              style={styles.feedbackRow}
              onPress={() => { playClickSound(); onRestartWalkthrough(); }}
              activeOpacity={0.75}
            >
              <View style={[styles.feedbackIcon, { backgroundColor: '#EDE4FF' }]}>
                <Text style={{ fontSize: 20 }}>🗺️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: textColor }]}>Restart App Tour</Text>
                <Text style={[styles.rowSub, { color: subColor }]}>Replay the feature walkthrough</Text>
              </View>
              <Text style={{ color: subColor, fontSize: 18 }}>›</Text>
            </TouchableOpacity>

          </View>

          {/* ── Danger zone ── */}
          <Text style={[styles.sectionLabel, { color: subColor }]}>DANGER ZONE</Text>
          <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
            <Text style={[styles.rowTitle, { color: textColor, marginBottom: 4 }]}>Reset all data</Text>
            <Text style={[styles.rowSub, { color: subColor, marginBottom: 12 }]}>
              Clears your profile and all chat history. Cannot be undone.
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={() => { playClickSound(); onReset(); }}>
              <Text style={styles.resetBtnText}>🗑️  Reset everything</Text>
            </TouchableOpacity>

            {__DEV__ ? (
              <TouchableOpacity
                style={[styles.resetBtn, styles.devResetBtn]}
                onPress={async () => {
                  await AsyncStorage.clear();
                  Alert.alert('Storage cleared', 'All local app data was reset. Reload the app now.');
                }}
              >
                <Text style={styles.devResetBtnText}>DEV: Clear local storage</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <Text style={[styles.footer, { color: subColor }]}>GentleParent v1.2.0 • Inka-Tech Solutions</Text>
        </ScrollView>

</SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 20, paddingBottom: 16, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5,
  },
  backBtn:     { backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, marginRight: 12 },
  backBtnText: { color: 'white', fontSize: 15, fontWeight: 'bold' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: 'bold' },

  content:      { padding: 16 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginTop: 20, marginBottom: 8, marginLeft: 4 },

  card: {
    borderRadius: 18, padding: 18, marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  row:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  rowSub:   { fontSize: 12 },

  toggle: {
    width: 50, height: 28, borderRadius: 14,
    justifyContent: 'center',
  },
  toggleKnob: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'white',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },

  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5 },
  input: {
    borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 15, marginBottom: 12,
  },
  childChipRow: { paddingBottom: 10 },
  childChip: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  childChipText: { fontSize: 13, fontWeight: '700' },
  childChipActive: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  addChildRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addChildInput: { flex: 1, marginBottom: 0 },
  addChildBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  addChildBtnText: { color: 'white', fontSize: 13, fontWeight: '700' },
  errorText: { fontSize: 12, color: '#FF5252', marginBottom: 8, marginTop: -6 },
  saveBtn: {
    borderRadius: 12, padding: 13, alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 0, elevation: 4,
    borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.15)',
  },
  saveBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  resetBtn: {
    borderRadius: 12, padding: 13, alignItems: 'center',
    backgroundColor: '#FFEBEE', borderWidth: 1, borderColor: '#FFCDD2',
  },
  resetBtnText: { color: '#C62828', fontWeight: 'bold', fontSize: 15 },
  devResetBtn: {
    marginTop: 10,
    backgroundColor: '#E3F2FD',
    borderColor: '#BBDEFB',
  },
  devResetBtnText: { color: '#1565C0', fontWeight: '700', fontSize: 14 },

  footer: { textAlign: 'center', fontSize: 12, marginTop: 24, marginBottom: 8 },

  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  feedbackIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  segmentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },

  dateRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 12 },
  dateSegment: { flex: 1, alignItems: 'center' },
  dateSegLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 5, textTransform: 'uppercase' },
  dateSegInput: {
    borderWidth: 1, borderRadius: 12, paddingVertical: 13,
    fontSize: 18, fontWeight: '700', textAlign: 'center', width: '100%',
  },
  dateSep: { fontSize: 22, fontWeight: '700', paddingBottom: 11 },

  dividerLine: { height: 1 },
  timeBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12,
  },
  timeBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: 30,
  },
  pickerCard: {
    width: '100%', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 8,
  },
  pickerTitle:  { fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  pickerRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
  pickerField:  { alignItems: 'center' },
  pickerLabel:  { fontSize: 12, marginBottom: 6 },
  pickerInput: {
    width: 70, borderWidth: 1, borderRadius: 12,
    padding: 12, fontSize: 22, textAlign: 'center', fontWeight: '700',
  },
  pickerColon:   { fontSize: 28, fontWeight: '700', marginTop: 16 },
  pickerActions: { flexDirection: 'row', gap: 12 },
  pickerCancel: {
    flex: 1, padding: 14, borderRadius: 12,
    borderWidth: 1.5, alignItems: 'center',
  },
  pickerCancelText: { fontSize: 15, fontWeight: '600' },
  pickerSave: {
    flex: 1, padding: 14, borderRadius: 12, alignItems: 'center',
  },
  pickerSaveText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
