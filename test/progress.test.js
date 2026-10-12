import { test } from "node:test";
import assert from "node:assert";
import { defaultState, recordSession, levelFor, isNextDay } from "../src/lib/progress.js";

test("level math", () => {
  assert.strictEqual(levelFor(0), 1);
  assert.strictEqual(levelFor(99), 1);
  assert.strictEqual(levelFor(100), 2);
  assert.strictEqual(levelFor(250), 3);
});

test("isNextDay handles consecutive days and gaps", () => {
  assert.strictEqual(isNextDay("2026-10-11", "2026-10-12"), true);
  assert.strictEqual(isNextDay("2026-10-11", "2026-10-13"), false);
  assert.strictEqual(isNextDay(null, "2026-10-12"), false);
  assert.strictEqual(isNextDay("2026-10-31", "2026-11-01"), true);
});

test("first session starts a streak of 1 and grants the first badge", () => {
  const s = recordSession(defaultState(), { day: "2026-10-12", xpEarned: 40, features: ["flap-t"] });
  assert.strictEqual(s.streak, 1);
  assert.strictEqual(s.xp, 40);
  assert.strictEqual(s.mastery["flap-t"], 8);
  assert.ok(s.badges.includes("first-session"));
});

test("consecutive days grow the streak; same day does not double it", () => {
  let s = recordSession(defaultState(), { day: "2026-10-12", xpEarned: 30, features: [] });
  s = recordSession(s, { day: "2026-10-12", xpEarned: 10, features: [] }); // same day again
  assert.strictEqual(s.streak, 1);
  assert.strictEqual(s.xp, 40);
  s = recordSession(s, { day: "2026-10-13", xpEarned: 30, features: [] });
  assert.strictEqual(s.streak, 2);
});

test("a gap resets the streak to 1", () => {
  let s = recordSession(defaultState(), { day: "2026-10-12", xpEarned: 30, features: [] });
  s = recordSession(s, { day: "2026-10-15", xpEarned: 30, features: [] });
  assert.strictEqual(s.streak, 1);
});

test("mastery accumulates and caps at 100", () => {
  let s = defaultState();
  for (let i = 0; i < 20; i++) {
    s = recordSession(s, { day: "2026-10-12", xpEarned: 5, features: ["th"] });
  }
  assert.strictEqual(s.mastery["th"], 100);
});

test("seven day streak earns the week badge", () => {
  let s = defaultState();
  for (let d = 12; d <= 18; d++) {
    s = recordSession(s, { day: `2026-10-${d}`, xpEarned: 20, features: [] });
  }
  assert.strictEqual(s.streak, 7);
  assert.ok(s.badges.includes("week-streak"));
});
