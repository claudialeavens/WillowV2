import { useEffect, useState } from 'react';
import { useTrackingRecord } from './useTrackingRecord';
import { LANDING_QUOTES, localDay, selectDailyQuote } from './dailyLandingQuote';

export const useDailyLandingQuote = (userId, conversation) => {
  const [day, setDay] = useState(localDay);
  const { value: saved, update, loading } = useTrackingRecord('dailyQuote', userId, null, `willow-daily-quote:${userId ?? 'guest'}`);
  useEffect(() => {
    const refreshDay = () => setDay(localDay());
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    const timer = setTimeout(refreshDay, Math.max(1, tomorrow.getTime() - Date.now()));
    window.addEventListener('focus', refreshDay);
    return () => { clearTimeout(timer); window.removeEventListener('focus', refreshDay); };
  }, [day]);
  useEffect(() => {
    if (!userId || loading || (saved?.day === day && LANDING_QUOTES.some((quote) => quote.id === saved.quoteId))) return;
    const selection = selectDailyQuote(conversation, day, userId);
    if (selection) update(selection);
  }, [userId, conversation, day, saved, loading, update]);
  if (!userId || loading || saved?.day !== day || conversation?.user_id !== userId) return null;
  return LANDING_QUOTES.find((quote) => quote.id === saved.quoteId) ?? null;
};
