import React, { useRef, useState } from 'react';
import { playClickSound } from '../utils/sounds';
import {
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  icon: string;
  title: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQCategory[] = [
  {
    icon: '🌱',
    title: 'Getting Started',
    items: [
      {
        q: 'What is GentleParent?',
        a: 'GentleParent is an AI-powered parenting companion built for modern families everywhere. It gives you instant, evidence-based advice on tantrums, sleep, eating, emotions, and discipline — all through a gentle parenting lens.',
      },
      {
        q: 'How do I set up my profile?',
        a: "Tap ⚙️ Settings from the home screen. From there you can update your name, your child's name and birthday, and add multiple children if needed.",
      },
      {
        q: 'Is my data private and secure?',
        a: 'Yes. Your personal information is stored locally on your device and is never sold to third parties. Conversations with the AI are processed securely and not retained after your session.',
      },
      {
        q: 'Can I use GentleParent for more than one child?',
        a: 'Absolutely. Go to ⚙️ Settings → Children and tap "Add another child". You can switch between children at any time — each gets their own milestone tracking and chore chart.',
      },
    ],
  },
  {
    icon: '💬',
    title: 'App Features',
    items: [
      {
        q: 'What can I ask the AI parenting advisor?',
        a: 'Anything related to raising young children — tantrums, sleep battles, picky eating, big emotions, sibling rivalry, gentle discipline, and more. Tap any topic card on the home screen to get started.',
      },
      {
        q: 'Who are Lesedi and Bra K?',
        a: "Lesedi is your warm, empathetic mom companion — available via Girl Talk or Our Companions. Bra K is a relatable, no-nonsense dad figure. Both are AI companions for real parent-life conversations, not just advice.",
      },
      {
        q: 'What is School Hub?',
        a: 'School Hub is your all-in-one school toolkit. Scan report cards with your camera, get AI homework help, draft teacher messages, track school readiness across 22 skills, plan your school terms, and access the full pre-school prep guide.',
      },
      {
        q: 'What is Novel Corner?',
        a: 'Novel Corner is a reading escape for parents — especially moms. It includes a Classics Library (Jane Austen, Brontë, Alcott and more via Project Gutenberg) and AI-written Mom Lit stories. Novel Corner requires a Premium subscription.',
      },
      {
        q: 'What is the White Noise Player?',
        a: 'The White Noise Player is available from the Sleep topic. It plays calming sounds — rain, ocean, lullaby, fan, and more — to help your baby settle. It keeps playing while the screen is on.',
      },
    ],
  },
  {
    icon: '✨',
    title: 'Premium',
    items: [
      {
        q: 'What does Premium include?',
        a: 'Premium unlocks: unlimited Lesedi conversations, unlimited Bra K conversations, unlimited Girl Talk sessions, the full Novel Corner (classics + AI Mom Lit stories), and priority AI responses.',
      },
      {
        q: 'How much does Premium cost?',
        a: 'Premium is available at R69/month or R699/year (saving R129). Both plans can be cancelled at any time. Billed in ZAR with no hidden fees.',
      },
      {
        q: 'How do I restore my purchase?',
        a: 'If you reinstall the app or switch devices, tap "Restore Purchase" on the Premium screen. Your subscription will be restored automatically if it is still active.',
      },
      {
        q: 'How do I cancel my subscription?',
        a: 'Subscriptions are managed through Google Play. Go to Google Play → Profile → Payments & subscriptions → Subscriptions, find GentleParent, and tap Cancel.',
      },
    ],
  },
  {
    icon: '💛',
    title: 'Gentle Parenting',
    items: [
      {
        q: 'What is gentle parenting?',
        a: "Gentle parenting is an approach focused on empathy, respect, and understanding. It sets clear boundaries while acknowledging your child's emotions — replacing punishment with connection and guidance.",
      },
      {
        q: 'How do I handle tantrums without losing my cool?',
        a: `Stay calm and stay near. Acknowledge the feeling: "You're really upset right now." Don't try to reason during the meltdown — the brain can't process logic when flooded with emotion. Offer comfort once the storm passes, then talk about what happened.`,
      },
      {
        q: `My child won't sleep — what should I do?`,
        a: 'Consistent bedtime routines are the single biggest factor. Wind down 30–45 minutes before bed: bath, story, low lights. Avoid screens. For night wakings, respond calmly and keep interactions brief and boring. Chat with our AI advisor under the Sleep topic for personalised tips.',
      },
      {
        q: 'How do I set limits without yelling?',
        a: "Get down to their level, make eye contact, and state the limit clearly and calmly: 'I won't let you hit. Hitting hurts.' Follow through consistently. Natural consequences work better than punishments. The Gentle Discipline topic in the app has more strategies.",
      },
      {
        q: `When should I be worried about my child's development?`,
        a: "Use the Development Tracker in the app to monitor milestones. If you notice significant delays — not walking by 18 months, no words by 16 months, loss of skills — speak to your paediatrician. Every child develops at their own pace, but early support makes a big difference.",
      },
    ],
  },
  {
    icon: '⚙️',
    title: 'Technical Help',
    items: [
      {
        q: 'How do I turn on morning notifications?',
        a: `Go to ⚙️ Settings → Morning Weather. Toggle on Daily Weather Alert and set your preferred time. You'll need to allow notification permissions when prompted. The notification includes a weather summary and dressing tip for your child.`,
      },
      {
        q: 'How do I change the app theme?',
        a: 'Go to ⚙️ Settings → Appearance. Choose ☀️ Light, 🌙 Dark, or 📱 System (follows your device setting automatically).',
      },
      {
        q: `The app is showing the wrong child's name — how do I fix it?`,
        a: 'Go to ⚙️ Settings → Children, tap the correct child chip to make them active. Their name will update across the whole app immediately.',
      },
      {
        q: 'How do I reset the app?',
        a: 'Go to ⚙️ Settings → Danger Zone → Reset everything. This clears all local data including your profile, children, and chat history. This action cannot be undone.',
      },
      {
        q: 'Can I replay the app tour?',
        a: 'Yes! Go to ⚙️ Settings → Feedback → Restart App Tour to replay the full feature walkthrough at any time.',
      },
    ],
  },
];

interface Props {
  theme: any;
  isDarkMode: boolean;
  parentGender: string;
  onClose: () => void;
}

function AccordionItem({
  item, isDarkMode, accentColor, textColor, subColor, borderColor, cardBg,
}: {
  item: FAQItem;
  isDarkMode: boolean;
  accentColor: string;
  textColor: string;
  subColor: string;
  borderColor: string;
  cardBg: string;
}) {
  const [open, setOpen] = useState(false);
  const heightAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    playClickSound();
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.timing(heightAnim, { toValue, duration: 220, useNativeDriver: false }),
      Animated.timing(rotateAnim, { toValue, duration: 220, useNativeDriver: true }),
    ]).start();
    setOpen((o) => !o);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.accordionItem, { borderColor }]}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={toggle}
        activeOpacity={0.75}
      >
        <Text style={[styles.question, { color: textColor, flex: 1, paddingRight: 12 }]}>
          {item.q}
        </Text>
        <Animated.Text style={[styles.chevron, { color: accentColor, transform: [{ rotate }] }]}>
          ▼
        </Animated.Text>
      </TouchableOpacity>

      {open && (
        <View style={[styles.answerContainer, { borderTopColor: borderColor }]}>
          <Text style={[styles.answer, { color: subColor }]}>{item.a}</Text>
        </View>
      )}
    </View>
  );
}

export default function FAQScreen({ theme, isDarkMode, parentGender, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(FAQ_DATA[0].title);

  const accentColor  = parentGender === 'mom' ? '#E75480' : '#2C5F8A';
  const bg           = isDarkMode ? '#111111' : (parentGender === 'mom' ? '#FFF0F5' : '#F0F4FF');
  const cardBg       = isDarkMode ? '#1E1E1E' : '#FFFFFF';
  const textColor    = isDarkMode ? '#EEEEEE' : '#222222';
  const subColor     = isDarkMode ? '#AAAAAA' : '#555555';
  const borderColor  = isDarkMode ? '#2A2A2A' : '#F0F0F0';

  const toggleCategory = (title: string) => {
    setExpandedCategory((prev) => (prev === title ? null : title));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: accentColor,
        paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16,
      }]}>
        <TouchableOpacity onPress={() => { playClickSound(); onClose(); }} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>❓ Help & FAQs</Text>
          <Text style={styles.headerSub}>Common questions, answered</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 13, color: subColor, marginBottom: 16, lineHeight: 19 }}>
          Tap a category to expand, then tap any question to read the answer.
        </Text>

        {FAQ_DATA.map((category) => {
          const isOpen = expandedCategory === category.title;
          return (
            <View key={category.title} style={{ marginBottom: 12 }}>

              {/* Category header */}
              <TouchableOpacity
                onPress={() => { playClickSound(); toggleCategory(category.title); }}
                activeOpacity={0.82}
                style={[styles.categoryHeader, {
                  backgroundColor: isOpen ? accentColor : cardBg,
                  borderColor: isOpen ? accentColor : borderColor,
                  borderWidth: 1.5,
                }]}
              >
                <Text style={{ fontSize: 20, marginRight: 10 }}>{category.icon}</Text>
                <Text style={[styles.categoryTitle, { color: isOpen ? 'white' : textColor, flex: 1 }]}>
                  {category.title}
                </Text>
                <Text style={{ color: isOpen ? 'white' : subColor, fontSize: 13, fontWeight: '700' }}>
                  {isOpen ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {/* FAQ items */}
              {isOpen && (
                <View style={[styles.categoryBody, { backgroundColor: cardBg, borderColor }]}>
                  {category.items.map((item, idx) => (
                    <React.Fragment key={idx}>
                      <AccordionItem
                        item={item}
                        isDarkMode={isDarkMode}
                        accentColor={accentColor}
                        textColor={textColor}
                        subColor={subColor}
                        borderColor={borderColor}
                        cardBg={cardBg}
                      />
                      {idx < category.items.length - 1 && (
                        <View style={[styles.itemDivider, { backgroundColor: borderColor }]} />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        <Text style={{ textAlign: 'center', fontSize: 12, color: subColor, marginTop: 8, fontStyle: 'italic' }}>
          Still need help? Send us feedback from Settings 💌
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  backArrow:   { color: 'white', fontSize: 22, fontWeight: 'bold' },
  headerTitle: { color: 'white', fontSize: 20, fontWeight: '800' },
  headerSub:   { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },

  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryTitle: { fontSize: 15, fontWeight: '800' },

  categoryBody: {
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
    marginTop: -4,
  },

  accordionItem:  { paddingHorizontal: 16 },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  question: { fontSize: 13, fontWeight: '700', lineHeight: 19 },
  chevron:  { fontSize: 11, fontWeight: '700' },

  answerContainer: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingBottom: 16,
  },
  answer: { fontSize: 13, lineHeight: 20 },

  itemDivider: { height: 1, marginHorizontal: 0 },
});
