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

export class WillowRequestError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'WillowRequestError';
    this.status = details.status;
    this.statusText = details.statusText;
    this.responseBody = details.responseBody;
    this.endpoint = details.endpoint;
    this.cause = details.cause;
  }
}

export const streamWillowMessage = async (messages, onToken, options = {}) => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const { signal, ...requestOptions } = options;
  const endpoint = `${supabaseUrl}/functions/v1/chat-with-guru`;
  let response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, stream: true, ...requestOptions }),
      signal,
    });
  } catch (cause) {
    throw new WillowRequestError(`Unable to reach the Willow service: ${cause.message}`, {
      endpoint,
      cause,
    });
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new WillowRequestError(
      `Willow service returned ${response.status} ${response.statusText}${errorText ? `: ${errorText}` : ''}`,
      {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText,
        endpoint,
      },
    );
  }

  if (!response.body) {
    throw new WillowRequestError('Willow service returned an empty streaming response.', {
      status: response.status,
      statusText: response.statusText,
      endpoint,
    });
  }

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
