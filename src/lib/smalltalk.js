/**
 * Light feedback for a free small-talk reply. Pure, testable. We cannot grade
 * accent from text, so this just checks whether the reply used the kind of easy,
 * natural phrasing Americans use in small talk, and nudges toward it.
 */

export function normalize(text) {
  return " " + (text || "").toLowerCase().replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim() + " ";
}

/** Which of the given phrase markers show up in the transcript. */
export function matchMarkers(transcript, markers) {
  const t = normalize(transcript);
  const hits = [];
  for (const m of markers || []) {
    if (t.includes(" " + normalize(m).trim() + " ") || t.includes(normalize(m).trim())) {
      hits.push(m);
    }
  }
  return hits;
}

/**
 * A short feedback object for a scenario reply.
 * @returns {{hits:string[], score:number, tip:string, words:number}}
 */
export function smallTalkFeedback(transcript, scenario) {
  const words = normalize(transcript).trim().split(" ").filter(Boolean).length;
  const hits = matchMarkers(transcript, scenario.markers);
  // score blends "did you say something" with "did it sound natural"
  let score = 0;
  if (words >= 3) score += 50;
  score += Math.min(50, hits.length * 25);
  score = Math.max(0, Math.min(100, score));

  let tip;
  if (words < 3) {
    tip = "Try a fuller reply. A sentence or two keeps the small talk going.";
  } else if (hits.length === 0) {
    tip = `Natural fillers help. People often say things like "${(scenario.markers[0] || "pretty good")}" here.`;
  } else if (words > 40) {
    tip = "Good and natural. Small talk stays short, so you can trim it a touch.";
  } else {
    tip = "Nice, that sounds natural. Shadow the model answer to match the rhythm.";
  }
  return { hits, score, tip, words };
}
