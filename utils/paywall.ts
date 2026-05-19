import AsyncStorage from '@react-native-async-storage/async-storage';

export const COMPANION_MESSAGE_LIMIT = 5;  // Bra K & Lesedi
export const PARENTING_MESSAGE_LIMIT  = 5; // Main parenting chat

// Keep this for any legacy references — points to parenting limit
export const FREE_MESSAGE_LIMIT = PARENTING_MESSAGE_LIMIT;

const COMPANION_COUNT_KEY     = 'companion_message_count';
const PARENTING_COUNT_KEY     = 'parenting_message_count';
const COMPANION_RESET_KEY     = 'companion_message_reset_time';
const PARENTING_RESET_KEY     = 'parenting_message_reset_time';

// Returns e.g. "2025-04-14" for today
const todayString = (): string => new Date().toISOString().slice(0, 10);

// ── Shared: check and apply midnight reset if needed ─────────────────────────
const checkAndReset = async (countKey: string, resetKey: string): Promise<void> => {
  try {
    const lastResetDay = await AsyncStorage.getItem(resetKey);
    const today = todayString();

    if (lastResetDay !== today) {
      await AsyncStorage.setItem(countKey, '0');
      await AsyncStorage.setItem(resetKey, today);
    }
  } catch {}
};

// ── Companion messages (Bra K & Lesedi) ──────────────────────────────────────
export const getCompanionMessageCount = async (): Promise<number> => {
  try {
    await checkAndReset(COMPANION_COUNT_KEY, COMPANION_RESET_KEY);
    const val = await AsyncStorage.getItem(COMPANION_COUNT_KEY);
    return val ? parseInt(val) : 0;
  } catch { return 0; }
};

export const incrementCompanionMessageCount = async (): Promise<number> => {
  try {
    const current = await getCompanionMessageCount();
    await AsyncStorage.setItem(COMPANION_COUNT_KEY, String(current + 1));
    return current + 1;
  } catch { return 0; }
};

export const resetCompanionMessageCount = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(COMPANION_COUNT_KEY, '0');
    await AsyncStorage.setItem(COMPANION_RESET_KEY, todayString());
  } catch {}
};

// ── Parenting messages (main chat) ────────────────────────────────────────────
export const getMessageCount = async (): Promise<number> => {
  try {
    await checkAndReset(PARENTING_COUNT_KEY, PARENTING_RESET_KEY);
    const val = await AsyncStorage.getItem(PARENTING_COUNT_KEY);
    return val ? parseInt(val) : 0;
  } catch { return 0; }
};

export const incrementMessageCount = async (): Promise<number> => {
  try {
    const current = await getMessageCount();
    await AsyncStorage.setItem(PARENTING_COUNT_KEY, String(current + 1));
    return current + 1;
  } catch { return 0; }
};

export const resetMessageCount = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(PARENTING_COUNT_KEY, '0');
    await AsyncStorage.setItem(PARENTING_RESET_KEY, todayString());
  } catch {}
};

// ── Reset all counts (e.g. on logout) ────────────────────────────────────────
export const resetAllMessageCounts = async (): Promise<void> => {
  await Promise.all([resetCompanionMessageCount(), resetMessageCount()]);
};
