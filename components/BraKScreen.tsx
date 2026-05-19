import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getBraKResponse } from '../services/perplexity';
import { getTodayMoodIndex } from '../utils/mood';
import { stripMarkdown } from '../utils/markdown';
import { COMPANION_MESSAGE_LIMIT, incrementCompanionMessageCount } from '../utils/paywall';
import { detectsSlang } from '../utils/slang';
import { cancelConversationReminder, trackConversationActivity } from '../services/notificationService';
import { detectTopic, trackTopicEngagement } from '../utils/braKNotification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { playClickSound } from '../utils/sounds';
import { clearHistory, loadHistory, saveHistory } from '../utils/storage';

// ── Bra K chat theme (dark green — used in chat view only) ───────────────────
const braKTheme = {
  background:     '#0F1A14',
  header:         '#1A2E20',
  cardBackground: '#1A2E20',
  accent:         '#4CAF50',
  userBubble:     '#2A4A30',
  botBubble:      '#1E3A28',
  inputBackground:'#1A2E20',
  inputBorder:    '#2A4A30',
  textPrimary:    '#E8F5E9',
  textSecondary:  '#81C784',
  textMuted:      '#4CAF50',
  typingBubble:   '#1E3A28',
};

// ── Nude/earth palette — random on each visit ────────────────────────────────
const braKNudePalettes = [
  { bg: '#C4A882', text: '#3B2A1A', accent: '#7A5C3A', sub: '#8B6B4A' },
  { bg: '#B89B7A', text: '#2E1F0F', accent: '#6B4C2A', sub: '#7A5C3A' },
  { bg: '#C9A87C', text: '#3D2610', accent: '#8B5E34', sub: '#9B6E44' },
  { bg: '#BFA98A', text: '#362418', accent: '#7A5A38', sub: '#8A6A48' },
  { bg: '#C2A47E', text: '#3A2214', accent: '#7C5030', sub: '#8C6040' },
  { bg: '#B8956A', text: '#2C1A08', accent: '#6A4020', sub: '#7A5030' },
  { bg: '#D4B896', text: '#3E2A14', accent: '#8A6238', sub: '#9A7248' },
  { bg: '#C8AD8F', text: '#382616', accent: '#785634', sub: '#886646' },
];

// ── Topics ────────────────────────────────────────────────────────────────────
const braKTopics = [
  { id: 'brak_sports',   icon: '⚽', title: 'Sports',    description: 'PSL, EPL, NBA, rugby & more',   questions: ['Who will win the PSL this season?', 'Best EPL team right now?', 'Springboks latest'] },
  { id: 'brak_cars',     icon: '🚗', title: 'Cars',      description: 'Dream rides & car culture',      questions: ['Best car for the money right now?', 'GTI vs Type R — which one?', 'Best new releases this year'] },
  { id: 'brak_business', icon: '💼', title: 'Business',  description: 'Side hustles & money moves',     questions: ['Best side hustle ideas right now?', 'How to start a small business?', 'Investment tips for beginners'] },
  { id: 'brak_fashion',  icon: '👟', title: 'Fashion',   description: 'Sneakers, fits & style tips',    questions: ['Best sneaker drops right now?', 'How to dress sharp on a budget?', 'Best streetwear brands'] },
  { id: 'brak_general',  icon: '🎙️', title: 'Guy Talk', description: 'Just vibing with Bra K',         questions: ['Tell me something interesting', 'Give me some life advice', "What's good right now?"] },
];

// ── Typing indicator ──────────────────────────────────────────────────────────
function BraKTypingIndicator() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, useNativeDriver: true, duration: 500 }),
        Animated.timing(pulse, { toValue: 1,   useNativeDriver: true, duration: 500 }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.typingContainer}>
      <Animated.Text style={[styles.avatarEmoji, { transform: [{ scale: pulse }] }]}>😎</Animated.Text>
      <View style={[styles.typingBubble, { backgroundColor: braKTheme.typingBubble }]}>
        <Text style={[styles.typingText, { color: braKTheme.textSecondary }]}>Bra K is typing...</Text>
      </View>
    </View>
  );
}

// ── TypewriterText ────────────────────────────────────────────────────────────
function TypewriterText({ text, style, speed = 16 }: { text: string; style: any; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const clean = stripMarkdown(text);
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setDisplayed(clean.slice(0, i));
      if (i >= clean.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [clean, speed]);
  return <Text style={style}>{displayed}</Text>;
}

const BraKMessageRow = React.memo(({ item }: { item: any }) => {
  const isUser = item.isUser;

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
      {!isUser && <Text style={styles.avatarEmoji}>😎</Text>}
      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { backgroundColor: braKTheme.userBubble, borderColor: braKTheme.accent }]
          : [styles.botBubble, { backgroundColor: braKTheme.botBubble }],
      ]}>
        {!isUser && item.animate ? (
          <TypewriterText text={item.text} style={[styles.messageText, { color: braKTheme.textPrimary }]} speed={16} />
        ) : (
          <Text style={[styles.messageText, isUser ? styles.userText : { color: braKTheme.textPrimary }]}>
            {isUser ? item.text : stripMarkdown(item.text)}
          </Text>
        )}
      </View>
    </View>
  );
});

const braKKeyExtractor = (item: any) => item.id;

interface Props {
  onClose: () => void;
  userName: string;
  parentGender: string;
  isPremium: boolean;
  onPaywall: () => void;
  msgCount: number;
  onMsgSent: (n: number) => void;
}

export default function BraKScreen({
  onClose, userName, parentGender, isPremium, onPaywall, msgCount, onMsgSent,
}: Props) {
  const [selectedTopic,  setSelectedTopic]  = useState<any>(null);
  const [messages,       setMessages]       = useState<any[]>([]);
  const [inputText,      setInputText]      = useState('');
  const [isTyping,       setIsTyping]       = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [moodIndex,      setMoodIndex]      = useState<number | null>(null);
  const listRef           = useRef<FlatList>(null);
  const savedScrollOffset = useRef(0);
  const isInitialLoad     = useRef(true);
  const scrollSaveTimer   = useRef<any>(null);
  const insets            = useSafeAreaInsets();

  const renderBraKMessage = useCallback(({ item }: { item: any }) => (
    <BraKMessageRow item={item} />
  ), []);

  // Pick a random nude palette once per screen mount
  const palette = useMemo(
    () => braKNudePalettes[Math.floor(Math.random() * braKNudePalettes.length)],
    []
  );
  const companionMessagesLeft = Math.max(COMPANION_MESSAGE_LIMIT - msgCount, 0);

  useEffect(() => {
    cancelConversationReminder('brak');
    getTodayMoodIndex().then(setMoodIndex);
  }, []);

  useEffect(() => {
    if (selectedTopic && messages.length > 1) {
      saveHistory(selectedTopic.id, messages);
    }
  }, [messages, selectedTopic]);

  const handleTopicSelect = async (topic: any) => {
    setSelectedTopic(topic);
    setLoadingHistory(true);
    isInitialLoad.current = true;
    savedScrollOffset.current = 0;
    const [saved, rawOffset] = await Promise.all([
      loadHistory(topic.id),
      AsyncStorage.getItem(`scroll_${topic.id}`),
    ]);
    if (rawOffset) savedScrollOffset.current = parseFloat(rawOffset);
    if (saved && saved.length > 0) {
      setMessages(saved.map((m: any) => ({ ...m, animate: false })));
    } else {
      const greetings: Record<string, string> = {
        brak_sports:   `Eish ${userName || 'my bra'}! 👊 You came to the right place — sports talk is my thing. PSL? EPL? Rugby? Let's go! ⚽`,
        brak_cars:     `Sharp sharp ${userName || 'ntwana'}! 🚗 You want to talk cars? Now we're speaking my language! Hit me!`,
        brak_business: `Yoh ${userName || 'my guy'}! 💼 Love it — a man thinking about his bag. Side hustle? Investment? Let's talk!`,
        brak_fashion:  `Hawu ${userName || 'bra'}! 👟 You want to look fresh? Sneakers, fits, style — what do you need?`,
        brak_general:  `Eish ${userName || 'ntwana'}, just us now! 😄 No topic, no rules — just good vibes. What's on your mind? 🤝`,
      };
      setMessages([{
        id: 'welcome',
        text: greetings[topic.id] || `Sharp ${userName || 'bra'}! Let's talk ${topic.title}! 🤝`,
        isUser: false, animate: false,
      }]);
    }
    setLoadingHistory(false);
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Start fresh with Bra K?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await clearHistory(selectedTopic.id);
          setMessages([{
            id: 'welcome',
            text: `Fresh start ${userName || 'my bra'}! 🤝 What are we talking about?`,
            isUser: false, animate: true,
          }]);
        },
      },
    ]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!isPremium && msgCount >= COMPANION_MESSAGE_LIMIT) {
      Keyboard.dismiss();
      onPaywall();
      return;
    }
    const userMessage = { id: Date.now().toString(), text: text.trim(), isUser: true };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);
    const useSlang = detectsSlang(updatedMessages);
    const result = await getBraKResponse(text.trim(), messages, userName, useSlang, moodIndex, parentGender);
    setIsTyping(false);
    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: result.success ? stripMarkdown(result.data || '') : result.fallback,
      isUser: false, animate: true,
    };
    setMessages((prev) => [...prev, botMessage]);
    const newCount = await incrementCompanionMessageCount();
    onMsgSent(newCount);
    trackConversationActivity('brak', 'Bra K', text.trim(), userName);
    const topic = detectTopic(text.trim());
    if (topic) trackTopicEngagement(topic);

    if (!isPremium && newCount >= COMPANION_MESSAGE_LIMIT) {
      Keyboard.dismiss();
      setTimeout(() => onPaywall(), 500);
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ── Topic selection — nude palette + long bar buttons ────────────────────
  if (!selectedTopic) {
    return (
      <Modal animationType="slide" transparent={false} visible={true}>
        <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]}>
          <View style={[styles.header, { backgroundColor: palette.bg }]}>
            <TouchableOpacity onPress={() => { playClickSound(); onClose(); }} style={[styles.closeButton, { borderColor: palette.accent }]}>
              <Text style={[styles.closeButtonText, { color: palette.accent }]}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.avatarLarge}>😎</Text>
              <Text style={[styles.headerTitle, { color: palette.text }]}>Bra K</Text>
              <Text style={[styles.headerSubtitle, { color: palette.sub }]}>Your kasi homeboy</Text>
            </View>
            <View style={{ width: 70 }} />
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.topicsContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.sectionSubtitle, { color: palette.sub }]}>
              What are we vibing about today? 🤝
            </Text>

            {braKTopics.map((topic) => (
              <TouchableOpacity
                key={topic.id}
                style={[styles.barButton, {
                  backgroundColor: palette.bg,
                  borderColor: palette.accent,
                  shadowColor: palette.accent,
                }]}
                onPress={() => { playClickSound(); handleTopicSelect(topic); }}
                activeOpacity={0.82}
              >
                <View style={[styles.barIcon, { backgroundColor: palette.accent + '22' }]}>
                  <Text style={styles.barIconText}>{topic.icon}</Text>
                </View>
                <View style={styles.barContent}>
                  <Text style={[styles.barTitle, { color: palette.text }]}>{topic.title}</Text>
                  <Text style={[styles.barDescription, { color: palette.sub }]}>{topic.description}</Text>
                </View>
                <Text style={[styles.barArrow, { color: palette.accent }]}>›</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.footer, { color: palette.sub }]}>Built with 🔥 by Inka-Tech Solutions</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── Chat screen — keeps dark green kasi theme ────────────────────────────
  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <SafeAreaView style={styles.chatContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior="padding"
          keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
        >
          <View style={[styles.chatHeader, {
            backgroundColor: braKTheme.header,
            borderBottomColor: braKTheme.accent,
          }]}>
            <TouchableOpacity
              onPress={() => { playClickSound(); setSelectedTopic(null); setMessages([]); }}
              style={styles.backButton}
            >
              <Text style={[styles.backButtonText, { color: braKTheme.accent }]}>←</Text>
            </TouchableOpacity>
            <Text style={styles.topicIconSmall}>{selectedTopic.icon}</Text>
            <Text style={[styles.chatHeaderText, { color: braKTheme.textPrimary }]}>{selectedTopic.title}</Text>
            {!isPremium ? (
              <View style={styles.counterPill}>
                <Text style={styles.counterText}>{companionMessagesLeft} left</Text>
              </View>
            ) : (
              <View style={styles.counterPillPremium}>
                <Text style={styles.counterTextPremium}>Unlimited</Text>
              </View>
            )}
            <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>🗑️</Text>
            </TouchableOpacity>
          </View>

          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: braKTheme.textSecondary }]}>Loading your convo... 🤝</Text>
            </View>
          ) : (
            <>
              <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={braKKeyExtractor}
                style={styles.chatList}
                contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 10 }}
                ListFooterComponent={isTyping ? <BraKTypingIndicator /> : null}
                onContentSizeChange={() => {
                  if (isInitialLoad.current) {
                    isInitialLoad.current = false;
                    if (savedScrollOffset.current > 0) {
                      listRef.current?.scrollToOffset({ offset: savedScrollOffset.current, animated: false });
                    } else {
                      listRef.current?.scrollToEnd({ animated: false });
                    }
                  }
                }}
                onScroll={(e) => {
                  const y = e.nativeEvent.contentOffset.y;
                  if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
                  scrollSaveTimer.current = setTimeout(() => {
                    AsyncStorage.setItem(`scroll_${selectedTopic.id}`, String(y));
                  }, 500);
                }}
                scrollEventThrottle={16}
                renderItem={renderBraKMessage}
                removeClippedSubviews
                maxToRenderPerBatch={8}
                windowSize={5}
                initialNumToRender={15}
              />

              {messages.length === 1 && (
                <View style={[styles.quickQuestions, { borderTopColor: braKTheme.accent + '33' }]}> 
                  <Text style={[styles.quickQuestionsTitle, { color: braKTheme.textSecondary }]}>Try asking:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {selectedTopic.questions.map((q: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.quickQuestionButton, {
                          backgroundColor: braKTheme.botBubble,
                          borderColor: braKTheme.accent,
                        }]}
                        onPress={() => { playClickSound(); sendMessage(q); }}
                      >
                        <Text style={[styles.quickQuestionText, { color: braKTheme.accent }]}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={[styles.inputContainer, {
                marginBottom: insets.bottom + 10,
                borderTopColor: braKTheme.accent + '33',
              }]}>
                <TextInput
                  style={[styles.input, {
                    backgroundColor: braKTheme.inputBackground,
                    borderColor: braKTheme.accent + '66',
                    color: braKTheme.textPrimary,
                  }]}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Talk to Bra K... 🤝"
                  placeholderTextColor={braKTheme.textMuted}
                  multiline
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    !inputText.trim() && styles.sendButtonDisabled,
                    inputText.trim() ? { backgroundColor: braKTheme.accent } : {},
                  ]}
                  onPress={() => { playClickSound(); sendMessage(inputText); }}
                  disabled={!inputText.trim()}
                >
                  <Text style={styles.sendText}>Send</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Topic selection ─────────────────────────────────────────────────────────
  container: { flex: 1 },
  header: {
    paddingTop: 20, paddingBottom: 20, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center',
  },
  closeButton: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1,
  },
  closeButtonText: { fontSize: 15, fontWeight: 'bold' },
  headerCenter:    { flex: 1, alignItems: 'center' },
  avatarLarge:     { fontSize: 40, marginBottom: 4 },
  headerTitle:     { fontSize: 22, fontWeight: 'bold' },
  headerSubtitle:  { fontSize: 12, fontStyle: 'italic' },

  topicsContainer: { paddingHorizontal: 16, paddingBottom: 30 },
  sectionSubtitle: {
    textAlign: 'center', fontSize: 14, fontStyle: 'italic', marginBottom: 20,
  },

  // ── Long bar buttons ────────────────────────────────────────────────────────
  barButton: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 16,
    marginBottom: 12, borderWidth: 1,
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  barIcon: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  barIconText:    { fontSize: 22 },
  barContent:     { flex: 1 },
  barTitle:       { fontSize: 15, fontWeight: '700', marginBottom: 3 },
  barDescription: { fontSize: 12 },
  barArrow:       { fontSize: 24, fontWeight: '300', marginLeft: 8 },

  footer: { textAlign: 'center', fontSize: 11, fontStyle: 'italic', marginTop: 24 },

  // ── Chat ────────────────────────────────────────────────────────────────────
  chatContainer: { flex: 1, backgroundColor: braKTheme.background },
  chatHeader: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 10,
  },
  backButtonText:   { fontSize: 18, fontWeight: 'bold' },
  topicIconSmall:   { fontSize: 22, marginRight: 8 },
  chatHeaderText:   { fontSize: 17, fontWeight: 'bold', flex: 1 },
  counterPill: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: '#4CAF50',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  counterText: { color: '#81C784', fontSize: 11, fontWeight: '700' },
  counterPillPremium: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: '#A5D6A7',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  counterTextPremium: { color: '#C8E6C9', fontSize: 11, fontWeight: '700' },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  clearButtonText: { fontSize: 16 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { fontSize: 15, fontStyle: 'italic' },

  chatList:   { flex: 1, paddingHorizontal: 12 },
  messageRow: { marginVertical: 6, flexDirection: 'row', alignItems: 'flex-end' },
  userRow:    { justifyContent: 'flex-end' },
  botRow:     { justifyContent: 'flex-start' },
  avatarEmoji:{ fontSize: 20, marginRight: 6, marginBottom: 4 },
  bubble:     { maxWidth: '78%', padding: 13, borderRadius: 20, elevation: 3 },
  userBubble: { borderBottomRightRadius: 5, borderWidth: 1 },
  botBubble:  { borderBottomLeftRadius: 5 },
  messageText:{ fontSize: 15, lineHeight: 22 },
  userText:   { color: braKTheme.textPrimary },

  quickQuestions: {
    padding: 12, backgroundColor: braKTheme.cardBackground, borderTopWidth: 1,
  },
  quickQuestionsTitle: { fontSize: 13, marginBottom: 8, fontWeight: '600', color: braKTheme.textSecondary },
  quickQuestionButton: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginRight: 10,
    borderWidth: 1, borderBottomWidth: 3,
  },
  quickQuestionText: { fontSize: 13, fontWeight: '500' },

  inputContainer: {
    flexDirection: 'row', padding: 10,
    backgroundColor: braKTheme.cardBackground, borderTopWidth: 1, alignItems: 'flex-end',
  },
  input: {
    flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10,
    marginRight: 10, maxHeight: 100, fontSize: 15, borderWidth: 1.5,
  },
  sendButton: {
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12,
    justifyContent: 'center', elevation: 3,
  },
  sendButtonDisabled: { backgroundColor: '#2A4A30' },
  sendText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  typingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  typingBubble:    { borderRadius: 15, paddingHorizontal: 14, paddingVertical: 8 },
  typingText:      { fontStyle: 'italic', fontSize: 14 },
});
