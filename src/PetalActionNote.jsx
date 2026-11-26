import React, { useId, useState } from 'react';

export const PetalActionNote = ({ item, preferences, onSave, disabled, status }) => {
  const [draft, setDraft] = useState(null);
  const fieldId = useId();
  const note = preferences?.notes?.[item.id] ?? '';
  return <div className="petal-action-note">
    {draft === null ? <>
      {note && <p className="petal-saved-note">{note}</p>}
      <button type="button" disabled={disabled} aria-label={`${note ? 'Edit note' : 'Add a note'}: ${item.text}`} onClick={() => setDraft(note)}>{note ? 'Edit note' : 'Add a note'}</button>
    </> : <form onSubmit={event => {
      event.preventDefault();
      if (disabled) return;
      onSave(current => ({ ...current, notes: { ...(current?.notes ?? {}), [item.id]: draft.trim() } }));
      setDraft(null);
    }}>
      <label htmlFor={fieldId}>Your note</label>
      <textarea id={fieldId} value={draft} onChange={event => setDraft(event.target.value)} maxLength={2000} autoFocus />
      <div className="petal-note-controls"><button type="submit" disabled={disabled}>Save note</button><button type="button" onClick={() => setDraft(null)}>Cancel</button></div>
      {note && <small>Clear the text and save to remove this note.</small>}
    </form>}
    {status && <small role="status">{status}</small>}
  </div>;
};
