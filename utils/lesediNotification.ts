import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ALL_LESEDI_MESSAGES, LesediTopic } from '../constants/lesediMessages';

const LAST_SCHEDULED_KEY = 'lesedi_nudge_date';
const NOTIF_ID_KEY       = 'lesedi_nudge_id';
const TOPIC_SCORES_KEY   = 'lesedi_topic_scores';

const todayString = () => new Date().toISOString().slice(0, 10);

// Swap female salutations for the user's name when the user is male
function personalizeForUser(message: string, userName: string, gender: string): string {
  if (gender === 'dad') {
    const name = userName || 'friend';
    return message
      .replace(/\bSisi\b/g, name)
      .replace(/\bSis\b/g, name)
      .replace(/\bGirl\b/g, name);
  }
  return message;
}

// ── Keyword-based topic detection ─────────────────────────────────────────────
const TOPIC_KEYWORDS: Record<LesediTopic, string[]> = {
  music: [
    'music', 'song', 'amapiano', 'playlist', 'album', 'artist', 'listen', 'beat',
    'track', 'afrobeats', 'hip hop', 'rap', 'kwaito', 'house music', 'dj',
    'lyrics', 'concert', 'vibe', 'tune', 'streaming music',
  ],
  books: [
    'book', 'novel', 'read', 'reading', 'kindle', 'author', 'fiction',
    'chapter', 'library', 'book club', 'bookclub', 'non-fiction', 'nonfiction',
    'biography', 'thriller', 'romance novel', 'literature', 'story',
  ],
  wine: [
    'wine', 'rosé', 'rose', 'cocktail', 'drink', 'glass of wine', 'merlot',
    'chardonnay', 'prosecco', 'gin', 'cheers', 'bottle', 'vineyard',
    'red wine', 'white wine', 'sparkling', 'sundowner',
  ],
  series: [
    'series', 'show', 'episode', 'season', 'netflix', 'streaming', 'binge',
    'watch', 'hulu', 'disney', 'amazon prime', 'showmax', 'tv show',
    'talk show', 'programme', 'sitcom', 'drama series', 'docuseries',
  ],
  realityTV: [
    'reality', 'housewives', 'love island', 'big brother', 'survivor',
    'bachelor', 'bachelorette', 'dating show', 'idol', 'x factor',
    'talent show', 'eviction', 'elimination', 'drama', 'unscripted',
    'temptation island', 'married at first sight',
  ],
  celebrities: [
    'celebrity', 'celeb', 'gossip', 'fashion', 'red carpet', 'star',
    'famous', 'influencer', 'style', 'outfit', 'look', 'photoshoot',
    'award', 'grammy', 'oscars', 'met gala', 'trending', 'viral',
  ],
};

export function detectLesediTopic(text: string): LesediTopic | null {
  const lower = text.toLowerCase();
  const scores: Record<LesediTopic, number> = {
    music: 0, books: 0, wine: 0, series: 0, realityTV: 0, celebrities: 0,
  };

  for (const topic of Object.keys(TOPIC_KEYWORDS) as LesediTopic[]) {
    for (const kw of TOPIC_KEYWORDS[topic]) {
      if (lower.includes(kw)) scores[topic]++;
    }
  }

  const best = (Object.keys(scores) as LesediTopic[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  );
  return scores[best] > 0 ? best : null;
}

// ── Persist engagement score per topic ───────────────────────────────────────
export async function trackLesediTopicEngagement(topic: LesediTopic): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TOPIC_SCORES_KEY);
    const scores: Record<LesediTopic, number> = raw
      ? JSON.parse(raw)
      : { music: 1, books: 1, wine: 1, series: 1, realityTV: 1, celebrities: 1 };

    scores[topic] = (scores[topic] ?? 1) + 1;
    await AsyncStorage.setItem(TOPIC_SCORES_KEY, JSON.stringify(scores));
  } catch {}
}

// ── Weighted random topic pick based on engagement ───────────────────────────
async function weightedTopicPick(): Promise<LesediTopic> {
  let scores: Record<LesediTopic, number> = {
    music: 1, books: 1, wine: 1, series: 1, realityTV: 1, celebrities: 1,
  };
  try {
    const raw = await AsyncStorage.getItem(TOPIC_SCORES_KEY);
    if (raw) scores = JSON.parse(raw);
  } catch {}

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const topic of Object.keys(scores) as LesediTopic[]) {
    r -= scores[topic];
    if (r <= 0) return topic;
  }
  return 'series';
}

// ── No-repeat message pick within chosen topic ────────────────────────────────
async function pickMessage(): Promise<string> {
  const topic = await weightedTopicPick();
  const pool  = ALL_LESEDI_MESSAGES.filter((m) => m.topic === topic);
  const total = pool.length;

  const seenKey = `lesedi_nudge_seen_${topic}`;
  let seen: number[] = [];
  try {
    const raw = await AsyncStorage.getItem(seenKey);
    seen = raw ? JSON.parse(raw) : [];
  } catch {}

  if (seen.length >= total) seen = [];

  const available = Array.from({ length: total }, (_, i) => i).filter((i) => !seen.includes(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  seen.push(idx);
  await AsyncStorage.setItem(seenKey, JSON.stringify(seen));

  return pool[idx].message;
}

// ── Random fire time 10:00–20:00 ──────────────────────────────────────────────
function getFireTime(): Date {
  const now  = new Date();
  const fire = new Date();
  fire.setHours(10, Math.floor(Math.random() * 600), 0, 0);
  if (now >= fire) fire.setDate(fire.getDate() + 1);
  return fire;
}

// ── Public: schedule once per day ────────────────────────────────────────────
export async function scheduleLesediDailyNudge(userName = '', gender = ''): Promise<void> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const lastDate = await AsyncStorage.getItem(LAST_SCHEDULED_KEY);
    if (lastDate === todayString()) return;

    const prevId = await AsyncStorage.getItem(NOTIF_ID_KEY);
    if (prevId) await Notifications.cancelScheduledNotificationAsync(prevId).catch(() => {});

    const raw      = await pickMessage();
    const message  = personalizeForUser(raw, userName, gender);
    const fireTime = getFireTime();

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Lesedi 💕',
        body: message,
        sound: true,
        data: { screen: 'girlTalk' },
      },
      trigger: { type: 'date', date: fireTime } as any,
    });

    await AsyncStorage.multiSet([
      [NOTIF_ID_KEY, id],
      [LAST_SCHEDULED_KEY, todayString()],
    ]);
  } catch {}
}
