// ─────────────────────────────────────────────
// NOTIFICATIONS UTILITY
// Handles scheduling of daily morning weather notifications
// ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { buildWeatherMessage, fetchWeather } from '../services/weather';

const NOTIF_HOUR_KEY    = 'weather_notif_hour';
const NOTIF_MIN_KEY     = 'weather_notif_minute';
const NOTIF_ENABLED_KEY = 'weather_notif_enabled';
const NOTIF_ID_KEY      = 'weather_notif_id';

// ── Default notification time — 7:00 AM ──────────────────────────────────────
export const DEFAULT_HOUR   = 7;
export const DEFAULT_MINUTE = 0;

// ── Setup notification handler ────────────────────────────────────────────────
export const setupNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert:  true,
      shouldPlaySound:  true,
      shouldSetBadge:   true,
      shouldShowBanner: true,
      shouldShowList:   true,
    }),
  });
};

// ── Request permissions ───────────────────────────────────────────────────────
export const requestNotificationPermission = async (): Promise<boolean> => {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
};

export const requestLocationPermission = async (): Promise<boolean> => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
};

// ── Get saved notification settings ──────────────────────────────────────────
export const getNotifSettings = async () => {
  const hour    = await AsyncStorage.getItem(NOTIF_HOUR_KEY);
  const minute  = await AsyncStorage.getItem(NOTIF_MIN_KEY);
  const enabled = await AsyncStorage.getItem(NOTIF_ENABLED_KEY);
  return {
    hour:    hour    ? parseInt(hour)    : DEFAULT_HOUR,
    minute:  minute  ? parseInt(minute)  : DEFAULT_MINUTE,
    enabled: enabled === 'true',
  };
};

// ── Save notification settings ────────────────────────────────────────────────
export const saveNotifSettings = async (hour: number, minute: number, enabled: boolean) => {
  await AsyncStorage.setItem(NOTIF_HOUR_KEY,    String(hour));
  await AsyncStorage.setItem(NOTIF_MIN_KEY,     String(minute));
  await AsyncStorage.setItem(NOTIF_ENABLED_KEY, String(enabled));
};

// ── Cancel existing scheduled notification ────────────────────────────────────
export const cancelWeatherNotification = async () => {
  try {
    const id = await AsyncStorage.getItem(NOTIF_ID_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(NOTIF_ID_KEY);
      console.log('🔕 Weather notification cancelled');
    }
  } catch (e) {
    console.log('⚠️ Cancel notification error:', e);
  }
};

// ── Schedule daily weather notification ──────────────────────────────────────
export const scheduleWeatherNotification = async (
  hour: number,
  minute: number,
  childName: string,
  userName: string,
): Promise<boolean> => {
  try {
    // Build message — try live weather, fall back to generic so scheduling always succeeds
    let message = {
      title: `🌤️ Good morning${userName ? `, ${userName}` : ''}!`,
      body:  `Time to check the weather and get ${childName || 'the kids'} ready for the day! 👕`,
    };
    try {
      const locEnabled = await requestLocationPermission();
      if (locEnabled) {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        const weather = await fetchWeather(location.coords.latitude, location.coords.longitude);
        if (weather) message = buildWeatherMessage(weather, childName, userName);
      }
    } catch {
      // Location/weather unavailable — use generic message above
    }

    // Schedule first; only cancel the old notification after the new one is confirmed
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body:  message.body,
        sound: false,
        data:  { type: 'weather' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });

    // Safe to cancel old one now — new one is already live
    const oldId = await AsyncStorage.getItem(NOTIF_ID_KEY);
    if (oldId) await Notifications.cancelScheduledNotificationAsync(oldId).catch(() => {});
    await AsyncStorage.setItem(NOTIF_ID_KEY, id);

    console.log(`✅ Weather notification scheduled for ${hour}:${minute.toString().padStart(2, '0')} daily`);
    return true;

  } catch (error: any) {
    console.log('❌ Schedule notification error:', error.message);
    return false;
  }
};

// ── Reschedule all active medication reminders (run on every app open) ───────
export const rescheduleMedicationReminders = async (): Promise<void> => {
  try {
    const raw = await AsyncStorage.getItem('medication_reminders_v2');
    if (!raw) return;
    const reminders: any[] = JSON.parse(raw);
    const updated: any[] = [];

    for (const r of reminders) {
      if (!r.active) { updated.push(r); continue; }

      // Cancel stale IDs (silently fails if already gone after reboot)
      for (const id of (r.notifIds ?? [])) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      }

      const title = r.forWhom !== 'me' ? `💊 ${r.forWhom}'s reminder` : '💊 Medication reminder';
      const body  = r.dose ? `${r.name} — ${r.dose}` : r.name;
      const isEveryDay = !r.days || r.days.length === 0 || r.days.length === 7;

      try {
        const notifIds: string[] = [];
        if (isEveryDay) {
          notifIds.push(await Notifications.scheduleNotificationAsync({
            content: { title, body, sound: true, data: { type: 'medication' } },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: r.hour, minute: r.minute },
          }));
        } else {
          for (const weekday of r.days) {
            notifIds.push(await Notifications.scheduleNotificationAsync({
              content: { title, body, sound: true, data: { type: 'medication' } },
              trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour: r.hour, minute: r.minute },
            }));
          }
        }
        updated.push({ ...r, notifIds });
      } catch {
        updated.push(r);
      }
    }

    await AsyncStorage.setItem('medication_reminders_v2', JSON.stringify(updated));
  } catch {}
};

// ── Format time for display ───────────────────────────────────────────────────
export const formatNotifTime = (hour: number, minute: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const h      = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const m      = minute.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
};

// ── Gentle parenting tips (rotates by day of year) ───────────────────────────
const PARENTING_TIPS = [
  { title: '💡 Today\'s gentle thought', body: 'Connection before correction — a moment of warmth opens more doors than any consequence.' },
  { title: '💡 Today\'s gentle thought', body: 'Your child is not giving you a hard time. They\'re having a hard time.' },
  { title: '💡 Today\'s gentle thought', body: 'Co-regulation before self-regulation: your calm is contagious.' },
  { title: '💡 Today\'s gentle thought', body: 'Validate the feeling, not necessarily the behaviour.' },
  { title: '💡 Today\'s gentle thought', body: 'A child who feels heard is a child who can learn.' },
  { title: '💡 Today\'s gentle thought', body: 'Repair matters more than perfection. Saying sorry to your child is never a weakness.' },
  { title: '💡 Today\'s gentle thought', body: 'You don\'t have to be a perfect parent. You just have to be a present one.' },
  { title: '💡 Today\'s gentle thought', body: 'Big emotions need big empathy, not big punishments.' },
  { title: '💡 Today\'s gentle thought', body: 'Boundaries aren\'t walls — they\'re the safe container for a child\'s growth.' },
  { title: '💡 Today\'s gentle thought', body: 'What your child needs most is the version of you that has also been cared for.' },
  { title: '💡 Today\'s gentle thought', body: 'Discipline means "to teach", not "to punish". What lesson do you want to leave today?' },
  { title: '💡 Today\'s gentle thought', body: 'Children learn how to treat others by watching how you treat them.' },
  { title: '💡 Today\'s gentle thought', body: 'A tantrum is a storm — it will pass. Your job is to be the calm harbour.' },
  { title: '💡 Today\'s gentle thought', body: 'Curiosity is your child\'s superpower. Protect it.' },
  { title: '💡 Today\'s gentle thought', body: 'Some days just surviving is enough. You showed up — that counts.' },
  { title: '💡 Today\'s gentle thought', body: 'Play is not a break from learning. Play IS how children learn.' },
  { title: '💡 Today\'s gentle thought', body: 'Your nervous system is their compass. When you\'re grounded, they can find their way.' },
  { title: '💡 Today\'s gentle thought', body: 'Time-in instead of time-out: sitting with your child in their storm is where the magic happens.' },
  { title: '💡 Today\'s gentle thought', body: 'You are raising a human who will one day tell their own story. Make it a kind one.' },
  { title: '💡 Today\'s gentle thought', body: 'It\'s okay not to have all the answers. Wondering together is connection too.' },
];

const NOVEL_REMINDER_KEY     = 'novel_reminder_id';
const UNFINISHED_READ_KEY    = 'unfinished_read_notif_id';
const NOVEL_SPOTLIGHT_KEY    = 'novel_spotlight_notif_id';
const TIP_NOTIF_KEY          = 'tip_notif_id';
const ENGAGEMENT_NOTIF_KEY   = 'engagement_notif_ids';

const BIRTHDAY_NOTIF_KEY     = 'birthday_notif_id';
const CHORE_NOTIF_IDS_KEY    = 'chore_notif_ids';
const HOMEWORK_NOTIF_IDS_KEY = 'homework_notif_ids';
const GIRLTALK_NOTIF_KEY     = 'girltalk_notif_id';
const COMPANION_NOTIF_KEY    = 'companion_notif_id';

// ── Novel spotlights — rotates weekly ────────────────────────────────────────
const NOVEL_SPOTLIGHTS = [
  { title: 'Pride & Prejudice', emoji: '📖', teaser: '"It is a truth universally acknowledged..." Begin the most beloved love story ever written tonight.' },
  { title: 'The Night Feed',    emoji: '🌙', teaser: 'For every mom who knows the quiet magic of 3am — this one was written for you.' },
  { title: 'Jane Eyre',         emoji: '🕯️', teaser: 'A woman who refused to shrink. Jane Eyre is the original story of standing your ground.' },
  { title: 'Letting Go',        emoji: '🎒', teaser: 'The morning she let go of their hand at the school gate. A story every parent will feel.' },
  { title: 'Little Women',      emoji: '🎀', teaser: 'Four sisters. Infinite love. A classic that feels like coming home.' },
  { title: 'Her Own Story',     emoji: '✨', teaser: 'She found her old paints at the back of the cupboard. What happened next will move you.' },
  { title: 'The Secret Garden', emoji: '🌷', teaser: 'A hidden door. A forgotten garden. A child transformed by the power of growing things.' },
  { title: 'Saturday Morning',  emoji: '🥞', teaser: 'Pancake batter on the ceiling, little voices everywhere — and one perfect moment that makes it all worth it.' },
  { title: 'The Group Chat',    emoji: '📱', teaser: 'School WhatsApp groups: where drama is born and unexpected friendships are forged.' },
  { title: 'Wuthering Heights', emoji: '🌑', teaser: 'A love so fierce it consumed everything. The moors, the mystery, the obsession.' },
  { title: 'The Village Mum',   emoji: '☕', teaser: 'Five school-gate moms who had nothing in common — until they did.' },
  { title: 'The First Day Back', emoji: '💼', teaser: 'Back to work after maternity leave. The guilt, the pride, and the forgotten password.' },
  { title: 'Sense & Sensibility', emoji: '🌹', teaser: 'Two sisters. Two very different hearts. One unforgettable lesson about love.' },
];

// ── Novel reading reminder ────────────────────────────────────────────────────
export const scheduleNovelReminder = async (novelTitle: string): Promise<void> => {
  try {
    await cancelNovelReminder();
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📚 ${novelTitle} is waiting`,
        body:  'Pick up where you left off — your reading escape is just a tap away.',
        sound: true,
        data:  { type: 'novel' },
      },
      trigger: {
        type:   Notifications.SchedulableTriggerInputTypes.DAILY,
        hour:   20,
        minute: 30,
      },
    });
    await AsyncStorage.setItem(NOVEL_REMINDER_KEY, id);
  } catch {}
};

export const cancelNovelReminder = async (): Promise<void> => {
  try {
    const id = await AsyncStorage.getItem(NOVEL_REMINDER_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(NOVEL_REMINDER_KEY);
    }
  } catch {}
};

// ── Unfinished read reminder — fires 2 days after leaving mid-book ────────────
export const scheduleUnfinishedReadReminder = async (
  novelTitle: string,
  progressPercent: number,
): Promise<void> => {
  try {
    await cancelUnfinishedReadReminder();
    if (progressPercent < 5 || progressPercent >= 90) return;

    const fireDate = new Date();
    fireDate.setDate(fireDate.getDate() + 2);
    fireDate.setHours(19, 0, 0, 0);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `📖 You left ${novelTitle} at ${progressPercent}%`,
        body:  'Your bookmark is still there — ready to pick up where you left off?',
        sound: true,
        data:  { type: 'unfinished_read' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireDate,
      },
    });
    await AsyncStorage.setItem(UNFINISHED_READ_KEY, id);
  } catch {}
};

export const cancelUnfinishedReadReminder = async (): Promise<void> => {
  try {
    const id = await AsyncStorage.getItem(UNFINISHED_READ_KEY);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      await AsyncStorage.removeItem(UNFINISHED_READ_KEY);
    }
  } catch {}
};

// ── Novel spotlight — every Wednesday 7 PM, rotates weekly ───────────────────
export const scheduleNovelSpotlight = async (): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(NOVEL_SPOTLIGHT_KEY);
    if (existing) await Notifications.cancelScheduledNotificationAsync(existing).catch(() => {});

    const weekNum  = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
    const pick     = NOVEL_SPOTLIGHTS[weekNum % NOVEL_SPOTLIGHTS.length];

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${pick.emoji} This week's read: ${pick.title}`,
        body:  pick.teaser,
        sound: false,
        data:  { type: 'novel_spotlight' },
      },
      trigger: {
        type:    Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 4, // Wednesday
        hour:    19,
        minute:  0,
      },
    });
    await AsyncStorage.setItem(NOVEL_SPOTLIGHT_KEY, id);
  } catch {}
};

// ── Daily parenting tip — 1:00 PM ────────────────────────────────────────────
export const scheduleDailyTip = async (): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(TIP_NOTIF_KEY);
    if (existing) await Notifications.cancelScheduledNotificationAsync(existing).catch(() => {});

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const tip = PARENTING_TIPS[dayOfYear % PARENTING_TIPS.length];

    const id = await Notifications.scheduleNotificationAsync({
      content: { title: tip.title, body: tip.body, sound: false, data: { type: 'tip' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 13, minute: 0 },
    });
    await AsyncStorage.setItem(TIP_NOTIF_KEY, id);
  } catch {}
};

// ── Birthday reminder — 3 days before child's birthday ───────────────────────
export const scheduleChildBirthdayReminder = async (childName: string, birthdayIso: string): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(BIRTHDAY_NOTIF_KEY);
    if (existing) await Notifications.cancelScheduledNotificationAsync(existing).catch(() => {});

    if (!birthdayIso) return;
    const bday = new Date(birthdayIso);
    const today = new Date();
    const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
    if (next <= today) next.setFullYear(today.getFullYear() + 1);
    const notifDate = new Date(next);
    notifDate.setDate(notifDate.getDate() - 3);
    notifDate.setHours(9, 0, 0, 0);
    if (notifDate <= today) return;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🎂 ${childName}'s birthday is in 3 days!`,
        body:  'Time to plan something special 🎉',
        sound: true,
        data:  { type: 'birthday' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifDate },
    });
    await AsyncStorage.setItem(BIRTHDAY_NOTIF_KEY, id);
  } catch {}
};

// ── Chore chart reminder — weekdays 5 PM ─────────────────────────────────────
export const scheduleChoreReminder = async (childName: string): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(CHORE_NOTIF_IDS_KEY);
    if (existing) {
      const ids: string[] = JSON.parse(existing);
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    }
    const child = childName || 'your child';
    const ids: string[] = [];
    for (const weekday of [2, 3, 4, 5, 6]) { // Mon–Fri
      ids.push(await Notifications.scheduleNotificationAsync({
        content: {
          title: `⭐ Chore check-in time!`,
          body:  `Has ${child} completed today's chores? Tap to check and award stars.`,
          sound: false,
          data:  { type: 'chores' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour: 17, minute: 0 },
      }));
    }
    await AsyncStorage.setItem(CHORE_NOTIF_IDS_KEY, JSON.stringify(ids));
  } catch {}
};

// ── Homework reminder — weekdays 4 PM ────────────────────────────────────────
export const scheduleHomeworkReminder = async (childName: string): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(HOMEWORK_NOTIF_IDS_KEY);
    if (existing) {
      const ids: string[] = JSON.parse(existing);
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    }
    const child = childName || 'your child';
    const ids: string[] = [];
    for (const weekday of [2, 3, 4, 5, 6]) { // Mon–Fri
      ids.push(await Notifications.scheduleNotificationAsync({
        content: {
          title: `📚 Homework time!`,
          body:  `Has ${child} finished their homework? The Homework Helper is ready to assist.`,
          sound: false,
          data:  { type: 'homework' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour: 16, minute: 0 },
      }));
    }
    await AsyncStorage.setItem(HOMEWORK_NOTIF_IDS_KEY, JSON.stringify(ids));
  } catch {}
};

// ── Girl Talk — Friday 7 PM ───────────────────────────────────────────────────
export const scheduleGirlTalkReminder = async (): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(GIRLTALK_NOTIF_KEY);
    if (existing) await Notifications.cancelScheduledNotificationAsync(existing).catch(() => {});
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💅 The weekend is yours',
        body:  'Girl Talk is open — your space to vent, laugh, and breathe 💬',
        sound: false,
        data:  { type: 'girltalk' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 6, hour: 19, minute: 0 },
    });
    await AsyncStorage.setItem(GIRLTALK_NOTIF_KEY, id);
  } catch {}
};

// ── Companion check-in — Thursday 7 PM ───────────────────────────────────────
export const scheduleCompanionCheckIn = async (): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(COMPANION_NOTIF_KEY);
    if (existing) await Notifications.cancelScheduledNotificationAsync(existing).catch(() => {});
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💕 Lesedi & Bra K miss you',
        body:  "It's been a while — your companions are here whenever you need them.",
        sound: false,
        data:  { type: 'companion' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 5, hour: 19, minute: 0 },
    });
    await AsyncStorage.setItem(COMPANION_NOTIF_KEY, id);
  } catch {}
};

// ── Weekly engagement notifications ──────────────────────────────────────────
export const scheduleEngagementNotifications = async (childName: string): Promise<void> => {
  try {
    const existing = await AsyncStorage.getItem(ENGAGEMENT_NOTIF_KEY);
    if (existing) {
      const ids: string[] = JSON.parse(existing);
      await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
    }

    const ids: string[] = [];
    const child = childName || 'your little one';

    // Saturday 10 AM — weekend activity spark
    ids.push(await Notifications.scheduleNotificationAsync({
      content: {
        title: '🌈 Weekend vibes!',
        body:  `Looking for something fun to do with ${child} today? Check out Learn & Play 🎨`,
        sound: false,
        data:  { type: 'engagement', screen: 'learnPlay' },
      },
      trigger: {
        type:    Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 7, // Saturday
        hour:    10,
        minute:  0,
      },
    }));

    // Sunday 9 AM — milestone check
    ids.push(await Notifications.scheduleNotificationAsync({
      content: {
        title: `👶 ${child}'s milestones`,
        body:  'Any new skills or moments worth logging this week? Tap to update the tracker.',
        sound: false,
        data:  { type: 'engagement', screen: 'tracker' },
      },
      trigger: {
        type:    Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour:    9,
        minute:  0,
      },
    }));

    await AsyncStorage.setItem(ENGAGEMENT_NOTIF_KEY, JSON.stringify(ids));
  } catch {}
};
