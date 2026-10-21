// Notify microphone consumers synchronously, before preview audio can start.
let active = false;
const listeners = new Set();

export const isVoicePreviewActive = () => active;
export const setVoicePreviewActive = (value) => {
  active = value;
  listeners.forEach((listener) => listener(active));
};
export const subscribeVoicePreview = (listener) => {
  listeners.add(listener);
  listener(active);
  return () => listeners.delete(listener);
};
