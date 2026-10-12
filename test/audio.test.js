import { test } from "node:test";
import assert from "node:assert";
import { energyEnvelope, voicedDurations, npvi, rhythmScore } from "../src/lib/audio.js";

const SR = 16000;

// build a signal from a pattern of loud/quiet blocks (milliseconds)
function makeSignal(blocks) {
  const samples = [];
  let phase = 0;
  for (const b of blocks) {
    const loudN = Math.round((SR * b.loudMs) / 1000);
    for (let i = 0; i < loudN; i++) {
      samples.push(0.5 * Math.sin((phase += 0.4)));
    }
    const quietN = Math.round((SR * b.quietMs) / 1000);
    for (let i = 0; i < quietN; i++) samples.push(0);
  }
  return Float32Array.from(samples);
}

test("energy envelope is high during loud blocks and near zero in silence", () => {
  const sig = makeSignal([{ loudMs: 200, quietMs: 200 }]);
  const env = energyEnvelope(sig, SR);
  assert.ok(Math.max(...env) > 0.2);
  assert.ok(Math.min(...env) < 0.05);
});

test("voicedDurations finds one stretch per loud block", () => {
  const sig = makeSignal([
    { loudMs: 200, quietMs: 150 },
    { loudMs: 200, quietMs: 150 },
    { loudMs: 200, quietMs: 150 },
  ]);
  const env = energyEnvelope(sig, SR);
  const d = voicedDurations(env);
  assert.strictEqual(d.length, 3);
});

test("npvi is near zero for equal durations and high for alternating", () => {
  assert.ok(npvi([10, 10, 10, 10]) < 1);
  assert.ok(npvi([20, 5, 20, 5, 20]) > 80);
});

test("stress-timed (uneven) speech scores higher than syllable-timed (even)", () => {
  const uneven = makeSignal([
    { loudMs: 320, quietMs: 120 },
    { loudMs: 80, quietMs: 120 },
    { loudMs: 320, quietMs: 120 },
    { loudMs: 80, quietMs: 120 },
    { loudMs: 320, quietMs: 120 },
  ]);
  const even = makeSignal([
    { loudMs: 180, quietMs: 120 },
    { loudMs: 180, quietMs: 120 },
    { loudMs: 180, quietMs: 120 },
    { loudMs: 180, quietMs: 120 },
    { loudMs: 180, quietMs: 120 },
  ]);
  const hi = rhythmScore(uneven, SR);
  const lo = rhythmScore(even, SR);
  assert.ok(hi.confident && lo.confident);
  assert.ok(hi.score > lo.score, `expected uneven ${hi.score} > even ${lo.score}`);
  assert.ok(hi.score >= 60, `uneven should score high, got ${hi.score}`);
  assert.ok(lo.score <= 30, `even should score low, got ${lo.score}`);
});

test("too few stretches is marked not confident", () => {
  const one = makeSignal([{ loudMs: 200, quietMs: 100 }]);
  assert.strictEqual(rhythmScore(one, SR).confident, false);
});
