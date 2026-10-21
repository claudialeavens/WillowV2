// Web Speech does not expose a cross-browser echo-cancelled input stream.
// Suppress verbatim fragments of the current reply before accepting dictation.
const words = (text) => text.toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

export function isPlaybackEcho(transcript, reply) {
  const fragment = words(transcript);
  return !fragment || ` ${words(reply)} `.includes(` ${fragment} `);
}
