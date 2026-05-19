import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_KEY = (categoryId: string) => `chat_history_${categoryId}`;

export const saveHistory = async (categoryId: string, messages: any[]) => {
  try {
    const trimmed = messages.slice(-30);
    await AsyncStorage.setItem(HISTORY_KEY(categoryId), JSON.stringify(trimmed));
  } catch (e) { console.log('Failed to save history:', e); }
};

export const loadHistory = async (categoryId: string) => {
  try {
    const saved = await AsyncStorage.getItem(HISTORY_KEY(categoryId));
    return saved ? JSON.parse(saved) : null;
  } catch (e) { console.log('Failed to load history:', e); return null; }
};

export const clearHistory = async (categoryId: string) => {
  try { await AsyncStorage.removeItem(HISTORY_KEY(categoryId)); }
  catch (e) { console.log('Failed to clear history:', e); }
};
