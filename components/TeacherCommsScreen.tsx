import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getLesediResponse } from '../services/perplexity';
import ChildSelector from './ChildSelector';

const CONCERN_TYPES = [
  { id: 'concern', label: '😟 Concern' },
  { id: 'absence', label: '🏠 Absence' },
  { id: 'bullying', label: '🛡️ Bullying' },
  { id: 'academic', label: '📖 Academic' },
  { id: 'other', label: '💬 Other' },
];

interface Props {
  childName: string;
  childNames?: string[];
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

export default function TeacherCommsScreen({ childName, childNames = [], theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const allChildren = childNames.length > 0 ? childNames : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || allChildren[0] || '');
  const [concern, setConcern] = useState('concern');
  const [details, setDetails] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);

  const bg = isDarkMode ? '#111111' : theme.background;
  const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;

  const generateDraft = async () => {
    if (!details.trim()) {
      Alert.alert('Tell us more', 'Describe what you want to communicate to the teacher.');
      return;
    }
    setLoading(true);
    setDraft('');

    const type = CONCERN_TYPES.find((c) => c.id === concern)?.label ?? 'message';
    const prompt = `Write a short, professional and warm parent-to-teacher message.
Type: ${type}
Child: ${selectedChild || 'my child'}
Situation: ${details}

Write ONLY the message body (no subject line). Under 100 words. Polite, clear, and constructive.`;

    const res = await getLesediResponse(prompt, 'teacher_comms', [], '', selectedChild, 'mom', false);
    setDraft(res.success ? res.data : res.fallback);
    setLoading(false);
  };

  const shareDraft = async () => {
    if (!draft) return;
    try {
      await Share.share({ message: draft });
    } catch {
      // user dismissed share sheet
    }
  };

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
        <View>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>✉️ Message My Teacher</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            AI drafts it — you copy & send
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <ChildSelector
          childNames={allChildren} selected={selectedChild}
          onSelect={(n) => { setSelectedChild(n); setDraft(''); setDetails(''); }}
          accentColor={theme.header} isDarkMode={isDarkMode}
        />
        <Text style={{ fontSize: 13, fontWeight: '700', color: textCol, marginBottom: 10 }}>
          What kind of message?
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {CONCERN_TYPES.map((c) => (
            <TouchableOpacity
              key={c.id}
              onPress={() => setConcern(c.id)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 20, borderWidth: 1.5,
                borderColor: concern === c.id ? theme.header : borderCol,
                backgroundColor: concern === c.id ? theme.header + '18' : cardBg,
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '600',
                color: concern === c.id ? theme.header : subCol,
              }}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ fontSize: 13, fontWeight: '700', color: textCol, marginBottom: 8 }}>
          What do you want to say?
        </Text>
        <TextInput
          style={{
            backgroundColor: cardBg, borderWidth: 1.5, borderColor: borderCol,
            borderRadius: 14, padding: 14, fontSize: 14, color: textCol,
            minHeight: 100, textAlignVertical: 'top', marginBottom: 16,
          }}
          value={details}
          onChangeText={setDetails}
          placeholder={`Briefly describe the situation regarding ${selectedChild || 'your child'}...`}
          placeholderTextColor="#aaa"
          multiline
        />

        <TouchableOpacity
          onPress={generateDraft}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#aaa' : theme.header,
            borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20,
          }}
        >
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
            {loading ? 'Drafting...' : '✨ Draft My Message'}
          </Text>
        </TouchableOpacity>

        {draft !== '' && (
          <View style={{
            backgroundColor: isDarkMode ? '#162516' : '#F0FFF4',
            borderRadius: 16, padding: 18,
            borderWidth: 1.5, borderColor: '#4CAF50',
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#4CAF50', marginBottom: 10, letterSpacing: 0.5 }}>
              ✅ YOUR DRAFTED MESSAGE
            </Text>
            <Text style={{ fontSize: 14, color: textCol, lineHeight: 22, marginBottom: 16 }}>
              {draft}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={shareDraft}
                style={{ flex: 1, backgroundColor: theme.header, borderRadius: 12, padding: 14, alignItems: 'center' }}
              >
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>📤 Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={generateDraft}
                style={{
                  flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
                  borderWidth: 1.5, borderColor: borderCol, backgroundColor: cardBg,
                }}
              >
                <Text style={{ color: textCol, fontWeight: '700', fontSize: 14 }}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
