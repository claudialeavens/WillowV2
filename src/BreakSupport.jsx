import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { streamWillowMessage } from './openAIService';
import { createAudioBlob, generateSpeech } from './textToSpeech';

const BREAK_INTRO_MESSAGE =
  'I’m really glad you reached out for a break. That signal matters.\n\n' +
  'If you’re open to it, share what feels most true right now so I can guide you toward the kind of break you actually need.\n\n' +
  'For example: what feels heaviest, what feels depleted, or what’s making today feel like too much?';

const BREAK_SUPPORT_PROMPT = `You are Willow, a thoughtful, compassionate, and insightful conversational partner providing calm support to someone who said they need a break.

Be warm, calm, empathetic, nonjudgmental, respectful, gently upbeat, and natural. Avoid clinical, directive, prescriptive, or productivity-focused language.

Conversation approach:
- First acknowledge the emotional tone and validate overwhelm, exhaustion, uncertainty, or pressure without judgment.
- Gently explore what feels heaviest or depleted. Ask one meaningful question at a time.
- Reflect values, hopes, strengths, care for others, and effort when they appear.
- Do not rush to solutions. When helpful, offer one small manageable step or exactly three concise numbered options.
- Present suggestions as choices, not instructions, and preserve the user’s autonomy.
- If the user selects a numbered option, acknowledge that exact choice and explain the next practical step without replacing it with a new list.
- If options do not resonate, validate that and ask one gentle clarifying question before suggesting more.
- Keep responses short, human, and readable. Avoid repeating the same opener or emotional summary each turn.
- Guide toward either greater clarity, a small restorative action, or one focused reflection question.`;

const OPTION_PATTERN = /^\s*(?:\d+[.)]|[-*•–—])\s+(.+?)\s*$/;

const cleanOption = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const parseOptions = (content) => {
  const before = [];
  const after = [];
  const options = [];
  let foundOption = false;

  content
    .replace(/\r\n/g, '\n')
    .replace(/(?<!\n)(\d+[.)]\s+)/g, '\n$1')
    .split('\n')
    .forEach((line) => {
      const match = line.match(OPTION_PATTERN);
      if (match && options.length < 3) {
        foundOption = true;
        options.push(cleanOption(match[1]));
        return;
      }
      (foundOption ? after : before).push(line);
    });

  return {
    before: before.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    after: after.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    options,
  };
};

const AssistantMessage = ({ content, onOption, optionsEnabled }) => {
  const parsed = parseOptions(content);
  if (!parsed.options.length) return <p>{content}</p>;

  return (
    <div className="break-option-message">
      {parsed.before && <p>{parsed.before}</p>}
      <div className="break-response-options">
        {parsed.options.map((option) => (
          <button type="button" key={option} onClick={() => onOption(option)} disabled={!optionsEnabled}>
            {option}
          </button>
        ))}
      </div>
      {parsed.after && <p>{parsed.after}</p>}
    </div>
  );
};

export const BreakSupport = () => {
  const [messages, setMessages] = useState([{ role: 'assistant', content: BREAK_INTRO_MESSAGE }]);
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const submitRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef('');

  let latestAssistantIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].role === 'assistant') {
      latestAssistantIndex = index;
      break;
    }
  }
  const latestAssistant = latestAssistantIndex >= 0 ? messages[latestAssistantIndex] : undefined;
  const speechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;

  const submitMessage = async (messageText, displayText = messageText) => {
    const trimmed = messageText.trim();
    if (!trimmed || isResponding) return;

    const nextMessages = [...messages, { role: 'user', content: displayText.trim() }];
    const assistantIndex = nextMessages.length;
    setMessages([...nextMessages, { role: 'assistant', content: '' }]);
    setInput('');
    setError('');
    setIsResponding(true);

    const previousReply = latestAssistant?.content?.slice(0, 220) ?? '';
    const requestMessages = nextMessages.map((message, index) =>
      index === nextMessages.length - 1
        ? {
            role: 'user',
            content:
              `${BREAK_SUPPORT_PROMPT}\n\n` +
              (previousReply ? `Avoid reusing wording from your previous reply: "${previousReply}".\n\n` : '') +
              `User input: ${trimmed}`,
          }
        : message,
    );

    try {
      let streamedReply = '';
      await streamWillowMessage(
        requestMessages,
        (token) => {
          streamedReply += token;
          setMessages((current) =>
            current.map((message, index) =>
              index === assistantIndex ? { ...message, content: streamedReply } : message,
            ),
          );
        },
        { maxTokens: 220, temperature: 0.7 },
      );
      window.localStorage.setItem('willow-general-activity-at', String(Date.now()));
    } catch (requestError) {
      console.error('Failed to get break-support response:', requestError);
      setMessages((current) =>
        current.map((message, index) =>
          index === assistantIndex && !message.content.trim()
            ? { ...message, content: 'I could not respond just now. Please try again.' }
            : message,
        ),
      );
      setError('I could not respond just now. Please try again.');
    } finally {
      setIsResponding(false);
    }
  };

  submitRef.current = submitMessage;

  const selectOption = (option) => {
    const prompt =
      `The user selected this option: "${option}". Respond in no more than 85 words total. ` +
      'Explain only what they are to do next in concise practical prose. Do not present new options, ' +
      'numbered lists, bullet lists, or a closing question. Use one short practical paragraph, then one ' +
      'brief invitation to share how it feels or what is on their mind.';
    void submitMessage(prompt, option);
  };

  const stopListening = () => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startListening = () => {
    if (!speechConstructor || isResponding || isSpeaking) {
      if (!speechConstructor) setError('Voice input is not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new speechConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      let finalText = '';

      recognition.onresult = (event) => {
        let interimText = '';
        for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
          const transcript = event.results[index]?.[0]?.transcript?.trim() ?? '';
          if (event.results[index]?.isFinal) finalText = `${finalText} ${transcript}`.trim();
          else interimText = `${interimText} ${transcript}`.trim();
        }

        const preview = `${finalText} ${interimText}`.trim();
        setInput(preview);
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => {
          const message = finalText.trim() || preview;
          finalText = '';
          if (message) void submitRef.current?.(message);
        }, /[.!?…]$/.test(preview) ? 850 : 1850);
      };
      recognition.onerror = () => {
        setIsListening(false);
        setError('I could not capture your voice. Please try again.');
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    setError('');
    setIsListening(true);
    recognitionRef.current.start();
  };

  const toggleMicrophone = () => {
    if (voiceMode) {
      setVoiceMode(false);
      stopListening();
      return;
    }
    setVoiceMode(true);
    startListening();
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsSpeaking(false);
  };

  const toggleSpeaker = async () => {
    if (isSpeaking) {
      stopAudio();
      return;
    }
    const text = latestAssistant?.content?.trim();
    if (!text) return;

    try {
      setError('');
      setIsGeneratingAudio(true);
      let audioContent;
      try {
        audioContent = await generateSpeech(text, 'coral');
      } catch {
        audioContent = await generateSpeech(text, 'shimmer');
      }
      const audioUrl = URL.createObjectURL(createAudioBlob(audioContent));
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = audioUrl;
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => setIsSpeaking(false);
      await audioRef.current.play();
      setIsSpeaking(true);
    } catch (speechError) {
      console.error('Failed to play response:', speechError);
      setError('I could not play audio right now. Please try again.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!voiceMode || isResponding || isSpeaking || isListening) return;
    startListening();
  }, [voiceMode, isResponding, isSpeaking, isListening]);

  useEffect(
    () => () => {
      stopListening();
      stopAudio();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [],
  );

  return (
    <section className="break-support-content" aria-labelledby="break-heading">
      <header className="break-support-heading">
        <p>TAKE A BREAK</p>
        <h1 id="break-heading">Let’s take a moment…</h1>
      </header>

      <div className="break-chat-panel">
        <div className="break-tools" aria-label="Conversation tools">
          <button
            type="button"
            onClick={toggleMicrophone}
            aria-label={voiceMode ? 'Turn voice input off' : 'Use voice input'}
            className={voiceMode ? 'active' : ''}
          >
            {voiceMode ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => void toggleSpeaker()}
            disabled={!latestAssistant?.content || isGeneratingAudio}
            aria-label={isSpeaking ? 'Stop spoken response' : 'Play spoken response'}
          >
            {isSpeaking ? <VolumeX aria-hidden="true" /> : <Volume2 aria-hidden="true" />}
          </button>
        </div>

        <div className="break-chat-messages" ref={scrollRef} aria-live="polite">
          {messages.map((message, index) => (
            <div className={`break-message ${message.role}`} key={`${message.role}-${index}`}>
              {message.role === 'assistant' ? (
                <AssistantMessage
                  content={message.content || (isResponding ? 'Thinking…' : '')}
                  onOption={selectOption}
                  optionsEnabled={index === latestAssistantIndex && !isResponding}
                />
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          ))}
        </div>

        {error && <p className="break-error" role="status">{error}</p>}

        <form
          className="break-input-row"
          onSubmit={(event) => {
            event.preventDefault();
            void submitMessage(input);
          }}
        >
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                void submitMessage(input);
              }
            }}
            rows={2}
            placeholder="Share what feels most true right now…"
            aria-label="Your message"
          />
          <button type="submit" disabled={isResponding || !input.trim()} aria-label="Send message">
            <ArrowUp aria-hidden="true" />
          </button>
        </form>
      </div>
    </section>
  );
};
