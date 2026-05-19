import React from 'react';
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
import { playClickSound } from '../utils/sounds';

interface Props {
  childName: string;
  childBirthday?: string;
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
  onReportCard: () => void;
  onHomework: () => void;
  onTeacherComms: () => void;
  onSchoolReadiness: () => void;
  onTermPlanner: () => void;
  onGradeRGuide: () => void;
  onHomeworkReminder: () => void;
  onSchoolSchedule: () => void;
}

const getAgeYears = (birthday: string): number => {
  if (!birthday) return 99;
  const [y, m, d] = birthday.split('-').map(Number);
  const birth = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
  ) age--;
  return age;
};

export default function SchoolHubScreen({
  childName, childBirthday, theme, isDarkMode, onClose, onReportCard, onHomework, onTeacherComms,
  onSchoolReadiness, onTermPlanner, onGradeRGuide, onHomeworkReminder, onSchoolSchedule,
}: Props) {
  const insets = useSafeAreaInsets();
  const childAge = getAgeYears(childBirthday ?? '');

  const bg = isDarkMode ? '#111111' : theme.background;
  const cardBg = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textCol = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol = isDarkMode ? '#AAAAAA' : theme.cardSubText;
  const borderCol = isDarkMode ? '#333333' : theme.quickQuestionsBorder;

  const features = [
    {
      icon: '📋',
      title: 'Report Card Scanner',
      desc: 'Photo-scan results, get a breakdown & a talk script',
      glassColor: '#E8F5E9',
      accent: '#4CAF50',
      badge: '✨ Premium',
      onPress: onReportCard,
    },
    {
      icon: '📝',
      title: 'Homework Helper',
      desc: 'Take a photo of homework — get a plain-English explanation',
      glassColor: '#FFF3E0',
      accent: '#FFA000',
      badge: '✨ Premium',
      onPress: onHomework,
    },
    ...(childAge >= 3 ? [{
      icon: '✅',
      title: 'Homework Reminder',
      desc: 'Add daily tasks, tick them off & set a notification reminder',
      glassColor: '#EDE7F6',
      accent: '#9C27B0',
      badge: '🔔 Daily reminder',
      onPress: onHomeworkReminder,
    }] : []),
    {
      icon: '✉️',
      title: 'Message My Teacher',
      desc: 'Draft a professional teacher message in seconds',
      glassColor: '#E3F2FD',
      accent: '#1976D2',
      badge: '✨ Premium',
      onPress: onTeacherComms,
    },
    {
      icon: '🎒',
      title: 'School Readiness Tracker',
      desc: 'Interactive checklist — is your child ready for Grade R?',
      glassColor: '#FCE4EC',
      accent: '#E91E63',
      badge: '✅ Track progress',
      onPress: onSchoolReadiness,
    },
    {
      icon: '📅',
      title: 'Term Planner',
      desc: 'School terms, public holidays & your custom events',
      glassColor: '#EDE7F6',
      accent: '#9C27B0',
      badge: '📌 2026 terms',
      onPress: onTermPlanner,
    },
    {
      icon: '🏫',
      title: 'Grade R Prep Guide',
      desc: 'Everything you need to know before Grade R — packing list, tips & more',
      glassColor: '#E0F7FA',
      accent: '#00BCD4',
      badge: '📖 Prep guide',
      onPress: onGradeRGuide,
    },
    {
      icon: '📅',
      title: 'School Year Planner',
      desc: 'Scan your school calendar — save events & get reminders',
      glassColor: '#FFF8E1',
      accent: '#F59E0B',
      badge: '✨ Premium',
      onPress: onSchoolSchedule,
    },
  ];

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
        <TouchableOpacity onPress={() => { playClickSound(); onClose(); }} style={{ padding: 4, marginRight: 12 }}>
          <Text style={{ fontSize: 22, color: 'white' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>📚 School Hub</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            {childName ? `Tools to support ${childName} at school` : 'School support tools'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 13, color: subCol, marginBottom: 18, lineHeight: 20 }}>
          From report cards to teacher emails — everything you need to be your child's best advocate. 🎒
        </Text>

        {features.map((f, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => { playClickSound(); f.onPress(); }}
            activeOpacity={0.85}
            style={{
              backgroundColor: isDarkMode ? '#1C1C1C' : f.glassColor,
              borderRadius: 20, padding: 20, marginBottom: 14,
              borderTopWidth: 4, borderTopColor: f.accent,
              borderWidth: 1, borderColor: isDarkMode ? '#333' : f.accent + '40',
              shadowColor: f.accent, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 36, marginRight: 14 }}>{f.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: isDarkMode ? '#EEEEEE' : '#111' }}>
                  {f.title}
                </Text>
                <Text style={{ fontSize: 13, color: isDarkMode ? '#AAAAAA' : '#555', marginTop: 3, lineHeight: 18 }}>
                  {f.desc}
                </Text>
              </View>
              <Text style={{ fontSize: 22, color: f.accent }}>›</Text>
            </View>
            <View style={{
              alignSelf: 'flex-start',
              backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFFCC',
              borderWidth: 1, borderColor: f.accent + '55',
              borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
            }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#CCCCCC' : f.accent }}>
                {f.badge}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}
