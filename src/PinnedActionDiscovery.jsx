import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Heart, Home, Leaf } from 'lucide-react';
import { CustomMeaningDiscovery } from './CustomMeaningDiscovery';
import { DiscoveryOther } from './DiscoveryOther';
import { BreakSupport } from './BreakSupport';
import { getArchive } from './conversationStore';
import { findPetalConversation } from './petalConversation';

const OPTIONS = [
  { title: 'Understand what matters to me about this', caption: 'Unpack the meaning, hopes, or feelings behind it' },
  { title: 'Work through what feels stuck', caption: 'Explore what is getting in the way, at my pace' },
  { title: 'Find a manageable next step', caption: 'Turn this intention into something I can begin' },
];
export const PinnedActionDiscovery = ({ item, userId, onBack, onHome, onChat, onConversationChanged }) => {
  const [answer, setAnswer] = useState(null);
  const [thought, setThought] = useState('');
  const [focused, setFocused] = useState(false);
  const [previous, setPrevious] = useState(null);
  const [session, setSession] = useState(null);
  useEffect(() => {
    let active = true;
    void getArchive(userId).then(({ records }) => { if (active) setPrevious(findPetalConversation(records, item)); }).catch(() => {});
    return () => { active = false; };
  }, [userId, item]);
  const discovery = { need: item.petal, pinnedAction: item.text, pinnedActionId: item.id, stage: 'discover' };
  const chat = (message, context = {}) => onChat(message, { ...discovery, ...context, pinnedAction: item.text, pinnedActionId: item.id });
  if (answer) return <CustomMeaningDiscovery userId={userId} item={item} onResume={saved => { setAnswer(null); setFocused(true); setSession({ saved }); }} choice={item.petal} initialAnswers={[
    { question: 'What pinned action would you like to explore?', answer: item.text },
    { question: 'How would you like to explore this?', answer },
  ]} onBack={() => setAnswer(null)} onHome={onHome} onChat={chat} />;
  return <main className={`page discovery-page${focused || session ? ' pinned-chat-active' : ''}`}>
    <nav className="tracking-navigation" aria-label="Page navigation"><button className="home-button back-button" type="button" aria-label="Go back" onClick={onBack}><ArrowLeft aria-hidden="true" /></button><button className="home-button" type="button" aria-label="Return to home page" onClick={onHome}><Home aria-hidden="true" /></button></nav>
    <section className="discovery-content" aria-labelledby="pinned-discovery-heading">
      <p className="discovery-eyebrow"><Leaf aria-hidden="true" /> Nourish &amp; Flourish · {item.petal}</p>
      <h1 id="pinned-discovery-heading">{item.text.charAt(0).toUpperCase() + item.text.slice(1)}</h1>
      <p className="discovery-intro">Let’s explore this possibility together.</p>
      <div hidden={focused || !!session} className="discovery-starting-points" role="group" aria-labelledby="pinned-question-heading">
        <h2 id="pinned-question-heading">How would you like to explore this?</h2>
        {OPTIONS.map(option => <button key={option.title} type="button" onClick={() => setAnswer(option.title)}><span className="discovery-choice-icon"><Heart aria-hidden="true" /></span><span><strong>{option.title}</strong><small>{option.caption}</small></span><ChevronRight aria-hidden="true" /></button>)}
        <DiscoveryOther initialValue={answer ?? ''} onSubmit={setAnswer} />
      </div>
      {session ? <div className="pinned-inline-chat"><BreakSupport key={session.saved?.id ?? 'new'} mode={session.saved?.mode ?? 'core'} userId={userId} savedConversation={session.saved ?? null} initialMessage={session.message ?? ''} entryContext={{ activity: 'My petals', selection: item.petal, discovery }} onHome={onHome} onConversationChanged={onConversationChanged} /></div> : <form className="discovery-chat" onSubmit={event => { event.preventDefault(); if (thought.trim()) setSession({ message: thought.trim() }); }}>
        <div className="pinned-chat-entry-links">
          {previous && <button type="button" className="pinned-resume-link" onClick={() => { setFocused(true); setSession({ saved: previous }); }}>Pick up where we left off</button>}
          <label htmlFor="pinned-discovery-thought">Or start wherever you like</label>
          {focused && <button type="button" className="pinned-resume-link" onClick={() => setFocused(false)}>Show choices</button>}
        </div>
        <div><input id="pinned-discovery-thought" value={thought} onFocus={() => setFocused(true)} onChange={event => setThought(event.target.value)} placeholder="What’s on your mind?" /><button type="submit" disabled={!thought.trim()} aria-label="Talk with Willow"><ArrowRight aria-hidden="true" /></button></div>
      </form>}
    </section>
  </main>;
};
