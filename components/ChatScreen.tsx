import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getParentingAdvice } from '../services/firebase';
import { stripMarkdown } from '../utils/markdown';
import { getTodayMoodIndex } from '../utils/mood';
import { FREE_MESSAGE_LIMIT, incrementMessageCount } from '../utils/paywall';
import { detectsSlang } from '../utils/slang';
import { clearHistory, loadHistory, saveHistory } from '../utils/storage';
import WhiteNoisePlayer from './WhiteNoisePlayer';

// ── Typewriter effect for bot messages ───────────────────────────────────────
function TypewriterText({ text, style, speed = 18 }: { text: string; style: any; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const cleanText = stripMarkdown(text);

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setDisplayed(cleanText.slice(0, i));
      if (i >= cleanText.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [cleanText, speed]);

  return <Text style={style}>{displayed}</Text>;
}

// ── Animated bubble entrance ──────────────────────────────────────────────────
function AnimatedBubble({ isNew, style, children }: any) {
  const scale = useRef(new Animated.Value(isNew ? 0.85 : 1)).current;

  useEffect(() => {
    if (isNew) {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }).start();
    }
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      {children}
    </Animated.View>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator({ theme }: { theme: any }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, useNativeDriver: true, duration: 600 }),
        Animated.timing(pulse, { toValue: 1,    useNativeDriver: true, duration: 600 }),
      ])
    ).start();
  }, []);
  return (
    <View style={styles.typingContainer}>
      <Animated.Text style={[styles.avatarEmoji, { transform: [{ scale: pulse }] }]}>🌱</Animated.Text>
      <View style={[styles.typingBubble, { backgroundColor: theme.typingBubble }]}>
        <Text style={[styles.typingText, { color: theme.typingText }]}>Lesedi is typing...</Text>
      </View>
    </View>
  );
}

interface Message { id: string; text: string; isUser: boolean; animate?: boolean; }

const chatKeyExtractor = (item: Message) => item.id;

const ChatMessageRow = React.memo(({ item, theme }: { item: Message; theme: any }) => (
  <View style={[styles.messageRow, item.isUser ? styles.userRow : styles.botRow]}>
    {!item.isUser && <Text style={styles.avatarEmoji}>🌱</Text>}
    <AnimatedBubble isNew={item.animate} style={[
      styles.bubble,
      item.isUser
        ? [styles.userBubble, { backgroundColor: theme.userBubble }]
        : [styles.botBubble,  { backgroundColor: theme.botBubble, shadowColor: theme.botBubbleShadow }],
    ]}>
      {!item.isUser && item.animate ? (
        <TypewriterText text={item.text} style={[styles.messageText, { color: theme.cardText }]} speed={18} />
      ) : (
        <Text style={[styles.messageText, item.isUser ? styles.userText : { color: theme.cardText }]}>
          {item.isUser ? item.text : stripMarkdown(item.text)}
        </Text>
      )}
    </AnimatedBubble>
  </View>
));

interface Props {
  category: {
    id: string; icon: string; label?: string; title: string; description?: string;
    color: string; shadowColor: string; accentColor?: string;
    questions: string[];
  };
  onBack: () => void;
  userName: string;
  childName: string;
  parentGender: string;
  theme: any;
  isPremium: boolean;
  msgCount: number;
  onPaywall: () => void;
  onMsgSent: (newCount: number) => void;
}

export default function ChatScreen({
  category, onBack,
  userName, childName, parentGender,
  theme, isPremium, msgCount, onPaywall, onMsgSent,
}: Props) {
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [inputText,      setInputText]      = useState('');
  const [isTyping,       setIsTyping]       = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [moodIndex,      setMoodIndex]      = useState<number | null>(null);
  const listRef            = useRef<FlatList>(null);
  const savedScrollOffset  = useRef(0);
  const isInitialLoad      = useRef(true);
  const scrollSaveTimer    = useRef<any>(null);
  const insets             = useSafeAreaInsets();

  const renderChatMessage = useCallback(({ item }: { item: Message }) => (
    <ChatMessageRow item={item} theme={theme} />
  ), [theme]);

  useEffect(() => {
    getTodayMoodIndex().then(setMoodIndex);
  }, []);

  // Load history on mount
  useEffect(() => {
    (async () => {
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
            ? `Hey ${userName}! 👋 Great to have you here. What's going on with ${childName}? I'm here to help 💪`
            : `Hi ${userName}! 😊 I'm Lesedi, and I'm here for you. You're looking at ${category.title.toLowerCase()} — what's going on with ${childName}? Tell me everything 💕`,
          isUser: false,
          animate: false,
        }]);
      }
      setLoadingHistory(false);
    })();
  }, []);

  // Persist on message change
  useEffect(() => {
    if (messages.length > 1) saveHistory(category.id, messages);
  }, [messages]);

  const handleClearChat = () => {
    const { Alert } = require('react-native');
    Alert.alert('Clear Chat', 'Are you sure you want to clear this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear', style: 'destructive',
        onPress: async () => {
          await clearHistory(category.id);
          setMessages([{
            id: 'welcome',
            text: parentGender === 'dad'
              ? `Starting fresh, ${userName}! 👋 What's on your mind? 💪`
              : `Starting fresh, ${userName}! 😊 What's on your mind about ${category.title.toLowerCase()}? I'm all ears 💕`,
            isUser: false, animate: true,
          }]);
        },
      },
    ]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    if (!isPremium && msgCount >= FREE_MESSAGE_LIMIT) {
      Keyboard.dismiss();
      onPaywall();
      return;
    }
    const userMessage: Message = { id: Date.now().toString(), text: text.trim(), isUser: true };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');
    setIsTyping(true);

    const useSlang = detectsSlang(updatedMessages);
    const result = await getParentingAdvice(
      text.trim(), category.id, updatedMessages, userName, childName, parentGender, false, useSlang, moodIndex
    );
    setIsTyping(false);

    const botMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: result.success
        ? stripMarkdown(result.data || '')
        : (result.fallback || "I'm having a little trouble connecting right now. Please try again in a moment! 💕"),
      isUser: false, animate: true,
    };
    setMessages((prev) => [...prev, botMessage]);

    const newCount = await incrementMessageCount();
    onMsgSent(newCount);

    if (!isPremium && newCount >= FREE_MESSAGE_LIMIT) {
      Keyboard.dismiss();
      setTimeout(() => onPaywall(), 500);
    }
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleQuestionSelect = async (question: string) => {
    if (!isPremium && msgCount >= FREE_MESSAGE_LIMIT) { onPaywall(); return; }
    await sendMessage(question);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        {/* Header */}
        <View style={[styles.chatHeader, { backgroundColor: category.color }]}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { shadowColor: category.shadowColor }]}
          >
            <Text style={[styles.backButtonText, { color: theme.cardText }]}>←</Text>
          </TouchableOpacity>
          <Text style={styles.categoryIconSmall}>{category.icon}</Text>
          <Text style={[styles.chatHeaderText, { color: theme.cardText }]}>{category.title}</Text>

          {/* Message counter badge */}
          {!isPremium && (
            <View style={[styles.msgCounterBadge, {
              backgroundColor: msgCount >= FREE_MESSAGE_LIMIT - 2
                ? '#FF6B6B'
                : 'rgba(255,255,255,0.3)',
            }]}>
              <Text style={[styles.msgCounterText, {
                color: msgCount >= FREE_MESSAGE_LIMIT - 2 ? 'white' : theme.cardText,
              }]}>
                {Math.max(0, FREE_MESSAGE_LIMIT - msgCount)} left
              </Text>
            </View>
          )}
          {isPremium && (
            <View style={[styles.msgCounterBadge, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
              <Text style={[styles.msgCounterText, { color: theme.cardText }]}>⭐ Pro</Text>
            </View>
          )}

          <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>

        {loadingHistory ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.subText }]}>Loading your conversation... 💕</Text>
          </View>
        ) : (
          <>
            {/* White Noise player — only in sleep category */}
            {category.id === 'sleep' && <WhiteNoisePlayer theme={theme} />}

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={chatKeyExtractor}
              style={styles.chatList}
              contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 10 }}
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
                  AsyncStorage.setItem(`scroll_${category.id}`, String(y));
                }, 500);
              }}
              scrollEventThrottle={16}
              ListFooterComponent={isTyping ? <TypingIndicator theme={theme} /> : null}
              renderItem={renderChatMessage}
              removeClippedSubviews
              maxToRenderPerBatch={8}
              windowSize={5}
              initialNumToRender={15}
            />

            {/* Quick questions — only shown on first message */}
            {messages.length === 1 && (
              <View style={[styles.quickQuestions, { borderTopColor: theme.quickQuestionsBorder }]}>
                <Text style={[styles.quickQuestionsTitle, { color: theme.subText }]}>Try asking:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {category.questions.map((q, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.quickQuestionButton, {
                        backgroundColor: category.color,
                        shadowColor: category.shadowColor,
                      }]}
                      onPress={() => handleQuestionSelect(q)}
                    >
                      <Text style={[styles.quickQuestionText, { color: theme.cardText }]}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Input bar */}
            <View style={[styles.inputContainer, {
              marginBottom: insets.bottom + 10,
              borderTopColor: theme.quickQuestionsBorder,
            }]}>
              <TextInput
                style={[styles.input, {
                  backgroundColor: theme.inputBackground,
                  borderColor: theme.inputBorder,
                  color: theme.cardText,
                }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Talk to Lesedi... 💕"
                placeholderTextColor="#bbb"
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !inputText.trim() && styles.sendButtonDisabled,
                  inputText.trim()
                    ? { backgroundColor: category.color, shadowColor: category.shadowColor }
                    : {},
                ]}
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim()}
              >
                <Text style={styles.sendText}>Send</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1 },
  chatHeader: {
    paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15,
    flexDirection: 'row', alignItems: 'center',
    borderBottomLeftRadius: 25, borderBottomRightRadius: 25,
    shadowColor: '#00000033', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, marginRight: 10,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
    borderBottomWidth: 4, borderRightWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.15)', borderRightColor: 'rgba(0,0,0,0.08)',
  },
  backButtonText:  { fontSize: 18, fontWeight: 'bold' },
  categoryIconSmall: { fontSize: 22, marginRight: 8 },
  chatHeaderText:  { fontSize: 17, fontWeight: 'bold', flex: 1 },
  msgCounterBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginRight: 6 },
  msgCounterText:  { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  clearButton: {
    backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
  },
  clearButtonText: { fontSize: 16 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { fontSize: 15, fontStyle: 'italic' },

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
  userBubble:  { borderBottomRightRadius: 5 },
  botBubble:   { borderBottomLeftRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText:    { color: 'white' },

  quickQuestions: {
    padding: 12, backgroundColor: 'white', borderTopWidth: 1,
  },
  quickQuestionsTitle: { fontSize: 13, marginBottom: 8, fontWeight: '600' },
  quickQuestionButton: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20, marginRight: 10,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 0, elevation: 4,
    borderBottomWidth: 4, borderRightWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.12)', borderRightColor: 'rgba(0,0,0,0.06)',
  },
  quickQuestionText: { fontSize: 13, fontWeight: '500' },

  inputContainer: {
    flexDirection: 'row', padding: 10,
    backgroundColor: 'white', borderTopWidth: 1, alignItems: 'flex-end',
  },
  input: {
    flex: 1, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10,
    marginRight: 10, maxHeight: 100, fontSize: 15, borderWidth: 1.5,
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
  typingBubble:    { borderRadius: 15, paddingHorizontal: 14, paddingVertical: 8 },
  typingText:      { fontStyle: 'italic', fontSize: 14 },
});
