/**
 * The practice content: the sound features to drill, workplace small-talk lines
 * to shadow, and small-talk scenarios to reply to.
 */

export const FEATURES = [
  {
    id: "flap-t",
    name: "The American flap T",
    tip: "Between two vowels, Americans turn a T into a fast D-like tap. Water sounds like wader, better like bedder.",
    cue: "Tap the tongue once on the ridge behind your top teeth, do not stop the air.",
    words: ["water", "better", "city", "letter", "little", "party", "thirty", "data"],
  },
  {
    id: "v-w",
    name: "V versus W",
    tip: "V uses your top teeth on your bottom lip. W rounds both lips with no teeth. Keep them separate.",
    cue: "For V, bite your lower lip gently. For W, round your lips like you are about to whistle.",
    words: ["vine / wine", "vest / west", "veil / wail", "vary / wary", "verse / worse"],
  },
  {
    id: "th",
    name: "The TH sounds",
    tip: "Put your tongue tip lightly between your teeth. Think is not tink, this is not dis.",
    cue: "Tongue tip just touches the bottom of your top teeth and lets air pass.",
    words: ["think / sink", "thin / tin", "three / tree", "they / day", "then / den"],
  },
  {
    id: "r",
    name: "The American R",
    tip: "American R is strong and colors the vowel. Do not tap or trill it. The tongue bunches back.",
    cue: "Pull the tongue back and bunch it, do not let it touch the roof. Round the lips a little.",
    words: ["car", "hard", "bird", "far", "mother", "world", "start", "four"],
  },
  {
    id: "schwa",
    name: "Schwa reduction",
    tip: "Americans crush unstressed vowels to a quick uh. Spell it full, say it reduced.",
    cue: "Say the strong syllable clearly and let the others go soft and fast.",
    words: ["about", "banana", "support", "today", "computer", "suppose", "camera"],
  },
  {
    id: "stress",
    name: "Stress and rhythm",
    tip: "English is stress-timed. Make the stressed syllable long and loud, squeeze the rest.",
    cue: "Punch one syllable per word and rush the others. Do not give every syllable equal time.",
    words: ["de-VE-lop-ment", "ca-LEN-dar", "PER-cent", "ho-TEL", "ne-CESS-ary", "pho-TOG-ra-pher"],
  },
];

export const LINES = [
  "Morning! How was your weekend?",
  "Hey, do you have a quick minute?",
  "I was just grabbing a coffee, want anything?",
  "Yeah, that works for me, let us go with that.",
  "No worries, take your time.",
  "Sounds good, I will send that over this afternoon.",
  "Oh nice, how is that project going?",
  "Honestly, pretty slammed this week.",
  "Let me loop you in on that thread.",
  "Can we push our sync to tomorrow?",
  "I am gonna grab lunch, you in?",
  "Thanks so much, I really appreciate it.",
  "Catch you at the standup.",
  "Long week, huh? Almost Friday.",
  "That makes sense, let me double-check and get back to you.",
  "Hey, good to see you, how have you been?",
  "I will take a look and circle back.",
  "No rush at all, whenever you get a chance.",
  "Did you catch the game last night?",
  "Let us table that for now and move on.",
  "Appreciate you jumping on this.",
  "Quick heads up, the meeting moved to three.",
  "Ha, tell me about it.",
  "Sure thing, happy to help.",
  "Let us grab time later this week.",
];

export const SCENARIOS = [
  {
    id: "weekend",
    prompt: "A coworker walks in Monday morning and says: Morning! How was your weekend?",
    model: "Pretty good, thanks! Kept it low key, caught up on sleep. How about you?",
    markers: ["pretty good", "not bad", "how about you", "pretty chill", "low key", "you"],
  },
  {
    id: "coffee",
    prompt: "Someone heading to the kitchen asks: I am making a coffee run, want anything?",
    model: "Oh, that would be great, thanks. Just a regular coffee if you do not mind.",
    markers: ["that would be great", "thanks", "if you do not mind", "i am good", "sure"],
  },
  {
    id: "standup",
    prompt: "At standup your lead asks: What are you working on today?",
    model: "Today I am wrapping up the report, then I will start on the review. No blockers.",
    markers: ["wrapping up", "working on", "no blockers", "i will", "then"],
  },
  {
    id: "elevator",
    prompt: "You step into the elevator with a colleague you barely know. Say something friendly.",
    model: "Hey, how is it going? Crazy how fast this week went by.",
    markers: ["how is it going", "how are you", "hey", "crazy", "this week"],
  },
  {
    id: "favor",
    prompt: "A teammate asks: Hey, could you take a quick look at my pull request?",
    model: "Yeah, for sure. Send it over and I will take a look this afternoon.",
    markers: ["for sure", "yeah", "send it over", "i will take a look", "happy to"],
  },
  {
    id: "lunch",
    prompt: "A few people are heading out and ask: We are grabbing lunch, you in?",
    model: "Yeah, I am in. Give me two minutes to wrap this up and I will meet you there.",
    markers: ["i am in", "yeah", "give me", "meet you there", "sounds good"],
  },
  {
    id: "friday",
    prompt: "It is Friday afternoon. A coworker says: Any fun plans for the weekend?",
    model: "Nothing crazy, probably just relax and maybe hit the farmers market. You?",
    markers: ["nothing crazy", "probably", "maybe", "you", "just relax"],
  },
  {
    id: "thanks",
    prompt: "A colleague helped you fix a tricky bug. Thank them naturally.",
    model: "Hey, thanks a ton for that, you saved me a bunch of time. I owe you one.",
    markers: ["thanks a ton", "appreciate it", "you saved me", "i owe you one", "thanks so much"],
  },
];

/** Pick the feature for a given day index so it rotates. */
export function featureForDay(dayIndex) {
  return FEATURES[dayIndex % FEATURES.length];
}

/** Deterministic pick of n items starting at an offset (so a day is stable). */
export function pick(arr, n, offset) {
  const out = [];
  for (let i = 0; i < n && i < arr.length; i++) {
    out.push(arr[(offset + i) % arr.length]);
  }
  return out;
}
