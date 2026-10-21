import { useSyncExternalStore } from 'react';

export const SPEAKER_VOICES = [
  { id: 'nova', name: 'Nova' },
  { id: 'onyx', name: 'Onyx' },
  { id: 'fable', name: 'Fable' },
  { id: 'echo', name: 'Echo' },
];
const STORAGE_KEY = 'willow:speaker-voice';
const normalize = (voice) => SPEAKER_VOICES.some((option) => option.id === voice) ? voice : 'nova';
const listeners = new Set();
let selectedVoice = 'nova';
try {
  selectedVoice = normalize(window.localStorage.getItem(STORAGE_KEY));
} catch { /* Nova remains available when browser storage is unavailable. */ }

const notify = () => listeners.forEach((listener) => listener());
const onStorage = (event) => {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  selectedVoice = normalize(event.newValue);
  notify();
};
const subscribe = (listener) => {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener('storage', onStorage);
  };
};
const getSnapshot = () => selectedVoice;
const setVoice = (voice) => {
  selectedVoice = normalize(voice);
  try {
    window.localStorage.setItem(STORAGE_KEY, selectedVoice);
  } catch { /* Keep the preference for this visit even without storage. */ }
  notify();
};

export const useVoicePreference = () => [
  useSyncExternalStore(subscribe, getSnapshot, () => 'nova'),
  setVoice,
];
