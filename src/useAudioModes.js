import { useSyncExternalStore } from 'react';

// Keep selections across chat screens during this visit; activity can pause
// independently without changing either user's selected mode.
const defaults = { microphone: false, speaker: false };
let modes = defaults;
const listeners = new Set();
const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const setMode = (key, enabled) => {
  if (modes[key] === enabled) return;
  modes = { ...modes, [key]: enabled };
  listeners.forEach((listener) => listener());
};
export const setMicrophoneEnabled = (enabled) => setMode('microphone', enabled);
export const setSpeakerEnabled = (enabled) => setMode('speaker', enabled);
export const useAudioModes = () => useSyncExternalStore(subscribe, () => modes, () => defaults);
