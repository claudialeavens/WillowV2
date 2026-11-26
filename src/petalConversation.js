export function findPetalConversation(records, item) {
  const conversations = records.filter(record => record.messages?.some(message => message.role === 'user'));
  const related = conversations.filter(record => {
    const discovery = record.summary?.discovery;
    return discovery?.pinnedActionId === item.id || discovery?.pinnedAction === item.text || discovery?.desiredTakeaway === item.text;
  }).sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return related[0] ?? conversations.find(record => record.id === item.sourceId) ?? null;
}

export function findDiscoveryConversation(records, choice) {
  return records.filter(record => record.messages?.some(message => message.role === 'user') &&
    (record.summary?.discovery?.need === choice ||
      (record.summary?.activity === 'Move towards what matters' && record.summary.selection === choice)))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0] ?? null;
}
