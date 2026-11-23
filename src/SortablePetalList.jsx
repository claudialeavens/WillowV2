import React, { useEffect, useId, useRef, useState } from 'react';

export const SortablePetalList = ({ items, disabled, onReorder, getClassName, children }) => {
  const list = useRef(null);
  const drag = useRef(null);
  const autoScrollFrame = useRef(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const instructions = useId();
  const ranked = new Map((preview ?? items.map(item => item.id)).map((id, index) => [id, index]));
  const ordered = [...items].sort((a, b) => (ranked.get(a.id) ?? items.length) - (ranked.get(b.id) ?? items.length));
  useEffect(() => () => { if (autoScrollFrame.current !== null) cancelAnimationFrame(autoScrollFrame.current); }, []);
  const finish = save => {
    if (autoScrollFrame.current !== null) cancelAnimationFrame(autoScrollFrame.current);
    autoScrollFrame.current = null;
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (save && current.active && current.ids.some((id, index) => id !== current.original[index])) {
      onReorder(current.ids);
      setAnnouncement(`Moved action to position ${current.ids.indexOf(current.id) + 1} of ${current.ids.length}.`);
    }
    setPreview(null);
    setDragging(null);
  };
  const updatePreview = () => {
    const current = drag.current;
    if (!current?.active || !list.current) return;
    const rect = list.current.getBoundingClientRect();
    if (current.clientY < rect.top + 25) list.current.scrollTop -= 10;
    if (current.clientY > rect.bottom - 25) list.current.scrollTop += 10;
    const y = current.clientY + list.current.scrollTop - current.scrollTop;
    let target = 0;
    current.centers.forEach((center, index) => { if (Math.abs(y - center) < Math.abs(y - current.centers[target])) target = index; });
    const ids = current.original.filter(id => id !== current.id);
    ids.splice(target, 0, current.id);
    if (ids.join('\0') !== current.ids.join('\0')) { current.ids = ids; setPreview(ids); }
  };
  const autoScroll = () => {
    autoScrollFrame.current = null;
    if (!drag.current?.active) return;
    updatePreview();
    autoScrollFrame.current = requestAnimationFrame(autoScroll);
  };
  const movePointer = event => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.active && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6) return;
    current.active = true;
    current.clientY = event.clientY;
    setDragging(current.id);
    updatePreview();
    if (autoScrollFrame.current === null) autoScrollFrame.current = requestAnimationFrame(autoScroll);
  };
  return <>
    <span className="sr-only" id={instructions}>Drag to reorder within this petal, or use the up and down arrow keys.</span>
    <span className="sr-only" role="status">{announcement}</span>
    <ul ref={list} onPointerMove={movePointer} onPointerUp={() => finish(true)} onPointerCancel={() => finish(false)} onLostPointerCapture={() => finish(false)} className={dragging ? 'petal-sort-active' : undefined}>
      {ordered.map(item => <li key={item.id} data-sortable-action={item.id} className={[getClassName(item), dragging === item.id ? 'is-dragging' : ''].filter(Boolean).join(' ') || undefined}>
        {children(item, {
          type: 'button',
          className: 'petal-drag-handle',
          'aria-label': `Move action item: ${item.text}`,
          'aria-describedby': instructions,
          'aria-keyshortcuts': 'ArrowUp ArrowDown',
          title: 'Drag to reorder; arrow keys also move this item',
          disabled: disabled || items.length < 2,
          onPointerDown: event => {
            if (event.button !== 0 || disabled || items.length < 2) return;
            event.preventDefault();
            event.currentTarget.focus({ preventScroll: true });
            list.current.setPointerCapture(event.pointerId);
            const original = ordered.map(value => value.id);
            drag.current = { id: item.id, pointerId: event.pointerId, original, ids: original, active: false, x: event.clientX, y: event.clientY, scrollTop: list.current.scrollTop, centers: [...list.current.children].map(row => { const rect = row.getBoundingClientRect(); return rect.top + rect.height / 2; }) };
          },
          onKeyDown: event => {
            if (event.key === 'Escape' && drag.current) { event.preventDefault(); finish(false); return; }
            if (!['ArrowUp', 'ArrowDown'].includes(event.key) || disabled) return;
            event.preventDefault();
            const ids = ordered.map(value => value.id);
            const from = ids.indexOf(item.id);
            const to = Math.max(0, Math.min(ids.length - 1, from + (event.key === 'ArrowUp' ? -1 : 1)));
            if (from === to) return;
            ids.splice(from, 1); ids.splice(to, 0, item.id);
            const handle = event.currentTarget;
            onReorder(ids);
            requestAnimationFrame(() => handle.focus({ preventScroll: true }));
            setAnnouncement(`Moved action to position ${to + 1} of ${ids.length}.`);
          },
        })}
      </li>)}
    </ul>
  </>;
};
