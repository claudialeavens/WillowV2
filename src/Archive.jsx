import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import { getArchive, getLocalArchive } from './conversationStore';

const dateLabel = (value) => new Date(value).toLocaleString(undefined, {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  hour: 'numeric', minute: '2-digit',
});
const entryType = (entry) => entry.summary?.kind === 'activity' ? 'Activity'
  : entry.summary?.activity || 'Conversation';

export const Archive = ({ userId, onClose }) => {
  const [entries, setEntries] = useState(() => getLocalArchive(userId));
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [syncState, setSyncState] = useState(userId ? 'loading' : 'local');
  const searchRef = useRef(null);

  useEffect(() => {
    let active = true;
    const previousFocus = document.activeElement;
    searchRef.current?.focus();
    const handleEscape = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEscape);
    document.body.classList.add('modal-open');
    void getArchive(userId).then((result) => {
      if (!active) return;
      setEntries(result.records);
      setSyncState(result.synced ? 'synced' : 'local');
    }).catch(() => { if (active) setSyncState('local'); });
    return () => {
      active = false;
      document.removeEventListener('keydown', handleEscape);
      document.body.classList.remove('modal-open');
      previousFocus?.focus();
    };
  }, [userId, onClose]);

  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const visible = entries.filter((entry) => {
    const activity = entry.summary?.kind === 'activity';
    if (filter === 'activities' && !activity || filter === 'conversations' && activity) return false;
    const text = [entry.title, entryType(entry), dateLabel(entry.created_at), entry.created_at,
      entry.summary?.focus, entry.summary?.whereLeftOff, entry.summary?.selection, entry.summary?.takeaway,
      ...(entry.summary?.highlights ?? []), ...(entry.messages ?? []).map((m) => m.content)]
      .join(' ').toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return createPortal(
    <div className="auth-overlay" onClick={onClose}>
      <section className="archive-modal" role="dialog" aria-modal="true" aria-labelledby="archive-title"
        onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const controls = [...event.currentTarget.querySelectorAll('button, input, select')].filter((el) => !el.disabled);
          const first = controls[0], last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}>
        <button className="auth-close" onClick={onClose} aria-label="Close archive"><X aria-hidden="true" /></button>
        <p className="auth-kicker">Your Willow history</p>
        <h2 id="archive-title">Archive</h2>
        <p className="archive-note" role="status">{syncState === 'loading' ? 'Loading saved account history…'
          : syncState === 'synced' ? 'Saved conversations and practices. Times shown in your local time zone.'
            : userId ? 'Showing history saved on this device. Account sync is unavailable.'
              : 'Saved on this device. Sign in to sync new entries across devices.'}</p>
        <div className="archive-search">
          <label><Search aria-hidden="true" /><span className="sr-only">Search archive</span>
            <input ref={searchRef} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scattered, meditation, a date…" /></label>
          <select aria-label="Archive entry type" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All entries</option><option value="conversations">Conversations</option><option value="activities">Activities</option>
          </select>
        </div>
        {selected ? <article className="archive-detail">
          <button className="archive-back" onClick={() => setSelected(null)}>← Back to results</button>
          <p className="auth-kicker">{entryType(selected)}</p><h3>{selected.title}</h3>
          <time dateTime={selected.created_at}>{dateLabel(selected.created_at)}</time>
          {selected.summary?.selection && <p>You chose: {selected.summary.selection}</p>}
          <h4>Summary</h4><p>{selected.summary?.focus}</p><p>{selected.summary?.whereLeftOff}</p>
          {selected.summary?.takeaway && <><h4>A takeaway to remember</h4><p>{selected.summary.takeaway}</p></>}
          {!!selected.summary?.highlights?.length && <ul>{selected.summary.highlights.map((text, i) => <li key={i}>{text}</li>)}</ul>}
          {!!selected.messages?.length && <><h4>Conversation</h4>{selected.messages.filter((m) => m.content?.trim()).map((message, i) =>
            <div className={`archive-message ${message.role}`} key={i}><strong>{message.role === 'user' ? 'You' : 'Willow'}</strong><p>{message.content}</p></div>)}</>}
        </article> : <div className="archive-results">
          <p className="archive-note">{visible.length} {visible.length === 1 ? 'entry' : 'entries'}</p>
          {!visible.length && <p>{entries.length ? 'No entries match your search.' : 'Your conversations and practices will appear here as you use Willow.'}</p>}
          {visible.map((entry) => <button className="archive-entry" key={entry.id} onClick={() => setSelected(entry)}>
            <span className="archive-entry-type">{entryType(entry)}</span><strong>{entry.title}</strong>
            <time dateTime={entry.created_at}>{dateLabel(entry.created_at)}</time>
            {entry.summary?.selection && <span>You chose: {entry.summary.selection}</span>}
            <span>{entry.summary?.whereLeftOff}</span>
          </button>)}
        </div>}
      </section>
    </div>, document.body,
  );
};
