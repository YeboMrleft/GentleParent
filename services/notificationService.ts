import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateCompanionFollowUp, getDailyQuote } from './firebase';

// ── Permission ────────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ── Unfinished conversation reminder ─────────────────────────────────────────

const LAST_ACTIVE_KEY = (id: string) => `lastActive_${id}`;
const NOTIF_ID_KEY    = (id: string) => `companionNotifId_${id}`;

const FALLBACK_TITLES: Record<string, string> = {
  lesedi: 'Lesedi is thinking of you 💛',
  brak:   'Bra K checking in 🤝',
};

const FALLBACK_BODIES: Record<string, string> = {
  lesedi: "Hey, how did things go? Come back when you're ready to talk. 💕",
  brak:   "Ey, just checking in on you my guy — come back and let's vibe! 😄",
};

export async function trackConversationActivity(
  companionId: 'lesedi' | 'brak',
  companionName: string,
  lastMessage?: string,
  userName?: string,
  parentGender?: string,
): Promise<void> {
  const now = Date.now();
  await AsyncStorage.setItem(LAST_ACTIVE_KEY(companionId), String(now));

  const existing = await AsyncStorage.getItem(NOTIF_ID_KEY(companionId));
  if (existing) await Notifications.cancelScheduledNotificationAsync(existing);

  const triggerDate = getDecentHourTrigger(now + 24 * 60 * 60 * 1000);

  let body = FALLBACK_BODIES[companionId];
  if (lastMessage) {
    try {
      const aiFollowUp = await generateCompanionFollowUp(companionId, lastMessage, userName, parentGender);
      if (aiFollowUp) body = aiFollowUp;
    } catch {
      // use fallback
    }
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: FALLBACK_TITLES[companionId],
      body,
      data:  { type: 'companion_followup', companionId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  await AsyncStorage.setItem(NOTIF_ID_KEY(companionId), id);
}

function getDecentHourTrigger(timestamp: number): Date {
  const date  = new Date(timestamp);
  const hours = date.getHours();
  if (hours < 8) {
    date.setHours(8, randomMinutes(), 0, 0);
  } else if (hours >= 20) {
    date.setDate(date.getDate() + 1);
    date.setHours(8, randomMinutes(), 0, 0);
  }
  return date;
}

export async function cancelConversationReminder(companionId: string): Promise<void> {
  const id = await AsyncStorage.getItem(NOTIF_ID_KEY(companionId));
  if (id) {
    await Notifications.cancelScheduledNotificationAsync(id);
    await AsyncStorage.removeItem(NOTIF_ID_KEY(companionId));
  }
}

// ── Daily motivation quote ─────────────────────────────────────────────────────

const DAILY_QUOTE_KEY  = 'dailyQuoteNotifId';
const DAILY_QUOTE_DATE = 'dailyQuoteDate';

export async function scheduleDailyQuote(): Promise<void> {
  const today    = new Date().toDateString();
  const lastDate = await AsyncStorage.getItem(DAILY_QUOTE_DATE);
  if (lastDate === today) return;

  const oldId = await AsyncStorage.getItem(DAILY_QUOTE_KEY);
  if (oldId) await Notifications.cancelScheduledNotificationAsync(oldId);

  const quote       = await generateMotivationQuote();
  const triggerDate = randomTimeAfter8am();

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🌱 Good morning, parent.',
      body:  quote,
      data:  { type: 'daily_quote', quote },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  await AsyncStorage.setItem(DAILY_QUOTE_KEY,  id);
  await AsyncStorage.setItem(DAILY_QUOTE_DATE, today);
}

async function generateMotivationQuote(): Promise<string> {
  const theme = getDayTheme();
  try {
    const quote = await getDailyQuote(theme);
    return quote ?? fallbackQuote();
  } catch {
    return fallbackQuote();
  }
}

const QUOTE_THEMES = [
  'patience', 'connection', 'self-care', 'resilience', 'play',
  'emotions', 'boundaries', 'gratitude', 'rest', 'growth',
];

function getDayTheme(): string {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return QUOTE_THEMES[dayOfYear % QUOTE_THEMES.length];
}

function fallbackQuote(): string {
  const quotes = [
    // Patience
    "Yoh, parenting is not for the faint-hearted. But you're still here. That's everything. 💪",
    "Deep breath. The tantrum will pass. You will survive. Tea helps. ☕",
    "You didn't lose it today when you easily could have. That's called growth, ntwana.",
    "Slow down. Your child is not an emergency to be managed — they're a person to be known.",
    "When you choose calm over chaos, you rewrite the script your child will carry forever.",
    // Connection
    "Put the phone down for 10 minutes. Your child is watching to see if they matter more than a screen.",
    "You are your child's whole world. Not a perfect world — the real one. That's better. 🌍",
    "A hug right now fixes more than you think it does.",
    "Show up. Show up messy, tired, unsure. Just show up. That's the whole secret.",
    "Your child will remember the moments you stopped and listened — not the ones you were busy. 💛",
    // Self-care
    "Sis / Bra — when last did you rest? Like actually rest? Schedule it. Today.",
    "You can't pour from an empty cup, and you can't run on fumes forever. Rest is the work.",
    "Mom guilt / Dad guilt is real. So is the fact that you're doing your absolute best.",
    "Taking a break makes you a better parent, not a worse one. Write that down. 📝",
    "You matter too. Not just as a parent — as a person. Don't forget that. 💅",
    // Resilience
    "Eish, yesterday was rough. Today is a new page. You've got this. 🌱",
    "You are not failing. You are learning in real time with no instruction manual. Big difference.",
    "Repair is the superpower. Went too hard? Go back, say sorry, reconnect. That's the move.",
    "Every hard season you walk through teaches your child that hard seasons end.",
    "You don't have to be perfect. You just have to keep going. Keep going.",
    // Play
    "Get on the floor. Be ridiculous. It costs nothing and it means everything. 🎉",
    "Laughter is the cheapest therapy for the whole family. Find something silly today.",
    "Play is not extra — it's the main event for little ones. Join in.",
    "Your child doesn't need the best toys. They need you, unrushed and fully there. ✨",
    "Chaos and creativity are basically the same thing at this age. Embrace it. 😄",
    // Emotions
    "Big feelings in a little body — they need you to stay regulated so they can borrow your calm.",
    "Don't try to logic a toddler out of a meltdown. Just stay close. Presence is the medicine.",
    "Name the feeling out loud: 'You're really frustrated right now.' Watch how it helps.",
    "Your child is not giving you a hard time. They're having a hard time. Massive difference. 💛",
    "Feelings are not a problem to be fixed. They are a child asking to be understood.",
    // Boundaries
    "Kind AND firm — you can be both. In fact, that's the whole formula.",
    "Saying no with love is still love. Don't let anyone tell you otherwise.",
    "Gentle parenting is not letting them run wild. It's raising a child who knows why the rules exist.",
    "Consistent boundaries = safe child. You're not being mean. You're building trust.",
    // Gratitude
    "Catch your child doing something right today and shout it out. Watch their face. 🌟",
    "The bath, the story, the goodnight kiss — that's the stuff they'll remember. It's enough.",
    "Your ordinary day is their entire childhood. It's already beautiful.",
    "Shame, these kids are something else hey. And you get to be their person. 💕",
    // Rest
    "Rest is not laziness. It is the strategy. Tired parents make harder decisions.",
    "You are allowed to have a bad day. You are still a great parent. Both can be true.",
    "If you have to choose between one more chore and 20 minutes of sleep — sleep wins.",
    // Growth
    "You and your child are growing at the same time. Give yourself the same grace you give them.",
    "The version of you that's reading this is already better than you think. Keep going. 🌱",
    "Who you are becoming matters just as much as what you're doing. The work is inside too.",
    "Small, consistent moments of love. That's the whole recipe. You're already cooking. 🍳",
  ];
  const start = new Date(new Date().getFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start.getTime()) / 86_400_000);
  return quotes[dayOfYear % quotes.length];
}

function randomTimeAfter8am(): Date {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minutesAfter8 = Math.floor(Math.random() * 240);
  today.setHours(8, minutesAfter8, 0, 0);
  if (today <= now) {
    today.setDate(today.getDate() + 1);
    today.setHours(8, Math.floor(Math.random() * 240), 0, 0);
  }
  return today;
}

function randomMinutes(): number {
  return Math.floor(Math.random() * 60);
}
