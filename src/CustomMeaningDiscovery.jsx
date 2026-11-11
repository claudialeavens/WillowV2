import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Home, Leaf } from 'lucide-react';
import { DiscoveryOther } from './DiscoveryOther';
import { DiscoveryFormatError } from './customDiscovery';
import { requestCustomDiscovery } from './requestCustomDiscovery';
import { streamWillowMessage } from './openAIService';

export const CustomMeaningDiscovery = ({ choice, initialAnswers, onBack, onHome, onChat }) => {
  const [answers, setAnswers] = useState(initialAnswers);
  const [screens, setScreens] = useState({});
  const [customDrafts, setCustomDrafts] = useState({});
  const [retry, setRetry] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);
  const [thought, setThought] = useState('');
  const heading = useRef(null);
  const screen = screens[answers.length];
  useEffect(() => {
    if (screen) return;
    let disposed = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    setLoading(true); setError('');
    (async () => {
      try {
        const next = await requestCustomDiscovery({ choice, answers, signal: controller.signal, request: streamWillowMessage });
        if (!controller.signal.aborted) setScreens(current => ({ ...current, [answers.length]: next }));
      } catch (requestError) {
        if (!disposed) {
          // Log only technical metadata, never the person's answers or response text.
          console.warn('Guided discovery request failed', { name: requestError.name, status: requestError.status ?? null, stage: answers.length });
          const reason = controller.signal.aborted ? 'The next step took too long to arrive.' : requestError instanceof DiscoveryFormatError ? 'Willow’s response didn’t come through in a usable format.' : 'We couldn’t connect to Willow to prepare the next step.';
          setError(`${reason} Your answer is still here. Please try again; you don’t need to change what you wrote.`);
        }
      } finally {
        clearTimeout(timeout);
        if (!disposed) setLoading(false);
      }
    })();
    return () => { disposed = true; clearTimeout(timeout); controller.abort(); };
  }, [answers, choice, retry, screen]);
  useEffect(() => { heading.current?.focus({ preventScroll: true }); }, [screen, active]);
  const choose = (answer) => {
    const length = answers.length + 1;
    setScreens(current => Object.fromEntries(Object.entries(current).filter(([key]) => Number(key) < length)));
    setAnswers(current => [...current, { question: screen.question, answer }]);
  };
  const back = () => {
    if (active) { setActive(null); return; }
    if (answers.length > initialAnswers.length) {
      setError(''); setLoading(false); setAnswers(current => current.slice(0, -1));
    } else onBack();
  };
  const chat = (message) => onChat(message, { need: choice, intent: answers[0].answer, answers: answers.slice(1).map(item => item.answer), guidedAnswers: answers, hopedOutcome: answers[3]?.answer ?? null, desiredTakeaway: answers[4]?.answer ?? null, approaches: screen?.approaches ?? [], activityTitle: active?.title ?? null, activitySteps: active?.steps ?? null, activityFactor: active?.factor ?? null, approach: active?.approach ?? null, stage: active ? 'reflect' : screen?.approaches ? 'orient' : 'discover' });
  return <main className="page discovery-page">
    <nav className="tracking-navigation" aria-label="Page navigation"><button className="home-button back-button" type="button" aria-label="Go back" onClick={back}><ArrowLeft aria-hidden="true" /></button><button className="home-button" type="button" aria-label="Return to home page" onClick={onHome}><Home aria-hidden="true" /></button></nav>
    <section className="discovery-content" aria-labelledby="custom-discovery-heading">
      <p className="discovery-eyebrow"><Leaf aria-hidden="true" /> Nourish &amp; Flourish</p>
      <h1 id="custom-discovery-heading" tabIndex={-1} ref={heading}>{active ? active.title : screen?.approaches ? 'Three ways to explore what fits.' : 'Let’s get a little closer.'}</h1>
      <p className="discovery-intro">{active ? active.gain : <>You shared: “{answers.at(-1).answer}”</>}</p>
      {loading && !screen && <p role="status">Shaping the next step around your answer…</p>}
      {error && <div role="alert"><p>{error}</p><button className="discovery-primary" type="button" onClick={() => { setLoading(false); setRetry(value => value + 1); }}>Try again</button></div>}
      {screen?.question && <div className="discovery-starting-points" role="group" aria-labelledby="custom-question-heading">
        <p className="discovery-label">A little closer · {answers.length} of 4</p><h2 id="custom-question-heading">{screen.question}</h2>
        {screen.options.map(item => <button key={item.title} type="button" onClick={() => choose(item.title)}><span className="discovery-choice-icon"><Leaf aria-hidden="true" /></span><span><strong>{item.title}</strong><small>{item.caption}</small></span><ChevronRight aria-hidden="true" /></button>)}
        <DiscoveryOther key={answers.length} initialValue={customDrafts[answers.length] ?? ''} onSubmit={(answer) => { setCustomDrafts(current => ({ ...current, [answers.length]: answer })); choose(answer); }} />
      </div>}
      {screen?.approaches && !active && <>{screen.approaches.map(item => <article className="discovery-recommendation" key={item.approach}><p className="discovery-label">{item.type} · {item.minutes} minutes</p><h2>{item.title}</h2><p>{item.gain}</p><button className="discovery-primary" type="button" onClick={() => setActive(item)}>Try this <ArrowRight aria-hidden="true" /></button></article>)}<button className="discovery-text-button" type="button" onClick={onBack}>Change my earlier answers</button></>}
      {active && <article className="discovery-experience"><p className="discovery-label">{active.type} · About {active.minutes} minutes · Go at your pace</p><ol>{active.steps.map((step, index) => <li key={index}>{step}</li>)}</ol><button className="discovery-text-button" type="button" onClick={() => setActive(null)}>See the three approaches</button><p className="discovery-permission">Take what helps. You can pause, adapt this, or choose something else.</p><button className="discovery-primary" type="button" onClick={() => chat(`I tried “${active.title}”. Help me reflect on what I noticed, one question at a time.`)}><Check aria-hidden="true" /> I’ve tried this</button><button className="discovery-text-button" type="button" onClick={() => chat(`Guide me through “${active.title}”, one small step at a time.`)}>Guide me through it</button></article>}
      <form className="discovery-chat" onSubmit={(event) => { event.preventDefault(); if (thought.trim()) chat(thought.trim()); }}><label htmlFor="custom-discovery-chat">Or open a conversation with Willow</label><div><input id="custom-discovery-chat" value={thought} onChange={event => setThought(event.target.value)} placeholder="What’s on your mind?" /><button type="submit" disabled={!thought.trim()} aria-label="Talk with Willow"><ArrowRight aria-hidden="true" /></button></div></form>
    </section>
  </main>;
};
