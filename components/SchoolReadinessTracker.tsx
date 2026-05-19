import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ChildSelector from './ChildSelector';

const slug = (n: string) => n.trim().toLowerCase().replace(/\s+/g, '_') || 'default';
const STORAGE_KEY = (child: string) => `school_readiness_v1_${slug(child)}`;

const SKILLS = [
  // Self-Help
  { id: 'sh1', category: 'Self-Help', icon: '👕', skill: 'Can dress and undress independently' },
  { id: 'sh2', category: 'Self-Help', icon: '🚽', skill: 'Fully toilet trained' },
  { id: 'sh3', category: 'Self-Help', icon: '🍱', skill: 'Can open and close lunchbox / food packaging' },
  { id: 'sh4', category: 'Self-Help', icon: '👟', skill: 'Can put on and take off shoes' },
  { id: 'sh5', category: 'Self-Help', icon: '🤧', skill: 'Can wipe own nose and wash hands' },
  // Social
  { id: 'so1', category: 'Social', icon: '👫', skill: 'Can play cooperatively with other children' },
  { id: 'so2', category: 'Social', icon: '👋', skill: 'Separates from parents without major distress' },
  { id: 'so3', category: 'Social', icon: '🤝', skill: 'Can take turns and share toys' },
  { id: 'so4', category: 'Social', icon: '🙋', skill: 'Can ask an adult for help when needed' },
  // Language
  { id: 'l1', category: 'Language', icon: '💬', skill: 'Speaks in full sentences (4–5 words)' },
  { id: 'l2', category: 'Language', icon: '👂', skill: 'Can follow 2-step instructions' },
  { id: 'l3', category: 'Language', icon: '🔤', skill: 'Recognises own name in writing' },
  { id: 'l4', category: 'Language', icon: '📖', skill: 'Can listen to a short story without losing focus' },
  // Cognitive
  { id: 'c1', category: 'Cognitive', icon: '🔢', skill: 'Can count to at least 10' },
  { id: 'c2', category: 'Cognitive', icon: '🎨', skill: 'Knows basic colours (red, blue, yellow, green)' },
  { id: 'c3', category: 'Cognitive', icon: '🔷', skill: 'Recognises basic shapes (circle, square, triangle)' },
  { id: 'c4', category: 'Cognitive', icon: '🧩', skill: 'Can complete a simple 4–6 piece puzzle' },
  { id: 'c5', category: 'Cognitive', icon: '🗂️', skill: 'Can sort and match objects by colour or shape' },
  // Physical
  { id: 'p1', category: 'Physical', icon: '✏️', skill: 'Can hold a pencil / crayon correctly' },
  { id: 'p2', category: 'Physical', icon: '✂️', skill: 'Can use child-safe scissors' },
  { id: 'p3', category: 'Physical', icon: '⚽', skill: 'Can kick, catch and throw a ball' },
  { id: 'p4', category: 'Physical', icon: '🦵', skill: 'Can hop on one foot' },
  { id: 'p5', category: 'Physical', icon: '🖍️', skill: 'Can draw a basic person (head + body)' },
];

const CATEGORIES = [
  { name: 'Self-Help',  color: '#E91E63', bg: '#FCE4EC' },
  { name: 'Social',     color: '#2196F3', bg: '#E3F2FD' },
  { name: 'Language',   color: '#9C27B0', bg: '#F3E5F5' },
  { name: 'Cognitive',  color: '#FF9800', bg: '#FFF3E0' },
  { name: 'Physical',   color: '#4CAF50', bg: '#E8F5E9' },
];

interface Props {
  childName: string;
  childNames?: string[];
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

export default function SchoolReadinessTracker({ childName, childNames = [], theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const allChildren = childNames.length > 0 ? childNames : (childName ? [childName] : []);
  const [selectedChild, setSelectedChild] = useState(childName || allChildren[0] || '');
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const bg       = isDarkMode ? '#111111' : theme.background;
  const cardBg   = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol  = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol   = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY(selectedChild)).then((val) => {
      setChecked(val ? JSON.parse(val) : {});
    });
  }, [selectedChild]);

  const toggle = async (id: string) => {
    const next = { ...checked, [id]: !checked[id] };
    setChecked(next);
    await AsyncStorage.setItem(STORAGE_KEY(selectedChild), JSON.stringify(next));
  };

  const total    = SKILLS.length;
  const done     = SKILLS.filter((s) => checked[s.id]).length;
  const pct      = Math.round((done / total) * 100);
  const allDone  = done === total;

  const getMessage = () => {
    if (pct === 100) return '🎉 Ready for school!';
    if (pct >= 75)   return '🌟 Almost there!';
    if (pct >= 50)   return '💪 Good progress!';
    if (pct >= 25)   return '🌱 Keep going!';
    return '🚀 Let\'s get started!';
  };

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
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>🎒 School Readiness</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            {selectedChild ? `Is ${selectedChild} ready for Grade R?` : 'Is your child ready for Grade R?'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <ChildSelector
          childNames={allChildren} selected={selectedChild}
          onSelect={(n) => setSelectedChild(n)}
          accentColor={theme.header} isDarkMode={isDarkMode}
        />
        {/* Progress card */}
        <View style={{
          backgroundColor: allDone ? '#E8F5E9' : (isDarkMode ? '#1E2A1E' : '#F1F8E9'),
          borderRadius: 20, padding: 20, marginBottom: 20,
          borderWidth: 1.5, borderColor: allDone ? '#4CAF50' : (isDarkMode ? '#2E4A2E' : '#C5E1A5'),
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: isDarkMode ? '#EEEEEE' : '#2E7D32' }}>
              {getMessage()}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#4CAF50' }}>{pct}%</Text>
          </View>

          {/* Progress bar */}
          <View style={{ height: 10, backgroundColor: isDarkMode ? '#2A3A2A' : '#DCEDC8', borderRadius: 5, overflow: 'hidden' }}>
            <View style={{
              height: 10, width: `${pct}%` as any,
              backgroundColor: allDone ? '#2E7D32' : '#66BB6A',
              borderRadius: 5,
            }} />
          </View>

          <Text style={{ fontSize: 12, color: isDarkMode ? '#AAAAAA' : '#558B2F', marginTop: 8, textAlign: 'right' }}>
            {done} of {total} skills
          </Text>
        </View>

        {/* Categories */}
        {CATEGORIES.map((cat) => {
          const skills = SKILLS.filter((s) => s.category === cat.name);
          const catDone = skills.filter((s) => checked[s.id]).length;
          return (
            <View key={cat.name} style={{ marginBottom: 16 }}>
              {/* Category header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 4, marginBottom: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{
                    width: 12, height: 12, borderRadius: 6,
                    backgroundColor: cat.color,
                  }} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: cat.color, letterSpacing: 0.5 }}>
                    {cat.name.toUpperCase()}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: subCol }}>{catDone}/{skills.length}</Text>
              </View>

              {skills.map((skill) => {
                const isChecked = !!checked[skill.id];
                return (
                  <TouchableOpacity
                    key={skill.id}
                    onPress={() => toggle(skill.id)}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      backgroundColor: isChecked
                        ? (isDarkMode ? cat.color + '22' : cat.bg)
                        : cardBg,
                      borderRadius: 14, padding: 14, marginBottom: 8,
                      borderWidth: 1.5,
                      borderColor: isChecked ? cat.color + '60' : borderCol,
                    }}
                  >
                    {/* Checkbox */}
                    <View style={{
                      width: 26, height: 26, borderRadius: 8, marginRight: 12,
                      borderWidth: 2,
                      borderColor: isChecked ? cat.color : (isDarkMode ? '#555' : '#CCC'),
                      backgroundColor: isChecked ? cat.color : 'transparent',
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isChecked && <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold' }}>✓</Text>}
                    </View>

                    <Text style={{ fontSize: 13, marginRight: 10 }}>{skill.icon}</Text>
                    <Text style={{
                      flex: 1, fontSize: 13, lineHeight: 18,
                      color: isChecked ? (isDarkMode ? '#AAAAAA' : cat.color) : textCol,
                      textDecorationLine: isChecked ? 'line-through' : 'none',
                      fontWeight: isChecked ? '500' : '600',
                    }}>
                      {skill.skill}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        {/* Tip */}
        <View style={{
          backgroundColor: isDarkMode ? '#1A1A2E' : '#EDE7F6',
          borderRadius: 14, padding: 16,
          borderWidth: 1, borderColor: isDarkMode ? '#333' : '#B39DDB',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#7B1FA2', marginBottom: 6 }}>
            💡 Tip for parents
          </Text>
          <Text style={{ fontSize: 12, color: subCol, lineHeight: 18 }}>
            Don't stress if a few boxes are unticked — every child develops at their own pace. Focus on making learning fun at home and your child will get there!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
