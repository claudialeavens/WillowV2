import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
import { mergeWellbeingReminders } from './wellbeingReminder';

const queues = new Map();
export const finishTrackingSaves = () => Promise.allSettled([...queues.values()]);
const enqueue = (key, task) => {
  const next = (queues.get(key) ?? Promise.resolve()).catch(() => {}).then(task);
  queues.set(key, next);
  return next;
};

export const useTrackingRecord = (kind, userId, initialValue, legacyKey) => {
  const key = `willow-tracking-v1:${userId ?? 'guest'}:${kind}`;
  const valid = (value) => kind === 'habit'
    ? typeof value?.title === 'string' && typeof value?.intention === 'string' && Array.isArray(value?.days) && value.days.every((day) => typeof day === 'string') && typeof value?.note === 'string' && (value.goals === undefined || (Array.isArray(value.goals) && value.goals.every((goal) => typeof goal?.id === 'string' && typeof goal?.title === 'string' && Array.isArray(goal?.days) && goal.days.every((day) => typeof day === 'string'))))
    : value === null || (typeof value?.text === 'string' && typeof value?.reason === 'string');
  const read = () => {
    try {
      const cached = JSON.parse(localStorage.getItem(key));
      if (cached && valid(cached.value)) return cached;
      const previous = (oldKind) => JSON.parse(localStorage.getItem(`willow-tracking-v1:${userId ?? 'guest'}:${oldKind}`))?.value
        ?? JSON.parse(localStorage.getItem(`willow-${oldKind}-reminder:${userId ?? 'guest'}`));
      const legacy = kind === 'wellbeing'
        ? mergeWellbeingReminders(previous('focus'), previous('intention'))
        : JSON.parse(localStorage.getItem(legacyKey));
      return { value: valid(legacy) ? legacy ?? initialValue : initialValue, pending: !!legacy && valid(legacy), legacy: !!legacy && valid(legacy) };
    } catch { return { value: initialValue, pending: false }; }
  };
  const cached = useRef(null);
  if (!cached.current) cached.current = read();
  const valueRef = useRef(cached.current.value);
  const [value, setValue] = useState(valueRef.current);
  const [loading, setLoading] = useState(!!userId);
  const [status, setStatus] = useState(userId ? 'Loading your saved updates…' : 'Saved in this browser on this device.');
  const alive = useRef(true);
  const cache = (record) => {
    cached.current = record;
    try { localStorage.setItem(key, JSON.stringify(record)); } catch { /* Cloud saving can still succeed. */ }
  };
  const saveCloud = (record) => enqueue(key, async () => {
    // Coalesce rapid reflection edits while retaining the latest pending value.
    if (cached.current !== record) return;
    const { data: sessionData, error: sessionError } = await supabase.auth.getUser();
    if (sessionError || sessionData.user?.id !== userId) throw sessionError ?? new Error('Account changed');
    const { error } = await supabase.auth.updateUser({ data: { [`willow_tracking_${kind}`]: record.value } });
    if (error) throw error;
    if (cached.current === record) {
      cached.current = { ...record, pending: false };
      try {
        const stored = JSON.parse(localStorage.getItem(key));
        if (stored?.revision === record.revision) localStorage.setItem(key, JSON.stringify(cached.current));
      } catch { /* The signed-in account remains the source of truth. */ }
    }
  });

  useEffect(() => {
    alive.current = true;
    let refreshing = false;
    const refresh = async () => {
      if (!userId || refreshing) return;
      refreshing = true;
      try {
        await (queues.get(key) ?? Promise.resolve()).catch(() => {});
        const beforeRead = cached.current;
        const { data: account, error } = await supabase.auth.getUser();
        if (error || account.user?.id !== userId) throw error ?? new Error('Account changed');
        let remote = account.user.user_metadata?.[`willow_tracking_${kind}`];
        if (cached.current !== beforeRead) return;
        if (kind === 'wellbeing' && remote == null && (!cached.current.pending || cached.current.legacy)) {
          const merged = mergeWellbeingReminders(account.user.user_metadata?.willow_tracking_focus, account.user.user_metadata?.willow_tracking_intention);
          if (merged) {
            valueRef.current = merged;
            cache({ value: merged, pending: true });
            if (alive.current) setValue(merged);
          }
        }
        if (remote != null && !valid(remote)) throw new Error('Invalid tracking data');
        // Existing account data wins over a one-time import of old browser data.
        const uploaded = cached.current.pending && (!cached.current.legacy || remote == null);
        if (uploaded) await saveCloud(cached.current);
        else if (cached.current.legacy && remote != null) cache({ value: remote, pending: false });
        const data = remote == null ? null : { value: remote };
        if (!alive.current) return;
        if (data && !uploaded && !cached.current.pending) {
          valueRef.current = data.value;
          cache({ value: data.value, pending: false });
          setValue(data.value);
        }
        setStatus('Saved to your account. Available on your other devices.');
      } catch {
        if (alive.current) setStatus('Account sync unavailable. Your updates stay on this device and will retry when you return or reconnect.');
      } finally {
        refreshing = false;
        if (alive.current) setLoading(false);
      }
    };
    void refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      alive.current = false;
      window.removeEventListener('online', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [key, userId, kind]);

  const update = useCallback((next) => {
    const nextValue = typeof next === 'function' ? next(valueRef.current) : next;
    valueRef.current = nextValue;
    setValue(nextValue);
    const record = { value: nextValue, pending: !!userId, revision: crypto.randomUUID() };
    cache(record);
    if (!userId) return;
    setStatus('Saving to your account…');
    void saveCloud(record).then(() => {
      if (alive.current && !cached.current.pending) setStatus('Saved to your account. Available on your other devices.');
    }).catch(() => {
      if (alive.current) setStatus('Account sync unavailable. Your updates stay on this device and will retry when you return or reconnect.');
    });
  }, [key, userId, kind]);
  return { value, update, loading, status };
};
