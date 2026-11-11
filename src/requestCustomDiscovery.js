import { customDiscoveryMessages, DiscoveryFormatError, parseCustomDiscovery } from './customDiscovery.js';

// Keep one guided step in place while retrying a malformed or transient response.
export const requestCustomDiscovery = async ({ choice, answers, signal, request }) => {
  const complete = answers.length >= 5;
  const messages = customDiscoveryMessages(choice, answers);
  for (let attempt = 0; attempt < 2; attempt++) {
    signal?.throwIfAborted();
    try {
      const raw = await request(messages, () => {}, { signal, maxTokens: complete ? 2200 : 850, temperature: attempt ? 0.2 : 0.5 });
      return parseCustomDiscovery(raw, complete);
    } catch (error) {
      const retryable = error instanceof DiscoveryFormatError || error.status === 429 || error.status >= 500 || (error.name === 'WillowRequestError' && !error.status);
      if (signal?.aborted || attempt === 1 || !retryable) throw error;
      if (error instanceof DiscoveryFormatError) messages.push({ role: 'system', content: 'The previous response did not match the required format. Return only the requested JSON object, with exactly three options or approaches. Use integer factorId values 0–9 for approaches and exactly the required type names. Do not add commentary.' });
    }
  }
};
