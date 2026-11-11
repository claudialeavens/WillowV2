import React, { useId, useState } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, Pencil } from 'lucide-react';

export const DiscoveryOther = ({ onSubmit, initialValue = '' }) => {
  const [editing, setEditing] = useState(Boolean(initialValue));
  const [text, setText] = useState(initialValue);
  const inputId = useId();
  return <div className="discovery-other">
    <button className="discovery-other-toggle" type="button" aria-expanded={editing} aria-controls={`${inputId}-form`} onClick={() => setEditing(value => !value)}>
      <span className="discovery-choice-icon"><Pencil aria-hidden="true" /></span>
      <span><strong>I had something else in mind...</strong><small>Use your own words and continue with guided questions</small></span>
      {editing ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
    </button>
    {editing && <form id={`${inputId}-form`} onSubmit={(event) => { event.preventDefault(); if (text.trim()) onSubmit(text.trim()); }}>
      <textarea id={inputId} aria-label="Your own answer" autoFocus value={text} maxLength={1000} onChange={(event) => setText(event.target.value)} placeholder="Type here..." rows={3} />
      <button className="discovery-primary" type="submit" disabled={!text.trim()}>Continue <ArrowRight aria-hidden="true" /></button>
    </form>}
  </div>;
};
