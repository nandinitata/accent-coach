/**
 * Streak, XP, levels, and per-sound mastery. The state transitions are pure
 * functions (testable in node); load/save just wrap localStorage.
 */

export function defaultState() {
  return {
    streak: 0,
    lastDay: null, // "YYYY-MM-DD"
    xp: 0,
    mastery: {}, // featureId -> 0..100
    badges: [],
    history: [], // [{day, xp}]
  };
}

export function levelFor(xp) {
  // 100 xp per level, starting at level 1
  return Math.floor(xp / 100) + 1;
}

export function xpIntoLevel(xp) {
  return xp % 100;
}

/** Days are "YYYY-MM-DD" strings. True if `day` is exactly one day after `prev`. */
export function isNextDay(prev, day) {
  if (!prev) return false;
  const a = Date.parse(prev + "T00:00:00Z");
  const b = Date.parse(day + "T00:00:00Z");
  if (isNaN(a) || isNaN(b)) return false;
  return Math.round((b - a) / 86400000) === 1;
}

/**
 * Apply one finished session.
 * @param {object} state
 * @param {{day:string, xpEarned:number, features:string[]}} session
 */
export function recordSession(state, session) {
  const s = JSON.parse(JSON.stringify(state));
  const { day, xpEarned, features } = session;

  // streak
  if (s.lastDay === day) {
    // already played today, keep streak
  } else if (isNextDay(s.lastDay, day)) {
    s.streak += 1;
  } else {
    s.streak = 1; // first ever, or a gap broke it
  }
  s.lastDay = day;

  // xp
  s.xp += Math.max(0, xpEarned);

  // mastery: each practiced feature inches up, capped at 100
  for (const f of features || []) {
    s.mastery[f] = Math.min(100, (s.mastery[f] || 0) + 8);
  }

  // history (keep last 60)
  s.history.push({ day, xp: xpEarned });
  if (s.history.length > 60) s.history = s.history.slice(-60);

  // badges
  const have = new Set(s.badges);
  if (!have.has("first-session")) s.badges.push("first-session");
  if (s.streak >= 7 && !have.has("week-streak")) s.badges.push("week-streak");
  if (s.streak >= 30 && !have.has("month-streak")) s.badges.push("month-streak");
  if (levelFor(s.xp) >= 5 && !have.has("level-5")) s.badges.push("level-5");

  return s;
}

const KEY = "accent-coach-progress-v1";

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage blocked, ignore */
  }
}

export function todayStr(date) {
  // date optional for testing; defaults to now in the browser
  const d = date || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
