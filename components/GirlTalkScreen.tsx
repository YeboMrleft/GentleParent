import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { getLesediResponse } from '../services/perplexity';
import { getTodayMoodIndex } from '../utils/mood';
import { stripMarkdown } from '../utils/markdown';
import { COMPANION_MESSAGE_LIMIT, incrementCompanionMessageCount } from '../utils/paywall';
import { cancelConversationReminder, trackConversationActivity } from '../services/notificationService';
import { detectLesediTopic, trackLesediTopicEngagement } from '../utils/lesediNotification';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearHistory, loadHistory, saveHistory } from '../utils/storage';
import { playClickSound } from '../utils/sounds';
// ── Typewriter ────────────────────────────────────────────────────────────────
function TypewriterText({ text, style, speed = 18 }: { text: string; style: any; speed?: number }) {
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

const GirlTalkMessageRow = React.memo(({ item }: { item: any }) => {
  const isUser = item.isUser;

  return (
    <View style={[styles.messageRow, isUser ? styles.userRow : styles.botRow]}>
      {!isUser && <Text style={styles.avatarEmoji}>💅</Text>}
      <View style={[
        styles.bubble,
        isUser
          ? [styles.userBubble, { shadowColor: '#b08fd4' }]
          : [styles.botBubble, { shadowColor: '#e8849a' }],
      ]}>
        {!isUser && item.animate ? (
          <TypewriterText text={item.text} style={[styles.messageText, styles.botText]} speed={18} />
        ) : (
          <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
            {isUser ? item.text : stripMarkdown(item.text)}
          </Text>
        )}
      </View>
    </View>
  );
});

const girlTalkKeyExtractor = (item: any) => item.id;

// ── Typing indicator ──────────────────────────────────────────────────────────
function GirlTalkTypingIndicator() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.2, useNativeDriver: true, duration: 600 }),
        Animated.timing(pulse, { toValue: 1,   useNativeDriver: true, duration: 600 }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.typingContainer}>
      <Animated.Text style={[styles.avatarEmoji, { transform: [{ scale: pulse }] }]}>💅</Animated.Text>
      <View style={styles.typingBubble}>
        <Text style={styles.typingText}>Lesedi is typing...</Text>
      </View>
    </View>
  );
}

interface Props {
  onClose: () => void;
  userName: string;
  childName: string;
  parentGender: string;
  isPremium: boolean;
  onPaywall: () => void;
  msgCount: number;
  onMsgSent: (n: number) => void;
}

export default function GirlTalkScreen({
  onClose, userName, childName, parentGender,
  isPremium, onPaywall, msgCount, onMsgSent,
}: Props) {
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [messages,         setMessages]         = useState<any[]>([]);
  const [inputText,        setInputText]        = useState('');
  const [isTyping,         setIsTyping]         = useState(false);
  const [loadingHistory,   setLoadingHistory]   = useState(false);
  const [moodIndex,        setMoodIndex]        = useState<number | null>(null);
  const listRef           = useRef<FlatList>(null);
  const savedScrollOffset = useRef(0);
  const isInitialLoad     = useRef(true);
  const scrollSaveTimer   = useRef<any>(null);
  const insets            = useSafeAreaInsets();
  const companionMessagesLeft = Math.max(COMPANION_MESSAGE_LIMIT - msgCount, 0);

  useEffect(() => {
    cancelConversationReminder('lesedi');
    getTodayMoodIndex().then(setMoodIndex);
  }, []);

  const renderGirlTalkMessage = useCallback(({ item }: { item: any }) => (
    <GirlTalkMessageRow item={item} />
  ), []);

  const girlTalkCategories = [
    {
      id: 'girltalk_selfcare',
      icon: '💆‍♀️',
      title: 'Self-care & Mental Health',
      description: 'Because you matter too',
      color: '#FFB3C6', shadowColor: '#e8849a',
      questions: [
        'I feel completely burnt out',
        'How do I make time for myself?',
        "I've been feeling really anxious lately",
      ],
    },
    {
      id: 'girltalk_relationships',
      icon: '💑',
      title: 'Relationships & Marriage',
      description: 'Love, life and partnership',
      color: '#EDD9FF', shadowColor: '#b08fd4',
      questions: [
        'My partner and I keep arguing',
        'How do I feel close to my husband again?',
        'Balancing marriage and motherhood',
      ],
    },
    {
      id: 'girltalk_momguilt',
      icon: '😔',
      title: 'Mom Guilt & Burnout',
      description: "You're doing better than you think",
      color: '#FFD6A5', shadowColor: '#e8b46e',
      questions: [
        'I feel like a bad mom sometimes',
        'I lost my patience and I feel terrible',
        'Is it normal to need a break from my kids?',
      ],
    },
    {
      id: 'girltalk_lifestyle',
      icon: '👗',
      title: 'Fashion, Beauty & Lifestyle',
      description: 'Feel good, look good',
      color: '#C5F0A4', shadowColor: '#8ed466',
      questions: [
        'How do I get my confidence back after baby?',
        'Simple self-care routines for busy moms',
        'How do I find my style again?',
      ],
    },
  ];

  // Persist on message change
  useEffect(() => {
    if (selectedCategory && messages.length > 1) {
      saveHistory(selectedCategory.id, messages);
    }
  }, [messages, selectedCategory]);

  const handleCategorySelect = async (category: any) => {
    setSelectedCategory(category);
    setLoadingHistory(true);
    isInitialLoad.current = true;
    savedScrollOffset.current = 0;
    const [saved, rawOffset] = await Promise.all([
      loadHistory(category.id),
      AsyncStorage.getItem(`scroll_${category.id}`),
    ]);
    if (rawOffset) savedScrollOffset.current = parseFloat(rawOffset);
    if (saved && saved.length > 0) {
      setMessages(saved.map((m: any) => ({ ...m, animate: false })));
    } else {
      setMessages([{
        id: 'welcome',
        text: parentGender === 'dad'
          ? `Hey ${userName}! 👋 Lesedi here — what's on your mind? I'm here to help with anything. 💪`
          : `Hey ${userName}! 💅 Just us girls now — no parenting talk unless you want to! What's on your mind, sis? 😊`,
        isUser: false,
        animate: false,
      }]);
    }
    setLoadingHistory(false);
  };

  const handleClearChat = () => {
    Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await clearHistory(selectedCategory.id);
          setMessages([{
            id: 'welcome',
            text: `Fresh start! 💅 What do you want to chat about, ${userName}? 😊`,
            isUser: false, animate: true,
          }]);
        },
      },
    ]);
  };

  const handleQuestionSelect = async (question: string) => {
    if (!isPremium && msgCount >= COMPANION_MESSAGE_LIMIT) { onPaywall(); return; }
    const userMessage = { id: Date.now().toString(), text: question, isUser: true };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsTyping(true);
    const result = await getLesediResponse(question, selectedCategory.id, messages, userName, childName, parentGender, true, moodIndex);
    setIsTyping(false);
    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: result.success ? result.data : result.fallback,
      isUser: false, animate: true,
    };
    setMessages((prev) => [...prev, botMessage]);
    const newCount = await incrementCompanionMessageCount();
    onMsgSent(newCount);
    trackConversationActivity('lesedi', 'Lesedi', question, userName, parentGender);
    const qTopic = detectLesediTopic(question);
    if (qTopic) trackLesediTopicEngagement(qTopic);

    if (!isPremium && newCount >= COMPANION_MESSAGE_LIMIT) {
      Keyboard.dismiss();
      setTimeout(() => onPaywall(), 500);
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    if (!isPremium && msgCount >= COMPANION_MESSAGE_LIMIT) {
      Keyboard.dismiss();
      onPaywall();
      return;
    }
    const sentText = inputText;
    const userMessage = { id: Date.now().toString(), text: sentText, isUser: true };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);
    const result = await getLesediResponse(
      sentText, selectedCategory?.id || 'girltalk_general',
      messages, userName, childName, parentGender, true, moodIndex
    );
    setIsTyping(false);
    const botMessage = {
      id: (Date.now() + 1).toString(),
      text: result.success ? result.data : result.fallback,
      isUser: false, animate: true,
    };
    setMessages((prev) => [...prev, botMessage]);
    const newCount = await incrementCompanionMessageCount();
    onMsgSent(newCount);
    trackConversationActivity('lesedi', 'Lesedi', sentText, userName, parentGender);
    const sTopic = detectLesediTopic(sentText);
    if (sTopic) trackLesediTopicEngagement(sTopic);

    if (!isPremium && newCount >= COMPANION_MESSAGE_LIMIT) {
      Keyboard.dismiss();
      setTimeout(() => onPaywall(), 500);
    }

    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <Modal animationType="slide" transparent={false} visible={true}>
      <SafeAreaView style={styles.container}>
        {!selectedCategory ? (
          // ── Category selection ───────────────────────────────────────────────
          <>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => { playClickSound(); onClose(); }} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>← Back</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>
                {parentGender === 'dad' ? '🌱 Lesedi' : '💅 Girl Talk'}
              </Text>
            </View>
            <ScrollView style={styles.categoriesContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.sectionSubtitle}>
                {parentGender === 'dad'
                  ? 'Just you and Lesedi — what do you want to talk about? 🌱'
                  : 'Just you and Lesedi — no parenting required 😊'}
              </Text>
              <View style={styles.grid}>
                {girlTalkCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryCard, { backgroundColor: category.color, shadowColor: category.shadowColor }]}
                    onPress={() => { playClickSound(); handleCategorySelect(category); }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription}>{category.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </>
        ) : (
          // ── Chat ─────────────────────────────────────────────────────────────
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
          >
            <View style={[styles.chatHeader, { backgroundColor: selectedCategory.color }]}>
              <TouchableOpacity
                onPress={() => { playClickSound(); setSelectedCategory(null); setMessages([]); }}
                style={[styles.backButton, { shadowColor: selectedCategory.shadowColor }]}
              >
                <Text style={styles.backButtonText}>←</Text>
              </TouchableOpacity>
              <Text style={styles.categoryIconSmall}>{selectedCategory.icon}</Text>
              <Text style={styles.chatHeaderText}>{selectedCategory.title}</Text>
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
                <Text style={styles.loadingText}>Loading your conversation... 💕</Text>
              </View>
            ) : (
              <>
                <FlatList
                  ref={listRef}
                  data={messages}
                  keyExtractor={girlTalkKeyExtractor}
                  style={styles.chatList}
                  contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 10 }}
                  ListFooterComponent={isTyping ? <GirlTalkTypingIndicator /> : null}
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
                      AsyncStorage.setItem(`scroll_${selectedCategory.id}`, String(y));
                    }, 500);
                  }}
                  scrollEventThrottle={16}
                  renderItem={renderGirlTalkMessage}
                  removeClippedSubviews
                  maxToRenderPerBatch={8}
                  windowSize={5}
                  initialNumToRender={15}
                />

                {messages.length === 1 && (
                  <View style={styles.quickQuestions}>
                    <Text style={styles.quickQuestionsTitle}>Try asking:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {selectedCategory.questions.map((q: string, index: number) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.quickQuestionButton, {
                            backgroundColor: selectedCategory.color,
                            shadowColor: selectedCategory.shadowColor,
                          }]}
                          onPress={() => { playClickSound(); handleQuestionSelect(q); }}
                        >
                          <Text style={styles.quickQuestionText}>{q}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={[styles.inputContainer, { marginBottom: insets.bottom + 10 }]}>
                  <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={parentGender === 'dad' ? 'Talk to Lesedi... 🌱' : 'Talk to Lesedi... 💅'}
                    placeholderTextColor="#bbb"
                    multiline
                  />
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !inputText.trim() && styles.sendButtonDisabled,
                      inputText.trim()
                        ? { backgroundColor: selectedCategory?.color || '#FFB3C6', shadowColor: selectedCategory?.shadowColor || '#e8849a' }
                        : {},
                    ]}
                    onPress={() => { playClickSound(); handleSendMessage(); }}
                    disabled={!inputText.trim()}
                  >
                    <Text style={styles.sendText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#FFF0F5' },
  header: {
    backgroundColor: '#FFB3C6', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#e8849a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  closeButton: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 12,
  },
  closeButtonText: { color: '#4A3F5C', fontSize: 15, fontWeight: 'bold' },
  headerTitle:     { color: '#4A3F5C', fontSize: 20, fontWeight: 'bold' },

  categoriesContainer: { padding: 15 },
  sectionSubtitle: {
    textAlign: 'center', color: '#9B7FA8', fontSize: 14,
    fontStyle: 'italic', marginVertical: 12,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: {
    width: '48%', borderRadius: 20, padding: 18, marginBottom: 14, alignItems: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 0, elevation: 6,
    borderBottomWidth: 5, borderRightWidth: 3,
    borderBottomColor: 'rgba(0,0,0,0.15)', borderRightColor: 'rgba(0,0,0,0.08)',
  },
  categoryIcon:        { fontSize: 36, marginBottom: 8 },
  categoryTitle:       { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 4, color: '#4A3F5C' },
  categoryDescription: { fontSize: 11, textAlign: 'center', color: '#6B5B7A' },

  chatHeader: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25,
    shadowColor: '#e8849a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 10,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
    borderBottomWidth: 4, borderRightWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.15)', borderRightColor: 'rgba(0,0,0,0.08)',
  },
  backButtonText:   { fontSize: 18, fontWeight: 'bold' },
  categoryIconSmall:{ fontSize: 22, marginRight: 8 },
  chatHeaderText:   { fontSize: 17, fontWeight: 'bold', flex: 1, color: '#4A3F5C' },
  counterPill: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: '#9B7FA8',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  counterText: { color: '#6B5B7A', fontSize: 11, fontWeight: '700' },
  counterPillPremium: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderColor: '#7D6A8D',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  counterTextPremium: { color: '#5E4D6E', fontSize: 11, fontWeight: '700' },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
  },
  clearButtonText: { fontSize: 16 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { fontSize: 15, fontStyle: 'italic', color: '#9B7FA8' },

  chatList: { flex: 1, paddingHorizontal: 12 },
  messageRow: { marginVertical: 6, flexDirection: 'row', alignItems: 'flex-end' },
  userRow:    { justifyContent: 'flex-end' },
  botRow:     { justifyContent: 'flex-start' },
  avatarEmoji:{ fontSize: 20, marginRight: 6, marginBottom: 4 },
  bubble: {
    maxWidth: '78%', padding: 13, borderRadius: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 0, elevation: 5,
    borderBottomWidth: 4, borderRightWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.12)', borderRightColor: 'rgba(0,0,0,0.06)',
  },
  userBubble: { borderBottomRightRadius: 5, backgroundColor: '#C9B1E8' },
  botBubble:  { borderBottomLeftRadius: 5,  backgroundColor: '#FFB3C6' },
  messageText:{ fontSize: 15, lineHeight: 22 },
  userText:   { color: 'white' },
  botText:    { color: '#4A3F5C' },

  quickQuestions:      { padding: 12, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F0E0EA' },
  quickQuestionsTitle: { fontSize: 13, marginBottom: 8, fontWeight: '600', color: '#9B7FA8' },
  quickQuestionButton: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginRight: 10,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
    borderBottomWidth: 4, borderRightWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.12)', borderRightColor: 'rgba(0,0,0,0.06)',
  },
  quickQuestionText: { fontSize: 13, fontWeight: '500', color: '#4A3F5C' },

  inputContainer: {
    flexDirection: 'row', padding: 10,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#F0E0EA', alignItems: 'flex-end',
  },
  input: {
    flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10,
    marginRight: 10, maxHeight: 100, fontSize: 15, borderWidth: 1.5,
    borderColor: '#FFB3C6', backgroundColor: '#FFF0F5', color: '#4A3F5C',
  },
  sendButton: {
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 12, justifyContent: 'center',
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.45, shadowRadius: 0, elevation: 5,
    borderBottomWidth: 5, borderRightWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.15)', borderRightColor: 'rgba(0,0,0,0.08)',
  },
  sendButtonDisabled: { backgroundColor: '#E8E0EE', shadowColor: '#ccc', borderBottomColor: 'rgba(0,0,0,0.06)' },
  sendText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  typingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6 },
  typingBubble:    { borderRadius: 15, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFE0EC' },
  typingText:      { fontStyle: 'italic', fontSize: 14, color: '#9B7FA8' },
});
