import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Users, Sprout, Sun, Leaf, Heart, ListChecks, ChevronRight, X, SquarePen, Check, Plus } from 'lucide-react';
import { getArchive, getLocalArchive, createConversationId } from './conversationStore';
import { archiveRecommendations, PETAL_NAMES } from './petalRecommendations';
import { useTrackingRecord } from './useTrackingRecord';
import { reviewArchivePetals } from './archivePetalReview';
import { addCustomPetalAction, customPetalActions, editPetalAction, applyPetalEdits } from './customPetalActions';

import { PetalPinButton } from './PetalPin';

const ICONS = [Users, Sprout, Sun, Leaf, Heart, ListChecks];
export const MyPetals = ({ userId, flower, onContinue }) => {
  const [archive, setArchive] = useState(() => ({ records: getLocalArchive(userId), loading: true, synced: false }));
  const [review, setReview] = useState({ items: null, state: 'loading', progress: '' });
  const [editing, setEditing] = useState(null);
  const [itemDraft, setItemDraft] = useState(null);
  const [draft, setDraft] = useState(null);
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
  const recommendations = applyPetalEdits([...(review.items ?? archiveItems), ...customPetalActions(preferences)], preferences);
  const dismissed = preferences?.dismissed ?? [];
  const visible = recommendations.filter(item => !dismissed.includes(item.id));
  return <>
    <p className="my-petals-status" role="status">{archive.loading ? 'Loading your archive…' : review.state === 'loading' ? `Reviewing your archive for action items… ${review.progress}` : `${visible.length} action items${preferences?.custom?.length ? ' from your conversations and custom additions' : ' from your archived conversations'}.`}{review.state === 'partial' && ' Full review is temporarily unavailable; showing extracted items. Reopen My petals to retry.'}{!archive.loading && userId && !archive.synced && ' Account history is unavailable; showing what is saved on this device.'}</p>
    <div className="my-petals-garden">
      <div className="my-petals-flower">{flower}</div>
      {PETAL_NAMES.map((petal, index) => {
        const Icon = ICONS[index];
        const items = visible.filter(item => item.petal === petal);
        const isEditing = editing === petal;
        const hiddenIds = recommendations.filter(item => item.petal === petal && dismissed.includes(item.id)).map(item => item.id);
        const adding = draft?.petal === petal;
        const cancelAdd = () => {
          setDraft(null);
          setEditing(null);
          setItemDraft(null);
        };
        const saveAction = () => {
          if (!adding || !draft.text.trim() || editsLoading) return;
          const id = `custom:${createConversationId()}`;
          savePreferences(current => addCustomPetalAction(current, petal, draft.text, id));
          setDraft(null);
        };
        return <section key={petal} className={`petal-recommendations petal-recommendations-${index}`} aria-labelledby={`petal-recommendations-${index}`}>
          <div className="petal-box-controls"><h2 id={`petal-recommendations-${index}`}>{petal}</h2><span className="petal-edit-controls">{(items.length > 0 || adding) && <button type="button" className="petal-edit-button" aria-label={`${adding ? 'Save new action item for' : 'Add action item to'} ${petal}`} title={adding ? 'Save action item' : 'Add action item'} disabled={editsLoading || (adding && !draft.text.trim())} onClick={() => { if (adding) saveAction(); else { setItemDraft(null); setDraft({ petal, text: '' }); } }}>{adding ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}</button>}{adding && <button type="button" className="petal-edit-button" aria-label={`Cancel new action item for ${petal}`} title="Cancel action item" onClick={cancelAdd}><X aria-hidden="true" /></button>}{!adding && items.length > 0 && <button type="button" className="petal-edit-button" aria-label={`${isEditing ? 'Done editing' : 'Edit action items for'} ${petal}`} title={isEditing ? 'Done editing' : 'Edit action items'} aria-pressed={isEditing} disabled={editsLoading} onClick={() => { setEditing(isEditing ? null : petal); setDraft(null); setItemDraft(null); }}>{isEditing ? <Check aria-hidden="true" /> : <SquarePen aria-hidden="true" />}</button>}</span></div>
          <ul>{items.map(item => <li key={item.id}>
            {itemDraft?.id === item.id ? <form className="petal-add-form petal-item-edit-form" onSubmit={event => {
              event.preventDefault();
              if (!itemDraft.text.trim() || editsLoading) return;
              savePreferences(current => editPetalAction(current, item.id, itemDraft.text));
              setItemDraft(null);
            }}>
              <label><span className="sr-only">Edit action item</span><textarea aria-label={`Edit action item: ${item.text}`} value={itemDraft.text} onChange={event => setItemDraft({ id: item.id, text: event.target.value })} maxLength={500} required autoFocus /></label>
              <div><button type="submit" aria-label="Save action item changes" title="Save changes" disabled={!itemDraft.text.trim() || editsLoading}><Check aria-hidden="true" /></button><button type="button" aria-label="Cancel action item changes" title="Cancel changes" onClick={() => setItemDraft(null)}><X aria-hidden="true" /></button></div>
            </form> : <>
              <button type="button" className="petal-recommendation" onClick={() => setSelected(item)}><Icon className="petal-item-icon" aria-hidden="true" /><span>{item.text}</span><ChevronRight aria-hidden="true" /></button>
              <PetalPinButton item={item} className="petal-item-pin" />
              {isEditing && <span className="petal-item-controls"><button type="button" className="petal-hide" aria-label={`Edit action item: ${item.text}`} title="Edit action item" disabled={editsLoading} onClick={() => { setDraft(null); setItemDraft({ id: item.id, text: item.text }); }}><SquarePen aria-hidden="true" /></button><button type="button" className="petal-hide" aria-label={`Hide recommendation: ${item.text}`} title="Remove action item" disabled={editsLoading} onClick={() => savePreferences(current => ({ ...current, dismissed: [...(current?.dismissed ?? []), item.id] }))}><X aria-hidden="true" /></button></span>}
            </>}
          </li>)}</ul>
          {adding ? <form className="petal-add-form" onSubmit={event => {
            event.preventDefault();
            saveAction();
          }}>
            <label>New action item<textarea aria-label={`New action item for ${petal}`} value={draft.text} onChange={event => setDraft({ petal, text: event.target.value })} maxLength={500} required autoFocus /></label>
            <div><button type="submit" disabled={!draft.text.trim() || editsLoading}>Add</button><button type="button" onClick={cancelAdd}>Cancel</button></div>
          </form> : items.length === 0 && <button type="button" className="petal-add-empty" disabled={editsLoading} onClick={() => { setItemDraft(null); setDraft({ petal, text: '' }); }}><Plus aria-hidden="true" />Add action item</button>}
          {isEditing && <div className="petal-box-edit-status">{hiddenIds.length > 0 && <button type="button" onClick={() => savePreferences(current => ({ ...current, dismissed: (current?.dismissed ?? []).filter(id => !hiddenIds.includes(id)) }))}>Restore hidden items</button>}<p role="status">{editStatus}</p></div>}
        </section>;
      })}
    </div>
    <dialog ref={dialog} className="whole-self-dialog petal-source-dialog" aria-labelledby="petal-source-heading" onClose={() => setSelected(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      {selected && <div className="whole-self-dialog-content"><button type="button" className="whole-self-close" aria-label="Close recommendation" onClick={() => dialog.current?.close()} autoFocus><X aria-hidden="true" /></button><h2 id="petal-source-heading">{selected.petal}</h2><p>{selected.text}</p><div className="petal-popup-pin"><PetalPinButton item={selected} showLabel /></div><p className="petal-source-label">{selected.role === 'assistant' ? 'Suggested by Willow' : selected.role === 'user' ? 'From your words' : selected.role === 'takeaway' ? 'From a conversation takeaway' : 'Saved by you'} · {selected.sourceTitle}</p>{selected.record && <details className="petal-source-conversation"><summary>Review source conversation</summary>{selected.record.summary?.takeaway && <p>{selected.record.summary.takeaway}</p>}{selected.record.messages?.filter(message => ['user', 'assistant'].includes(message.role)).map((message, index) => <div key={index}><strong>{message.role === 'user' ? 'You' : 'Willow'}</strong><p>{message.content}</p></div>)}</details>}<button type="button" className="tracking-continue" onClick={() => { dialog.current?.close(); onContinue(selected); }}>Work on this with Willow <ChevronRight aria-hidden="true" /></button></div>}
    </dialog>
  </>;
};
