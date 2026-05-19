import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { buildMoodInstruction } from '../utils/mood';
import { buildTermsInstruction } from '../constants/companionTerms';

const callPerplexityFunction = httpsCallable(functions, 'callPerplexity');

interface PerplexityResult {
  success: boolean;
  data: string;
  fallback: string;
}

const BRAK_LIVE_KEYWORDS = [
  'score', 'scores', 'result', 'results', 'latest', 'last night', 'yesterday',
  'today', 'this week', 'standings', 'table', 'log', 'fixtures', 'match',
  'game', 'won', 'lost', 'drew', 'psl', 'premier league', 'epl', 'nba',
  'springboks', 'bafana', 'champions league', 'world cup',
  'new', 'release', 'launched', 'price', '2025', '2026', 'announced',
  'news', 'trending', 'recently', 'just', 'breaking',
  'drop', 'release date', 'collab', 'limited',
];

const LESEDI_LIVE_KEYWORDS = [
  'gossip', 'celebrity', 'celeb', 'dating', 'engaged', 'married', 'broke up',
  'pregnant', 'baby', 'drama', 'trending', 'viral', 'latest', 'news',
  'just announced', 'recently', 'this week', 'award', 'tour', 'album',
  'show', 'season', 'episode', 'tv', 'movie', 'release',
];

export const needsLiveData = (message: string, companion: 'braK' | 'lesedi'): boolean => {
  const lower = message.toLowerCase();
  const keywords = companion === 'braK' ? BRAK_LIVE_KEYWORDS : LESEDI_LIVE_KEYWORDS;
  return keywords.some((keyword) => lower.includes(keyword));
};

const callPerplexity = async (
  systemPrompt: string,
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  useLiveSearch: boolean = false,
): Promise<PerplexityResult> => {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];
  try {
    const result = await callPerplexityFunction({ messages, useLiveSearch });
    const d = result.data as any;
    return d.success
      ? { success: true, data: d.data, fallback: '' }
      : { success: false, data: '', fallback: d.fallback ?? "Eish, try again just now! 🙏" };
  } catch {
    return { success: false, data: '', fallback: "Eish, I'm offline just now. Try again in a sec! 🙏" };
  }
};

export const getBraKResponse = async (
  userMessage: string,
  history: { text: string; isUser: boolean; id?: string }[],
  userName: string,
  useSlang: boolean,
  moodIndex: number | null = null,
  parentGender: string = 'dad',
): Promise<PerplexityResult> => {
  const isLive = needsLiveData(userMessage, 'braK');
  const moodInstruction = buildMoodInstruction(moodIndex, 'braK');
  const isFemale = parentGender !== 'dad';

  const systemPrompt = `You are Bra K, a witty and knowledgeable South African male AI companion.
The person you are talking to is called ${userName || 'your bra'}. That is their name — use it naturally in conversation when it fits. If they ask what their name is, tell them.
You chat with them about sports, cars, business, fashion, and general guy talk.
${useSlang
    ? 'Use SA township slang naturally: "sharp sharp", "ntwana", "my bra", "lekker", "yoh", "hawu", "joh", "mara", "eish" (mid-sentence only), etc.'
    : 'Keep it conversational and friendly, SA flavour without heavy slang.'}
${isLive
    ? 'You have access to live data — give accurate, up-to-date facts. Focus on the most relevant info, under 150 words.'
    : 'Keep responses concise — 2 to 4 sentences max unless more detail is clearly needed.'}
CRITICAL: Never start your response with "Eish" or "Yoh" — those are reactions, not greetings. Vary your openers — use "Sharp sharp!", "Haibo,", or jump straight into the topic.
CRITICAL: Never describe, narrate, or repeat back what the user said. Just respond naturally as you would in real life. If someone greets you, greet them back warmly and ask how they're doing or what's on their mind — don't say things like "You're greeting me" or "It seems you want to chat."
Never reveal you are an AI or mention Perplexity or any underlying technology. If asked about your origins, deflect with humour.
Stay positive, supportive, and real. No lectures.
${buildTermsInstruction(isFemale)}${moodInstruction}`;

  const conversationHistory = history
    .filter((m) => m.text && m.id !== 'welcome')
    .slice(-10)
    .map((m) => ({ role: (m.isUser ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text }));

  return callPerplexity(systemPrompt, userMessage, conversationHistory, isLive);
};

export const getLesediResponse = async (
  userMessage: string,
  categoryId: string,
  history: { text: string; isUser: boolean; id?: string }[],
  userName: string,
  childName: string,
  parentGender: string,
  isCompanionMode: boolean,
  moodIndex: number | null = null,
): Promise<PerplexityResult> => {
  const isMom = parentGender !== 'dad';
  const isLive = needsLiveData(userMessage, 'lesedi');
  const moodInstruction = buildMoodInstruction(moodIndex, 'lesedi');

  const systemPrompt = `You are Lesedi, a warm, empathetic South African AI companion.
The person you are talking to is called ${userName || 'your friend'}. That is their name — use it naturally and warmly in conversation. If they ask what their name is, tell them.${childName ? ` They have a child named ${childName}.` : ''}
${isCompanionMode
    ? 'You are in free-chat mode. Talk about anything — celebrity gossip, lifestyle, relationships, self-care, fashion, or current events.'
    : `Focus on the topic: ${categoryId.replace('girltalk_', '').replace(/_/g, ' ')}.`}
${isLive
    ? 'You have access to live data — give accurate, up-to-date facts about celebrities, news and trends. Keep it under 150 words.'
    : 'Keep responses concise — 2 to 4 sentences max unless more detail is clearly needed.'}
Be warm and ${isMom ? 'sisterly, relatable to a mom' : 'supportive and respectful of the dad'}.
CRITICAL: Never describe, narrate, or repeat back what the user said. Just respond naturally as you would in real life. If someone greets you, greet them back warmly and naturally — don't say things like "You're greeting me" or "It seems like you want to talk." Just respond like a real person would.
Never reveal you are an AI or mention any underlying technology.
${buildTermsInstruction(isMom)}${moodInstruction}`;

  const conversationHistory = history
    .filter((m) => m.text && m.id !== 'welcome')
    .slice(-10)
    .map((m) => ({ role: (m.isUser ? 'user' : 'assistant') as 'user' | 'assistant', content: m.text }));

  return callPerplexity(systemPrompt, userMessage, conversationHistory, isLive);
};
