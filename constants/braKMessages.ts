export type BraKTopic = 'soccer' | 'movies' | 'music' | 'banter';

export const BRAK_MESSAGES: Record<BraKTopic, string[]> = {
  soccer: [
    "Ay bra, you been checking the PSL log table lately? 🔥 Things are getting spicy out there — your team still in the race?",
    "Bro the Orlando Pirates vs Kaizer Chiefs derby energy is something else neh 😂⚽ — who you backing when they meet?",
    "Bafana Bafana have a big match coming up my bro 🇿🇦 — you watching? Can't miss this one",
    "Champions League nights are hitting different this week bra 🏆 — who do you think goes all the way this season?",
    "Ay bro, some mad results in the EPL this weekend 😅 — did you catch any of it? The table is mad scrambled right now",
    "PSL transfer window rumours are wild bra 👀 — you think your team is making smart moves or just wasting money again? 😂",
    "Bro have you been watching any of the African football lately? AFCON qualifying is no joke — some proper talent out there",
    "Ay bra, Mamelodi Sundowns have been on another level this season neh — what do you think their secret is? 🌟⚽",
    "Bro the referee decisions this weekend though 😤 — I swear some of these calls are costing teams everything. Did you see?",
    "Ay, have you been keeping up with your fantasy football? My team is struggling this week I won't lie 😂 — how's yours doing?",
  ],
  movies: [
    "Bro, you on Netflix tonight? There's some fire new stuff dropping this month that you need to check out 🎬🍿",
    "Ay bra — what's the last series you actually finished? I need something new to watch, give me your top recommendation right now 😂",
    "Bro if there's a movie or series collecting dust in your watchlist, tonight might be the night to finally sort it out 🎥 — what's been sitting there?",
    "Ay have you watched anything lately that actually blew your mind? I'm talking that 'can't sleep, thinking about it' type of show 🤯",
    "Bro the action movies they've been dropping lately are hitting different 🔥 — you been keeping up or you still watching the same old stuff? 😂",
    "Ay bra, horror or comedy tonight? You know sometimes you just need to switch it up — what's your mood? 👻😂",
    "Bro documentaries are actually underrated neh — have you watched any solid ones recently? Some of them will change how you see the world",
    "Ay, the new Netflix originals they've been releasing lately bra 👀 — some are actually proper good. You been exploring or just sticking to the familiar?",
    "Bro I need a movie recommendation for tonight — and don't say something I've definitely seen already 😂 what's your hidden gem pick?",
    "Ay bra, have you noticed how the mid-season drops on streaming have been going hard lately? 🎬 Don't sleep on what just came out",
  ],
  music: [
    "Ay bra, the amapiano scene has been dropping absolute fire lately 🎵 — you keeping up with the new joints coming out?",
    "Bro who's your top artist right now? And I mean right now — because mine literally changes every two weeks 😂",
    "Ay bra, playlist game has been different this week — what sounds are you on? Give me something new to add 🎶",
    "Bro South African music has been going global in a serious way neh 🌍 — are you proud or does it feel like the world is only just catching on? 😂",
    "Ay, have you been listening to any live sets recently? Some of those festival recordings that come out are actually better than the studio tracks 🎧",
    "Bro what do you put on when you need to just zone out and decompress? I need to know your go-to vibe 🎵",
    "Ay bra, old school hip hop vs new wave — which side are you on today? 😂 Because sometimes I can't decide",
    "Bro I found a new artist this week that I was sleeping on badly 😅 — have you had one of those recently? Someone just pops up and blows your mind?",
  ],
  banter: [
    "Ay bra just checking in on you 💪 — you know how it is, life gets busy but we still gotta stay connected neh",
    "Bro it's a new day — what are you going into it with? Energy levels on what? I need to know 😂",
    "Ay bra, serious question — how do you actually switch off after a long day? Because I feel like a lot of guys just don't know how to do that properly",
    "Bro the weekend is almost here 🙌 — you got plans or are we doing the classic 'I'll see how I feel' move again? 😂",
    "Ay bra, what's one thing that genuinely made you laugh this week? Because we need more of that energy in our lives neh",
    "Bro sometimes you just need to step outside, get some air, and reset 🌤️ — have you had one of those moments recently?",
    "Ay bra, honest question — when last did you do something just for yourself? Not for work, not for anyone else, just for you?",
    "Bro I've been thinking — we put so much pressure on ourselves neh 💭 — do you think guys talk about that enough?",
    "Ay bra it's one of those 'what am I even doing with my life' kind of days 😂 — you ever get those? What do you do to snap out of it?",
    "Bro sometimes a good conversation is all you need to reset the whole day 🤜🤛 — open to chatting if you got something on your mind",
  ],
};

export const ALL_BRAK_MESSAGES: { topic: BraKTopic; message: string }[] =
  (Object.keys(BRAK_MESSAGES) as BraKTopic[]).flatMap((topic) =>
    BRAK_MESSAGES[topic].map((message) => ({ topic, message }))
  );
