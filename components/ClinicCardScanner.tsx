import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyzeImageWithPrompt } from '../services/vision';
import { stripMarkdown } from '../utils/markdown';
import { playClickSound } from '../utils/sounds';
import {
  SavedClinicRecord,
  deleteClinicRecord,
  loadClinicRecords,
  printClinicRecord,
  saveClinicRecord,
  shareFile,
} from '../utils/scanStorage';

type ScanType = 'visit' | 'vaccination';

interface ScanResult {
  visitSummary: string;
  treatmentPlan: string;
  healthNotes: string;
}

interface Props {
  childName: string;
  childNames?: string[];
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ClinicCardScanner({ childName, childNames = [], theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const allChildren = childNames.length > 0 ? childNames : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || allChildren[0] || '');
  const [activeTab, setActiveTab]     = useState<'scan' | 'history'>('scan');
  const [scanType, setScanType]       = useState<ScanType>('visit');
  const [imageUri, setImageUri]       = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState<ScanResult | null>(null);
  const [savedMsg, setSavedMsg]       = useState(false);
  const [savedRecord, setSavedRecord] = useState<SavedClinicRecord | null>(null);
  const [history, setHistory]         = useState<SavedClinicRecord[]>([]);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const name        = selectedChild || 'the child';
  const bg          = isDarkMode ? '#111111' : theme.background;
  const cardBg      = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol     = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol      = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol   = isDarkMode ? '#333333' : theme.quickQuestionsBorder;
  const isVacc      = scanType === 'vaccination';
  const accentColor = isVacc ? '#00897B' : '#1976D2';
  const accentLight = isVacc ? '#E0F2F1' : '#E3F2FD';
  const accentDark  = isVacc ? '#00695C' : '#0D47A1';

  useEffect(() => { refreshHistory(); }, [selectedChild]);

  const refreshHistory = async () => {
    const records = await loadClinicRecords(selectedChild);
    setHistory(records);
  };

  const pickImage = async (fromCamera: boolean) => {
    playClickSound();
    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission needed', `Please allow ${fromCamera ? 'camera' : 'photo library'} access in your device settings.`);
      return;
    }

    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({
          base64: true, quality: 0.85,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 ?? null);
      setResult(null); setSavedMsg(false);
    }
  };

  const scanCard = async () => {
    if (!imageBase64) return;
    playClickSound();
    setLoading(true);

    const [summaryRes, treatmentRes, notesRes] = await Promise.all([
      analyzeImageWithPrompt(
        imageBase64,
        isVacc
          ? `This is a vaccination/immunization record for ${name}. List each vaccine clearly: vaccine name, date given, batch/lot number if visible, and the clinic or nurse who administered it. If multiple pages or entries are visible, list all. If unclear, say so.`
          : `This is a clinic card or doctor visit record for ${name}. Extract: date of visit, clinic or doctor's name, child's weight (kg), height (cm), head circumference (cm) if present, reason for visit, and any diagnosis or findings noted. Present it clearly.`
      ),
      analyzeImageWithPrompt(
        imageBase64,
        isVacc
          ? `Based on this vaccination record for ${name}, list: any upcoming or overdue vaccines based on the standard immunisation schedule (6 weeks, 10 weeks, 14 weeks, 6 months, 9 months, 12 months, 18 months). Note the next due date if visible. Keep it brief and parent-friendly.`
          : `Based on this clinic/doctor record for ${name}, list any: medications prescribed (name, dose, frequency, duration), treatments recommended, referrals made, and the next scheduled appointment date. Be brief and clear.`
      ),
      analyzeImageWithPrompt(
        imageBase64,
        isVacc
          ? `Based on this vaccination record, give the parent 2–3 short, practical notes — e.g. normal reactions to expect, when to seek help, or general immunisation tips. Keep it warm and reassuring.`
          : `Based on this clinic/doctor visit record for ${name}, assess the growth measurements if present and note whether they appear on track for the child's age. Give the parent 2–3 practical follow-up tips. Flag anything that needs urgent attention. Be warm and clear.`
      ),
    ]);

    const scanResult: ScanResult = {
      visitSummary:  stripMarkdown(summaryRes.success   ? summaryRes.data   : summaryRes.fallback),
      treatmentPlan: stripMarkdown(treatmentRes.success ? treatmentRes.data : treatmentRes.fallback),
      healthNotes:   stripMarkdown(notesRes.success     ? notesRes.data     : notesRes.fallback),
    };

    setResult(scanResult);

    try {
      const rec = await saveClinicRecord(imageBase64, selectedChild, scanType, scanResult);
      setSavedRecord(rec);
      setSavedMsg(true);
      refreshHistory();
    } catch (e) {
      console.warn('Save failed:', e);
    }

    setLoading(false);
  };

  const handlePrint = async () => {
    if (!result) return;
    playClickSound();
    const dateStr = new Date().toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' });
    const summary = [
      `GentleParent — ${isVacc ? 'Vaccination Record' : 'Clinic Visit Record'}`,
      `Child: ${childName || 'My child'}`,
      `Scanned: ${dateStr}`,
      '',
      isVacc ? '💉 VACCINATIONS GIVEN' : '🩺 VISIT SUMMARY',
      result.visitSummary,
      '',
      isVacc ? '📅 UPCOMING / NEXT DUE' : '💊 TREATMENT & NEXT STEPS',
      result.treatmentPlan,
      '',
      '📝 HEALTH NOTES',
      result.healthNotes,
      '',
      '─────────────────────────',
      'Scanned with GentleParent · For reference only · Always consult your healthcare provider',
    ].join('\n');

    try {
      await Share.share({ message: summary, title: `${childName || 'Child'} — Health Record` });
    } catch { /* dismissed */ }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Record', 'Remove this saved health record from your device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteClinicRecord(selectedChild, id);
          setHistory(h => h.filter(r => r.id !== id));
          if (expandedId === id) setExpandedId(null);
        },
      },
    ]);
  };

  const reset = () => {
    playClickSound();
    setImageUri(null); setImageBase64(null); setResult(null);
    setSavedMsg(false); setSavedRecord(null);
  };

  const childSelector = allChildren.length > 1 ? (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? '#AAAAAA' : '#555', marginBottom: 8, letterSpacing: 0.4 }}>
        SCANNING FOR
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {allChildren.map(name => (
          <TouchableOpacity
            key={name}
            onPress={() => {
              playClickSound();
              setSelectedChild(name);
              setResult(null);
              setImageUri(null);
              setImageBase64(null);
              setSavedMsg(false);
              setSavedRecord(null);
              setExpandedId(null);
            }}
            style={{
              paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
              backgroundColor: selectedChild === name ? accentColor : (isDarkMode ? '#2A2A2A' : '#F0F0F0'),
              borderWidth: 1.5,
              borderColor: selectedChild === name ? accentColor : (isDarkMode ? '#444' : '#DDD'),
            }}
          >
            <Text style={{
              fontWeight: '700', fontSize: 13,
              color: selectedChild === name ? 'white' : (isDarkMode ? '#CCC' : '#444'),
            }}>
              {name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ) : null;

  const privacyNote = (
    <View style={{
      backgroundColor: isDarkMode ? '#1A1A2E' : '#EDE7F6',
      borderRadius: 12, padding: 12, marginBottom: 16,
      borderWidth: 1, borderColor: '#9C27B0' + '55',
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    }}>
      <Text style={{ fontSize: 16 }}>🔒</Text>
      <Text style={{ flex: 1, fontSize: 12, color: isDarkMode ? '#CCBBEE' : '#6A1B9A', lineHeight: 18 }}>
        Documents are saved privately on this device only. They will be removed if the app is uninstalled.{' '}
        <Text style={{ fontWeight: '700' }}>Inka-Tech Solutions does not store or access your files.</Text>
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: accentColor,
        paddingTop: Platform.OS === 'android' ? insets.top + 16 : 20,
        shadowColor: accentDark,
        paddingBottom: 0,
      }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 12, paddingHorizontal: 0 }}>
          <TouchableOpacity onPress={() => { playClickSound(); onClose(); }} style={styles.backBtn}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>🏥 Clinic Card Scanner</Text>
            <Text style={styles.headerSub}>
              {selectedChild ? `${selectedChild}'s health records` : 'Scan & save health records'}
            </Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row' }}>
          {(['scan', 'history'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => { playClickSound(); setActiveTab(tab); }}
              style={{
                flex: 1, paddingVertical: 10, alignItems: 'center',
                borderBottomWidth: 3,
                borderBottomColor: activeTab === tab ? 'white' : 'transparent',
              }}
            >
              <Text style={{
                color: activeTab === tab ? 'white' : 'rgba(255,255,255,0.55)',
                fontWeight: '700', fontSize: 13,
              }}>
                {tab === 'scan' ? '📷 New Scan' : `📁 Saved (${history.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'scan' ? (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

          {privacyNote}
          {childSelector}

          {/* Scan type selector */}
          <View style={[styles.typeRow, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F0F4F8', borderColor: borderCol }]}>
            <TouchableOpacity
              style={[styles.typeBtn, scanType === 'visit' && { backgroundColor: '#1976D2' }]}
              onPress={() => { playClickSound(); setScanType('visit'); setResult(null); setImageUri(null); setImageBase64(null); }}
              activeOpacity={0.8}
            >
              <Text style={styles.typeBtnIcon}>🩺</Text>
              <Text style={[styles.typeBtnLabel, { color: scanType === 'visit' ? 'white' : (isDarkMode ? '#CCC' : '#444') }]}>
                Doctor Visit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, scanType === 'vaccination' && { backgroundColor: '#00897B' }]}
              onPress={() => { playClickSound(); setScanType('vaccination'); setResult(null); setImageUri(null); setImageBase64(null); }}
              activeOpacity={0.8}
            >
              <Text style={styles.typeBtnIcon}>💉</Text>
              <Text style={[styles.typeBtnLabel, { color: scanType === 'vaccination' ? 'white' : (isDarkMode ? '#CCC' : '#444') }]}>
                Vaccination Record
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pick buttons */}
          <View style={styles.pickRow}>
            <TouchableOpacity onPress={() => pickImage(true)} style={[styles.pickBtn, { backgroundColor: accentColor }]}>
              <Text style={styles.pickBtnText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => pickImage(false)} style={[styles.pickBtn, styles.pickBtnOutline, { borderColor: accentColor }]}>
              <Text style={[styles.pickBtnText, { color: accentColor }]}>🖼️ Choose Photo</Text>
            </TouchableOpacity>
          </View>

          {imageUri ? (
            <>
              <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />
              <TouchableOpacity
                onPress={scanCard}
                disabled={loading}
                style={[styles.scanBtn, { backgroundColor: loading ? '#AAA' : accentColor, shadowColor: accentDark }]}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="white" />
                    <Text style={styles.scanBtnText}>Reading record...</Text>
                  </View>
                ) : (
                  <Text style={styles.scanBtnText}>
                    🔍 Scan {isVacc ? 'Vaccination Record' : 'Clinic Card'}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: cardBg, borderColor: accentColor + '55' }]}>
              <Text style={styles.emptyIcon}>{isVacc ? '💉' : '🏥'}</Text>
              <Text style={[styles.emptyTitle, { color: textCol }]}>
                {isVacc ? 'Scan a Vaccination Record' : `Scan ${childName ? `${childName}'s` : 'a'} Clinic Card`}
              </Text>
              <Text style={[styles.emptySub, { color: subCol }]}>
                {isVacc
                  ? `Photo your Road to Health booklet immunisation page or any vaccine record.`
                  : `Photo your Road to Health booklet or any doctor's visit notes.`}
              </Text>
            </View>
          )}

          {savedMsg && savedRecord && (
            <>
              <View style={{
                backgroundColor: isDarkMode ? '#0D2010' : '#E8F5E9',
                borderRadius: 12, padding: 12,
                flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
                borderWidth: 1, borderColor: '#4CAF50',
              }}>
                <Text style={{ fontSize: 18 }}>✅</Text>
                <Text style={{ flex: 1, color: isDarkMode ? '#A5D6A7' : '#2E7D32', fontWeight: '600', fontSize: 13 }}>
                  Saved to your device — view it any time in the Saved tab.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <TouchableOpacity
                  onPress={() => { playClickSound(); shareFile(savedRecord.filePath); }}
                  style={{ flex: 1, backgroundColor: accentColor, borderRadius: 12, padding: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>📤 Share Image</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { playClickSound(); printClinicRecord(savedRecord); }}
                  style={{ flex: 1, backgroundColor: '#6A1B9A', borderRadius: 12, padding: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>🖨️ Print / PDF</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {result && (
            <>
              {/* Section 1 — Visit Summary / Vaccinations */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: isDarkMode ? '#1A2A3A' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.sectionHeader, { backgroundColor: accentColor }]}>
                  <View style={styles.sectionIconBox}>
                    <Text style={{ fontSize: 18 }}>{isVacc ? '💉' : '🩺'}</Text>
                  </View>
                  <Text style={styles.sectionHeaderText}>
                    {isVacc ? 'VACCINATIONS GIVEN' : 'VISIT SUMMARY'}
                  </Text>
                </View>
                <View style={styles.sectionBody}>
                  <Text style={[styles.sectionBodyText, { color: textCol }]}>{result.visitSummary}</Text>
                </View>
              </View>

              {/* Section 2 — Treatment / Next Due */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: isDarkMode ? '#2A2010' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.sectionHeader, { backgroundColor: '#F57C00' }]}>
                  <View style={styles.sectionIconBox}>
                    <Text style={{ fontSize: 18 }}>{isVacc ? '📅' : '💊'}</Text>
                  </View>
                  <Text style={styles.sectionHeaderText}>
                    {isVacc ? 'UPCOMING / NEXT DUE' : 'TREATMENT & NEXT STEPS'}
                  </Text>
                </View>
                <View style={styles.sectionBody}>
                  <Text style={[styles.sectionBodyText, { color: textCol }]}>{result.treatmentPlan}</Text>
                </View>
              </View>

              {/* Section 3 — Health Notes */}
              <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: isDarkMode ? '#102010' : 'rgba(0,0,0,0.06)' }]}>
                <View style={[styles.sectionHeader, { backgroundColor: '#388E3C' }]}>
                  <View style={styles.sectionIconBox}>
                    <Text style={{ fontSize: 18 }}>📝</Text>
                  </View>
                  <Text style={styles.sectionHeaderText}>HEALTH NOTES</Text>
                </View>
                <View style={styles.sectionBody}>
                  <Text style={[styles.sectionBodyText, { color: textCol }]}>{result.healthNotes}</Text>
                </View>
              </View>

              {/* Disclaimer */}
              <View style={{
                flexDirection: 'row', alignItems: 'flex-start', gap: 10,
                backgroundColor: isDarkMode ? '#1A1400' : '#FFF8E1',
                borderRadius: 14, padding: 14, marginBottom: 16,
                borderWidth: 1, borderColor: isDarkMode ? '#3A2800' : '#FFB74D',
              }}>
                <Text style={{ fontSize: 16 }}>⚠️</Text>
                <Text style={{ flex: 1, fontSize: 12, color: isDarkMode ? '#CCAA55' : '#E65100', lineHeight: 18, fontStyle: 'italic' }}>
                  For reference only. Always consult your doctor or clinic sister for medical decisions.
                </Text>
              </View>

              <TouchableOpacity onPress={handlePrint} style={[styles.printBtn, { backgroundColor: accentColor, shadowColor: accentDark }]}>
                <Text style={styles.printBtnText}>🖨️ Print / Share Summary</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={reset} style={styles.resetLink}>
                <Text style={[styles.resetLinkText, { color: subCol }]}>📷 Scan another record</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      ) : (
        /* ── History Tab ── */
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
          {privacyNote}
          {childSelector}

          {history.length === 0 ? (
            <View style={{
              backgroundColor: cardBg, borderRadius: 16, padding: 32, alignItems: 'center',
              borderWidth: 1, borderColor: borderCol, borderStyle: 'dashed',
            }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📁</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textCol, marginBottom: 6 }}>No saved records yet</Text>
              <Text style={{ fontSize: 13, color: subCol, textAlign: 'center' }}>
                Scan a clinic card or vaccination record and it'll be saved here automatically.
              </Text>
            </View>
          ) : (
            history.map(record => {
              const isVaccRecord  = record.scanType === 'vaccination';
              const recordAccent  = isVaccRecord ? '#00897B' : '#1976D2';
              const recordBg      = isVaccRecord ? (isDarkMode ? '#0A1A18' : '#E0F2F1') : (isDarkMode ? '#0A1628' : '#E3F2FD');
              return (
                <View key={record.id} style={{
                  backgroundColor: cardBg, borderRadius: 16, marginBottom: 14,
                  borderWidth: 1, borderColor: borderCol, overflow: 'hidden',
                }}>
                  <View style={{ flexDirection: 'row', padding: 14, gap: 12, alignItems: 'center' }}>
                    <Image
                      source={{ uri: record.filePath }}
                      style={{ width: 72, height: 72, borderRadius: 10, backgroundColor: '#F5F5F5' }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: textCol }}>
                        {isVaccRecord ? '💉 Vaccination Record' : '🩺 Doctor Visit'}
                      </Text>
                      <Text style={{ fontSize: 12, color: subCol, marginTop: 2 }}>{formatDate(record.date)}</Text>
                      {record.childName ? (
                        <Text style={{ fontSize: 12, color: subCol }}>{record.childName}</Text>
                      ) : null}
                    </View>
                    <TouchableOpacity
                      onPress={() => setExpandedId(expandedId === record.id ? null : record.id)}
                      style={{ backgroundColor: recordAccent + '18', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}
                    >
                      <Text style={{ color: recordAccent, fontWeight: '700', fontSize: 12 }}>
                        {expandedId === record.id ? 'Hide' : 'View'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {expandedId === record.id && (
                    <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
                      {!!record.visitSummary && (
                        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: isDarkMode ? '#1A2A3A' : 'rgba(0,0,0,0.06)' }]}>
                          <View style={[styles.sectionHeader, { backgroundColor: recordAccent }]}>
                            <View style={styles.sectionIconBox}>
                              <Text style={{ fontSize: 16 }}>{isVaccRecord ? '💉' : '🩺'}</Text>
                            </View>
                            <Text style={styles.sectionHeaderText}>{isVaccRecord ? 'VACCINATIONS GIVEN' : 'VISIT SUMMARY'}</Text>
                          </View>
                          <View style={styles.sectionBody}>
                            <Text style={[styles.sectionBodyText, { color: textCol }]}>{stripMarkdown(record.visitSummary)}</Text>
                          </View>
                        </View>
                      )}
                      {!!record.treatmentPlan && (
                        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: isDarkMode ? '#2A2010' : 'rgba(0,0,0,0.06)' }]}>
                          <View style={[styles.sectionHeader, { backgroundColor: '#F57C00' }]}>
                            <View style={styles.sectionIconBox}>
                              <Text style={{ fontSize: 16 }}>{isVaccRecord ? '📅' : '💊'}</Text>
                            </View>
                            <Text style={styles.sectionHeaderText}>{isVaccRecord ? 'UPCOMING / NEXT DUE' : 'TREATMENT & NEXT STEPS'}</Text>
                          </View>
                          <View style={styles.sectionBody}>
                            <Text style={[styles.sectionBodyText, { color: textCol }]}>{stripMarkdown(record.treatmentPlan)}</Text>
                          </View>
                        </View>
                      )}
                      {!!record.healthNotes && (
                        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: isDarkMode ? '#102010' : 'rgba(0,0,0,0.06)' }]}>
                          <View style={[styles.sectionHeader, { backgroundColor: '#388E3C' }]}>
                            <View style={styles.sectionIconBox}>
                              <Text style={{ fontSize: 16 }}>📝</Text>
                            </View>
                            <Text style={styles.sectionHeaderText}>HEALTH NOTES</Text>
                          </View>
                          <View style={styles.sectionBody}>
                            <Text style={[styles.sectionBodyText, { color: textCol }]}>{stripMarkdown(record.healthNotes)}</Text>
                          </View>
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => { playClickSound(); shareFile(record.filePath); }}
                          style={{ flex: 1, backgroundColor: recordBg, borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: recordAccent }}
                        >
                          <Text style={{ color: recordAccent, fontWeight: '700', fontSize: 12 }}>📤 Share</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => { playClickSound(); printClinicRecord(record); }}
                          style={{ flex: 1, backgroundColor: '#EDE7F6', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#7B1FA2' }}
                        >
                          <Text style={{ color: '#7B1FA2', fontWeight: '700', fontSize: 12 }}>🖨️ Print</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDelete(record.id)}
                          style={{ flex: 1, backgroundColor: '#FFEBEE', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#EF5350' }}
                        >
                          <Text style={{ color: '#C62828', fontWeight: '700', fontSize: 12 }}>🗑️ Delete</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    flexDirection: 'column',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  backBtn:    { padding: 4 },
  backArrow:  { fontSize: 22, color: 'white' },
  headerTitle:{ fontSize: 20, fontWeight: 'bold', color: 'white' },
  headerSub:  { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  typeRow: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: 14,
    gap: 4,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 12, borderRadius: 12, gap: 6,
  },
  typeBtnIcon:  { fontSize: 18 },
  typeBtnLabel: { fontSize: 13, fontWeight: '700' },

  pickRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  pickBtn: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  pickBtnOutline: { backgroundColor: 'transparent', borderWidth: 1.5 },
  pickBtnText: { color: 'white', fontWeight: '700', fontSize: 13 },

  preview: {
    width: '100%', height: 240, borderRadius: 14,
    backgroundColor: '#F5F5F5', marginBottom: 12,
  },

  scanBtn: {
    borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 0, elevation: 5,
    borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  scanBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },

  emptyState: {
    borderRadius: 16, padding: 32, alignItems: 'center',
    borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 20,
  },
  emptyIcon:  { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  sectionCard: {
    borderRadius: 18, marginBottom: 14, overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14,
  },
  sectionIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  sectionHeaderText: {
    color: 'white', fontWeight: '800', fontSize: 12, letterSpacing: 0.8, flex: 1,
  },
  sectionBody: { padding: 16 },
  sectionBodyText: { fontSize: 14, lineHeight: 22 },

  printBtn: {
    borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3,
    shadowRadius: 0, elevation: 5,
    borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  printBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },

  resetLink:     { alignItems: 'center', paddingVertical: 8 },
  resetLinkText: { fontSize: 13 },
});
