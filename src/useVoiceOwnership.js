import { useEffect, useRef } from 'react';

export const useVoiceOwnership = (onTakenOver) => {
  const channel = useRef(null);
  const releaseLock = useRef(null);
  const pending = useRef(null);
  const generation = useRef(0);
  const onTakenOverRef = useRef(onTakenOver);
  onTakenOverRef.current = onTakenOver;

  const release = () => {
    generation.current += 1;
    releaseLock.current?.();
    releaseLock.current = null;
    pending.current = null;
  };

  useEffect(() => {
    if (!window.BroadcastChannel) return undefined;
    const connection = new BroadcastChannel('willow-voice-input');
    channel.current = connection;
    connection.onmessage = () => {
      release();
      onTakenOverRef.current();
    };
    return () => {
      release();
      connection.close();
      channel.current = null;
    };
  }, []);

  const acquire = () => {
    if (!navigator.locks || !window.BroadcastChannel) return Promise.resolve(false);
    if (releaseLock.current) return Promise.resolve(true);
    if (pending.current) return pending.current;
    const attempt = ++generation.current;
    channel.current?.postMessage('claim');
    pending.current = new Promise((resolve) => {
      navigator.locks.request('willow-voice-input', async () => {
        if (attempt !== generation.current || document.hidden) {
          resolve(false);
          return;
        }
        await new Promise((unlock) => {
          releaseLock.current = unlock;
          resolve(true);
        });
      }).catch(() => resolve(false));
    });
    return pending.current;
  };

  return { acquire, release };
};
