import { useState } from "react";
import { speak, listenOnce, startRecorder, caps } from "../lib/speech.js";
import { rhythmScore } from "../lib/audio.js";
import { smallTalkFeedback } from "../lib/smalltalk.js";

function normalizeWord(s) {
  return s.toLowerCase().replace(/[^a-z ]/g, "").trim();
}

function Meter({ value, label, tone = "accent" }) {
  return (
    <div className="meter">
      <div className="meter__top">
        <span className="meter__label">{label}</span>
        <span className="meter__val">{Math.round(value)}</span>
      </div>
      <div className="meter__track">
        <span className={`meter__fill meter__fill--${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

function RoundShell({ eyebrow, title, children, onNext, nextLabel = "Next" }) {
  return (
    <section className="round">
      <p className="round__eyebrow">{eyebrow}</p>
      <h2 className="round__title">{title}</h2>
      {children}
      <button className="btn btn--next" onClick={onNext}>{nextLabel}</button>
    </section>
  );
}

/* ---- Round 1: Sound of the day ---- */
export function SoundDrill({ feature, onComplete }) {
  const [i, setI] = useState(0);
  const [status, setStatus] = useState(null); // {ok, text}
  const [busy, setBusy] = useState(false);
  const [earned, setEarned] = useState(0);
  const word = feature.words[i];
  const target = word.split("/")[0].replace(/[A-Z-]/g, (m) => m.toLowerCase().replace("-", "")).trim();

  async function sayIt() {
    if (!caps.stt) { setStatus({ ok: null, text: "Speech check needs Chrome, Edge, or Safari." }); return; }
    setBusy(true); setStatus({ ok: null, text: "Listening..." });
    try {
      const { transcript } = await listenOnce();
      const said = normalizeWord(transcript);
      const want = normalizeWord(target);
      const ok = said.includes(want) || want.includes(said.split(" ")[0] || "");
      setStatus({ ok, text: ok ? `Clear. Heard "${transcript}".` : `Heard "${transcript}". Try again, slower and crisper.` });
      if (ok) setEarned((e) => e + 2);
    } catch {
      setStatus({ ok: null, text: "Did not catch that, give it another go." });
    } finally { setBusy(false); }
  }

  function next() {
    if (i < feature.words.length - 1) { setI(i + 1); setStatus(null); }
    else onComplete(Math.max(10, earned), feature.id);
  }

  return (
    <RoundShell eyebrow="Sound of the day" title={feature.name}
      onNext={next} nextLabel={i < feature.words.length - 1 ? "Next word" : "Done with sounds"}>
      <p className="tip">{feature.tip}</p>
      <p className="cue"><b>How:</b> {feature.cue}</p>
      <div className="word-card">
        <span className="word-card__word">{word}</span>
        <span className="word-card__count">{i + 1} of {feature.words.length}</span>
      </div>
      <div className="row">
        <button className="btn" onClick={() => speak(target)}>Hear it</button>
        <button className="btn btn--accent" onClick={sayIt} disabled={busy}>{busy ? "Listening..." : "Say it"}</button>
      </div>
      {status && <p className={`status ${status.ok === true ? "status--ok" : status.ok === false ? "status--try" : ""}`}>{status.text}</p>}
    </RoundShell>
  );
}

/* ---- Round 2: Shadow the line (rhythm) ---- */
export function Shadow({ lines, onComplete }) {
  const [i, setI] = useState(0);
  const [rec, setRec] = useState(null);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState(null); // {score, url}
  const [earned, setEarned] = useState(0);
  const line = lines[i];

  async function record() {
    if (!caps.mic) { setResult({ score: null, text: "Recording needs mic access." }); return; }
    try {
      const r = await startRecorder();
      setRec(r); setRecording(true); setResult(null);
    } catch { setResult({ score: null, text: "Could not start the mic." }); }
  }
  async function stop() {
    setRecording(false);
    const { url, samples, sampleRate } = await rec.stop();
    const r = rhythmScore(samples, sampleRate);
    setResult({ score: r.confident ? r.score : null, url, text: r.confident ? null : "Say the whole line so the rhythm can be read." });
    setEarned((e) => e + (r.confident ? 6 : 3));
    setRec(null);
  }
  function next() {
    if (i < lines.length - 1) { setI(i + 1); setResult(null); }
    else onComplete(Math.max(10, earned), "stress");
  }

  return (
    <RoundShell eyebrow="Shadow the line" title="Match the flow"
      onNext={next} nextLabel={i < lines.length - 1 ? "Next line" : "Done shadowing"}>
      <p className="tip">Hear it, then say it the same way. Copy the melody and which words get stretched.</p>
      <blockquote className="line">{line}</blockquote>
      <div className="row">
        <button className="btn" onClick={() => speak(line)}>Hear it</button>
        {!recording
          ? <button className="btn btn--accent" onClick={record}>Record me</button>
          : <button className="btn btn--stop" onClick={stop}>Stop</button>}
        {result?.url && <button className="btn" onClick={() => new Audio(result.url).play()}>Play me</button>}
      </div>
      {result?.score != null && <Meter value={result.score} label="Rhythm match (approximate)" tone={result.score >= 60 ? "good" : "accent"} />}
      {result?.text && <p className="status">{result.text}</p>}
    </RoundShell>
  );
}

/* ---- Round 3: Small-talk scenario ---- */
export function Scenario({ scenario, onComplete }) {
  const [busy, setBusy] = useState(false);
  const [fb, setFb] = useState(null);
  const [said, setSaid] = useState(null);

  async function reply() {
    if (!caps.stt) { setFb({ tip: "Speech check needs Chrome, Edge, or Safari.", score: 0 }); return; }
    setBusy(true); setFb(null);
    try {
      const { transcript } = await listenOnce(9000);
      setSaid(transcript);
      setFb(smallTalkFeedback(transcript, scenario));
    } catch {
      setFb({ tip: "Did not catch that. Speak a sentence or two.", score: 0, hits: [] });
    } finally { setBusy(false); }
  }

  return (
    <RoundShell eyebrow="Small talk" title="Keep it going"
      onNext={() => onComplete(Math.max(12, fb ? Math.round(fb.score / 5) + 10 : 10))} nextLabel="Finish session">
      <p className="prompt">{scenario.prompt}</p>
      <div className="row">
        <button className="btn btn--accent" onClick={reply} disabled={busy}>{busy ? "Listening..." : "Reply out loud"}</button>
      </div>
      {said && <p className="heard">You said: {said}</p>}
      {fb && (
        <div className="fb">
          {fb.score != null && <Meter value={fb.score} label="Natural and clear" tone={fb.score >= 70 ? "good" : "accent"} />}
          <p className="status">{fb.tip}</p>
          <div className="model">
            <span className="model__label">A natural reply</span>
            <p className="model__text">{scenario.model}</p>
            <button className="btn btn--small" onClick={() => speak(scenario.model)}>Hear it</button>
          </div>
        </div>
      )}
    </RoundShell>
  );
}
