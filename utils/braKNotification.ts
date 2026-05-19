import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { ALL_BRAK_MESSAGES, BraKTopic } from '../constants/braKMessages';

const LAST_SCHEDULED_KEY  = 'brak_nudge_date';
const NOTIF_ID_KEY        = 'brak_nudge_id';
const SEEN_INDICES_KEY    = 'brak_nudge_seen';
const TOPIC_SCORES_KEY    = 'brak_topic_scores';

const todayString = () => new Date().toISOString().slice(0, 10);

// Swap male salutations for the user's name when the user is female
function personalizeForUser(message: string, userName: string, gender: string): string {
  if (gender === 'mom') {
    const name = userName || 'friend';
    return message
      .replace(/\bBra\b(?!\s+K)/g, name)  // "bra" but not "Bra K"
      .replace(/\bbro\b/gi, name);
  }
  return message;
}

// ── Keyword-based topic detection ─────────────────────────────────────────────
const TOPIC_KEYWORDS: Record<BraKTopic, string[]> = {
  soccer: [
    'football', 'soccer', 'psl', 'epl', 'premier league', 'champions league',
    'bafana', 'goal', 'match', 'league', 'log table', 'fixture', 'referee',
    'orlando pirates', 'kaizer chiefs', 'mamelodi sundowns', 'amakhosi', 'bucs',
    'arsenal', 'chelsea', 'liverpool', 'manchester', 'real madrid', 'barcelona',
    'penalty', 'offside', 'stadium', 'transfer',
  ],
  movies: [
    'movie', 'film', 'netflix', 'series', 'watch', 'episode', 'show', 'streaming',
    'cinema', 'hulu', 'disney', 'amazon prime', 'season', 'actor', 'actress',
    'director', 'trailer', 'plot', 'ending', 'binge',
  ],
  music: [
    'music', 'song', 'amapiano', 'playlist', 'album', 'artist', 'listen', 'beat',
    'track', 'afrobeats', 'hip hop', 'rap', 'kwaito', 'house music', 'dj', 'genre',
    'lyrics', 'concert', 'vibe', 'tune',
  ],
  banter: [
    'weekend', 'plans', 'stress', 'feeling', 'life', 'work', 'tired', 'bored',
    'laugh', 'funny', 'jokes', 'crazy', 'advice', 'thinking',
  ],
};

export function detectTopic(text: string): BraKTopic | null {
  const lower = text.toLowerCase();
  const scores: Record<BraKTopic, number> = { soccer: 0, movies: 0, music: 0, banter: 0 };

  for (const topic of Object.keys(TOPIC_KEYWORDS) as BraKTopic[]) {
    for (const kw of TOPIC_KEYWORDS[topic]) {
      if (lower.includes(kw)) scores[topic]++;
    }
  }

  const best = (Object.keys(scores) as BraKTopic[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  );
  return scores[best] > 0 ? best : null;
}

// ── Persist engagement score per topic ───────────────────────────────────────
export async function trackTopicEngagement(topic: BraKTopic): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TOPIC_SCORES_KEY);
    const scores: Record<BraKTopic, number> = raw
      ? JSON.parse(raw)
      : { soccer: 1, movies: 1, music: 1, banter: 1 }; // start equal

    scores[topic] = (scores[topic] ?? 1) + 1;
    await AsyncStorage.setItem(TOPIC_SCORES_KEY, JSON.stringify(scores));
  } catch {}
}

// ── Weighted random topic pick based on engagement ───────────────────────────
async function weightedTopicPick(): Promise<BraKTopic> {
  let scores: Record<BraKTopic, number> = { soccer: 1, movies: 1, music: 1, banter: 1 };
  try {
    const raw = await AsyncStorage.getItem(TOPIC_SCORES_KEY);
    if (raw) scores = JSON.parse(raw);
  } catch {}

  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const topic of Object.keys(scores) as BraKTopic[]) {
    r -= scores[topic];
    if (r <= 0) return topic;
  }
  return 'banter';
}

// ── No-repeat message pick within chosen topic ────────────────────────────────
async function pickMessage(): Promise<string> {
  const topic = await weightedTopicPick();

  const pool = ALL_BRAK_MESSAGES.filter((m) => m.topic === topic);
  const total = pool.length;

  let seen: number[] = [];
  const seenKey = `${SEEN_INDICES_KEY}_${topic}`;
  try {
    const raw = await AsyncStorage.getItem(seenKey);
    seen = raw ? JSON.parse(raw) : [];
  } catch {}

  if (seen.length >= total) seen = []; // reset cycle for this topic

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
export async function scheduleBraKDailyNudge(userName = '', gender = ''): Promise<void> {
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
        title: 'Bra K 🤜🤛',
        body: message,
        sound: true,
        data: { screen: 'braK' },
      },
      trigger: { type: 'date', date: fireTime } as any,
    });

    await AsyncStorage.multiSet([
      [NOTIF_ID_KEY, id],
      [LAST_SCHEDULED_KEY, todayString()],
    ]);
  } catch {}
}
