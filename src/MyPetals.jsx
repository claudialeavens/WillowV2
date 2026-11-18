import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users, Sprout, Sun, Leaf, Heart, ListChecks, ChevronRight, X, SquarePen, Check } from 'lucide-react';
import { getArchive, getLocalArchive } from './conversationStore';
import { archiveRecommendations, PETAL_NAMES } from './petalRecommendations';
import { useTrackingRecord } from './useTrackingRecord';
import { reviewArchivePetals } from './archivePetalReview';

const ICONS = [Users, Sprout, Sun, Leaf, Heart, ListChecks];
export const MyPetals = ({ userId, flower, onContinue }) => {
  const [archive, setArchive] = useState(() => ({ records: getLocalArchive(userId), loading: true, synced: false }));
  const [review, setReview] = useState({ items: null, state: 'loading', progress: '' });
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const dialog = useRef(null);
  const { value: preferences, update: savePreferences, status: editStatus, loading: editsLoading } = useTrackingRecord('petalRecommendations', userId, { dismissed: [] }, `willow-petal-recommendations:${userId ?? 'guest'}`);
  useEffect(() => {
    let active = true;
    void getArchive(userId).then(result => { if (active) setArchive({ ...result, loading: false }); }).catch(() => { if (active) setArchive(current => ({ ...current, loading: false })); });
    return () => { active = false; };
  }, [userId]);
  useEffect(() => {
    if (archive.loading) return undefined;
    const controller = new AbortController();
    setReview({ items: null, state: 'loading', progress: '' });
    void reviewArchivePetals(archive.records, userId, {
      signal: controller.signal,
      onProgress: (done, total) => { if (!controller.signal.aborted) setReview(current => ({ ...current, progress: `${done} of ${total} conversations reviewed` })); },
    }).then(result => { if (!controller.signal.aborted) setReview({ items: result.items, state: result.complete ? 'complete' : 'partial', progress: '' }); })
      .catch(() => { if (!controller.signal.aborted) setReview({ items: null, state: 'partial', progress: '' }); });
    return () => controller.abort();
  }, [archive.records, archive.loading, userId]);
  useEffect(() => { if (selected) dialog.current?.showModal(); }, [selected]);
  const archiveItems = useMemo(() => archiveRecommendations(archive.records, userId), [archive.records, userId]);
  const recommendations = review.items ?? archiveItems;
  const dismissed = preferences?.dismissed ?? [];
  const visible = recommendations.filter(item => !dismissed.includes(item.id));
  return <>
    <p className="my-petals-status" role="status">{archive.loading ? 'Loading your archive…' : review.state === 'loading' ? `Reviewing your archive for action items… ${review.progress}` : `${visible.length} action items from your archived conversations.`}{review.state === 'partial' && ' Full review is temporarily unavailable; showing extracted items. Reopen My petals to retry.'}{!archive.loading && userId && !archive.synced && ' Account history is unavailable; showing what is saved on this device.'}</p>
    <div className="my-petals-garden">
      <div className="my-petals-flower">{flower}</div>
      {PETAL_NAMES.map((petal, index) => {
        const Icon = ICONS[index];
        const items = visible.filter(item => item.petal === petal);
        const isEditing = editing === petal;
        const hiddenIds = recommendations.filter(item => item.petal === petal && dismissed.includes(item.id)).map(item => item.id);
        if (items.length === 0 && !isEditing) return null;
        return <section key={petal} className={`petal-recommendations petal-recommendations-${index}`} aria-labelledby={`petal-recommendations-${index}`}>
          <div className="petal-box-controls"><h2 id={`petal-recommendations-${index}`}>{petal}</h2><button type="button" className="petal-edit-button" aria-label={`${isEditing ? 'Done editing' : 'Edit action items for'} ${petal}`} title={isEditing ? 'Done editing' : 'Edit action items'} aria-pressed={isEditing} disabled={editsLoading} onClick={() => setEditing(isEditing ? null : petal)}>{isEditing ? <Check aria-hidden="true" /> : <SquarePen aria-hidden="true" />}</button></div>
          <ul>{items.map(item => <li key={item.id}><button type="button" className="petal-recommendation" onClick={() => setSelected(item)}><Icon className="petal-item-icon" aria-hidden="true" /><span>{item.text}</span><ChevronRight aria-hidden="true" /></button>{isEditing && <button type="button" className="petal-hide" aria-label={`Hide recommendation: ${item.text}`} onClick={() => savePreferences(current => ({ dismissed: [...(current?.dismissed ?? []), item.id] }))}><X aria-hidden="true" /></button>}</li>)}</ul>
          {isEditing && <div className="petal-box-edit-status">{hiddenIds.length > 0 && <button type="button" onClick={() => savePreferences(current => ({ dismissed: (current?.dismissed ?? []).filter(id => !hiddenIds.includes(id)) }))}>Restore hidden items</button>}<p role="status">{editStatus}</p></div>}
        </section>;
      })}
    </div>
    <dialog ref={dialog} className="whole-self-dialog petal-source-dialog" aria-labelledby="petal-source-heading" onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      {selected && <div className="whole-self-dialog-content"><button type="button" className="whole-self-close" aria-label="Close recommendation" onClick={() => dialog.current?.close()} autoFocus><X aria-hidden="true" /></button><h2 id="petal-source-heading">{selected.petal}</h2><p>{selected.text}</p><p className="petal-source-label">{selected.role === 'assistant' ? 'Suggested by Willow' : selected.role === 'user' ? 'From your words' : selected.role === 'takeaway' ? 'From a conversation takeaway' : 'Saved by you'} · {selected.sourceTitle}</p>{selected.record && <details className="petal-source-conversation"><summary>Review source conversation</summary>{selected.record.summary?.takeaway && <p>{selected.record.summary.takeaway}</p>}{selected.record.messages?.filter(message => ['user', 'assistant'].includes(message.role)).map((message, index) => <div key={index}><strong>{message.role === 'user' ? 'You' : 'Willow'}</strong><p>{message.content}</p></div>)}</details>}<button type="button" className="tracking-continue" onClick={() => { dialog.current?.close(); onContinue(selected); }}>Work on this with Willow <ChevronRight aria-hidden="true" /></button></div>}
    </dialog>
  </>;
};
