/**
 * Browser speech: speak a model phrase (TTS), listen for a clarity check
 * (SpeechRecognition), and record the mic to raw samples for the rhythm score.
 * All free, no keys. Degrades gracefully where a capability is missing.
 */

const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);

export const caps = {
  tts: typeof window !== "undefined" && "speechSynthesis" in window,
  stt: !!SR,
  mic: typeof navigator !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
  firefox: typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent),
};

/** Pick a good en-US voice, preferring known natural ones. */
export function pickUsVoice() {
  if (!caps.tts) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const us = voices.filter((v) => /en[-_]US/i.test(v.lang));
  const prefer = ["Samantha", "Google US English", "Aria", "Jenny", "Guy", "Microsoft"];
  for (const name of prefer) {
    const hit = us.find((v) => v.name.includes(name));
    if (hit) return hit;
  }
  return us[0] || voices[0] || null;
}

/** Speak text with a US voice. Resolves when done. */
export function speak(text, rate = 0.95) {
  return new Promise((resolve) => {
    if (!caps.tts) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickUsVoice();
    if (v) u.voice = v;
    u.lang = "en-US";
    u.rate = rate;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

/** Listen once and return {transcript, confidence}. Rejects on error/timeout. */
export function listenOnce(timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    if (!caps.stt) return reject(new Error("no-stt"));
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    let done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; try { rec.stop(); } catch {} reject(new Error("timeout")); }
    }, timeoutMs);
    rec.onresult = (e) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      const r = e.results[0][0];
      resolve({ transcript: r.transcript || "", confidence: r.confidence || 0 });
    };
    rec.onerror = (e) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(new Error(e.error || "stt-error"));
    };
    try { rec.start(); } catch (err) { clearTimeout(timer); reject(err); }
  });
}

/**
 * Record the mic until stop() is called. stop() resolves to
 * {blob, url, samples, sampleRate} where samples is a Float32Array for rhythm.
 */
export async function startRecorder() {
  if (!caps.mic) throw new Error("no-mic");
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const rec = new MediaRecorder(stream);
  const chunks = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.start();

  return {
    stop() {
      return new Promise((resolve) => {
        rec.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          const url = URL.createObjectURL(blob);
          let samples = new Float32Array(0), sampleRate = 16000;
          try {
            const buf = await blob.arrayBuffer();
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const audio = await ctx.decodeAudioData(buf);
            samples = audio.getChannelData(0);
            sampleRate = audio.sampleRate;
            ctx.close();
          } catch { /* decode failed, rhythm will be skipped */ }
          resolve({ blob, url, samples, sampleRate });
        };
        rec.stop();
      });
    },
  };
}
