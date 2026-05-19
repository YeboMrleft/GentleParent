export type LesediTopic = 'music' | 'books' | 'wine' | 'series' | 'realityTV' | 'celebrities';

export const LESEDI_MESSAGES: Record<LesediTopic, string[]> = {
  music: [
    "Sisi, have you heard what's been dropping on the music scene lately? 🎵 Some of these artists are really giving us EVERYTHING right now",
    "Girl, I need to know what's on your playlist right now — because the vibes have been too good to keep to myself 🎶",
    "Sis, the amapiano scene has been DELIVERING lately 🔥 — are you keeping up or do you need me to catch you up?",
    "Girl, a good playlist can literally change your whole mood neh 🎵 — what are you listening to when you need to reset?",
    "Sisi, have you discovered any new artists lately? I'm always looking for fresh sounds to add to my rotation 🎶",
    "Sis, some songs just hit different depending on the season you're in neh 🎵 — what song is speaking to you right now?",
    "Girl, South African music has been going global in a serious way 🌍🎶 — are we proud or does it feel like the world is only just catching on? 😂",
    "Sisi, live music vs a streaming playlist — which one actually feeds your soul more? Because I go back and forth on this 😂🎵",
  ],
  books: [
    "Sis, are you reading anything right now? Because I've been seeing some really good recommendations going around and I don't know where to start 📚",
    "Girl, a good book on a quiet evening with some tea? That's self-care nobody can take from you 📖☕ — what are you reading?",
    "Sisi, the book community online has been buzzing about some new releases 📚 — are you keeping up or do you need the full rundown?",
    "Sis, Kindle or a physical book? Because this debate is never-ending and I need to know which side you're on 📚😂",
    "Girl, a good novel is honestly therapy sometimes neh 📖 — have you had one of those reads recently that you just could not put down?",
    "Sisi, fiction or non-fiction? Because my mood literally decides for me every single time 😂📚 — what's your default?",
    "Sis, book clubs are having a whole moment right now 📖✨ — are you in one or is that something you've been thinking about?",
    "Girl, there is nothing like finishing a book that genuinely changes how you see something 📚💫 — when last did a book do that for you?",
  ],
  wine: [
    "Sis, pour yourself a glass tonight — you have absolutely earned it 🍷 — what's your go-to wine when you need to decompress?",
    "Girl, red or white? Because depending on the kind of week I've had, my answer changes every single time 😂🍷",
    "Sisi, a glass of wine and a good show is genuinely one of life's simple pleasures neh 🍷✨ — are you treating yourself tonight?",
    "Girl, have you tried any new wines or cocktails lately? Because sometimes you just need to switch up the evening vibe 🥂",
    "Sis, self-care reminder: you deserve a slow evening, good music, and something nice to sip on 🍷 — when last did you actually do that for yourself?",
    "Sisi, rosé is not just a season — it's a whole lifestyle 😂🌸🍷 — are you with me on this or nah?",
    "Girl, wine with good conversation hits so different neh 🍷💬 — who would be your ideal person to share a bottle with right now?",
    "Sis, has anyone recommended a wine to you lately that actually surprised you? Because I love when something unexpected turns out to be amazing 🥂",
  ],
  series: [
    "Girl, what are you binging right now? 📺 Because I need something new and I trust your taste completely",
    "Sisi, are you a binge-all-at-once or one-episode-a-week person? Because this says a LOT about someone 😂📺",
    "Girl, some of these streaming platforms have been DELIVERING lately neh 🔥 — which one are you on the most right now?",
    "Sisi, nothing beats a good series marathon on a slow day 📺☕ — what is your current obsession?",
    "Sis, that cliffhanger ending though 😩 — are you watching anything that has you counting down to the next episode?",
    "Girl, some of the writing in TV shows lately has been genuinely incredible neh ✍️📺 — have you watched anything recently that actually moved you?",
    "Sisi, talk shows have been having such good conversations lately 🎙️ — are you keeping up with any of them or do you prefer to catch clips online?",
    "Sis, the amount of content available right now is honestly overwhelming 😂📺 — how do you even decide what to watch next?",
  ],
  realityTV: [
    "Girl, reality TV is not just entertainment — it's a whole sociology lesson 😂 — are you watching anything good right now?",
    "Sisi, the drama on these reality shows this season 👀 — have you been keeping up? Because the CHAOS is real",
    "Girl, reality TV gets a bad rep but it is honestly some of the most entertaining content out there neh 😂 — what's your guilty pleasure show?",
    "Sis, some of these reality stars are genuinely iconic neh 🌟 — do you have a favourite who you actually root for every season?",
    "Sisi, Love Island / Big Brother drama — are you team 'it's all scripted' or team 'I am genuinely emotionally invested'? 😂📺",
    "Girl, the Real Housewives franchise never runs out of storylines neh 😂👀 — which city do you think has the best cast right now?",
    "Sis, reality dating shows have been on another level lately 💕 — are you watching any of them or have you retired from that genre? 😂",
    "Sisi, some of the fashion on these reality shows has actually been really inspiring lately ✨👗 — are you taking notes or am I the only one? 😂",
  ],
  celebrities: [
    "Girl, have you seen what's been going on in the celebrity world lately? 👀 The internet has been absolutely TALKING",
    "Sis, celebrity fashion at the recent events has been giving me so much life 😍 — who has been winning the style game for you lately?",
    "Sisi, South African celebrities have really been showing up and showing OUT on the global stage lately 🇿🇦🌍 — are you proud?",
    "Girl, some of these celebrity looks lately have been absolutely stunning neh ✨ — are you keeping up with the fashion moments?",
    "Sis, celebrity drama aside — who do you genuinely respect and admire in the entertainment industry right now? 🌟",
    "Sisi, celeb relationships in the news lately 👀 — I'm not saying I'm invested but... I might be a little invested 😂",
    "Girl, some of these celebrities have been so open about their personal journeys lately 💫 — have you seen anything that actually inspired you?",
    "Sis, the red carpet looks from the latest events though ✨👗 — who absolutely nailed it and who needed a second opinion? 😂",
  ],
};

export const ALL_LESEDI_MESSAGES: { topic: LesediTopic; message: string }[] =
  (Object.keys(LESEDI_MESSAGES) as LesediTopic[]).flatMap((topic) =>
    LESEDI_MESSAGES[topic].map((message) => ({ topic, message }))
  );
