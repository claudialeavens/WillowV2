import React, { useEffect, useState } from 'react';
import { getArchive } from './conversationStore';
import { findDiscoveryConversation, findPetalConversation } from './petalConversation';

export const DiscoveryResumeLink = ({ userId, choice, item, onResume }) => {
  const [previous, setPrevious] = useState(null);
  useEffect(() => {
    let active = true;
    setPrevious(null);
    void getArchive(userId).then(({ records }) => {
      if (active) setPrevious(item ? findPetalConversation(records, item) : findDiscoveryConversation(records, choice));
    }).catch(() => {});
    return () => { active = false; };
  }, [userId, choice, item]);
  return previous && onResume ? <button type="button" className="pinned-resume-link" onClick={() => onResume(previous)}>Pick up where we left off</button> : null;
};
