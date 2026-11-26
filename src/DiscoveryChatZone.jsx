import React, { useId, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { BreakSupport } from './BreakSupport';
import { DiscoveryResumeLink } from './DiscoveryResumeLink';

export const DiscoveryChatZone = ({ choice, item, userId, getContext, onActiveChange, onHome, onConversationChanged }) => {
  const [thought, setThought] = useState('');
  const [focused, setFocused] = useState(false);
  const [session, setSession] = useState(null);
  const fieldId = useId();
  const activate = () => { setFocused(true); onActiveChange(true); };
  if (session) return <div className="pinned-inline-chat"><BreakSupport
    key={session.saved?.id ?? 'new'} userId={userId} mode={session.saved?.mode ?? 'core'}
    savedConversation={session.saved ?? null} initialMessage={session.message ?? ''}
    entryContext={{ activity: item ? 'My petals' : 'Move towards what matters', selection: choice, discovery: { ...getContext(), ...(item ? { pinnedAction: item.text, pinnedActionId: item.id } : {}) } }}
    onHome={onHome} onConversationChanged={onConversationChanged}
  /></div>;
  return <form className="discovery-chat" onSubmit={event => {
    event.preventDefault();
    if (thought.trim()) { activate(); setSession({ message: thought.trim() }); }
  }}>
    <div className="pinned-chat-entry-links">
      <DiscoveryResumeLink userId={userId} choice={choice} item={item} onResume={saved => { activate(); setSession({ saved }); }} />
      <label htmlFor={fieldId}>Or start wherever you like</label>
      {focused && <button type="button" className="pinned-resume-link" onClick={() => { setFocused(false); onActiveChange(false); }}>Show choices</button>}
    </div>
    <div><input id={fieldId} value={thought} onFocus={activate} onChange={event => setThought(event.target.value)} placeholder="What’s on your mind?" /><button type="submit" disabled={!thought.trim()} aria-label="Talk with Willow"><ArrowRight aria-hidden="true" /></button></div>
  </form>;
};
