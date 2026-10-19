import { supabase } from './supabase';

const STORAGE_KEY = 'willow_conversations_v1';

const readLocalConversations = () => {
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeLocalConversations = (conversations) => {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(conversations),
  );
};

const saveLocalConversation = (conversation) => {
  const conversations = readLocalConversations().filter((item) => item.id !== conversation.id);
  writeLocalConversations(
    [conversation, ...conversations].sort(
      (left, right) => new Date(right.updated_at) - new Date(left.updated_at),
    ),
  );
};

export const createConversationId = () =>
  window.crypto?.randomUUID?.() ?? `willow-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const buildConversationSummary = (messages, phaseAssessment) => {
  const userMessages = messages.filter((message) => message.role === 'user' && message.content.trim());
  const assistantMessages = messages.filter(
    (message) => message.role === 'assistant' && message.content.trim(),
  );
  const opening = userMessages[0]?.content.trim() ?? '';
  const latest = assistantMessages.at(-1)?.content.trim() ?? '';
  const phase = phaseAssessment?.phase
    ? `${phaseAssessment.phase.charAt(0)}${phaseAssessment.phase.slice(1).toLowerCase()}`
    : 'Conversation';
  const focus = opening.length > 120 ? `${opening.slice(0, 117)}…` : opening;
  const whereLeftOff = latest.length > 180 ? `${latest.slice(0, 177)}…` : latest;

  return {
    phase,
    focus: focus || 'You were finding the right place to begin.',
    whereLeftOff: whereLeftOff || 'Willow was listening for what would help next.',
    highlights: userMessages.slice(-3).map((message) => message.content.trim().slice(0, 180)),
  };
};

export const getLocalArchive = (userId) =>
  readLocalConversations().filter((record) => record.user_id === (userId ?? null));

export const getArchive = async (userId) => {
  const records = new Map(getLocalArchive(userId).map((record) => [record.id, record]));
  if (!userId) return { records: [...records.values()], synced: false };
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.from('willow_conversations')
      .select('*').eq('user_id', userId).order('created_at', { ascending: false })
      .order('id').range(offset, offset + 99);
    if (error) return { records: [...records.values()], synced: false };
    for (const record of data ?? []) {
      const local = records.get(record.id);
      if (!local || record.updated_at >= local.updated_at) records.set(record.id, record);
    }
    if (!data || data.length < 100) break;
    offset += 100;
  }
  const merged = [...records.values()];
  try {
    writeLocalConversations([
      ...readLocalConversations().filter((record) => record.user_id !== userId), ...merged,
    ].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
  } catch (error) {
    console.warn('Unable to cache account history on this device.', error);
  }
  return { records: merged, synced: true };
};

export const recordActivity = (title, userId) => {
  const now = new Date().toISOString();
  return saveConversation({
    id: createConversationId(), mode: 'break', title, messages: [],
    summary: { kind: 'activity', focus: title, whereLeftOff: 'Started this practice.' },
    created_at: now, updated_at: now,
  }, userId);
};

export const saveConversation = async (conversation, userId) => {
  const record = { ...conversation, user_id: userId ?? null };
  saveLocalConversation(record);
  if (!userId) return record;

  const { error } = await supabase.from('willow_conversations').upsert(record, { onConflict: 'id' });
  if (error) {
    console.warn('Conversation saved locally; Supabase sync was unavailable.', error);
  }
  return record;
};

export const getLatestConversation = async (userId) => {
  if (!userId) return null;

  const { data, error } = await supabase
    .from('willow_conversations')
    .select('*')
    .eq('user_id', userId)
    .not('messages', 'eq', '[]')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!error && data?.user_id === userId) {
    saveLocalConversation(data);
    return data;
  }
  if (error) console.warn('Using account-owned local history; Supabase load was unavailable.', error);

  return readLocalConversations().find((conversation) => conversation.user_id === userId && conversation.messages?.length) ?? null;
};

export const deleteConversation = async (conversationId, userId) => {
  writeLocalConversations(
    readLocalConversations().filter((conversation) => conversation.id !== conversationId),
  );
  if (!userId) return;
  const { error } = await supabase.from('willow_conversations').delete().eq('id', conversationId);
  if (error) console.warn('Conversation removed locally; Supabase deletion was unavailable.', error);
};
