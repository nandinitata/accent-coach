/**
 * Rhythm analysis. Pure math, no Web Audio, so it runs in node for tests.
 * The React side decodes the mic recording to raw samples and passes them here.
 *
 * The idea: American English is stress-timed. Stressed syllables are long and
 * loud, unstressed ones get crushed short and quiet. Indian English is more
 * syllable-timed, so syllables come out more even. We measure that unevenness
 * with the normalized Pairwise Variability Index (nPVI) over loud (vocalic)
 * stretches of the recording. More variability means more stress-timed, which
 * reads as more American. This is an approximate signal, not a real accent grade.
 */

/** RMS energy per short frame. Returns an array of energies. */
export function energyEnvelope(samples, sampleRate, frameMs = 25, hopMs = 10) {
  const frame = Math.max(1, Math.round((sampleRate * frameMs) / 1000));
  const hop = Math.max(1, Math.round((sampleRate * hopMs) / 1000));
  const out = [];
  for (let start = 0; start + frame <= samples.length; start += hop) {
    let sum = 0;
    for (let i = start; i < start + frame; i++) sum += samples[i] * samples[i];
    out.push(Math.sqrt(sum / frame));
  }
  return out;
}

/** Moving-average smooth, window of k frames. */
export function smooth(env, k = 3) {
  if (k <= 1) return env.slice();
  const out = [];
  for (let i = 0; i < env.length; i++) {
    let sum = 0, n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(env.length - 1, i + k); j++) {
      sum += env[j]; n++;
    }
    out.push(sum / n);
  }
  return out;
}

/**
 * Durations (in frames) of the loud stretches, a proxy for vocalic intervals.
 * A stretch starts when energy rises above the threshold and ends when it drops.
 */
export function voicedDurations(env, relThreshold = 0.35) {
  if (env.length === 0) return [];
  const peak = Math.max(...env);
  if (peak <= 0) return [];
  const thr = peak * relThreshold;
  const durations = [];
  let run = 0;
  for (let i = 0; i < env.length; i++) {
    if (env[i] >= thr) {
      run++;
    } else if (run > 0) {
      durations.push(run);
      run = 0;
    }
  }
  if (run > 0) durations.push(run);
  return durations;
}

/** Normalized Pairwise Variability Index over a list of durations. */
export function npvi(durations) {
  if (durations.length < 2) return 0;
  let sum = 0, pairs = 0;
  for (let i = 0; i < durations.length - 1; i++) {
    const a = durations[i], b = durations[i + 1];
    const mean = (a + b) / 2;
    if (mean > 0) {
      sum += Math.abs(a - b) / mean;
      pairs++;
    }
  }
  return pairs === 0 ? 0 : (100 * sum) / pairs;
}

/**
 * Map a recording to a 0-100 rhythm score. Needs a few vocalic stretches to be
 * meaningful; returns {score, confident, npvi, intervals}.
 */
export function rhythmScore(samples, sampleRate) {
  const env = smooth(energyEnvelope(samples, sampleRate), 2);
  const durations = voicedDurations(env);
  const index = npvi(durations);
  // stress-timed English tends to sit higher on nPVI than syllable-timed speech.
  // Map roughly: 35 and below -> 0, 70 and above -> 100.
  const score = Math.max(0, Math.min(100, Math.round(((index - 35) / (70 - 35)) * 100)));
  return {
    score,
    npvi: Math.round(index),
    intervals: durations.length,
    confident: durations.length >= 4,
  };
}
