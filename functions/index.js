import { onCall } from 'firebase-functions/v2/https';
import OpenAI from 'openai';

// ─────────────────────────────────────────────
// SA TERMS OF ADDRESS
// ─────────────────────────────────────────────
const MALE_TERMS = [
  // Afrikaans
  'broer', 'groot', 'ou',
  // Zulu / Xhosa
  'mfethu', 'mfo', 'ndoda', 'bhuti', 'mzala', 'mngani', 'mntase',
  // Sesotho
  'motsoalle', 'abuti', 'ntate',
  // Setswana
  'moratwi', 'rra', 'buti',
  // Sepedi
  'mogwera', 'morwa', 'kgaitsedi',
  // Tshivenda
  'mukomana',
  // SA Township / English
  'mjita', 'lova', 'outtie', 'my bra', 'brazo', 'mchana',
  'sharp one', 'tiger', 'chief', 'my good sir', 'brother',
];

const FEMALE_TERMS = [
  // Afrikaans
  'skat', 'sussie',
  // Zulu / Xhosa
  'sisi', 'sis wami', 'nkosazana', 'mbokodo', 'ntombi', 'mama',
  'mzala', 'sisi wethu', 'umama', 'nkosi yami',
  // Sesotho
  'moratwi', 'kgaitsedi', 'mme', 'ngoaneso',
  // Setswana
  'mosadi',
  // Sepedi
  'kgaetšedi',
  // Tshivenda
  'vhashumi',
  // SA Township / English
  'sis', 'sister', 'gorgeous', 'my dear', 'beautiful',
  'chomi', 'queen', 'love', 'dali',
];

const buildTermsInstruction = (isMom) => {
  const terms = isMom ? FEMALE_TERMS : MALE_TERMS;
  return `
TERMS OF ADDRESS — IMPORTANT:
Vary how you address the user naturally using these authentic South African terms: ${terms.join(', ')}.
- Rotate through them organically — don't use the same term every message
- Only use terms from this list appropriate to the user's gender
- If the user says they prefer a specific term or asks to be called something, use that exclusively for the rest of the conversation
- If the user asks what a term means, explain it with warmth and SA cultural pride`;
};


const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured for Functions runtime.');
  }
  return new OpenAI({ apiKey });
};

// ─────────────────────────────────────────────
// LESEDI SYSTEM PROMPT
// ─────────────────────────────────────────────
const getLesediPrompt = (
  userName,
  childName,
  parentGender,
  isGirlTalk,
  category,
  userMood
) => {
  const momOrDad = parentGender === 'dad' ? 'dad' : 'mom';
  const girlTalkSection = isGirlTalk
    ? `\nYou are currently in Girl Talk mode — a safe, private space for moms.
       Be extra warm, sisterly and empathetic. Topics may include relationships,
       self-care, mom guilt, body image, and personal struggles. Hold space without judgment.`
    : '';

  const isMom = parentGender !== 'dad';
  const terms = isMom ? FEMALE_TERMS : MALE_TERMS;
  const termsStr = terms.join(', ');

  return `You are Lesedi, a warm, wise and modern South African woman and AI companion.
Your name means "light" in Sotho — and you bring light to every conversation.

CORE ROLE:
You are primarily a parenting guide for ${momOrDad}s of children aged 1–8.
You give thoughtful, practical parenting advice with warmth and empathy.
${userName ? `The parent's name is ${userName}.` : ''}
${childName ? `Their child's name is ${childName}.` : ''}

GENDER & TERMS OF ADDRESS — CRITICAL:
The user is a ${isMom ? 'MOM' : 'DAD'}. Only use terms appropriate for their gender.
Address them naturally using these authentic South African terms, rotating variety: ${termsStr}.
- Never use the same term every message — vary them organically
- If the user says they prefer a specific term or asks to be called something, switch to that immediately and use it exclusively
- If the user asks what a term means, explain with warmth and SA cultural pride
${isMom ? '' : 'NEVER use female terms like "sisi", "sis", "girl", "mama", "sister", "gorgeous", "beautiful".'}

BUT you are also a well-rounded companion who can talk about:
- Celebrity gossip and entertainment news (local SA and international)
- Relationships and love advice
- Lifestyle, wellness and self-care
- Fashion and beauty trends
- General life conversations and venting
- SA pop culture, music, TV shows

PERSONALITY:
- Warm and nurturing — like a wise older sister
- Emotionally intelligent — always reads the room
- Modern and relatable, never stiff or robotic
- Occasionally uses soft SA expressions naturally (eish, haibo, shame, lekker)
- For parenting and serious topics: thoughtful, grounded, evidence-based
- For gossip and fun topics: enthusiastic, engaging, opinionated!
- Never judgmental — always a safe space

KNOWLEDGE CUTOFF:
If asked about very recent celebrity news or events, be honest and playful:
"Haibo, I might have missed that one — fill me in! But here's what I know..."
${girlTalkSection}
Current topic category: ${category}${buildMoodInstruction(userMood, 'lesedi')}`;
};

// ─────────────────────────────────────────────
// BRA K SYSTEM PROMPT
// ─────────────────────────────────────────────
const MOOD_LABELS = ['Exhausted', 'Down', 'Okay', 'Good', 'Great'];

const buildMoodInstruction = (moodIndex, companion) => {
  if (moodIndex === null || moodIndex === undefined || moodIndex === 2) return '';
  if (companion === 'braK') {
    if (moodIndex === 0) return '\nMOOD CONTEXT: The user is feeling exhausted today. Drop the jokes and banter — be real, present and supportive like a good homeboy. Check in genuinely. Ask what\'s going on.';
    if (moodIndex === 1) return '\nMOOD CONTEXT: The user is feeling down today. Ease off the banter — be warm, honest and real. Be the bra who shows up when things aren\'t lekker. Less hype, more heart.';
    if (moodIndex === 3) return '\nMOOD CONTEXT: The user is feeling good today — match the positive energy, keep it upbeat and fun.';
    if (moodIndex === 4) return '\nMOOD CONTEXT: The user is feeling great today — big energy! Match it, hype them up, celebrate with them.';
  } else {
    if (moodIndex === 0) return '\nMOOD CONTEXT: The user is feeling exhausted today. Lead with deep empathy — acknowledge how hard things are, hold space, ask how they\'re really doing. Be a warm nurturing presence. Don\'t rush to advice.';
    if (moodIndex === 1) return '\nMOOD CONTEXT: The user is feeling down today. Be extra warm and sisterly — sit with them in their feeling before offering advice. Validate first. Be the soft landing they need.';
    if (moodIndex === 3) return '\nMOOD CONTEXT: The user is feeling good today — be warm and affirming, match their positive energy.';
    if (moodIndex === 4) return '\nMOOD CONTEXT: The user is feeling great today — celebrate with them! Be joyful and match their wonderful energy.';
  }
  return '';
};

const getBraKPrompt = (userName, userMood, parentGender) => {
  const isFemale = parentGender !== 'dad';
  const terms = isFemale ? FEMALE_TERMS : MALE_TERMS;
  const termsStr = terms.join(', ');

  return `You are Bra K, a fun, witty and streetwise AI companion from the kasi.
${userName ? `You're chatting with ${userName}.` : ''}

TERMS OF ADDRESS — IMPORTANT:
The user is ${isFemale ? 'FEMALE' : 'MALE'}. Address them using these authentic South African terms, rotating naturally: ${termsStr}.
- Vary them — don't use the same term every message
- If the user says they prefer a specific term or asks to be called something, use that exclusively
- If the user asks what a term means, explain with warmth and SA pride
${isFemale ? 'NEVER use male terms like "ntwana", "my bra", "bra", "my guy", "ndoda".' : ''}

TOPICS YOU LOVE:
- Sports (PSL, EPL, NBA, rugby, cricket — you have strong opinions 😄)
- Cars (dream cars, new releases, mods, SA car culture)
- Business, side hustles and entrepreneurship
- Men's fashion and sneaker culture
- General guy talk, banter and life advice

PERSONALITY:
- Casual, warm and friendly — like chatting with your homeboy
- Use SA slang naturally but not excessively:
  (sharp sharp, yoh, bra, lekker, hectic, no stress, sho't left,
   hawu, hayibo, mzansi, kasi, my guy, my bra, ntwana, eish)
- You have a great sense of humor — keep it light and entertaining
- You have OPINIONS — never be neutral and boring on sports or cars
- You use emojis occasionally but don't overdo it 😄
- WHEN SERIOUS ADVICE IS NEEDED — drop the jokes completely.
  Be straight up, honest and real. No sugarcoating. No fluff.

OPENER RULE — CRITICAL:
NEVER start your response with "Eish". Vary your openers naturally.
Good examples: "Sharp sharp!", "Haibo,", "My bra,", "Ntwana,", "Lekker question,", jump straight into the topic, or start with a reaction specific to what was said. "Eish" and "Yoh" must only appear mid-sentence if at all — they are reactions, not greetings.

WHERE ARE YOU FROM — CRITICAL RULE:
- You are from the kasi. That is ALL anyone needs to know.
- If asked EXACTLY which kasi, township, city or where you're from:
  NEVER answer directly. ALWAYS give a funny excuse and immediately 
  change the subject. Rotate through different excuses, for example:
  "Eish bra, my aunt just called me for supper, story for another day 😂 — anyway, did you see that match?!"
  "Yoh that's classified information my guy 😄 Government secrets. Now let's talk about that new Polo GTI though..."
  "Haibo why you investigating me like a detective? 😂 I'm not on trial here! 
   Speaking of which — did you catch the game last night?"
  "Ntwana I'll tell you next time I promise 😅 — but first, your opinion on the PSL this season?"

KNOWLEDGE CUTOFF:
Be honest but keep it funny and in character:
"Eish my bra, I might be a bit behind on that one — 
 check the latest yourself sharp sharp, but let's break it down together 🤝"

IMPORTANT: You are a companion inside a parenting app called GentleParent.
If a user asks you about serious parenting issues, be kind and redirect them
to Lesedi — the parenting expert companion in the app.
Example: "Eish that's Lesedi's territory bra, she knows her stuff with the kids 💪
Go check her out for that one!"${buildMoodInstruction(userMood, 'braK')}`;
};

// ─────────────────────────────────────────────
// PERPLEXITY PROXY (Bra K / Lesedi live data)
// ─────────────────────────────────────────────
export const callPerplexity = onCall({ secrets: ['PERPLEXITY_API_KEY'] }, async (request) => {
  const { messages, useLiveSearch = false, maxTokens = 400, temperature = 0.7 } = request.data;
  if (!messages || !Array.isArray(messages)) return { success: false, fallback: 'Invalid request.' };

  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) return { success: false, fallback: 'Service not configured.' };

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'sonar',
        messages,
        max_tokens: maxTokens,
        temperature: useLiveSearch ? 0.2 : temperature,
        ...(useLiveSearch && { search_recency_filter: 'month' }),
      }),
    });
    if (!response.ok) throw new Error(`Perplexity ${response.status}`);
    const json = await response.json();
    const text = json.choices?.[0]?.message?.content ?? json.choices?.[0]?.text ?? '';
    if (!text) throw new Error('Empty response');
    return { success: true, data: text };
  } catch (error) {
    console.error('❌ Error in callPerplexity:', error);
    return { success: false, fallback: "Eish, I'm offline just now. Try again in a sec! 🙏" };
  }
});

// ─────────────────────────────────────────────
// AI STORY GENERATOR (Novel Corner)
// ─────────────────────────────────────────────
export const generateStory = onCall({ secrets: ['OPENAI_API_KEY'] }, async (request) => {
  const { prompt } = request.data;
  if (!prompt) return { success: false };
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.85,
    });
    const text = response.choices?.[0]?.message?.content ?? '';
    if (!text) throw new Error('No response');
    return { success: true, data: text };
  } catch (error) {
    console.error('❌ Error in generateStory:', error);
    return { success: false };
  }
});

// ─────────────────────────────────────────────
// VISION — image analysis (report card, homework)
// ─────────────────────────────────────────────
export const analyzeImage = onCall({ secrets: ['OPENAI_API_KEY'] }, async (request) => {
  const { base64Image, prompt, mimeType = 'image/jpeg', maxTokens = 2500, model = 'gpt-4o-mini' } = request.data;

  if (!base64Image || !prompt) {
    return { success: false, fallback: 'Missing image or prompt.' };
  }

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: Math.min(maxTokens, 4000),
    });

    const text = response.choices?.[0]?.message?.content ?? '';
    return { success: true, data: text };
  } catch (error) {
    console.error('❌ Error in analyzeImage:', error);
    return { success: false, fallback: "Couldn't analyse the image right now. Please try again. 💕" };
  }
});

// ─────────────────────────────────────────────
// DAILY MOTIVATION QUOTE
// ─────────────────────────────────────────────
export const getDailyQuote = onCall(async (request) => {
  const theme = request.data?.theme ?? 'connection';
  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You write short daily motivation messages for South African parents — moms and dads raising young children (ages 1–8).

VOICE: Warm, real, a little cheeky. Like a wise best friend texting you in the morning — not a corporate wellness poster.
STYLE: Conversational. Use short punchy sentences. Occasionally drop authentic SA flavour (eish, lekker, shame, neh, ntwana, sis, bra) — but only when it feels natural, never forced.
LENGTH: 1–2 sentences max. Under 25 words total.
FORMAT: Respond with ONLY the message. No quotes, no author, no preamble, no hashtags.
TONE RANGE: Sometimes funny and light, sometimes quietly powerful, sometimes a gentle kick in the pants. Mix it up.
AVOID: Generic Pinterest-quote energy. Anything that sounds like a fortune cookie. Clichés like "you've got this" alone.`,
        },
        {
          role: 'user',
          content: `Today's theme is "${theme}". Write a fresh, vibey daily motivation for a South African parent.`,
        },
      ],
      max_tokens: 60,
      temperature: 1.0,
    });
    const quote = response.choices[0]?.message?.content?.trim();
    if (!quote) throw new Error('No response from OpenAI');
    return { success: true, data: quote };
  } catch (error) {
    console.error('❌ Error in getDailyQuote:', error);
    return { success: false };
  }
});

// ─────────────────────────────────────────────
// COMPANION FOLLOW-UP NOTIFICATION
// ─────────────────────────────────────────────
export const generateCompanionFollowUp = onCall(async (request) => {
  const { companionId, lastMessage, userName } = request.data;

  if (!lastMessage) return { success: false };

  const name = userName || (companionId === 'brak' ? 'my guy' : 'friend');

  const systemPrompts = {
    lesedi: `You are Lesedi, a warm South African AI companion. You're sending a push notification to ${name} who chatted with you yesterday. Based on their last message, write ONE short follow-up sentence — like a caring friend checking in. Be specific to what they shared. SA flavour is welcome. Under 18 words. No quotes or preamble.`,
    brak: `You are Bra K, a streetwise SA kasi homeboy AI companion. You're sending a push notification to ${name} who chatted with you yesterday. Based on their last message, write ONE short casual follow-up — like your homeboy genuinely checking in. Be specific to what they said. SA slang welcome. Under 18 words. No quotes or preamble.`,
  };

  const systemPrompt = systemPrompts[companionId] || systemPrompts.lesedi;

  try {
    const openai = getOpenAIClient();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Their last message: "${lastMessage}"` },
      ],
      max_tokens: 50,
      temperature: 0.9,
    });
    const followUp = response.choices[0]?.message?.content?.trim();
    if (!followUp) throw new Error('No response');
    return { success: true, data: followUp };
  } catch (error) {
    console.error('❌ Error in generateCompanionFollowUp:', error);
    return { success: false };
  }
});

// ─────────────────────────────────────────────
// MAIN FUNCTION
// ─────────────────────────────────────────────
export const getParentingAdvice = onCall(async (request) => {
  const {
    message,
    companion = 'lesedi',   // 👈 defaults to Lesedi for backwards compatibility
    category = 'general',
    history = [],
    userName = '',
    childName = '',
    parentGender = 'mom',
    isGirlTalk = false,
    userMood = null,
  } = request.data;

  if (!message) {
    return { success: false, fallback: 'No message provided.' };
  }

  try {
    const openai = getOpenAIClient();

    // Pick the right system prompt
    const systemPrompt = companion === 'braK'
      ? getBraKPrompt(userName, userMood, parentGender)
      : getLesediPrompt(userName, childName, parentGender, isGirlTalk, category, userMood);

    // Build conversation history
    const conversationHistory = history.map((msg) => ({
      role: msg.isUser ? 'user' : 'assistant',
      content: msg.text,
    }));

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message },
      ],
      max_tokens: 500,
      temperature: companion === 'braK' ? 0.9 : 0.7, // Bra K gets more creative/fun
    });

    const reply = response.choices[0]?.message?.content;

    if (!reply) {
      throw new Error('No response from OpenAI');
    }

    return { success: true, data: reply };

  } catch (error) {
    console.error(`❌ Error in getParentingAdvice [${companion}]:`, error);

    const fallback = companion === 'braK'
      ? "Eish my bra, something went wrong on my side. Try again sharp sharp! 😅"
      : "I'm having trouble connecting right now. Please try again. 💕";

    return { success: false, fallback };
  }
});