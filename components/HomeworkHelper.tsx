import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  ActivityIndicator,
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

const GRADES = ['Grade R', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'];

interface Props {
  childName: string;
  childNames?: string[];
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

export default function HomeworkHelper({ childName, childNames = [], theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const allChildren = childNames.length > 0 ? childNames : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || allChildren[0] || '');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [grade, setGrade] = useState('Grade 2');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const bg = isDarkMode ? '#111111' : theme.background;
  const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;

  const pickImage = async (fromCamera: boolean) => {
    const { status } = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') return;

    const res = fromCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ImagePicker.MediaTypeOptions.Images });

    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setImageBase64(res.assets[0].base64 ?? null);
      setResult('');
    }
  };

  const analyzeHomework = async () => {
    if (!imageBase64) return;
    setLoading(true);
    setResult('');

    const prompt = `This is a ${grade} homework worksheet${selectedChild ? ` for a child named ${selectedChild}` : ''}.

Please:
1. Identify the subject and topic
2. Explain the key concepts in very simple terms a parent can understand
3. Give 2-3 practical tips for helping the child complete this homework at home

Be warm, encouraging, and clear. Use simple language. Format with emoji where helpful.`;

    const res = await analyzeImageWithPrompt(imageBase64, prompt);
    setResult(res.success ? res.data : res.fallback);
    setLoading(false);
  };

  return (
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
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>📝 Homework Helper</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            Photo → plain English explanation
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <ChildSelector
          childNames={allChildren} selected={selectedChild}
          onSelect={(n) => { setSelectedChild(n); setResult(''); setImageUri(null); setImageBase64(null); }}
          accentColor={theme.header} isDarkMode={isDarkMode}
        />
        <Text style={{ fontSize: 13, fontWeight: '700', color: textCol, marginBottom: 10 }}>
          {selectedChild ? `${selectedChild}'s grade` : "Child's grade"}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {GRADES.map((g) => (
              <TouchableOpacity
                key={g}
                onPress={() => setGrade(g)}
                style={{
                  paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: grade === g ? theme.header : borderCol,
                  backgroundColor: grade === g ? theme.header + '18' : cardBg,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: grade === g ? theme.header : subCol }}>
                  {g}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

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
              style={{
                width: '100%', height: 220, borderRadius: 14,
                resizeMode: 'contain', backgroundColor: '#F5F5F5', marginBottom: 12,
              }}
            />
            <TouchableOpacity
              onPress={analyzeHomework}
              disabled={loading}
              style={{
                backgroundColor: loading ? '#aaa' : '#FFA000',
                borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16,
              }}
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>✨ Help Me Explain This</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <View style={{
            backgroundColor: cardBg, borderRadius: 16, padding: 32, alignItems: 'center',
            borderWidth: 1, borderColor: borderCol, borderStyle: 'dashed', marginBottom: 16,
          }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📚</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textCol, marginBottom: 6 }}>
              Take a photo of the homework
            </Text>
            <Text style={{ fontSize: 13, color: subCol, textAlign: 'center', lineHeight: 20 }}>
              We'll break it down so you can guide {selectedChild || 'your child'} step by step
            </Text>
          </View>
        )}

        {result !== '' && (
          <View style={{
            backgroundColor: isDarkMode ? '#1A2516' : '#F1F8E9',
            borderRadius: 16, padding: 18,
            borderWidth: 1.5, borderColor: '#8BC34A',
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#558B2F', marginBottom: 10, letterSpacing: 0.5 }}>
              📖 HERE'S WHAT YOU NEED TO KNOW
            </Text>
            <Text style={{ fontSize: 14, color: textCol, lineHeight: 22 }}>{result}</Text>
            <TouchableOpacity
              onPress={() => { setImageUri(null); setImageBase64(null); setResult(''); }}
              style={{ marginTop: 14, alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, color: subCol }}>📷 Scan another worksheet</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
