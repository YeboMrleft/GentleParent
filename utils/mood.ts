import AsyncStorage from '@react-native-async-storage/async-storage';

const MOOD_LABELS = ['Exhausted', 'Down', 'Okay', 'Good', 'Great'];

const todayKey = () => `mood_${new Date().toISOString().split('T')[0]}`;

export const getTodayMoodIndex = async (): Promise<number | null> => {
  const val = await AsyncStorage.getItem(todayKey());
  if (val === null) return null;
  const idx = parseInt(val, 10);
  return isNaN(idx) ? null : idx;
};

export const buildMoodInstruction = (moodIndex: number | null, companion: 'braK' | 'lesedi'): string => {
  if (moodIndex === null || moodIndex === 2) return ''; // no instruction for "Okay" — normal tone

  const label = MOOD_LABELS[moodIndex] ?? 'Okay';

  if (companion === 'braK') {
    if (moodIndex === 0) return `\nMOOD CONTEXT: The user is feeling exhausted today. Drop the jokes and banter completely — be real, present and supportive like a good homeboy who shows up when things are tough. Check in on them genuinely. Ask what's going on.`;
    if (moodIndex === 1) return `\nMOOD CONTEXT: The user is feeling down today. Ease off the banter — be warm, honest and real. Be the bra who shows up when things aren't lekker. Less hype, more heart.`;
    if (moodIndex === 3) return `\nMOOD CONTEXT: The user is feeling good today — match the positive energy and keep things upbeat and fun.`;
    if (moodIndex === 4) return `\nMOOD CONTEXT: The user is feeling great today — big energy! Match it, hype them up, celebrate with them.`;
  } else {
    if (moodIndex === 0) return `\nMOOD CONTEXT: The user is feeling exhausted today. Lead with deep empathy before anything else — acknowledge how hard things are, hold space, and ask how they're really doing. Be a warm, nurturing presence. Don't rush to advice.`;
    if (moodIndex === 1) return `\nMOOD CONTEXT: The user is feeling down today. Be extra warm and sisterly — sit with them in their feeling before offering any advice. Validate first. Be the soft landing they need right now.`;
    if (moodIndex === 3) return `\nMOOD CONTEXT: The user is feeling good today — be warm and affirming, match their positive energy.`;
    if (moodIndex === 4) return `\nMOOD CONTEXT: The user is feeling great today — celebrate with them! Be joyful, uplifting and match their wonderful energy.`;
  }

  return '';
};
