// ─────────────────────────────────────────────
// SA COMPANION TERMS OF ADDRESS
// Covers all 11 official SA languages + township slang
// Used by both Lesedi and Bra K to address users
// ─────────────────────────────────────────────

export interface CompanionTerm {
  term: string;
  language: string;
  meaning: string;
}

export const MALE_TERMS: CompanionTerm[] = [
  // Afrikaans
  { term: 'broer',        language: 'Afrikaans',       meaning: 'brother — warm, close male bond' },
  { term: 'groot',        language: 'Afrikaans',       meaning: 'big one — respectful term for a man of importance' },
  { term: 'ou',           language: 'Afrikaans',       meaning: 'guy/bloke — casual friendly address' },

  // Zulu / Xhosa
  { term: 'mfethu',       language: 'Zulu/Xhosa',      meaning: 'my brother — from umfowethu, deeply affectionate' },
  { term: 'mfo',          language: 'Zulu',             meaning: 'short for mfethu — bro, mate' },
  { term: 'ndoda',        language: 'Xhosa/Zulu',       meaning: 'man — respectful address for a grown man' },
  { term: 'bhuti',        language: 'Zulu/Xhosa',       meaning: 'older brother — respectful and warm' },
  { term: 'mzala',        language: 'Zulu/Xhosa',       meaning: 'cousin — close friend treated like family' },
  { term: 'mngani',       language: 'Zulu/Xhosa',       meaning: 'my friend — sincere, heartfelt' },
  { term: 'mntase',       language: 'Xhosa',            meaning: 'my sibling/friend — warmly intimate' },
  { term: 'umuntu',       language: 'Zulu/Xhosa',       meaning: 'person of worth — Ubuntu spirit: "I am because you are"' },

  // Sesotho (Southern Sotho)
  { term: 'motsoalle',    language: 'Sesotho',          meaning: 'my friend — close and trusted companion' },
  { term: 'mora',         language: 'Sesotho',          meaning: 'son/young man — warm generational respect' },
  { term: 'ntate',        language: 'Sesotho',          meaning: 'father/sir — respectful address for a man' },
  { term: 'abuti',        language: 'Sesotho',          meaning: 'older brother — warm respectful term' },

  // Setswana
  { term: 'moratwi',      language: 'Setswana',         meaning: 'beloved/dear one — deeply affectionate' },
  { term: 'rra',          language: 'Setswana',          meaning: 'sir/mister — respectful male address' },
  { term: 'modisa',       language: 'Setswana',          meaning: 'shepherd/leader — term of respect' },
  { term: 'buti',         language: 'Setswana/Sotho',   meaning: 'brother — widely used warm male term' },

  // Sepedi (Northern Sotho / Sesotho sa Leboa)
  { term: 'mogwera',      language: 'Sepedi',           meaning: 'my friend — close trusted bond, almost sworn friendship' },
  { term: 'morwa',        language: 'Sepedi',           meaning: 'son/young man — warm and encouraging' },
  { term: 'kgaitsedi',    language: 'Sepedi',           meaning: 'sibling — deeply inclusive, family bond' },

  // Tshivenda
  { term: 'vhahosi',      language: 'Tshivenda',        meaning: 'chief/king — very respectful, regal address' },
  { term: 'mukomana',     language: 'Tshivenda',        meaning: 'young man — affectionate and encouraging' },
  { term: 'vhafuwi',      language: 'Tshivenda',        meaning: 'wealthy/blessed one — uplifting address' },

  // SA Township / Multi-cultural slang
  { term: 'mjita',        language: 'SA Township',      meaning: 'mate/friend — kasi street slang for a close buddy' },
  { term: 'lova',         language: 'SA Township',      meaning: 'buddy/friend — used warmly like "my guy"' },
  { term: 'outtie',       language: 'Cape Flats',       meaning: 'guy/homie — Cape Malay and Coloured community slang' },
  { term: 'my bra',       language: 'SA English',       meaning: 'my brother — broad SA slang across all cultures' },
  { term: 'brazo',        language: 'SA Township',      meaning: 'bro/brother — warmer, more playful variant of bra' },
  { term: 'mchana',       language: 'SA Township',      meaning: 'mate/friend — derived from Zulu "mngane"' },
  { term: 'sharp one',    language: 'SA English',       meaning: 'clever, on-point guy — term of respect' },
  { term: 'tiger',        language: 'SA English',       meaning: 'strong guy — playful term of respect' },
  { term: 'chief',        language: 'SA English',       meaning: 'you are the boss/leader — respectful address' },
  { term: 'my good sir',  language: 'Playful SA English', meaning: 'humorously formal — used with affection' },
  { term: 'brother',      language: 'English',          meaning: 'universal term of male solidarity' },
];

export const FEMALE_TERMS: CompanionTerm[] = [
  // Afrikaans
  { term: 'skat',         language: 'Afrikaans',        meaning: 'treasure/darling — deeply affectionate' },
  { term: 'sussie',       language: 'Afrikaans',        meaning: 'little sister — warm playful address' },
  { term: 'tannie',       language: 'Afrikaans',        meaning: 'aunty — affectionate respectful for an older woman' },

  // Zulu / Xhosa
  { term: 'sisi',         language: 'Zulu/Xhosa',       meaning: 'sister — respectful, affectionate term for a woman' },
  { term: 'sis wami',     language: 'Zulu/Xhosa',       meaning: 'my sister — deeply personal and warm' },
  { term: 'nkosazana',    language: 'Zulu/Xhosa',       meaning: 'princess/young lady — respectful and regal' },
  { term: 'mbokodo',      language: 'Zulu',             meaning: 'boulder/strong woman — "Wathint’ abafazi, wathint’ imbokodo" — she who is struck is like a rock' },
  { term: 'ntombi',       language: 'Zulu',             meaning: 'girl/young woman — affectionate and playful' },
  { term: 'mama',         language: 'Zulu/Xhosa',       meaning: 'honoured woman — respectful address for any woman' },
  { term: 'mzala',        language: 'Zulu/Xhosa',       meaning: 'cousin — close friend treated like family' },
  { term: 'sisi wethu',   language: 'Zulu/Xhosa',       meaning: 'our sister — communal, we are all family' },
  { term: 'umama',        language: 'Zulu/Xhosa',       meaning: 'the mother — deeply respectful for a mom' },
  { term: 'nkosi yami',   language: 'Zulu/Xhosa',       meaning: 'my queen — regal, celebratory and uplifting' },

  // Sesotho
  { term: 'moratwi',      language: 'Sesotho',          meaning: 'my beloved/dear — deeply affectionate' },
  { term: 'kgaitsedi',    language: 'Sesotho',          meaning: 'sister — family bond, you belong here' },
  { term: 'mme',          language: 'Sesotho',          meaning: 'mother/ma\'am — respectful warm address for a woman' },
  { term: 'ngoaneso',     language: 'Sesotho',          meaning: 'my sibling/dear one — intimate and warm' },

  // Setswana
  { term: 'mmaago',       language: 'Setswana',         meaning: 'your mother (used affectionately) — deeply respectful' },
  { term: 'mosadi',       language: 'Setswana',         meaning: 'woman — used with honour and pride' },
  { term: 'moratwi wa me',language: 'Setswana',         meaning: 'my beloved — tender and warm' },

  // Sepedi (Northern Sotho)
  { term: 'kgaetšedi',    language: 'Sepedi',           meaning: 'sister — you are my sibling, close bond' },
  { term: 'mmagwe',       language: 'Sepedi',           meaning: 'respected woman — honoured matriarch energy' },

  // Tshivenda
  { term: 'vhashumi',     language: 'Tshivenda',        meaning: 'hardworking woman — term of deep respect' },
  { term: 'zwikoro',      language: 'Tshivenda',        meaning: 'strong one — you are resilient and powerful' },

  // English / SA English / Township
  { term: 'sis',          language: 'SA English',       meaning: 'sister — warm, everyday female address' },
  { term: 'sister',       language: 'English',          meaning: 'universal female bond' },
  { term: 'gorgeous',     language: 'English',          meaning: 'you are stunning — affirming and uplifting' },
  { term: 'my dear',      language: 'English',          meaning: 'warm, caring address' },
  { term: 'beautiful',    language: 'English',          meaning: 'affirming and celebratory' },
  { term: 'chomi',        language: 'SA Township',      meaning: 'close girlfriend/bestie — from "comrade"' },
  { term: 'queen',        language: 'English/SA',       meaning: 'you are royalty — widely used uplifting term' },
  { term: 'love',         language: 'SA English',       meaning: 'warm, friendly term of endearment' },
  { term: 'dali',         language: 'SA Township',      meaning: 'darling/dear — warm affectionate term' },
];

// Build a compact instruction string for system prompts
export const buildTermsInstruction = (isMom: boolean): string => {
  const terms = isMom ? FEMALE_TERMS : MALE_TERMS;
  const termList = terms.map((t) => t.term).join(', ');

  return `
TERMS OF ADDRESS — CRITICAL:
You have a rich set of authentic South African terms to address the user covering all SA languages. Use them naturally and vary them throughout the conversation — don't use the same one every message, and don't force one into every sentence.
Available terms: ${termList}
Rules:
- Rotate through them organically based on tone, context, and the natural flow of conversation
- If the user EVER says they prefer a specific term, or says "call me X" or "I like when you call me X" — switch to that term immediately and use it for the rest of the conversation
- If the user asks what a term means, explain it with warmth and SA cultural pride — share the language it comes from and its deeper meaning
- Never use terms from the wrong gender list`;
};
