import React, { useState } from 'react';
import { ArrowRight, ChevronRight, Pencil } from 'lucide-react';

export const DiscoveryOther = ({ onSubmit, initialValue = '' }) => {
  const [editing, setEditing] = useState(Boolean(initialValue));
  const [text, setText] = useState(initialValue);
  if (!editing) return <button type="button" onClick={() => setEditing(true)}><span className="discovery-choice-icon"><Pencil aria-hidden="true" /></span><span><strong>Other (edit)</strong><small>Use your own words and continue with guided questions</small></span><ChevronRight aria-hidden="true" /></button>;
  return <form className="discovery-other" onSubmit={(event) => { event.preventDefault(); if (text.trim()) onSubmit(text.trim()); }}>
    <label>Your own answer<textarea autoFocus value={text} maxLength={1000} onChange={(event) => setText(event.target.value)} placeholder="What feels closer for you?" rows={3} /></label>
    <p>This stays in guided discovery. Your answer helps shape the next question.</p>
    <button className="discovery-primary" type="submit" disabled={!text.trim()}>Continue <ArrowRight aria-hidden="true" /></button>
    <button className="discovery-text-button" type="button" onClick={() => setEditing(false)}>Cancel</button>
  </form>;
};
