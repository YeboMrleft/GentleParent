import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { generateStory } from '../services/firebase';
import { playClickSound } from '../utils/sounds';
import BookReflectionModal from './BookReflectionModal';
import { cancelNovelReminder, cancelUnfinishedReadReminder, scheduleNovelReminder, scheduleUnfinishedReadReminder } from '../utils/notifications';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Novel {
  id: string;
  title: string;
  author: string;
  cover: string;
  genre: string;
  description: string;
  color: string;
  textColor: string;
  gutenbergId?: number;
  aiPrompt?: string;
  free?: boolean;
}

type ReadingMode = 'light' | 'sepia' | 'dark';

const READING_MODES: Record<ReadingMode, { bg: string; text: string; icon: string }> = {
  light: { bg: '#FAF7F2', text: '#2C2416', icon: '☀️' },
  sepia: { bg: '#F5ECD7', text: '#3B2A1A', icon: '📜' },
  dark:  { bg: '#111010', text: '#E8E0D0', icon: '🌙' },
};
const MODE_CYCLE: ReadingMode[] = ['light', 'sepia', 'dark'];

const CLASSIC_NOVELS: Novel[] = [
  {
    id: 'pride',
    title: 'Pride & Prejudice',
    author: 'Jane Austen',
    cover: '📖',
    genre: 'Romance',
    gutenbergId: 1342,
    description: "The timeless tale of Elizabeth Bennet and Mr. Darcy's slow-burning love.",
    color: '#FFE4EE',
    textColor: '#5A0020',
    free: true,
  },
  {
    id: 'jane_eyre',
    title: 'Jane Eyre',
    author: 'Charlotte Brontë',
    cover: '🕯️',
    genre: 'Classic',
    gutenbergId: 1260,
    description: 'An orphan girl navigates love, independence, and dark secrets.',
    color: '#EDE4FF',
    textColor: '#2D0060',
  },
  {
    id: 'little_women',
    title: 'Little Women',
    author: 'Louisa May Alcott',
    cover: '🎀',
    genre: 'Family',
    gutenbergId: 514,
    description: 'Four sisters grow up, love, and find their way in the world.',
    color: '#E4FFE8',
    textColor: '#005A1A',
  },
  {
    id: 'secret_garden',
    title: 'The Secret Garden',
    author: 'F. H. Burnett',
    cover: '🌷',
    genre: 'Classic',
    gutenbergId: 113,
    description: 'A hidden garden transforms a lonely, difficult child.',
    color: '#E4F4FF',
    textColor: '#00305A',
  },
  {
    id: 'sense',
    title: 'Sense & Sensibility',
    author: 'Jane Austen',
    cover: '🌹',
    genre: 'Romance',
    gutenbergId: 161,
    description: 'Two sisters navigate heartbreak, society, and finding real love.',
    color: '#FFF0E4',
    textColor: '#5A2000',
  },
  {
    id: 'wuthering',
    title: 'Wuthering Heights',
    author: 'Emily Brontë',
    cover: '🌑',
    genre: 'Gothic',
    gutenbergId: 768,
    description: 'A passionate, dark love story on the wild Yorkshire moors.',
    color: '#F0E4FF',
    textColor: '#2A004A',
  },
];

const AI_STORIES: Novel[] = [
  {
    id: 'night_feed',
    title: 'The Night Feed',
    author: 'AI Original',
    cover: '🌙',
    genre: 'Mom Lit',
    description: 'A tender story about the quiet magic of 3am and the love only a mother knows.',
    color: '#E8EEFF',
    textColor: '#001A5A',
    free: true,
    aiPrompt: `Write a warm, moving short story chapter (about 800 words) titled "The Night Feed" about a new mother during a 3am feed. The tone should be tender, a little funny, and ultimately hopeful. Include her raw, tired inner thoughts, the peaceful quiet of the night, her baby's sounds, and end with a moment of unexpected joy or connection. Write it in first person.`,
  },
  {
    id: 'village_mum',
    title: 'The Village Mum',
    author: 'AI Original',
    cover: '☕',
    genre: 'Mom Lit',
    description: 'Friendship, laughter, and school-gate drama among a group of moms.',
    color: '#FFF8E4',
    textColor: '#5A3A00',
    aiPrompt: `Write a funny, warm short story chapter (about 800 words) about a group of mothers who meet at the school gate and form an unlikely friendship. Include humour, warmth, and a sense of genuine sisterhood. Mix different backgrounds. Write in first person from one mom's perspective.`,
  },
  {
    id: 'her_story',
    title: 'Her Own Story',
    author: 'AI Original',
    cover: '✨',
    genre: 'Mom Lit',
    description: "One mom's journey back to herself — and her forgotten passion.",
    color: '#FFFDE4',
    textColor: '#5A5A00',
    aiPrompt: `Write a moving, uplifting short story chapter (about 800 words) about a mother who rediscovers her passion for painting after years of putting everyone else first. Include the moment she finds her old paints, the emotion that surfaces, and the small but significant decision she makes. Tone: warm, introspective, hopeful. Write in first person.`,
  },
  {
    id: 'first_day_back',
    title: 'The First Day Back',
    author: 'AI Original',
    cover: '💼',
    genre: 'Mom Lit',
    description: "Returning to work after maternity leave — the guilt, the pride, and the forgotten password.",
    color: '#E4F0FF',
    textColor: '#001A5A',
    aiPrompt: `Write a warm, funny, and moving short story chapter (about 800 words) about a mother returning to work for the first time after maternity leave. Include the morning chaos getting ready, the emotional drop-off at daycare, the strange feeling of being "herself" again at the office, and a small moment that makes her feel both guilty and proud at the same time. Write in first person. Tone: honest, humorous, ultimately uplifting.`,
  },
  {
    id: 'saturday_morning',
    title: 'Saturday Morning',
    author: 'AI Original',
    cover: '🥞',
    genre: 'Mom Lit',
    description: 'The sacred chaos of a slow Saturday morning with little ones.',
    color: '#FFF4E4',
    textColor: '#5A2A00',
    aiPrompt: `Write a warm, funny short story chapter (about 800 words) about a mother's Saturday morning with her young children. Include the early wake-up, the pancake negotiations, a small disaster in the kitchen, and a tender moment that makes it all worth it. Tone: warm, playful, nostalgic. Write in first person.`,
  },
  {
    id: 'the_group_chat',
    title: 'The Group Chat',
    author: 'AI Original',
    cover: '📱',
    genre: 'Mom Lit',
    description: 'School WhatsApp groups: where friendships are forged and drama never sleeps.',
    color: '#E4FFE8',
    textColor: '#005A1A',
    aiPrompt: `Write a funny, sharp, warm short story chapter (about 800 words) from the perspective of a mother navigating a school WhatsApp parents' group. Include the passive-aggressive messages, the over-enthusiastic class rep, a genuine moment of community, and one perfectly timed message that saves the day. Tone: comedic, warm, relatable. Write in first person.`,
  },
  {
    id: 'letting_go',
    title: 'Letting Go',
    author: 'AI Original',
    cover: '🎒',
    genre: 'Mom Lit',
    description: "Her baby's first day of school — and a mother learning to breathe again.",
    color: '#F0E4FF',
    textColor: '#2A004A',
    aiPrompt: `Write a moving, bittersweet short story chapter (about 800 words) about a mother on the morning of her child's very first day of school. Include the careful preparation the night before, the walk to the school gate, the moment she lets go of their hand, and what she does in the quiet hour that follows. Tone: tender, honest, ultimately hopeful. Write in first person.`,
  },
];

const ALL_NOVELS = [...CLASSIC_NOVELS, ...AI_STORIES];

type TextBlock = { type: 'heading' | 'paragraph'; content: string };

function parseBookText(text: string): TextBlock[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n{2,}/)
    .map((b) => b.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter((b) => b.length > 1);

  return blocks.map((block) => {
    const isHeading =
      /^(CHAPTER|PART|BOOK|SECTION|VOLUME|PROLOGUE|EPILOGUE|ACT|SCENE)\b/i.test(block) ||
      (block.length < 60 && block === block.toUpperCase() && /[A-Z]/.test(block));
    return { type: isHeading ? 'heading' : 'paragraph', content: block };
  });
}

function stripGutenbergBoilerplate(text: string): string {
  const startIdx = text.search(/\*\*\* ?START OF (THIS|THE) PROJECT GUTENBERG/i);
  const endIdx = text.search(/\*\*\* ?END OF (THIS|THE) PROJECT GUTENBERG/i);
  if (startIdx !== -1) {
    const afterStart = text.indexOf('\n', startIdx) + 1;
    const content = endIdx !== -1 ? text.slice(afterStart, endIdx) : text.slice(afterStart);
    return content.trim();
  }
  return text.trim();
}

interface Props {
  theme: any;
  isDarkMode: boolean;
  isPremium: boolean;
  parentGender: string;
  onClose: () => void;
  onPaywall: () => void;
}

export default function NovelReaderScreen({ theme, isDarkMode, isPremium, parentGender, onClose, onPaywall }: Props) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<'library' | 'reader'>('library');
  const [selectedNovel, setSelectedNovel] = useState<Novel | null>(null);
  const [bookText, setBookText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [fontSize, setFontSize] = useState(16);
  const [readingMode, setReadingMode] = useState<ReadingMode>('light');
  const [lastReadNovelId, setLastReadNovelId] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);
  const [viewHeight, setViewHeight] = useState(0);
  const [showReflection, setShowReflection] = useState(false);
  const [reflectedIds, setReflectedIds] = useState<Set<string>>(new Set());
  const reflectionTriggered = useRef(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accentColor = parentGender === 'mom' ? '#E75480' : '#2C5F8A';
  const bg = isDarkMode ? '#111111' : (parentGender === 'mom' ? '#FFF0F5' : '#F0F4FF');
  const textPrimary = isDarkMode ? '#EEEEEE' : '#222222';
  const textSecondary = isDarkMode ? '#AAAAAA' : '#666666';

  const progressPercent = contentHeight > viewHeight
    ? Math.min(100, Math.round((scrollOffset / (contentHeight - viewHeight)) * 100))
    : 0;

  const readerBg   = READING_MODES[readingMode].bg;
  const readerText = READING_MODES[readingMode].text;

  useEffect(() => {
    AsyncStorage.multiGet(['novel_reading_mode', 'novel_last_read']).then(([modeEntry, lastEntry]) => {
      if (modeEntry[1] && MODE_CYCLE.includes(modeEntry[1] as ReadingMode)) {
        setReadingMode(modeEntry[1] as ReadingMode);
      }
      if (lastEntry[1]) setLastReadNovelId(lastEntry[1]);
    });
    // Load which novels have already been reflected on
    AsyncStorage.getItem('book_reflections_v1').then((val) => {
      if (val) {
        try {
          const all = JSON.parse(val);
          setReflectedIds(new Set(all.map((r: any) => r.novelId)));
        } catch {}
      }
    });
  }, []);

  // Trigger reflection prompt at 90% progress
  useEffect(() => {
    if (progressPercent >= 90 && selectedNovel && !reflectionTriggered.current && !showReflection) {
      reflectionTriggered.current = true;
      setTimeout(() => setShowReflection(true), 800);
    }
  }, [progressPercent]);

  // Scroll to saved position after content loads
  useEffect(() => {
    if (!bookText || !selectedNovel) return;
    AsyncStorage.getItem(`novel_progress_${selectedNovel.id}`).then((val) => {
      if (val) {
        try {
          const { offset } = JSON.parse(val);
          if (offset > 0) {
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({ y: offset, animated: false });
            }, 150);
          }
        } catch {}
      }
    });
  }, [bookText]);

  const cycleReadingMode = () => {
    playClickSound();
    const next = MODE_CYCLE[(MODE_CYCLE.indexOf(readingMode) + 1) % MODE_CYCLE.length];
    setReadingMode(next);
    AsyncStorage.setItem('novel_reading_mode', next);
  };

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.y;
    setScrollOffset(offset);
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = setTimeout(() => {
      if (selectedNovel) {
        AsyncStorage.setItem(`novel_progress_${selectedNovel.id}`, JSON.stringify({ offset }));
      }
    }, 600);
  };

  const loadNovelContent = async (novel: Novel) => {
    setIsLoading(true);
    setLoadError('');
    setBookText('');
    setScrollOffset(0);

    const cacheKey = `novel_v1_${novel.id}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setBookText(cached);
        setIsLoading(false);
        return;
      }

      if (novel.gutenbergId) {
        const id = novel.gutenbergId;
        const urls = [
          `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,
          `https://www.gutenberg.org/files/${id}/${id}-0.txt`,
          `https://www.gutenberg.org/files/${id}/${id}.txt`,
        ];
        let raw = '';
        for (const url of urls) {
          try {
            const resp = await fetch(url, {
              headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36' },
            });
            if (resp.ok) { raw = await resp.text(); break; }
          } catch {}
        }
        if (!raw) throw new Error('All URLs failed');
        const cleaned = stripGutenbergBoilerplate(raw);
        const excerpt = cleaned.slice(0, 40000);
        await AsyncStorage.setItem(cacheKey, excerpt);
        setBookText(excerpt);
      } else if (novel.aiPrompt) {
        const generated = await generateStory(novel.aiPrompt);
        if (!generated) throw new Error('Empty response');
        await AsyncStorage.setItem(cacheKey, generated);
        setBookText(generated);
      }
    } catch {
      setLoadError("Couldn't load this book right now. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAiStory = async (novel: Novel) => {
    playClickSound();
    await AsyncStorage.removeItem(`novel_v1_${novel.id}`);
    await AsyncStorage.removeItem(`novel_progress_${novel.id}`);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    loadNovelContent(novel);
  };

  const openNovel = (novel: Novel) => {
    playClickSound();
    if (!isPremium && !novel.free) {
      onPaywall();
      return;
    }
    setSelectedNovel(novel);
    setView('reader');
    reflectionTriggered.current = false;
    AsyncStorage.setItem('novel_last_read', novel.id);
    setLastReadNovelId(novel.id);
    scheduleNovelReminder(novel.title);
    cancelUnfinishedReadReminder();
    loadNovelContent(novel);
  };

  const backToLibrary = () => {
    playClickSound();
    if (selectedNovel) {
      scheduleUnfinishedReadReminder(selectedNovel.title, progressPercent);
    }
    setView('library');
    setSelectedNovel(null);
    setBookText('');
    setLoadError('');
    setScrollOffset(0);
    setContentHeight(0);
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
  };

  const lastReadNovel = lastReadNovelId ? ALL_NOVELS.find((n) => n.id === lastReadNovelId) ?? null : null;

  // ── Reader view ──────────────────────────────────────────────────────────────
  if (view === 'reader' && selectedNovel) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: readerBg }}>
        <StatusBar barStyle={readingMode === 'dark' ? 'light-content' : 'dark-content'} />

        {/* Reader header */}
        <View style={{
          backgroundColor: accentColor,
          paddingTop: Platform.OS === 'android' ? insets.top + 12 : 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        }}>
          <TouchableOpacity onPress={backToLibrary} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: 'white', fontSize: 22 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15 }} numberOfLines={1}>
              {selectedNovel.cover} {selectedNovel.title}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>{selectedNovel.author}</Text>
          </View>
          {/* Reading mode toggle */}
          <TouchableOpacity
            onPress={cycleReadingMode}
            style={{ paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, marginRight: 2 }}
          >
            <Text style={{ fontSize: 13 }}>{READING_MODES[readingMode].icon}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { playClickSound(); setFontSize((f) => Math.max(12, f - 1)); }}
            style={{ paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>A−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { playClickSound(); setFontSize((f) => Math.min(26, f + 1)); }}
            style={{ paddingHorizontal: 9, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>A+</Text>
          </TouchableOpacity>
        </View>

        {/* Progress bar */}
        <View style={{ height: 3, backgroundColor: readingMode === 'dark' ? '#2A2A2A' : '#E8E0D4' }}>
          <View style={{ height: 3, width: `${progressPercent}%`, backgroundColor: accentColor }} />
        </View>

        <BookReflectionModal
        visible={showReflection}
        novel={selectedNovel}
        accentColor={accentColor}
        isDarkMode={isDarkMode}
        onClose={() => setShowReflection(false)}
        onReflected={(id) => setReflectedIds((prev) => new Set([...prev, id]))}
      />

      {isLoading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: readerBg }}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={{ marginTop: 16, color: readerText, fontSize: 14, opacity: 0.7 }}>
              {selectedNovel.aiPrompt ? 'Writing your story...' : 'Loading book...'}
            </Text>
          </View>
        ) : loadError ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: readerBg }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>📵</Text>
            <Text style={{ color: readerText, fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 8 }}>
              Couldn't Load Book
            </Text>
            <Text style={{ color: readerText, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24, opacity: 0.7 }}>
              {loadError}
            </Text>
            <TouchableOpacity
              onPress={() => loadNovelContent(selectedNovel)}
              style={{ backgroundColor: accentColor, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
            >
              <Text style={{ color: 'white', fontWeight: '700' }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 22, paddingBottom: 80 }}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={200}
            onContentSizeChange={(_, h) => setContentHeight(h)}
            onLayout={(e) => setViewHeight(e.nativeEvent.layout.height)}
          >
            {parseBookText(bookText).map((block, i) =>
              block.type === 'heading' ? (
                <Text key={i} style={{
                  fontSize: fontSize + 2,
                  fontWeight: '800',
                  color: readerText,
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                  textAlign: 'center',
                  marginTop: 32,
                  marginBottom: 16,
                  letterSpacing: 0.5,
                  opacity: 0.85,
                }}>
                  {block.content}
                </Text>
              ) : (
                <Text key={i} style={{
                  fontSize: fontSize,
                  lineHeight: fontSize * 1.75,
                  color: readerText,
                  fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
                  letterSpacing: 0.3,
                  marginBottom: fontSize * 0.9,
                  textAlign: 'left',
                }}>
                  {block.content}
                </Text>
              )
            )}

            {/* Footer */}
            <View style={{ marginTop: 32, alignItems: 'center', gap: 12 }}>
              {selectedNovel.gutenbergId && (
                <Text style={{ color: readerText, fontSize: 11, textAlign: 'center', fontStyle: 'italic', opacity: 0.5 }}>
                  Public domain text via Project Gutenberg
                </Text>
              )}
              {selectedNovel.aiPrompt && (
                <>
                  <Text style={{ color: readerText, fontSize: 11, textAlign: 'center', fontStyle: 'italic', opacity: 0.5 }}>
                    AI-generated story · GentleParent Mom Lit
                  </Text>
                  <TouchableOpacity
                    onPress={() => refreshAiStory(selectedNovel)}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                      paddingHorizontal: 18, paddingVertical: 10,
                      backgroundColor: accentColor + '18',
                      borderRadius: 20, borderWidth: 1, borderColor: accentColor + '40',
                    }}
                  >
                    <Text style={{ fontSize: 14 }}>↺</Text>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: accentColor }}>
                      Generate a new story
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    );
  }

  // ── Library view ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />

      <View style={{
        backgroundColor: accentColor,
        paddingTop: Platform.OS === 'android' ? insets.top + 16 : 16,
        paddingBottom: 16,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: accentColor,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 8,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={{ color: 'white', fontSize: 22, marginRight: 12 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 20 }}>📚 Novel Corner</Text>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 }}>
              {isPremium ? 'Premium Active — enjoy your reading ✓' : 'Your reading escape'}
            </Text>
          </View>
          {!isPremium && (
            <TouchableOpacity
              onPress={onPaywall}
              style={{ backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 }}
            >
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>✨ PREMIUM</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Continue Reading banner */}
        {lastReadNovel && (
          <TouchableOpacity
            onPress={() => openNovel(lastReadNovel)}
            activeOpacity={0.88}
            style={{
              backgroundColor: isDarkMode ? '#1E1E1E' : lastReadNovel.color,
              borderRadius: 18, padding: 16, marginBottom: 20,
              flexDirection: 'row', alignItems: 'center', gap: 14,
              borderWidth: 1.5, borderColor: accentColor + '40',
              shadowColor: accentColor, shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
            }}
          >
            <View style={{
              width: 52, height: 52, borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.7)',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontSize: 26 }}>{lastReadNovel.cover}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: accentColor, letterSpacing: 0.5, marginBottom: 2 }}>
                CONTINUE READING
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: isDarkMode ? '#EEE' : lastReadNovel.textColor }} numberOfLines={1}>
                {lastReadNovel.title}
              </Text>
              <Text style={{ fontSize: 11, color: isDarkMode ? '#888' : lastReadNovel.textColor, opacity: 0.7 }}>
                {lastReadNovel.author}
              </Text>
            </View>
            <Text style={{ fontSize: 20, color: accentColor }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Unlock banner for non-premium */}
        {!isPremium && (
          <TouchableOpacity
            onPress={onPaywall}
            activeOpacity={0.88}
            style={{
              backgroundColor: accentColor,
              borderRadius: 18, padding: 18, marginBottom: 20,
              flexDirection: 'row', alignItems: 'center',
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
            }}
          >
            <Text style={{ fontSize: 32, marginRight: 14 }}>✨</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 15, marginBottom: 3 }}>
                Unlock Full Access
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, lineHeight: 17 }}>
                Subscribe to read all novels and AI-written Mom Lit stories
              </Text>
            </View>
            <Text style={{ color: 'white', fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        )}

        {/* Classics */}
        <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary, marginBottom: 4, marginTop: 4 }}>
          📖 Classics Library
        </Text>
        <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 14, lineHeight: 18 }}>
          Timeless novels, free from copyright · powered by Project Gutenberg
        </Text>

        {CLASSIC_NOVELS.map((novel) => (
          <NovelCard
            key={novel.id}
            novel={novel}
            isPremium={isPremium}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            onPress={() => openNovel(novel)}
            badgeLabel={novel.genre.toUpperCase()}
            badgeStyle="default"
            isReflected={reflectedIds.has(novel.id)}
          />
        ))}

        {/* Mom Lit */}
        <Text style={{ fontSize: 16, fontWeight: '800', color: textPrimary, marginBottom: 4, marginTop: 20 }}>
          ✨ Mom Lit
        </Text>
        <Text style={{ fontSize: 12, color: textSecondary, marginBottom: 14, lineHeight: 18 }}>
          Original stories written for moms, by AI · refreshes anytime
        </Text>

        {AI_STORIES.map((novel) => (
          <NovelCard
            key={novel.id}
            novel={novel}
            isPremium={isPremium}
            isDarkMode={isDarkMode}
            accentColor={accentColor}
            onPress={() => openNovel(novel)}
            badgeLabel="AI ORIGINAL"
            badgeStyle="accent"
            isReflected={reflectedIds.has(novel.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Shared card component ────────────────────────────────────────────────────
function NovelCard({
  novel, isPremium, isDarkMode, accentColor, onPress, badgeLabel, badgeStyle, isReflected,
}: {
  novel: Novel;
  isPremium: boolean;
  isDarkMode: boolean;
  accentColor: string;
  onPress: () => void;
  badgeLabel: string;
  badgeStyle: 'default' | 'accent';
  isReflected?: boolean;
}) {
  const isLocked = !isPremium && !novel.free;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={{
        backgroundColor: isDarkMode ? '#1E1E1E' : novel.color,
        borderRadius: 18, padding: 16, marginBottom: 12,
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1,
        borderColor: isDarkMode ? '#333333' : 'rgba(0,0,0,0.06)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
        opacity: isLocked ? 0.72 : 1,
      }}
    >
      <View style={{
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.7)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
      }}>
        <Text style={{ fontSize: 26 }}>{novel.cover}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 3 }}>
          <Text style={{
            fontSize: 13, fontWeight: '800',
            color: isDarkMode ? '#EEEEEE' : novel.textColor,
            flex: 1,
          }}>
            {novel.title}
          </Text>
          {/* Reflected badge */}
          {isReflected && (
            <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, marginLeft: 4 }}>
              <Text style={{ fontSize: 13 }}>📓</Text>
            </View>
          )}
          {/* FREE badge */}
          {novel.free && !isPremium && (
            <View style={{
              backgroundColor: '#22C55E22', paddingHorizontal: 7, paddingVertical: 2,
              borderRadius: 8, marginLeft: 6, borderWidth: 1, borderColor: '#22C55E55',
            }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#16A34A' }}>FREE</Text>
            </View>
          )}
          {/* Genre / AI badge */}
          <View style={{
            backgroundColor: badgeStyle === 'accent'
              ? accentColor + '22'
              : (isDarkMode ? '#333' : 'rgba(255,255,255,0.6)'),
            paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, marginLeft: 4,
          }}>
            <Text style={{
              fontSize: 9, fontWeight: '700',
              color: badgeStyle === 'accent' ? accentColor : (isDarkMode ? '#AAAAAA' : novel.textColor),
            }}>
              {badgeLabel}
            </Text>
          </View>
        </View>
        <Text style={{ fontSize: 11, color: isDarkMode ? '#888' : novel.textColor, opacity: 0.75, marginBottom: 4 }}>
          {novel.author}
        </Text>
        <Text style={{ fontSize: 12, color: isDarkMode ? '#AAAAAA' : novel.textColor, lineHeight: 17, opacity: isDarkMode ? 1 : 0.85 }}>
          {novel.description}
        </Text>
      </View>

      <Text style={{ fontSize: 18, marginLeft: 8, opacity: isLocked ? 0.5 : 0.7, color: isDarkMode ? '#555555' : novel.textColor }}>
        {isLocked ? '🔒' : '›'}
      </Text>
    </TouchableOpacity>
  );
}
