import React, { useState } from 'react';
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

const SECTIONS = [
  {
    id: 'what',
    emoji: '🏫',
    title: 'What is Grade R?',
    color: '#9C27B0',
    bg: '#F3E5F5',
    content: [
      { type: 'text', text: 'Grade R (Reception Year) is the year before Grade 1 in the South African school system. Children typically start Grade R at age 5 or 6.' },
      { type: 'text', text: 'It forms part of the Foundation Phase and follows the CAPS (Curriculum and Assessment Policy Statement) curriculum.' },
      { type: 'highlight', text: '🎯 The goal of Grade R is to prepare children for formal schooling through play-based learning.' },
    ],
  },
  {
    id: 'age',
    emoji: '🎂',
    title: 'Age Requirements',
    color: '#E91E63',
    bg: '#FCE4EC',
    content: [
      { type: 'text', text: 'To enroll in Grade R, your child must turn 5 by 30 June of that school year.' },
      { type: 'bullet', items: [
        'Age 5 by 30 June → Grade R eligible',
        'Age 6 by 30 June → Grade 1 eligible',
        'Born after 30 June → starts the following year',
      ]},
      { type: 'highlight', text: '📋 Required documents: birth certificate, clinic card, proof of address, and ID of parent/guardian.' },
    ],
  },
  {
    id: 'skills',
    emoji: '🌱',
    title: 'Skills Developed in Grade R',
    color: '#4CAF50',
    bg: '#E8F5E9',
    content: [
      { type: 'text', text: 'Grade R focuses on developing foundational skills across all areas of development:' },
      { type: 'bullet', items: [
        '🔤 Literacy: phonics awareness, letter recognition, pre-writing',
        '🔢 Numeracy: counting, patterns, shapes, measurement',
        '🎨 Creative arts: drawing, painting, music and movement',
        '💪 Physical: fine & gross motor development through play',
        '💬 Language: speaking, listening and early reading',
        '🌍 Life skills: self-care, social skills, safety awareness',
      ]},
    ],
  },
  {
    id: 'pack',
    emoji: '🎒',
    title: 'Grade R Stationery & Packing List',
    color: '#FF9800',
    bg: '#FFF3E0',
    content: [
      { type: 'text', text: 'Most schools provide a stationery list. Common items include:' },
      { type: 'bullet', items: [
        '🖍️ Jumbo wax crayons (chunky grip)',
        '✏️ HB pencils + pencil grip',
        '✂️ Child-safe scissors',
        '📏 30cm ruler',
        '🗂️ Scrapbook (A4 & A3)',
        '🧴 Glue stick',
        '🎨 Washable finger paints',
        '🍱 Lunchbox + reusable water bottle',
        '🧦 Change of clothes (kept in bag)',
        '📚 Reading bag / library bag',
      ]},
      { type: 'highlight', text: '💡 Label EVERYTHING with your child\'s name. Iron-on labels last better than stickers.' },
    ],
  },
  {
    id: 'home',
    emoji: '🏠',
    title: 'How to Prepare at Home',
    color: '#2196F3',
    bg: '#E3F2FD',
    content: [
      { type: 'text', text: 'The best preparation for Grade R starts at home. Here\'s what makes the biggest difference:' },
      { type: 'bullet', items: [
        '📖 Read together every day — even 10 minutes counts',
        '🧩 Do puzzles, building blocks and sorting activities',
        '✏️ Practise colouring, drawing and cutting with scissors',
        '🔢 Count everyday objects — stairs, fruit, cars on the road',
        '🗣️ Talk and tell stories — narrate your day together',
        '🎵 Sing nursery rhymes and songs with rhyming words',
        '⏰ Establish a consistent morning routine before school starts',
        '👟 Practise dressing, packing a bag and using a lunchbox',
      ]},
    ],
  },
  {
    id: 'first',
    emoji: '🌟',
    title: 'First Day Tips for Parents',
    color: '#00BCD4',
    bg: '#E0F7FA',
    content: [
      { type: 'bullet', items: [
        '😊 Stay calm — children mirror your energy',
        '🕗 Arrive early for the first few days',
        '🤗 Keep goodbyes short and confident ("I\'ll be back at 1!")',
        '📸 Take photos — the emotions are real on both sides!',
        '🍎 Pack a familiar, easy-to-eat lunch for the first week',
        '💬 Ask "What was the best thing today?" not "How was school?"',
        '😴 Expect tiredness — school is mentally draining for little ones',
      ]},
      { type: 'highlight', text: '💛 If your child cries at drop-off, it\'s normal and usually stops within minutes. Trust the teacher — they\'ve seen it many times!' },
    ],
  },
];

interface Props {
  childName: string;
  theme: any;
  isDarkMode: boolean;
  onClose: () => void;
}

export default function GradeRPrepGuide({ childName, theme, isDarkMode, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState<string | null>('what');

  const bg      = isDarkMode ? '#111111' : theme.background;
  const textCol = isDarkMode ? '#EEEEEE' : theme.cardText;
  const subCol  = isDarkMode ? '#AAAAAA' : theme.cardSubText;

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
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>🏫 Grade R Guide</Text>
          <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
            {childName ? `Get ${childName} ready for Grade R` : 'Prepare your child for Grade R'}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text style={{ fontSize: 13, color: subCol, marginBottom: 18, lineHeight: 20 }}>
          Everything South African parents need to know about Grade R — from age requirements to first-day survival tips. 🇿🇦
        </Text>

        {SECTIONS.map((section) => {
          const isOpen = expanded === section.id;
          return (
            <View
              key={section.id}
              style={{
                backgroundColor: isDarkMode ? '#1C1C1C' : section.bg,
                borderRadius: 20, marginBottom: 12,
                borderTopWidth: 4, borderTopColor: section.color,
                borderWidth: 1, borderColor: isDarkMode ? '#333' : section.color + '40',
                overflow: 'hidden',
              }}
            >
              <TouchableOpacity
                onPress={() => setExpanded(isOpen ? null : section.id)}
                activeOpacity={0.8}
                style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}
              >
                <Text style={{ fontSize: 28, marginRight: 14 }}>{section.emoji}</Text>
                <Text style={{ flex: 1, fontSize: 15, fontWeight: '800', color: isDarkMode ? '#EEEEEE' : '#111' }}>
                  {section.title}
                </Text>
                <Text style={{ fontSize: 18, color: section.color, fontWeight: '700' }}>
                  {isOpen ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {isOpen && (
                <View style={{ paddingHorizontal: 18, paddingBottom: 18 }}>
                  {section.content.map((block, bi) => {
                    if (block.type === 'text') {
                      return (
                        <Text key={bi} style={{ fontSize: 13, color: textCol, lineHeight: 21, marginBottom: 10 }}>
                          {(block as any).text}
                        </Text>
                      );
                    }
                    if (block.type === 'bullet') {
                      return (
                        <View key={bi} style={{ marginBottom: 10, gap: 6 }}>
                          {((block as any).items as string[]).map((item, ii) => (
                            <View key={ii} style={{ flexDirection: 'row', gap: 8 }}>
                              <Text style={{ color: section.color, fontSize: 13, marginTop: 2 }}>•</Text>
                              <Text style={{ flex: 1, fontSize: 13, color: textCol, lineHeight: 20 }}>{item}</Text>
                            </View>
                          ))}
                        </View>
                      );
                    }
                    if (block.type === 'highlight') {
                      return (
                        <View key={bi} style={{
                          backgroundColor: isDarkMode ? '#2A2A2A' : '#FFFFFFCC',
                          borderRadius: 12, padding: 12, marginBottom: 8,
                          borderLeftWidth: 3, borderLeftColor: section.color,
                        }}>
                          <Text style={{ fontSize: 13, color: textCol, lineHeight: 20 }}>
                            {(block as any).text}
                          </Text>
                        </View>
                      );
                    }
                    return null;
                  })}
                </View>
              )}
            </View>
          );
        })}

        <View style={{
          backgroundColor: isDarkMode ? '#1A1F2E' : '#E8EAF6',
          borderRadius: 14, padding: 16, marginTop: 4,
          borderWidth: 1, borderColor: isDarkMode ? '#333' : '#9FA8DA',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#3949AB', marginBottom: 6 }}>
            🇿🇦 SA-specific resources
          </Text>
          <Text style={{ fontSize: 12, color: subCol, lineHeight: 18 }}>
            For official information visit the Department of Basic Education at www.education.gov.za or contact your nearest district office.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
