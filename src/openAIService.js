const unwrapMessageContent = (text) => {
  const trimmed = text.trim();
  const withoutFence = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const parsed = JSON.parse(withoutFence);
    if (parsed && typeof parsed.message === 'string') return parsed.message.trim();
  } catch {
    // Most responses are plain text.
  }

  return trimmed;
};

export const streamWillowMessage = async (messages, onToken, options = {}) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const { signal, ...requestOptions } = options;
  const response = await fetch(`${supabaseUrl}/functions/v1/chat-with-guru`, {
    method: 'POST',
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, stream: true, ...requestOptions }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Streaming request failed with status ${response.status}`);
  }

  if (!response.body) throw new Error('Streaming response body was empty.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (!chunk) continue;
      fullText += chunk;
      onToken(chunk);
    }

    const finalChunk = decoder.decode();
    if (finalChunk) {
      fullText += finalChunk;
      onToken(finalChunk);
    }
  } finally {
    reader.releaseLock();
  }

  return unwrapMessageContent(fullText);
};
