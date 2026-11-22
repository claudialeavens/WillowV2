import React, { createContext, useContext } from 'react';
import { Pin, PinOff } from 'lucide-react';
import { useTrackingRecord } from './useTrackingRecord';
import { togglePetalPin } from './petalInspiration';

const PetalPinContext = createContext(null);
export const PetalPinProvider = ({ userId, children }) => {
  // Retain the saved pause record: an existing held action becomes a pinned action.
  const { value: rotation, update: saveRotation, loading: rotationLoading, status: rotationStatus } = useTrackingRecord('petalRotation', userId, { paused: false, itemId: null }, `willow-petal-rotation:${userId ?? 'guest'}`);
  return <PetalPinContext.Provider value={{ rotation, saveRotation, rotationLoading, rotationStatus }}>{children}</PetalPinContext.Provider>;
};
export const usePetalPin = () => useContext(PetalPinContext);
export const PetalPinButton = ({ item, className = '', showLabel = false }) => {
  const { rotation, saveRotation, rotationLoading } = usePetalPin();
  const pinned = !!item && rotation?.paused && rotation.itemId === item.id;
  const label = pinned ? 'Unpin action item' : 'Pin action item';
  return <button type="button" className={`petal-pin-button ${className}`} aria-label={`${label}${showLabel ? '' : `: ${item?.text ?? ''}`}`} aria-pressed={!!pinned} title={pinned ? 'Unpin and allow profile rotation' : 'Keep this action in your profile menu'} disabled={!item || rotationLoading} onClick={event => {
    event.preventDefault();
    event.stopPropagation();
    if (item) saveRotation(current => togglePetalPin(current, item.id));
  }}>{pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}{showLabel && <span>{pinned ? 'Unpin from profile' : 'Pin to profile'}</span>}</button>;
};
