import * as ImagePicker from 'expo-image-picker';
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
import { playClickSound } from '../utils/sounds';
import {
  SavedReportCard,
  deleteReportCard,
  loadReportCards,
  printReportCard,
  saveReportCard,
  shareFile,
} from '../utils/scanStorage';
import ChildSelector from './ChildSelector';

interface Props {
  childName: string;
  childNames?: string[];
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });

export default function ReportCardScanner({ childName, childNames = [], theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const allChildren = childNames.length > 0 ? childNames : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || allChildren[0] || '');
  const [activeTab, setActiveTab]     = useState<'scan' | 'history'>('scan');
  const [imageUri, setImageUri]       = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [breakdown, setBreakdown]     = useState('');
  const [talkScript, setTalkScript]   = useState('');
  const [focusAreas, setFocusAreas]   = useState('');
  const [savedMsg, setSavedMsg]       = useState(false);
  const [savedRecord, setSavedRecord] = useState<SavedReportCard | null>(null);
  const [history, setHistory]         = useState<SavedReportCard[]>([]);
  const [expandedId, setExpandedId]   = useState<string | null>(null);

  const bg        = isDarkMode ? '#111111' : theme.background;
  const cardBg    = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol   = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol    = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;
  const name      = childName || 'the child';

  useEffect(() => { refreshHistory(); }, [selectedChild]);

  const refreshHistory = async () => {
    const records = await loadReportCards(selectedChild);
    setHistory(records);
  };

  const pickImage = async (fromCamera: boolean) => {
    playClickSound();
    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') return;

    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({
          base64: true, quality: 0.85,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 ?? null);
      setBreakdown(''); setTalkScript(''); setFocusAreas(''); setSavedMsg(false);
    }
  };

  const scanReportCard = async () => {
    if (!imageBase64) return;
    playClickSound();
    setLoading(true);

    const [breakdownRes, scriptRes, focusRes] = await Promise.all([
      analyzeImageWithPrompt(
        imageBase64,
        `This is a school report card for ${name}. List each subject with its mark or symbol and any teacher comment. Format clearly. If the image is unclear, say so politely.`
      ),
      analyzeImageWithPrompt(
        imageBase64,
        `Based on this report card for ${name}, write a short warm script (3–5 sentences) a parent can say when discussing results with their child. Be encouraging regardless of the grades — focus on effort, growth, and pride.`
      ),
      analyzeImageWithPrompt(
        imageBase64,
        `Based on this report card, identify 2–3 subjects needing the most attention. For each, give one simple practical thing the parent can do at home. Be brief and actionable.`
      ),
    ]);

    const bd = breakdownRes.success ? breakdownRes.data : breakdownRes.fallback;
    const ts = scriptRes.success    ? scriptRes.data    : scriptRes.fallback;
    const fa = focusRes.success     ? focusRes.data     : focusRes.fallback;

    setBreakdown(bd); setTalkScript(ts); setFocusAreas(fa);

    try {
      const rec = await saveReportCard(imageBase64, selectedChild, { breakdown: bd, talkScript: ts, focusAreas: fa });
      setSavedRecord(rec);
      setSavedMsg(true);
      refreshHistory();
    } catch (e) {
      console.warn('Save failed:', e);
    }

    setLoading(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Record', 'Remove this saved report card from your device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await deleteReportCard(selectedChild, id);
          setHistory(h => h.filter(r => r.id !== id));
          if (expandedId === id) setExpandedId(null);
        },
      },
    ]);
  };

  const reset = () => {
    playClickSound();
    setImageUri(null); setImageBase64(null);
    setBreakdown(''); setTalkScript(''); setFocusAreas('');
    setSavedMsg(false); setSavedRecord(null);
  };

  const hasResults = breakdown !== '' || talkScript !== '' || focusAreas !== '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={{
        backgroundColor: theme.header,
        paddingTop: Platform.OS === 'android' ? insets.top + 16 : 20,
        paddingBottom: 0, paddingHorizontal: 20,
        shadowColor: theme.headerShadow, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 6, elevation: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 12 }}>
          <TouchableOpacity onPress={() => { playClickSound(); onClose(); }} style={{ padding: 4, marginRight: 12 }}>
            <Text style={{ fontSize: 22, color: 'white' }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>📋 Report Card Scanner</Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {selectedChild ? `${selectedChild}'s academic records` : 'Scan → insights + talk script'}
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
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

          {/* Privacy disclaimer */}
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

          <ChildSelector
            childNames={allChildren} selected={selectedChild}
            onSelect={(n) => { setSelectedChild(n); setImageUri(null); setImageBase64(null); setBreakdown(''); setTalkScript(''); setFocusAreas(''); setSavedMsg(false); setSavedRecord(null); }}
            accentColor='#4CAF50' isDarkMode={isDarkMode}
          />

          {/* Pick buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <TouchableOpacity
              onPress={() => pickImage(true)}
              style={{ flex: 1, backgroundColor: theme.header, borderRadius: 14, padding: 14, alignItems: 'center' }}
            >
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => pickImage(false)}
              style={{
                flex: 1, backgroundColor: cardBg, borderRadius: 14, padding: 14,
                alignItems: 'center', borderWidth: 1.5, borderColor: borderCol,
              }}
            >
              <Text style={{ color: textCol, fontWeight: '700', fontSize: 13 }}>🖼️ Choose Photo</Text>
            </TouchableOpacity>
          </View>

          {imageUri ? (
            <>
              <Image
                source={{ uri: imageUri }}
                style={{ width: '100%', height: 240, borderRadius: 14, resizeMode: 'contain', backgroundColor: '#F5F5F5', marginBottom: 12 }}
              />
              <TouchableOpacity
                onPress={scanReportCard}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#AAA' : '#4CAF50',
                  borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20,
                  elevation: 4,
                }}
              >
                {loading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <ActivityIndicator color="white" />
                    <Text style={{ color: 'white', fontWeight: '700' }}>Scanning...</Text>
                  </View>
                ) : (
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>🔍 Scan Report Card</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <View style={{
              backgroundColor: cardBg, borderRadius: 16, padding: 32, alignItems: 'center',
              borderWidth: 1, borderColor: borderCol, borderStyle: 'dashed', marginBottom: 20,
            }}>
              <Text style={{ fontSize: 52, marginBottom: 12 }}>📋</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textCol, marginBottom: 6 }}>
                {childName ? `Scan ${childName}'s Report Card` : 'Scan the Report Card'}
              </Text>
              <Text style={{ fontSize: 13, color: subCol, textAlign: 'center', lineHeight: 20 }}>
                Take a clear photo. We'll extract the marks, spot what needs work, and give you a talk script.
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
                  style={{ flex: 1, backgroundColor: '#1976D2', borderRadius: 12, padding: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>📤 Share Image</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { playClickSound(); printReportCard(savedRecord); }}
                  style={{ flex: 1, backgroundColor: '#6A1B9A', borderRadius: 12, padding: 12, alignItems: 'center' }}
                >
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 13 }}>🖨️ Print / PDF</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {breakdown !== '' && (
            <View style={{
              backgroundColor: isDarkMode ? '#0D1F0D' : '#E8F5E9',
              borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#4CAF50', marginBottom: 14,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#2E7D32', marginBottom: 10, letterSpacing: 0.8 }}>
                📊 RESULTS BREAKDOWN
              </Text>
              <Text style={{ fontSize: 14, color: textCol, lineHeight: 22 }}>{breakdown}</Text>
            </View>
          )}

          {talkScript !== '' && (
            <View style={{
              backgroundColor: isDarkMode ? '#1F1A0D' : '#FFF8E1',
              borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#FFB300', marginBottom: 14,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#E65100', marginBottom: 10, letterSpacing: 0.8 }}>
                💬 WHAT TO SAY TO {(childName || 'YOUR CHILD').toUpperCase()}
              </Text>
              <Text style={{ fontSize: 14, color: textCol, lineHeight: 22, fontStyle: 'italic' }}>
                "{talkScript}"
              </Text>
            </View>
          )}

          {focusAreas !== '' && (
            <View style={{
              backgroundColor: isDarkMode ? '#0D1020' : '#E3F2FD',
              borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#1976D2', marginBottom: 14,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#0D47A1', marginBottom: 10, letterSpacing: 0.8 }}>
                🎯 WHAT TO FOCUS ON THIS TERM
              </Text>
              <Text style={{ fontSize: 14, color: textCol, lineHeight: 22 }}>{focusAreas}</Text>
            </View>
          )}

          {hasResults && (
            <TouchableOpacity onPress={reset} style={{ alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 13, color: subCol }}>📷 Scan another report card</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        /* ── History Tab ── */
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

          {/* Privacy disclaimer */}
          <View style={{
            backgroundColor: isDarkMode ? '#1A1A2E' : '#EDE7F6',
            borderRadius: 12, padding: 12, marginBottom: 16,
            borderWidth: 1, borderColor: '#9C27B0' + '55',
            flexDirection: 'row', gap: 10, alignItems: 'flex-start',
          }}>
            <Text style={{ fontSize: 16 }}>🔒</Text>
            <Text style={{ flex: 1, fontSize: 12, color: isDarkMode ? '#CCBBEE' : '#6A1B9A', lineHeight: 18 }}>
              All files are stored privately on this device only and will be removed if the app is uninstalled.{' '}
              <Text style={{ fontWeight: '700' }}>Inka-Tech Solutions does not store or access your files.</Text>
            </Text>
          </View>

          <ChildSelector
            childNames={allChildren} selected={selectedChild}
            onSelect={(n) => setSelectedChild(n)}
            accentColor='#4CAF50' isDarkMode={isDarkMode}
          />

          {history.length === 0 ? (
            <View style={{
              backgroundColor: cardBg, borderRadius: 16, padding: 32, alignItems: 'center',
              borderWidth: 1, borderColor: borderCol, borderStyle: 'dashed',
            }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>📁</Text>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textCol, marginBottom: 6 }}>No saved records yet</Text>
              <Text style={{ fontSize: 13, color: subCol, textAlign: 'center' }}>
                Scan a report card and it'll be saved here automatically.
              </Text>
            </View>
          ) : (
            history.map(record => (
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
                    <Text style={{ fontSize: 14, fontWeight: '700', color: textCol }}>📋 Report Card</Text>
                    <Text style={{ fontSize: 12, color: subCol, marginTop: 2 }}>{formatDate(record.date)}</Text>
                    {record.childName ? (
                      <Text style={{ fontSize: 12, color: subCol }}>{record.childName}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => setExpandedId(expandedId === record.id ? null : record.id)}
                    style={{ backgroundColor: '#4CAF5018', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 }}
                  >
                    <Text style={{ color: '#4CAF50', fontWeight: '700', fontSize: 12 }}>
                      {expandedId === record.id ? 'Hide' : 'View'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {expandedId === record.id && (
                  <View style={{ paddingHorizontal: 14, paddingBottom: 14, gap: 10 }}>
                    {!!record.breakdown && (
                      <View style={{ backgroundColor: isDarkMode ? '#0D1F0D' : '#E8F5E9', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#4CAF50' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#2E7D32', marginBottom: 6, letterSpacing: 0.6 }}>📊 RESULTS BREAKDOWN</Text>
                        <Text style={{ fontSize: 13, color: textCol, lineHeight: 20 }}>{record.breakdown}</Text>
                      </View>
                    )}
                    {!!record.talkScript && (
                      <View style={{ backgroundColor: isDarkMode ? '#1F1A0D' : '#FFF8E1', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#FFB300' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#E65100', marginBottom: 6, letterSpacing: 0.6 }}>💬 TALK SCRIPT</Text>
                        <Text style={{ fontSize: 13, color: textCol, lineHeight: 20, fontStyle: 'italic' }}>"{record.talkScript}"</Text>
                      </View>
                    )}
                    {!!record.focusAreas && (
                      <View style={{ backgroundColor: isDarkMode ? '#0D1020' : '#E3F2FD', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#1976D2' }}>
                        <Text style={{ fontSize: 10, fontWeight: '800', color: '#0D47A1', marginBottom: 6, letterSpacing: 0.6 }}>🎯 FOCUS AREAS</Text>
                        <Text style={{ fontSize: 13, color: textCol, lineHeight: 20 }}>{record.focusAreas}</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => { playClickSound(); shareFile(record.filePath); }}
                        style={{ flex: 1, backgroundColor: '#E3F2FD', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1976D2' }}
                      >
                        <Text style={{ color: '#1976D2', fontWeight: '700', fontSize: 12 }}>📤 Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => { playClickSound(); printReportCard(record); }}
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
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
