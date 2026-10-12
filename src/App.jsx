import { useEffect, useMemo, useRef, useState } from "react";
import { SoundDrill, Shadow, Scenario } from "./components/Rounds.jsx";
import { FEATURES, LINES, SCENARIOS, featureForDay, pick } from "./content/content.js";
import * as P from "./lib/progress.js";
import { caps } from "./lib/speech.js";

function daysSinceEpoch(dayStr) {
  return Math.floor(Date.parse(dayStr + "T00:00:00Z") / 86400000);
}

function ProgressHeader({ state }) {
  const level = P.levelFor(state.xp);
  const into = P.xpIntoLevel(state.xp);
  return (
    <header className="masthead">
      <div className="brand">
        <span className="brand__name">Watercooler</span>
        <span className="brand__tag">sound a little more American, ten minutes a day</span>
      </div>
      <div className="stats">
        <div className="stat"><b>{state.streak}</b><span>day streak</span></div>
        <div className="stat"><b>Lvl {level}</b><span>{into} / 100 xp</span></div>
      </div>
    </header>
  );
}

function Home({ state, onStart, doneToday }) {
  return (
    <div className="home">
      {caps.firefox && <div className="banner">Heads up: the speaking checks do not work in Firefox. Use Chrome, Edge, or Safari.</div>}
      {!caps.firefox && (!caps.stt || !caps.mic) && <div className="banner">Your browser is missing a speech or mic feature, so some checks may be skipped.</div>}

      <div className="hero-card">
        <p className="hero-card__kicker">{doneToday ? "You already practiced today" : "Today's ten minutes"}</p>
        <h1 className="hero-card__title">A quick warm-up, a few lines, one small-talk chat.</h1>
        <p className="hero-card__sub">Hear a model voice, say it back, and watch your rhythm and clarity. Small reps, every day.</p>
        <button className="btn btn--go" onClick={onStart}>{doneToday ? "Practice again" : "Start"}</button>
      </div>

      <div className="mastery">
        <h3 className="mastery__head">Your sounds</h3>
        <div className="mastery__grid">
          {FEATURES.map((f) => (
            <div className="mbar" key={f.id}>
              <span className="mbar__name">{f.name}</span>
              <span className="mbar__track"><span className="mbar__fill" style={{ width: `${state.mastery[f.id] || 0}%` }} /></span>
            </div>
          ))}
        </div>
      </div>

      <p className="disclaimer">A practice aid, not a certified accent score. The clarity check tells you that you were understood; the rhythm meter is an approximate read of your stress and timing. Nothing leaves beyond your browser except the speech-recognition audio your browser sends to its own service.</p>
    </div>
  );
}

function Summary({ earned, state, features, onDone }) {
  const names = features.map((id) => (FEATURES.find((f) => f.id === id) || {}).name).filter(Boolean);
  return (
    <div className="summary">
      <p className="summary__kicker">Session done</p>
      <h1 className="summary__title">Nice work today.</h1>
      <div className="summary__stats">
        <div className="stat stat--big"><b>+{earned}</b><span>xp earned</span></div>
        <div className="stat stat--big"><b>{state.streak}</b><span>day streak</span></div>
        <div className="stat stat--big"><b>Lvl {P.levelFor(state.xp)}</b><span>level</span></div>
      </div>
      {names.length > 0 && <p className="summary__line">You worked on {names.join(" and ")}.</p>}
      <p className="summary__line">Tip for tomorrow: say the stressed syllable long and loud, and let the rest go quick and soft. That is what makes it sound American.</p>
      <button className="btn btn--go" onClick={onDone}>Done</button>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(P.defaultState());
  const [view, setView] = useState("home"); // home | 0 | 1 | 2 | summary
  const sess = useRef({ xp: 0, features: [] });
  const [earned, setEarned] = useState(0);

  useEffect(() => {
    setState(P.load());
    // prcompt the browser to load TTS voices
    if (caps.tts) { window.speechSynthesis.getVoices(); window.speechSynthesis.onvoiceschanged = () => {}; }
  }, []);

  const today = P.todayStr();
  const offset = daysSinceEpoch(today);
  const daily = useMemo(() => ({
    feature: featureForDay(offset),
    lines: pick(LINES, 4, offset),
    scenario: SCENARIOS[offset % SCENARIOS.length],
  }), [offset]);

  function start() { sess.current = { xp: 0, features: [] }; setView(0); }

  function finishRound(xp, featureId) {
    sess.current.xp += xp;
    if (featureId && !sess.current.features.includes(featureId)) sess.current.features.push(featureId);
    setView((v) => (typeof v === "number" ? v + 1 : v));
  }

  function finishSession(xp) {
    sess.current.xp += xp;
    const next = P.recordSession(state, { day: today, xpEarned: sess.current.xp, features: sess.current.features });
    P.save(next);
    setState(next);
    setEarned(sess.current.xp);
    setView("summary");
  }

  return (
    <div className="app">
      {view !== "summary" && <ProgressHeader state={state} />}
      <main className="stage">
        {view === "home" && <Home state={state} onStart={start} doneToday={state.lastDay === today} />}
        {view === 0 && <SoundDrill feature={daily.feature} onComplete={(xp, id) => finishRound(xp, id)} />}
        {view === 1 && <Shadow lines={daily.lines} onComplete={(xp, id) => finishRound(xp, id)} />}
        {view === 2 && <Scenario scenario={daily.scenario} onComplete={(xp) => finishSession(xp)} />}
        {view === "summary" && <Summary earned={earned} state={state} features={sess.current.features} onDone={() => setView("home")} />}
      </main>
    </div>
  );
}
