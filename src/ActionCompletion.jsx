import React from 'react';
import { Check, Minus, Plus } from 'lucide-react';

export const ActionCompletion = ({ item, count, onChange, disabled }) => count === 0
  ? <button type="button" className="petal-complete-first" aria-label={`Mark action item complete: ${item.text}`} title="Mark complete" disabled={disabled} onClick={() => onChange(1)} />
  : <span className="petal-completion-controls"><span className="petal-completed-mark" aria-hidden="true"><Check /></span><span className="petal-completion-pill" role="group" aria-label={`Completions for ${item.text}`}>
    <button type="button" aria-label={`Decrease completion count: ${item.text}`} title="Decrease count" disabled={disabled} onClick={() => onChange(-1)}><Minus aria-hidden="true" /></button>
    <span role="status" aria-label={`Completed ${count} ${count === 1 ? 'time' : 'times'}`}>{count}×</span>
    <button type="button" aria-label={`Increase completion count: ${item.text}`} title="Complete again" disabled={disabled} onClick={() => onChange(1)}><Plus aria-hidden="true" /></button>
  </span></span>;
