import React, { useId, useState } from 'react';

export const PetalActionNote = ({ item, preferences, onSave, disabled, status }) => {
  const [draft, setDraft] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [enlarged, setEnlarged] = useState(false);
  const fieldId = useId();
  const noteId = useId();
  const note = preferences?.notes?.[item.id] ?? '';
  return <div className={`petal-action-note${enlarged ? ' is-enlarged' : ''}`}>
    {(draft !== null || (note && expanded)) && <button type="button" className="petal-note-link petal-note-size" aria-expanded={enlarged} onClick={() => setEnlarged(current => !current)}>{enlarged ? 'Minimize' : 'Expand note'}</button>}
    {draft === null ? <>
      {note ? <>
        <button type="button" className="petal-note-link" aria-expanded={expanded} aria-controls={noteId} onClick={() => { setExpanded(current => !current); setEnlarged(false); }}>My notes</button>
        <div id={noteId} hidden={!expanded}>
          <p className="petal-saved-note">{note}</p>
          <button type="button" className="petal-note-link" disabled={disabled} onClick={() => setDraft(note)}>Edit note</button>
        </div>
      </> : <button type="button" className="petal-note-link" disabled={disabled} aria-label={`Add note: ${item.text}`} onClick={() => setDraft('')}>Add note</button>}
    </> : <form onSubmit={event => {
      event.preventDefault();
      if (disabled) return;
      onSave(current => ({ ...current, notes: { ...(current?.notes ?? {}), [item.id]: draft.trim() } }));
      setDraft(null);
      setExpanded(false);
      setEnlarged(false);
    }}>
      <label htmlFor={fieldId}>Your note</label>
      <textarea id={fieldId} value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} autoFocus />
      <div className="petal-note-controls"><button type="submit" disabled={disabled}>Save note</button><button type="button" onClick={() => { setDraft(null); setEnlarged(false); }}>Cancel</button></div>
      {note && <small>Clear the text and save to remove this note.</small>}
    </form>}
    {status && <small role="status">{status}</small>}
  </div>;
};
