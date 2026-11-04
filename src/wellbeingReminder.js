// Keep both earlier reminders when moving to the combined wellbeing intention.
export const mergeWellbeingReminders = (focus, intention) => {
  const texts = [...new Set([focus?.text, intention?.text].filter((text) => typeof text === 'string' && text.trim()))];
  if (!texts.length) return null;
  const reasons = [...new Set([focus?.reason, intention?.reason].filter((text) => typeof text === 'string' && text.trim()))];
  return { text: texts.join('\n\n'), reason: reasons.join('\n\n') };
};
