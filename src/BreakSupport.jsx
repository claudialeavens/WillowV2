import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUp, Mic, MicOff, Volume2, VolumeX, Leaf, Users, Sprout, Sparkles, Heart, X } from 'lucide-react';
import { streamWillowMessage } from './openAIService';
import { createAudioBlob, generateSpeech } from './textToSpeech';
import { useVoiceOwnership } from './useVoiceOwnership';
import { useVoicePreference } from './useVoicePreference';
import { getResearchMessage, TURNER_THEMES_SOURCE } from './researchMessages';
import willowVariant from './willowVariant.json';
import {
  buildConversationSummary,
  createConversationId,
  deleteConversation,
  saveConversation,
} from './conversationStore';
import {
  CORE_CONVERSATION_PROMPT,
  GUIDED_CONVERSATION_INSTRUCTIONS,
  PHASE_ASSESSMENT_INSTRUCTIONS,
  PROACTIVE_GUIDANCE_INSTRUCTIONS,
} from './willowDirectives';

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
- Do not rush to solutions. Offer 2–3 personalized discovery possibilities after one or two focused questions; offer a small manageable step once a direction resonates.
- Present suggestions as choices, not instructions, and preserve the user’s autonomy.
- If the user selects an option, follow that choice. Help explore what resonates before offering a practical step when they are ready.
- If options do not resonate, validate that and ask one gentle clarifying question before suggesting more.
- Keep responses short, human, and readable. Avoid repeating the same opener or emotional summary each turn.
- Guide toward either greater clarity, a small restorative action, or one focused reflection question.`;

const WILLOW_VOICE_INSTRUCTIONS =
  'Speak in a savvy, relaxed, warm, and grounded style. Sound naturally conversational and quietly confident. ' +
  'Use an unhurried pace, gentle energy, and subtle expressiveness. Avoid sounding clinical, overly cheerful, theatrical, or scripted.';

const OPTION_PATTERN = /^\s*(?:\d+[.)]|[-*•–—])\s+(.+?)\s*$/;
const PHASE_PATTERN = /^WILLOW_STATE:\s*(SETTLE|STABILIZE|RECONNECT|ORIENT|ACT)\s*\|\s*([^\n]+)\n?/i;

const parsePhaseAssessment = (content) => {
  const match = content.match(PHASE_PATTERN);
  const firstLinePending = !content.includes('\n') &&
    ('WILLOW_STATE:'.startsWith(content) || content.startsWith('WILLOW_STATE:'));
  return {
    phase: match?.[1]?.toUpperCase() ?? '',
    strategy: match?.[2]?.trim() ?? '',
    response: match ? content.slice(match[0].length) : content,
    isMetadataPending: firstLinePending,
  };
};

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
      if (match && options.length < 4) {
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

export const BreakSupport = ({
  initialMessage = '',
  entryContext = null,
  mode = 'break',
  savedConversation = null,
  userId = null,
  onConversationChanged,
  onHome,
}) => {
  const [landed, setLanded] = useState(false);
  const [takeaway, setTakeaway] = useState(savedConversation?.summary?.takeaway ?? '');
  const [preparingTakeaway, setPreparingTakeaway] = useState(false);
  const takeawayRequestRef = useRef(null);
  useEffect(() => {
    if (landed) document.getElementById('landed-heading')?.focus();
  }, [landed]);
  const isCoreConversation = mode === 'core' || mode === 'guided';
  const isGuidedConversation = mode === 'guided';
  const [messages, setMessages] = useState(() =>
    savedConversation?.messages?.length
      ? savedConversation.messages
      : isCoreConversation
        ? []
        : [{ role: 'assistant', content: BREAK_INTRO_MESSAGE }],
  );
  const [input, setInput] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState('');
  const [voiceMode, setVoiceModeState] = useState(false);
  const voiceModeRef = useRef(false);
  const setVoiceMode = useCallback((enabled) => {
    voiceModeRef.current = enabled;
    setVoiceModeState(enabled);
  }, []);
  const [microphonePaused, setMicrophonePaused] = useState(false);
  const microphoneBlockedRef = useRef(false);
  const recognitionGenerationRef = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [selectedVoice] = useVoicePreference();
  const audioRequestRef = useRef(0);
  const [phaseAssessment, setPhaseAssessment] = useState(
    savedConversation?.phase_assessment ?? null,
  );
  const [showResumeSummary, setShowResumeSummary] = useState(
    Boolean(savedConversation?.messages?.length),
  );
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);
  const startingVoiceRef = useRef(false);
  const voiceOwnership = useVoiceOwnership(() => {
    setVoiceMode(false);
    stopListening();
  });
  const silenceTimerRef = useRef(null);
  const submitRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef('');
  const initialMessageRef = useRef(initialMessage.trim());
  const initialMessageSentRef = useRef(false);
  const resumeSentRef = useRef(false);
  const conversationIdRef = useRef(savedConversation?.id ?? createConversationId());
  const conversationCreatedAtRef = useRef(savedConversation?.created_at ?? new Date().toISOString());
  const isResumedConversation = Boolean(savedConversation?.messages?.length);
  const researchMessage = getResearchMessage(entryContext ?? savedConversation?.summary, messages, preparingTakeaway ? '' : takeaway);

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
    stopListening();

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
              `${isCoreConversation ? CORE_CONVERSATION_PROMPT : BREAK_SUPPORT_PROMPT}\n\n` +
              (isGuidedConversation ? `${GUIDED_CONVERSATION_INSTRUCTIONS}\n\n` : '') +
              `${PROACTIVE_GUIDANCE_INSTRUCTIONS}\n\n` +
              (isCoreConversation ? `${PHASE_ASSESSMENT_INSTRUCTIONS}\n\n` : '') +
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
          const parsedReply = isCoreConversation
            ? parsePhaseAssessment(streamedReply)
            : { response: streamedReply, isMetadataPending: false };
          setMessages((current) =>
            current.map((message, index) =>
              index === assistantIndex
                ? {
                    ...message,
                    content: parsedReply.isMetadataPending ? '' : parsedReply.response,
                  }
                : message,
            ),
          );
        },
        { maxTokens: isCoreConversation ? 260 : 220, temperature: 0.7 },
      );
      if (isCoreConversation) {
        const parsedReply = parsePhaseAssessment(streamedReply);
        if (parsedReply.phase && parsedReply.strategy) {
          setPhaseAssessment({ phase: parsedReply.phase, strategy: parsedReply.strategy });
        }
        setMessages((current) =>
          current.map((message, index) =>
            index === assistantIndex ? { ...message, content: parsedReply.response.trim() } : message,
          ),
        );
      }
      window.localStorage.setItem('willow-general-activity-at', String(Date.now()));
    } catch (requestError) {
      console.error('Willow response request failed', {
        name: requestError.name,
        message: requestError.message,
        status: requestError.status ?? null,
        statusText: requestError.statusText ?? null,
        responseBody: requestError.responseBody ?? null,
        endpoint: requestError.endpoint ?? null,
        cause: requestError.cause ?? null,
        error: requestError,
      });
      const userFacingError = import.meta.env.DEV
        ? `Development error: ${requestError.message}`
        : 'I could not respond just now. Please try again.';
      setMessages((current) =>
        current.map((message, index) =>
          index === assistantIndex && !message.content.trim()
            ? { ...message, content: userFacingError }
            : message,
        ),
      );
      setError(userFacingError);
    } finally {
      setIsResponding(false);
    }
  };

  submitRef.current = submitMessage;

  useEffect(() => {
    if (!initialMessageRef.current || initialMessageSentRef.current) return;
    initialMessageSentRef.current = true;
    void submitRef.current?.(initialMessageRef.current);
  }, []);

  useEffect(() => {
    if (!isResumedConversation || resumeSentRef.current || initialMessageRef.current) return;
    resumeSentRef.current = true;
    void submitRef.current?.(
      'Continue this conversation from where it left off. Use what is already known, do not repeat prior questions, and offer the next natural response.',
      'Pick up where we left off.',
    );
  }, [isResumedConversation]);

  useEffect(() => {
    if (isResponding || !messages.some((message) => message.role === 'user')) return undefined;
    const timeout = window.setTimeout(() => {
      const summary = {
        ...buildConversationSummary(messages, phaseAssessment),
        ...(savedConversation?.summary?.activity ? {
          activity: savedConversation.summary.activity, selection: savedConversation.summary.selection,
        } : entryContext ?? {}),
        ...(takeaway ? { takeaway } : {}),
      };
      const firstUserMessage = messages.find((message) => message.role === 'user')?.content ?? '';
      const now = new Date().toISOString();
      const conversation = {
        id: conversationIdRef.current,
        mode,
        title: summary.activity ? `${summary.activity} · ${summary.selection}` : firstUserMessage.slice(0, 80) || 'Willow conversation',
        messages,
        phase_assessment: phaseAssessment,
        summary,
        created_at: conversationCreatedAtRef.current,
        updated_at: now,
      };
      void saveConversation(conversation, userId).then((savedConversation) =>
        onConversationChanged?.(savedConversation),
      ).catch((error) => console.error('Unable to save conversation:', error));
    }, 100);
    return () => window.clearTimeout(timeout);
  }, [isResponding, messages, mode, onConversationChanged, phaseAssessment, userId, entryContext, savedConversation, takeaway]);

  const startNewConversation = () => {
    takeawayRequestRef.current?.abort();
    setTakeaway('');
    setLanded(false);
    stopListening();
    stopAudio();
    conversationIdRef.current = createConversationId();
    conversationCreatedAtRef.current = new Date().toISOString();
    initialMessageRef.current = '';
    initialMessageSentRef.current = true;
    resumeSentRef.current = true;
    setMessages(isCoreConversation ? [] : [{ role: 'assistant', content: BREAK_INTRO_MESSAGE }]);
    setPhaseAssessment(null);
    setShowResumeSummary(false);
    setInput('');
    setError('');
  };

  const removeCurrentConversation = async () => {
    await deleteConversation(conversationIdRef.current, userId);
    onConversationChanged?.(null);
    startNewConversation();
  };

  const selectOption = (option) => {
    if (isGuidedConversation) {
      void submitMessage(option, option);
      return;
    }
    const prompt =
      `The user selected this option: "${option}". Respond in no more than 85 words total. ` +
      'Follow their chosen direction rather than replacing it with a new list. If this is a discovery ' +
      'choice, help them recognize the underlying feeling or need without rushing into solutions. ' +
      'If they are ready for action, suggest one small meaningful step and connect it to their original ' +
      'intention. Keep the response short, personalized, and gently forward-moving.';
    void submitMessage(prompt, option);
  };

  const stopListening = () => {
    recognitionGenerationRef.current += 1;
    startingVoiceRef.current = false;
    voiceOwnership.release();
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    // Abort discards buffered speech; stop() can deliver a final echo result.
    try { recognition?.abort(); } catch { /* The session may already have ended. */ }
    setIsListening(false);
  };

  const startListening = async () => {
    if (document.hidden || !voiceModeRef.current || startingVoiceRef.current || recognitionRef.current) return;
    if (!speechConstructor || isResponding || isSpeaking || isGeneratingAudio || microphoneBlockedRef.current) {
      if (!speechConstructor) setError('Voice input is not supported in this browser.');
      return;
    }

    startingVoiceRef.current = true;
    const generation = ++recognitionGenerationRef.current;
    const acquired = await voiceOwnership.acquire();
    if (generation !== recognitionGenerationRef.current) return;
    if (!acquired) {
      startingVoiceRef.current = false;
      setVoiceMode(false);
      return;
    }
    if (document.hidden || !voiceModeRef.current || microphoneBlockedRef.current) {
      stopListening();
      return;
    }

    {
      const recognition = new speechConstructor();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      let finalText = '';
      let preview = '';
      const isCurrent = () => recognitionRef.current === recognition
        && generation === recognitionGenerationRef.current && voiceModeRef.current
        && !microphoneBlockedRef.current && !document.hidden;

      recognition.onresult = (event) => {
        if (!isCurrent()) return;
        let interimText = '';
        for (let index = event.resultIndex ?? 0; index < event.results.length; index += 1) {
          const transcript = event.results[index]?.[0]?.transcript?.trim() ?? '';
          if (event.results[index]?.isFinal) finalText = `${finalText} ${transcript}`.trim();
          else interimText = `${interimText} ${transcript}`.trim();
        }

        preview = `${finalText} ${interimText}`.trim();
        setInput(preview);
        if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = window.setTimeout(() => {
          if (!isCurrent()) return;
          const message = finalText.trim() || preview;
          finalText = '';
          preview = '';
          stopListening();
          if (message) void submitRef.current?.(message);
        }, /[.!?…]$/.test(preview) ? 850 : 1850);
      };
      recognition.onerror = () => {
        if (!isCurrent()) return;
        stopListening();
        setVoiceMode(false);
        setIsListening(false);
        setError('I could not capture your voice. Please try again.');
      };
      recognition.onend = () => {
        if (!isCurrent()) return;
        const message = finalText.trim() || preview;
        stopListening();
        if (message) void submitRef.current?.(message);
      };
    }

    setError('');
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch {
      stopListening();
      setVoiceMode(false);
      setIsListening(false);
      setError('I could not capture your voice. Please try again.');
    } finally {
      startingVoiceRef.current = false;
    }
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

  const stopAudio = useCallback(() => {
    audioRequestRef.current += 1;
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsSpeaking(false);
    setIsGeneratingAudio(false);
  }, []);

  useEffect(() => {
    stopAudio();
  }, [selectedVoice, stopAudio]);

  const playResponse = async (voice) => {
    const text = latestAssistant?.content?.trim();
    if (!text || isGeneratingAudio || isResponding) return;
    stopAudio();
    // Block synchronously before async voice ownership or speech events can run.
    microphoneBlockedRef.current = true;
    setMicrophonePaused(true);
    stopListening();
    const request = audioRequestRef.current;

    try {
      setError('');
      setIsGeneratingAudio(true);
      const audioContent = await generateSpeech(text, voice, WILLOW_VOICE_INSTRUCTIONS);
      if (request !== audioRequestRef.current) return;
      const audioUrl = URL.createObjectURL(createAudioBlob(audioContent));
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = audioUrl;
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => {
        if (request === audioRequestRef.current) setIsSpeaking(false);
      };
      audioRef.current.onerror = () => {
        if (request !== audioRequestRef.current) return;
        stopAudio();
        setError('I could not play that voice right now. Please try again or choose another voice.');
      };
      await audioRef.current.play();
      if (request === audioRequestRef.current) setIsSpeaking(true);
    } catch (speechError) {
      console.error('Failed to play response:', speechError);
      if (request === audioRequestRef.current) {
        setError('I could not play that voice right now. Please try again or choose another voice.');
      }
    } finally {
      if (request === audioRequestRef.current) setIsGeneratingAudio(false);
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (!microphonePaused || isSpeaking || isGeneratingAudio) return;
    // Let the final sound finish before reopening microphone recognition.
    const timeout = window.setTimeout(() => {
      microphoneBlockedRef.current = false;
      setMicrophonePaused(false);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [microphonePaused, isSpeaking, isGeneratingAudio]);

  useEffect(() => {
    if (document.hidden || !voiceMode || isResponding || isSpeaking || isGeneratingAudio || microphonePaused || isListening) return;
    startListening();
  }, [voiceMode, isResponding, isSpeaking, isGeneratingAudio, microphonePaused, isListening]);

  useEffect(() => {
    const pauseListening = () => {
      if (!document.hidden) return;
      setVoiceMode(false);
      stopListening();
    };
    document.addEventListener('visibilitychange', pauseListening);
    return () => document.removeEventListener('visibilitychange', pauseListening);
  }, []);

  useEffect(
    () => () => {
      stopListening();
      stopAudio();
      takeawayRequestRef.current?.abort();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    },
    [],
  );

  const continueExploring = () => {
    takeawayRequestRef.current?.abort();
    setPreparingTakeaway(false);
    setLanded(false);
  };

  const finishConversation = async () => {
    setVoiceMode(false);
    stopListening();
    stopAudio();
    setLanded(true);
    setPreparingTakeaway(true);
    const controller = new AbortController();
    takeawayRequestRef.current?.abort();
    takeawayRequestRef.current = controller;
    try {
      const text = await streamWillowMessage([
        ...messages.filter((m) => m.content?.trim()).slice(-12),
        { role: 'user', content: 'The user clicked "Happy where we have landed?". Write a brief takeaway for their closing page, in 1–2 warm, specific sentences (maximum 55 words). Summarize only what this conversation actually established. If they chose an action, remind them of that action and connect it to their original intention or need. Otherwise capture the insight or direction that resonated; do not invent an action or imply they committed to one. No questions, new suggestions, lists, metadata, or introductory labels. Return only the takeaway.' },
      ], () => {}, { maxTokens: 110, signal: controller.signal });
      if (!controller.signal.aborted) setTakeaway(text.trim());
    } catch {
      if (!controller.signal.aborted) setTakeaway('Carry forward what felt useful here, at your own pace. You can return to this conversation in your archive.');
    } finally {
      if (!controller.signal.aborted) setPreparingTakeaway(false);
    }
  };

  if (landed) return (
    <section className="landed-content" aria-labelledby="landed-heading">
      <button className="landed-close" type="button" onClick={continueExploring} aria-label="Return to conversation"><X aria-hidden="true" /></button>
      <p className="matters-eyebrow">WILLOW</p>
      <h1 id="landed-heading" tabIndex={-1}>You’re on your way.</h1>
      <p className="landed-intro">You’ve made space for what matters to you — and that matters.</p>
      <article className="landed-note" aria-live="polite">
        <Leaf className="landed-leaf" aria-hidden="true" />
        <h2>A takeaway to remember</h2>
        <p>{preparingTakeaway ? 'Gathering what we discovered together…' : takeaway}</p>
        <Heart className="landed-heart" aria-hidden="true" />
      </article>
      <div className="landed-reassurance">
        <div><span className="connection"><Users aria-hidden="true" /></span><p>{researchMessage.text}</p>
          <details className="landed-research"><summary>Research</summary>
            <a href={researchMessage.source} target="_blank" rel="noreferrer">Wellbeing research</a>
            <a href={TURNER_THEMES_SOURCE} target="_blank" rel="noreferrer">Kelly Turner element: {researchMessage.theme}</a>
          </details>
        </div>
        <div><span className="growth"><Sprout aria-hidden="true" /></span><p>{researchMessage.tip ?? `Explore ${researchMessage.theme.toLowerCase()} through a small step that feels right for you.`}</p></div>
        <div><span className="support"><Sparkles aria-hidden="true" /></span><p>Return to Willow any time. We’ll be here whenever you need us.</p></div>
      </div>
      <button className="landed-continue" type="button" onClick={continueExploring}><Leaf aria-hidden="true" />Continue exploring</button>
      <button className="landed-home" type="button" onClick={onHome}>Back to home</button>
      <p className="landed-footer">We’ll be here whenever you need us.</p>
    </section>
  );

  return (
    <section className="break-support-content" aria-labelledby="break-heading">
      <header className="break-support-heading">
        <p>{isCoreConversation ? 'WILLOW' : 'TAKE A BREAK'}</p>
        <h1 id="break-heading">
          {isCoreConversation ? 'Let’s begin where you are.' : 'Let’s take a moment…'}
        </h1>
      </header>

      <div className="break-chat-panel">
        {showResumeSummary && (
          <aside className="conversation-resume-summary">
            <div>
              <p>WHERE WE LEFT OFF · {savedConversation.summary?.phase ?? 'Conversation'}</p>
              <strong>{savedConversation.summary?.focus}</strong>
              <span>{savedConversation.summary?.whereLeftOff}</span>
            </div>
            <div className="conversation-history-actions">
              <button type="button" onClick={startNewConversation}>New conversation</button>
              <button type="button" onClick={() => void removeCurrentConversation()}>Delete</button>
            </div>
          </aside>
        )}
        <div className="break-tools" aria-label="Conversation tools">
          <button
            type="button"
            onClick={toggleMicrophone}
            aria-label={voiceMode ? 'Turn voice input off' : 'Use voice input'}
            aria-pressed={voiceMode}
            title={voiceMode && microphonePaused ? 'Microphone paused while Willow speaks' : undefined}
            className={voiceMode ? 'active' : ''}
          >
            {voiceMode ? <MicOff aria-hidden="true" /> : <Mic aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) stopAudio();
              else void playResponse(selectedVoice);
            }}
            disabled={!latestAssistant?.content?.trim() || isGeneratingAudio || isResponding}
            aria-label={isGeneratingAudio ? 'Preparing spoken response' : isSpeaking ? 'Stop spoken response' : 'Play spoken response'}
            aria-busy={isGeneratingAudio}
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
        <button className="happy-landed" type="button" onClick={() => void finishConversation()}
          disabled={isResponding || isGeneratingAudio || !messages.some((message) => message.role === 'user')}>
          <img src="/images/willow-leaf-sprig.png" alt="" aria-hidden="true" width="64" height="64" />
          <span><strong>~ Happy where we have landed? ~</strong><small>Let’s wrap up →</small></span>
        </button>
      </div>

      {isCoreConversation && willowVariant.showPromptGuidance && (
        <aside className="phase-insight" aria-live="polite" aria-label="Willow phase assessment">
          <p className="phase-insight-label">Prompt guidance preview</p>
          {phaseAssessment ? (
            <div className="phase-insight-content">
              <span>{phaseAssessment.phase}</span>
              <p>{phaseAssessment.strategy}</p>
            </div>
          ) : (
            <p className="phase-insight-empty">
              Willow’s phase and current strategy will appear here after the first response.
            </p>
          )}
        </aside>
      )}
    </section>
  );
};
