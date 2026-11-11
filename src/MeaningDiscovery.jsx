import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, Home, Leaf, Sparkles } from 'lucide-react';
import { DISCOVERY_PATHS } from './meaningDiscovery';
import { discoveryFollowUp, sessionOutcomeQuestion, sessionTakeawayQuestion, tailoredApproaches } from './discoveryQuestions';
import { DiscoveryOther } from './DiscoveryOther';
import { CustomMeaningDiscovery } from './CustomMeaningDiscovery';
import { useTrackingRecord } from './useTrackingRecord';

export const MeaningDiscovery = ({ choice, userId, onBack, onHome, onChat }) => {
  const path = DISCOVERY_PATHS[choice] ?? DISCOVERY_PATHS['Not sure yet'];
  const [customDraft, setCustomDraft] = useState(null);
  const [customAnswers, setCustomAnswers] = useState(null);
  const [intentIndex, setIntentIndex] = useState(null);
  const [active, setActive] = useState(null);
  const [needIndex, setNeedIndex] = useState(null);
  const [fitIndex, setFitIndex] = useState(null);
  const [outcomeIndex, setOutcomeIndex] = useState(null);
  const [takeawayIndex, setTakeawayIndex] = useState(null);
  const [thought, setThought] = useState('');
  const [remember, setRemember] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const headingRef = useRef(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [intentIndex, needIndex, fitIndex, outcomeIndex, takeawayIndex, active]);
  const { value: preference, update: savePreference, loading, status } = useTrackingRecord('discoveryPreference', userId, null, `willow-discovery-preference:${userId ?? 'guest'}`);
  const intent = intentIndex === null ? null : path.intents[intentIndex];
  const firstQuestion = intent ? discoveryFollowUp(choice, intentIndex) : null;
  const need = needIndex === null ? null : firstQuestion?.options[needIndex];
  const secondQuestion = need ? discoveryFollowUp(choice, intentIndex, needIndex) : null;
  const fit = fitIndex === null ? null : secondQuestion?.options[fitIndex];
  const thirdQuestion = fit ? sessionOutcomeQuestion(choice, intentIndex, needIndex, fitIndex) : null;
  const outcome = outcomeIndex === null ? null : thirdQuestion?.options[outcomeIndex];
  const fourthQuestion = outcome ? sessionTakeawayQuestion(choice, intentIndex, needIndex, fitIndex, outcomeIndex) : null;
  const takeaway = takeawayIndex === null ? null : fourthQuestion?.options[takeawayIndex];
  const question = outcome ? fourthQuestion : fit ? thirdQuestion : need ? secondQuestion : firstQuestion;
  const approaches = tailoredApproaches(choice, intentIndex, needIndex, fitIndex, outcomeIndex, takeawayIndex);
  const recommendation = approaches[0] ?? null;
  const selectIntent = (index) => { setIntentIndex(index); setNeedIndex(null); setFitIndex(null); setOutcomeIndex(null); setTakeawayIndex(null); setActive(null); };
  const goBack = () => {
    if (active) setActive(null);
    else if (takeaway) setTakeawayIndex(null);
    else if (outcome) setOutcomeIndex(null);
    else if (fit) setFitIndex(null);
    else if (need) setNeedIndex(null);
    else if (intent) selectIntent(null);
    else onBack();
  };
  const start = (activity) => {
    if (remember && intent) savePreference({ text: intent.title, reason: choice });
    setActive(activity);
  };
  const chat = (message) => onChat(message, { need: choice, intent: intent?.title ?? null, answers: [need?.title, fit?.title, outcome?.title, takeaway?.title].filter(Boolean), hopedOutcome: outcome?.title ?? null, desiredTakeaway: takeaway?.title ?? null, approaches: approaches.map(({ id, approach, title, steps }) => ({ id, approach, title, steps })), approach: active?.approach ?? null, activityId: active?.id ?? null, activityTitle: active?.title ?? null, activitySteps: active?.steps ?? null, stage: active ? 'reflect' : recommendation ? 'orient' : 'discover' });

  const customStage = outcome ? 4 : fit ? 3 : need ? 2 : intent ? 1 : 0;
  const customInitialValue = customDraft?.stage === customStage ? customDraft.text : '';
  const continueCustom = (answer) => {
    setCustomDraft({ stage: customStage, text: answer });
    const previous = [
      { question: 'What feels closest today?', answer: intent?.title },
      { question: firstQuestion?.question, answer: need?.title },
      { question: secondQuestion?.question, answer: fit?.title },
      { question: thirdQuestion?.question, answer: outcome?.title },
    ].filter(item => item.answer);
    setCustomAnswers([...previous, { question: intent ? question.question : 'What feels closest today?', answer }]);
  };
  if (customAnswers) return <CustomMeaningDiscovery choice={choice} initialAnswers={customAnswers} onBack={() => setCustomAnswers(null)} onHome={onHome} onChat={onChat} />;

  return <main className="page discovery-page">
    <nav className="tracking-navigation" aria-label="Page navigation">
      <button className="home-button back-button" type="button" aria-label="Go back" onClick={goBack}><ArrowLeft aria-hidden="true" /></button>
      <button className="home-button" type="button" aria-label="Return to home page" onClick={onHome}><Home aria-hidden="true" /></button>
    </nav>
    <section className="discovery-content" aria-labelledby="discovery-heading">
      <p className="discovery-eyebrow"><Leaf aria-hidden="true" /> Nourish &amp; Flourish</p>
      <h1 id="discovery-heading" ref={headingRef} tabIndex={-1}>{active ? active.title : recommendation ? 'Three ways to explore what fits.' : intent ? 'Let’s get a little closer.' : path.heading}</h1>
      <p className="discovery-intro">{active ? active.gain : recommendation ? `You’re hoping to ${outcome.title.toLowerCase()} and leave with ${takeaway.title.toLowerCase()}. Choose the approach that feels right for you.` : outcome ? `You’re hoping to ${outcome.title.toLowerCase()}. Let’s make the finish useful to you.` : fit ? `“${fit.title}” feels like a fit. Let’s shape this time around what you need from it.` : need ? `You chose “${need.title}”. Let’s find what would feel right in practice.` : intent ? `You chose “${intent.title}”. Let’s find the part of that you most want support with.` : path.intro}</p>
      {!intent && !loading && preference?.reason === choice && !dismissed && <aside className="discovery-memory">
        <p>You asked Willow to remember: <strong>{preference.text}</strong></p>
        <div><button type="button" onClick={() => {
          const index = path.intents.findIndex((item) => item.title === preference.text);
          if (index >= 0) selectIntent(index);
        }}>Explore this again</button><button type="button" onClick={() => setDismissed(true)}>Not today</button><button type="button" onClick={() => savePreference(null)}>Forget this</button></div>
      </aside>}
      {!intent && <div className="discovery-starting-points" role="group" aria-label="What brings you here today?">
        <h2>What feels closest today?</h2>
        {path.intents.slice(0, 3).map((item, index) => <button key={item.title} type="button" onClick={() => selectIntent(index)}>
          <span className="discovery-choice-icon"><Heart aria-hidden="true" /></span><span><strong>{item.title}</strong><small>{item.caption}</small></span><ChevronRight aria-hidden="true" />
        </button>)}
        <DiscoveryOther initialValue={customInitialValue} onSubmit={continueCustom} />
      </div>}
      {intent && !takeaway && <div className="discovery-starting-points" role="group" aria-labelledby="discovery-follow-up-heading">
        <p className="discovery-label">A little closer · {outcome ? '4' : fit ? '3' : need ? '2' : '1'} of 4</p>
        <h2 id="discovery-follow-up-heading">{question.question}</h2>
        {question.options.map((item, index) => <button key={item.title} type="button" onClick={() => {
          if (outcome) setTakeawayIndex(index);
          else if (fit) setOutcomeIndex(index);
          else if (need) setFitIndex(index);
          else { setNeedIndex(index); setFitIndex(null); }
        }}><span className="discovery-choice-icon"><Leaf aria-hidden="true" /></span><span><strong>{item.title}</strong><small>{item.caption}</small></span><ChevronRight aria-hidden="true" /></button>)}
        <DiscoveryOther key={`other-${needIndex}-${fitIndex}-${outcomeIndex}`} initialValue={customInitialValue} onSubmit={continueCustom} />
      </div>}
      {recommendation && !active && <>
        {approaches.map((suggestion) => <article className="discovery-recommendation" key={suggestion.approach}>
          <p className="discovery-label"><Sparkles aria-hidden="true" /> {suggestion.type} · {suggestion.minutes} minutes</p>
          <h2>{suggestion.title}</h2><p>{suggestion.gain}</p>
          <button className="discovery-primary" type="button" onClick={() => start(suggestion)}>{suggestion.approach === 'conversation' ? 'Explore with Willow' : 'Try this'} <ArrowRight aria-hidden="true" /></button>
        </article>)}
        <button className="discovery-text-button" type="button" onClick={() => { setFitIndex(null); setNeedIndex(null); setOutcomeIndex(null); setTakeawayIndex(null); }}>Change my answers</button>
        <label className="discovery-remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Remember this direction when I start.<small>{userId ? 'Optional. Saved to your account; you can change or forget it next time.' : 'Optional. Saved in this browser; you can change or forget it next time.'}</small></span></label>
        {remember && <p className="discovery-save-status" role="status">{status}</p>}
      </>}
      {active && <article className="discovery-experience">
        <p className="discovery-label">{active.type} · About {active.minutes} minutes · Go at your pace</p>
        <ol>{active.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        <button className="discovery-text-button" type="button" onClick={() => setActive(null)}>See the three approaches</button>
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
