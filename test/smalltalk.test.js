import { test } from "node:test";
import assert from "node:assert";
import { normalize, matchMarkers, smallTalkFeedback } from "../src/lib/smalltalk.js";

const scenario = {
  markers: ["pretty good", "how about you", "not bad"],
  model: "Pretty good, thanks. How about you?",
};

test("normalize lowercases and strips punctuation", () => {
  assert.strictEqual(normalize("Pretty GOOD, thanks!").trim(), "pretty good thanks");
});

test("matchMarkers finds the markers that appear", () => {
  const hits = matchMarkers("Pretty good, how about you?", scenario.markers);
  assert.ok(hits.includes("pretty good"));
  assert.ok(hits.includes("how about you"));
  assert.ok(!hits.includes("not bad"));
});

test("a short reply is nudged to say more", () => {
  const fb = smallTalkFeedback("good", scenario);
  assert.strictEqual(fb.words, 1);
  assert.ok(fb.tip.toLowerCase().includes("fuller") || fb.tip.toLowerCase().includes("sentence"));
  assert.ok(fb.score < 60);
});

test("a natural reply with markers scores well", () => {
  const fb = smallTalkFeedback("Pretty good thanks, how about you", scenario);
  assert.ok(fb.hits.length >= 2);
  assert.ok(fb.score >= 90);
});

test("a reply with no markers still counts length but suggests fillers", () => {
  const fb = smallTalkFeedback("I spent the weekend working on a project at home", scenario);
  assert.strictEqual(fb.hits.length, 0);
  assert.ok(fb.score >= 50);
  assert.ok(fb.tip.toLowerCase().includes("filler") || fb.tip.toLowerCase().includes("people often say"));
});
