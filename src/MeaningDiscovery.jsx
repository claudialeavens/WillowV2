import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, Home, Leaf, Sparkles } from 'lucide-react';
import { DISCOVERY_PATHS, recommendedActivities } from './meaningDiscovery';
import { useTrackingRecord } from './useTrackingRecord';

export const MeaningDiscovery = ({ choice, userId, onBack, onHome, onChat }) => {
  const path = DISCOVERY_PATHS[choice] ?? DISCOVERY_PATHS['Not sure yet'];
  const [intentIndex, setIntentIndex] = useState(null);
  const [active, setActive] = useState(null);
  const [thought, setThought] = useState('');
  const [remember, setRemember] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { value: preference, update: savePreference, loading, status } = useTrackingRecord('discoveryPreference', userId, null, `willow-discovery-preference:${userId ?? 'guest'}`);
  const intent = intentIndex === null ? null : path.intents[intentIndex];
  const recommendations = intent ? recommendedActivities(choice, intentIndex) : [];
  const start = (activity) => {
    if (remember && intent) savePreference({ text: intent.title, reason: choice });
    setActive(activity);
  };
  const chat = (message) => onChat(message, { need: choice, intent: intent?.title ?? null, activityId: active?.id ?? null, stage: active ? 'reflect' : intent ? 'orient' : 'discover' });

  return <main className="page discovery-page">
    <nav className="tracking-navigation" aria-label="Page navigation">
      <button className="home-button back-button" type="button" aria-label="Go back" onClick={() => active ? setActive(null) : intent ? setIntentIndex(null) : onBack()}><ArrowLeft aria-hidden="true" /></button>
      <button className="home-button" type="button" aria-label="Return to home page" onClick={onHome}><Home aria-hidden="true" /></button>
    </nav>
    <section className="discovery-content" aria-labelledby="discovery-heading">
      <p className="discovery-eyebrow"><Leaf aria-hidden="true" /> Nourish &amp; Flourish</p>
      <h1 id="discovery-heading">{active ? active.title : intent ? 'Here’s a gentle place to begin.' : path.heading}</h1>
      <p className="discovery-intro">{active ? active.gain : intent ? `You’re looking to ${intent.title.charAt(0).toLowerCase() + intent.title.slice(1)}. Let’s try something small that fits.` : path.intro}</p>
      {!intent && !loading && preference?.reason === choice && !dismissed && <aside className="discovery-memory">
        <p>You asked Willow to remember: <strong>{preference.text}</strong></p>
        <div><button type="button" onClick={() => {
          const index = path.intents.findIndex((item) => item.title === preference.text);
          if (index >= 0) setIntentIndex(index);
        }}>Explore this again</button><button type="button" onClick={() => setDismissed(true)}>Not today</button><button type="button" onClick={() => savePreference(null)}>Forget this</button></div>
      </aside>}
      {!intent && <div className="discovery-starting-points" role="group" aria-label="What brings you here today?">
        <h2>What feels closest today?</h2>
        {path.intents.map((item, index) => <button key={item.title} type="button" onClick={() => setIntentIndex(index)}>
          <span className="discovery-choice-icon"><Heart aria-hidden="true" /></span><span><strong>{item.title}</strong><small>{item.caption}</small></span><ChevronRight aria-hidden="true" />
        </button>)}
      </div>}
      {intent && !active && <>
        <article className="discovery-recommendation">
          <p className="discovery-label"><Sparkles aria-hidden="true" /> A place to start · {recommendations[0].minutes} minutes</p>
          <h2>{recommendations[0].title}</h2><p>{recommendations[0].gain}</p>
          <button className="discovery-primary" type="button" onClick={() => start(recommendations[0])}>Try this <ArrowRight aria-hidden="true" /></button>
        </article>
        <section className="discovery-alternatives" aria-label="Two other ways in"><h2>Or take a different way in</h2>
          {recommendations.slice(1).map((item) => <button type="button" key={item.id} onClick={() => start(item)}><span><strong>{item.title}</strong><small>{item.type} · {item.minutes} minutes — {item.gain}</small></span><ChevronRight aria-hidden="true" /></button>)}
        </section>
        <label className="discovery-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember this direction when I start.<small>{userId ? 'Optional. Saved to your account; you can change or forget it next time.' : 'Optional. Saved in this browser; you can change or forget it next time.'}</small></span></label>
        {remember && <p className="discovery-save-status" role="status">{status}</p>}
      </>}
      {active && <article className="discovery-experience">
        <p className="discovery-label">{active.type} · About {active.minutes} minutes · Go at your pace</p>
        <ol>{active.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <p className="discovery-permission">Take what helps. You can pause, adapt this, or choose something else.</p>
        <button className="discovery-primary" type="button" onClick={() => chat(`I tried “${active.title}”. Help me reflect on what I noticed, one question at a time.`)}><Check aria-hidden="true" /> I’ve tried this</button>
        <button className="discovery-text-button" type="button" onClick={() => chat(`I'd like you to guide me through “${active.title}”, one small step at a time.`)}>Guide me through it</button>
      </article>}
      <form className="discovery-chat" onSubmit={(event) => { event.preventDefault(); if (thought.trim()) chat(thought.trim()); }}>
        <label htmlFor="discovery-thought">{active ? 'What did you notice? Or tell Willow what you need.' : 'Or start wherever you like'}</label>
        <div><input id="discovery-thought" value={thought} onChange={(event) => setThought(event.target.value)} placeholder="What’s on your mind?" /><button type="submit" disabled={!thought.trim()} aria-label="Talk with Willow"><ArrowRight aria-hidden="true" /></button></div>
      </form>
    </section>
  </main>;
};
