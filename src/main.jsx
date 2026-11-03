import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import {
  ArrowLeft,
  Archive as ArchiveIcon,
  ArrowRight,
  Bell,
  CalendarCheck,
  Check,
  ChevronRight,
  Cloud,
  Compass,
  Heart,
  Lightbulb,
  Sparkles,
  Sprout,
  Home,
  Menu,
  Info,
  ShieldCheck,
  Leaf,
  LogOut,
  Pause,
  Play,
  Sun,
  User,
  Users,
  Volume2,
  X,
} from 'lucide-react';
import { useAuth } from './useAuth';
import { SPEAKER_VOICES, useVoicePreference } from './useVoicePreference';
import { getVoicePlaybackRate } from './textToSpeech';
import { setVoicePreviewActive } from './voicePreviewState';
import { BreakSupport } from './BreakSupport';
import { getLatestConversation, recordActivity } from './conversationStore';
import { Archive } from './Archive';
import './styles.css';

const AuthModal = lazy(() =>
  import('./AuthModal').then((module) => ({ default: module.AuthModal })),
);

const HOME_ACTIONS = [
  'Grounding',
  'Take a Break',
  'Clearing',
  'Deepen your roots',
  'Follow What Matters',
];

const AccountButton = ({ auth, onSignIn }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      const menu = menuRef.current;
      if (menu?.open && !menu.contains(event.target)) menu.open = false;
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false;
        menuRef.current.querySelector('summary')?.focus();
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);
  if (auth.loading) {
    return <span className="account-loading" aria-label="Loading account" />;
  }

  if (!auth.user || auth.isGuest) {
    return (
      <button className="sign-in" type="button" onClick={onSignIn} aria-label="Sign in">
        <User aria-hidden="true" />
      </button>
    );
  }

  return (
    <details className="account-menu" ref={menuRef}>
      <summary aria-label="Open account menu"><User className="signed-in-person" aria-hidden="true" /></summary>
      <div className="account-popover">
        <p>{auth.user.email}</p>
        <div className="account-history-note">
          <strong>Your saved conversations</strong>
          <p>Sign in with this account on any device to continue where you left off.</p>
        </div>
        <button className="account-signout" type="button" onClick={auth.signOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </button>
      </div>
    </details>
  );
};

const AboutContent = () => <>
  <p>Willow is a personal sanctuary for whatever is on your mind. Through thoughtful conversation, quiet moments and simple practices, it helps you clear what’s getting in the way, reconnect with yourself, find clarity about what matters, and move forward in a way that feels right for you.</p>
  <p><strong>Behind Willow's gentle, personalized approach is a deeper purpose.</strong> Inspired by Dr. Kelly Turner's research into the ten key factors associated with remarkable healing journeys, Willow naturally weaves these elements into your experience—without making it feel like a program or a checklist.</p>
  <p>Whether you're finding more joy, strengthening relationships, releasing difficult emotions, reconnecting with purpose, or simply making space for yourself, Willow helps you explore the things that can meaningfully support your health and wellbeing.</p>
  <p><strong>And the best part? By simply nurturing what matters to you, you're effortlessly supporting better health along the way—guided by research into the powerful connections between how we live, how we feel, and our wellbeing.</strong></p>
  <p><strong>The beauty is in its simplicity.</strong> You come as you are, with whatever is on your mind. No complicated routines or big commitments—just small, meaningful moments that naturally become part of your wellbeing.</p>
  <p><em>Small moments. Meaningful shifts. A healthier, more connected you.</em></p>
</>;

const MainMenu = ({ onHome, onArchive, auth, onSignIn }) => {
  const [selectedVoice, setVoice] = useVoicePreference();
  const menuRef = useRef(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const sampleAudioRef = useRef(null);
  const [sampleVoice, setSampleVoice] = useState(null);
  const [sampleStatus, setSampleStatus] = useState('');
  const stopSample = useCallback(() => {
    const audio = sampleAudioRef.current;
    sampleAudioRef.current = null;
    if (audio) {
      audio.onended = null;
      audio.onerror = null;
      audio.pause();
    }
    setSampleVoice(null);
    setSampleStatus('');
    setVoicePreviewActive(false);
  }, []);
  const playSample = async (voice) => {
    stopSample();
    setVoice(voice);
    const audio = new Audio(`/audio/voices/${voice}.mp3`);
    sampleAudioRef.current = audio;
    audio.playbackRate = getVoicePlaybackRate(voice);
    setSampleVoice(voice);
    setSampleStatus(`Loading ${SPEAKER_VOICES.find((option) => option.id === voice).name} sample…`);
    setVoicePreviewActive(true);
    const failed = () => {
      if (sampleAudioRef.current !== audio) return;
      stopSample();
      setSampleStatus('Could not play the sample. Select a voice to try again.');
    };
    audio.onended = () => {
      if (sampleAudioRef.current === audio) stopSample();
    };
    audio.onerror = failed;
    try {
      await audio.play();
      if (sampleAudioRef.current === audio) {
        setSampleStatus(`Playing ${SPEAKER_VOICES.find((option) => option.id === voice).name} sample`);
      }
    } catch {
      failed();
    }
  };
  useEffect(() => stopSample, [stopSample]);
  useEffect(() => {
    const closeOutside = (event) => {
      if (menuRef.current?.open && !menuRef.current.contains(event.target)) {
        stopSample();
        menuRef.current.open = false;
      }
    };
    const escape = (event) => {
      if (event.key === 'Escape') {
        stopSample();
        if (menuRef.current) menuRef.current.open = false;
        setAboutOpen(false);
        setPrivacyOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', escape);
    };
  }, [stopSample]);
  const choose = (action) => { stopSample(); menuRef.current.open = false; action(); };
  return <>
    <details className="main-menu" ref={menuRef} onToggle={(event) => {
      if (event.target === event.currentTarget && !event.currentTarget.open) stopSample();
    }}>
      <summary aria-label="Open Willow menu"><Menu aria-hidden="true" /></summary>
      <nav className="main-menu-items" aria-label="Willow navigation">
        <button type="button" onClick={() => choose(onHome)}><Home aria-hidden="true" />Home</button>
        <button type="button" onClick={() => choose(() => setAboutOpen(true))}><Info aria-hidden="true" />About</button>
        <details className="menu-voice-settings" onToggle={(event) => {
          if (!event.currentTarget.open) stopSample();
        }}>
          <summary><Volume2 aria-hidden="true" />Change voice<small>{SPEAKER_VOICES.find((voice) => voice.id === selectedVoice)?.name}</small></summary>
          <fieldset>
            <legend className="sr-only">Willow's voice</legend>
            {SPEAKER_VOICES.map((voice) => (
              <label key={voice.id}>
                <input type="radio" name="willow-speaker-voice" value={voice.id}
                  checked={selectedVoice === voice.id}
                  onChange={() => void playSample(voice.id)}
                  onClick={() => { if (selectedVoice === voice.id) void playSample(voice.id); }} />
                {voice.name}
              </label>
            ))}
          </fieldset>
          <p role="status">{sampleStatus || 'Select a voice to hear a sample.'}</p>
          {sampleVoice && <button type="button" onClick={stopSample}>Stop sample</button>}
          <p>AI-generated voice · Nova plays at 1.1×</p>
        </details>
        <button type="button" onClick={() => choose(onArchive)}><ArchiveIcon aria-hidden="true" />Archive</button>
        <button type="button" onClick={() => choose(() => setPrivacyOpen(true))}><ShieldCheck aria-hidden="true" />Privacy Policy</button>
        <button type="button" disabled={auth.loading} onClick={() => choose(auth.user ? auth.signOut : onSignIn)}>
          {auth.user ? <LogOut aria-hidden="true" /> : <User aria-hidden="true" />}
          {auth.user ? 'Sign out' : 'Sign in'}
        </button>
      </nav>
    </details>
    {aboutOpen && <div className="willow-about-overlay" onClick={() => setAboutOpen(false)}>
      <section className="willow-about-dialog" role="dialog" aria-modal="true" aria-labelledby="menu-about-heading" onClick={(e) => e.stopPropagation()}>
        <button className="willow-about-close" type="button" autoFocus aria-label="Close about Willow" onClick={() => setAboutOpen(false)}><X aria-hidden="true" /></button>
        <h2 id="menu-about-heading">About Willow</h2>
        <AboutContent />
      </section>
    </div>}
    {privacyOpen && <div className="signin-privacy-overlay" onClick={() => setPrivacyOpen(false)}>
      <section className="signin-privacy-dialog" role="dialog" aria-modal="true" aria-label="Privacy Policy"
        onClick={(event) => event.stopPropagation()} onKeyDown={(event) => {
          if (event.key === 'Tab') { event.preventDefault(); event.currentTarget.querySelector('button')?.focus(); }
        }}>
        <button className="signin-info-close" type="button" autoFocus aria-label="Close Privacy Policy" onClick={() => setPrivacyOpen(false)}><X aria-hidden="true" /></button>
        <span className="privacy-shield" aria-hidden="true"><ShieldCheck /></span>
            <p>Our commitment is to keep your data secure and protected to the highest standards. ...</p>
      </section>
    </div>}
  </>;
};

const NavigationContext = React.createContext({ canGoBack: false, goBack: () => {} });

const HomeButton = ({ onHome }) => {
  const { canGoBack, goBack } = React.useContext(NavigationContext);
  return <>
    <button className="home-button" type="button" onClick={canGoBack ? onHome : goBack} aria-label={canGoBack ? 'Return to home page' : 'Go back'}>
      {canGoBack ? <Home aria-hidden="true" /> : <ArrowLeft aria-hidden="true" />}
    </button>
    {canGoBack && <button className="home-button back-button" type="button" onClick={goBack} aria-label="Go back">
      <ArrowLeft aria-hidden="true" />
    </button>}
  </>;
};

const WillowLogo = ({ showAboutLink = false, secondaryAction, children }) => {
  const [aboutOpen, setAboutOpen] = useState(false);

  useEffect(() => {
    if (!aboutOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setAboutOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [aboutOpen]);

  return (
    <>
      <div className="intro-hero">
      <h1 className="willow-logo">
        <button
          className="willow-title-button"
          type="button"
          onClick={() => setAboutOpen(true)}
          aria-label="About Willow"
        >
          <span className="willow-word">Willow</span>
          <span className="leaf-mark" aria-hidden="true">
            <Leaf size={152} strokeWidth={4.8} />
          </span>
        </button>
      </h1>
      {children}
      </div>

      {showAboutLink && (
        <div className="intro-secondary-actions">
          {secondaryAction}
        <div className="intro-about">
          <button type="button" onClick={() => setAboutOpen(true)}>
            <Lightbulb aria-hidden="true" /><span>About Willow</span><ChevronRight aria-hidden="true" />
          </button>
        </div>
        </div>
      )}
      {aboutOpen && createPortal(
        <div className="willow-about-overlay" onMouseDown={() => setAboutOpen(false)}>
          <section
            className="willow-about-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="willow-about-heading"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="willow-about-close"
              type="button"
              onClick={() => setAboutOpen(false)}
              aria-label="Close about Willow"
              autoFocus
            >
              <X aria-hidden="true" />
            </button>
            <h2 id="willow-about-heading">About Willow</h2>
            <AboutContent />
          </section>
        </div>,
        document.body,
      )}
    </>
  );
};

const IntroPage = ({
  onBreak,
  onClearing,
  onGrounding,
  onTakeStep,
  onKeepOnTrack,
  onThoughtSubmit,
  resumeConversation,
  onResumeConversation,
  auth,
  onSignIn,
}) => {
  const [thought, setThought] = useState('');

  const submitThought = (event) => {
    event.preventDefault();
    const trimmedThought = thought.trim();
    if (trimmedThought) onThoughtSubmit(trimmedThought);
  };

  return (
    <main className="page intro-page">
      <AccountButton auth={auth} onSignIn={onSignIn} />
      <section className="intro-content">
        <div className="intro-content-scaled">
        <WillowLogo showAboutLink secondaryAction={
          <button className="intro-track-button" type="button" onClick={onKeepOnTrack}>
            <CalendarCheck aria-hidden="true" />
            <span><strong>Keep me on track</strong><small>Stay consistent.</small></span>
          </button>
        }>
        <p className="tagline">Clear the way. Reconnect with yourself. Reveal your light.</p>
        <header className="intro-heading">
          <h2>A little clarity can change a lot.</h2>
          <p>Whatever’s on your mind, Willow helps you work through what’s holding you back and move toward what helps you thrive.</p>
        </header>
        </WillowLogo>
        <div className="intro-thought">
          <form className="intro-thought-field" onSubmit={submitThought}>
            <input
              type="text"
              value={thought}
              onChange={(event) => setThought(event.target.value)}
              placeholder="What’s on your mind?"
              aria-label="What’s on your mind?"
            />
            <button type="submit" disabled={!thought.trim()} aria-label="Share what’s on your mind">
              <ArrowRight aria-hidden="true" />
            </button>
          </form>
          <nav className="intro-quick-actions" aria-label="Quick practices">
            {[
              { href: '#take-a-break', onClick: onBreak, Icon: Leaf, title: 'Take a break', caption: 'A moment for you' },
              { href: '#clearing', onClick: onClearing, Icon: Cloud, title: <>Clear my<br />mind</>, caption: 'Make sense of things' },
              { href: '#grounding', onClick: onGrounding, Icon: Heart, title: <>Find my<br />balance</>, caption: 'Feel more grounded' },
              { href: '#take-a-step', onClick: onTakeStep, Icon: Sparkles, title: <>Surprise me<br />with meaning</>, caption: 'A fresh perspective' },
            ].map(({ href, onClick, Icon, title, caption, className }) => (
              <a key={href} className={className} href={href} onClick={(event) => { event.preventDefault(); onClick(); }}>
                <span className="intro-action-icon"><Icon aria-hidden="true" /></span>
                <strong>{title}</strong>
                <small>{caption}</small>
              </a>
            ))}
          </nav>
          {resumeConversation && (
            <button className="resume-conversation-link" type="button" onClick={onResumeConversation}>
              Pick up where we left off
            </button>
          )}
        </div>
        </div>
      </section>
    </main>
  );
};

const HomePage = ({ onHome, onBreak, onClearing, auth, onSignIn }) => (
  <main className="page home-page">
    <AccountButton auth={auth} onSignIn={onSignIn} />
    <HomeButton onHome={onHome} />
    <section className="home-content" aria-labelledby="home-heading">
      <header className="home-heading">
        <p className="home-eyebrow">
          <span className="home-brand-name">WILLOW</span>
          <span className="home-brand-tagline">~ Your personal sanctuary ~</span>
        </p>
        <h1 id="home-heading">What do you need today?</h1>
      </header>

      <nav className="practice-grid" aria-label="Wellness practices">
        {HOME_ACTIONS.map((action, index) => (
          <button
            className="practice-button"
            type="button"
            key={action}
            onClick={
              action === 'Clearing'
                ? onClearing
                : action === 'Take a Break'
                  ? onBreak
                  : undefined
            }
          >
            <span className="practice-number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span>{action}</span>
            <ArrowRight aria-hidden="true" />
          </button>
        ))}
      </nav>

    </section>
  </main>
);

const BreakChoicePage = ({ onBack, onChat, onSilence, auth, onSignIn }) => (
  <main className="page break-support-page">
    <AccountButton auth={auth} onSignIn={onSignIn} />
    <HomeButton onHome={onBack} />
    <section className="break-choice-content" aria-labelledby="break-choice-heading">
      <header className="break-support-heading">
        <p>TAKE A BREAK</p>
        <h1 id="break-choice-heading">Let’s take<br />a moment…</h1>
        <div className="break-choice-intro">A little space for you, right now.<br />Choose what feels right.</div>
      </header>
      <div className="break-choice-actions">
        <button type="button" onClick={onSilence}>
          <span className="break-choice-badge rest"><Sun aria-hidden="true" /></span>
          <span className="break-choice-label"><strong>Five minute rest</strong><small>A little space to reset</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
        <button type="button" onClick={onChat}>
          <span className="break-choice-badge chat"><Leaf aria-hidden="true" /></span>
          <span className="break-choice-label"><strong>Share what’s on your mind</strong><small>Clear what’s taking up space</small></span>
          <ArrowRight aria-hidden="true" />
        </button>
      </div>
    </section>
  </main>
);

const BreakSupportPage = ({
  onBack,
  initialMessage,
  entryContext,
  mode,
  savedConversation,
  onConversationChanged,
  auth,
  onSignIn,
}) => (
  <main className="page break-support-page">
    <AccountButton auth={auth} onSignIn={onSignIn} />
    <HomeButton onHome={onBack} />
    <BreakSupport
        onHome={onBack}
        entryContext={entryContext}
        initialMessage={initialMessage}
        mode={mode}
        savedConversation={savedConversation}
        userId={auth.user?.id ?? null}
        onConversationChanged={onConversationChanged}
    />
  </main>
);

const GROUNDING_OPTIONS = [
  { label: 'My mind won’t stop', detail: 'Reduce cognitive noise' },
  { label: 'I feel anxious or jittery', detail: 'Settle activation' },
  { label: 'I feel disconnected', detail: 'Reconnect through the senses' },
  { label: 'I’m overwhelmed', detail: 'Reduce inputs and decisions' },
  { label: 'I feel scattered', detail: 'Orient your attention' },
  { label: 'I don’t feel like myself', detail: 'Reconnect with identity and values' },
];

const GroundingPage = ({ onHome, onSelect, auth, onSignIn }) => (
  <main className="page grounding-page">
    <AccountButton auth={auth} onSignIn={onSignIn} />
    <HomeButton onHome={onHome} />
    <section className="grounding-content" aria-labelledby="grounding-heading">
      <header>
        <p className="meditation-eyebrow">GROUNDING</p>
        <h1 id="grounding-heading">What does grounded mean right now?</h1>
        <p>Choose what feels closest. You don’t need to explain it yet.</p>
      </header>
      <div className="grounding-options">
        {GROUNDING_OPTIONS.map((option) => (
          <button type="button" key={option.label} onClick={() => onSelect(option.label)}>
            <span>{option.label}</span>
            <small>{option.detail}</small>
            <ArrowRight aria-hidden="true" />
          </button>
        ))}
      </div>
    </section>
  </main>
);

const MattersPage = ({ onHome, onSelect, auth, onSignIn }) => (
  <main className="page matters-page">
    <AccountButton auth={auth} onSignIn={onSignIn} />
    <HomeButton onHome={onHome} />
    <section className="matters-content" aria-labelledby="matters-heading">
      <h1 id="matters-heading">Move towards<br />what matters</h1>
      <p className="matters-question">What would you like a little more of in your life?</p>
      <div className="matters-options">
        {[
          { choice: 'Feeling connected', Icon: Users },
          { choice: 'Energy & vitality', Icon: Sprout },
          { choice: 'Peace of mind', Icon: Leaf },
          { choice: 'Joy & enjoyment', Icon: Sun },
          { choice: 'Meaning & purpose', Icon: Heart },
          { choice: 'Not sure yet', Icon: Compass },
        ].map(({ choice, Icon }) => (
          <button key={choice} type="button" onClick={() => onSelect(choice)}><Icon aria-hidden="true" /><span>{choice}</span></button>
        ))}
      </div>
      <div className="matters-divider" aria-hidden="true"><Leaf /></div>
      <p className="matters-note">Explore what feels right for you.<br />Follow your curiosity, wherever it leads you.</p>
    </section>
  </main>
);

const TRACKING_OPTIONS = [
  { title: 'A daily habit', detail: '(e.g., movement, meditation)', Icon: Leaf },
  { title: 'A wellbeing focus', detail: '(e.g., better sleep, less stress)', Icon: Heart },
  { title: 'A current intention', detail: '(e.g., more energy, emotional balance)', Icon: Sun },
];

const TrackingNavigation = ({ onBack, onHome }) => (
  <nav className="tracking-navigation" aria-label="Page navigation">
    <button className="home-button back-button" type="button" onClick={onBack} aria-label="Go back"><ArrowLeft aria-hidden="true" /></button>
    <button className="home-button" type="button" onClick={onHome} aria-label="Return to home page"><Home aria-hidden="true" /></button>
  </nav>
);

const KeepOnTrackPage = ({ onBack, onHome, onContinue }) => {
  const [selection, setSelection] = useState(TRACKING_OPTIONS[0].title);

  return (
    <main className="page tracking-page">
      <section className="tracking-content" aria-labelledby="tracking-heading">
        <div className="tracking-brand">Willow<Leaf aria-hidden="true" /></div>
        <TrackingNavigation onBack={onBack} onHome={onHome} />
        <h1 id="tracking-heading">What would you like support staying consistent with?</h1>
        <form onSubmit={(event) => { event.preventDefault(); onContinue(selection); }}>
          <fieldset className="tracking-options">
            <legend className="sr-only">Choose what you’d like support staying consistent with</legend>
            {TRACKING_OPTIONS.map(({ title, detail, Icon }) => (
              <label className="tracking-option" key={title}>
                <Icon aria-hidden="true" />
                <span><strong>{title}</strong><small>{detail}</small></span>
                <input type="radio" name="tracking-focus" value={title} checked={selection === title} onChange={() => setSelection(title)} />
              </label>
            ))}
          </fieldset>
          <button className="tracking-continue" type="submit">Continue <ArrowRight aria-hidden="true" /></button>
        </form>
      </section>
    </main>
  );
};

const PersonalReminderPage = ({ kind, userId, onBack, onHome }) => {
  const isFocus = kind === 'focus';
  const noun = isFocus ? 'focus' : 'intention';
  const storageKey = `willow-${kind}-reminder:${userId ?? 'guest'}`;
  const [reminder, setReminder] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (typeof saved?.text === 'string' && saved.text.trim()) {
        return { text: saved.text, reason: typeof saved.reason === 'string' ? saved.reason : '' };
      }
    } catch { /* Allow writing a reminder even when storage is unavailable. */ }
    return null;
  });
  const [editing, setEditing] = useState(!reminder);
  const [storageError, setStorageError] = useState(false);
  const Icon = isFocus ? Heart : Sun;

  const saveReminder = (event) => {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const text = fields.get('reminder').trim();
    if (!text) return;
    const next = { text, reason: fields.get('reason').trim() };
    setReminder(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageError(false);
    } catch { setStorageError(true); }
    setEditing(false);
  };

  return (
    <main className="page tracking-page">
      <section className="tracking-content reminder-content" aria-labelledby="reminder-heading">
        <div className="tracking-brand">Willow<Leaf aria-hidden="true" /></div>
        <TrackingNavigation onBack={onBack} onHome={onHome} />
        <div className="habit-section-heading">
          <h1 id="reminder-heading">Your {isFocus ? 'wellbeing focus' : 'current intention'}</h1>
          {!editing && <button type="button" onClick={() => setEditing(true)}>Edit</button>}
        </div>
        {editing ? (
          <>
            <p className="reminder-guidance">{isFocus ? 'What would you like to nurture in your wellbeing? You might focus on better sleep, feeling calmer, or making space to rest.' : 'What would you like to bring into your days? You might intend to move gently, protect your energy, or respond with more patience.'}</p>
            <form className="habit-edit reminder-edit" onSubmit={saveReminder}>
              <label htmlFor="reminder-text">{isFocus ? 'My wellbeing focus is…' : 'My intention is…'}</label>
              <textarea id="reminder-text" name="reminder" defaultValue={reminder?.text ?? ''} placeholder={isFocus ? 'Make more space for restful sleep.' : 'Pause and take a breath before responding.'} required maxLength={500} autoFocus />
              <label htmlFor="reminder-reason">Why does this matter to you? <span>(optional)</span></label>
              <textarea id="reminder-reason" name="reason" defaultValue={reminder?.reason ?? ''} placeholder="A few words to reconnect with your why." maxLength={500} />
              <button className="tracking-continue" type="submit">Save my {noun}<Check aria-hidden="true" /></button>
              {reminder && <button className="reminder-cancel" type="button" onClick={() => setEditing(false)}>Cancel</button>}
            </form>
          </>
        ) : (
          <>
            <div className="habit-focus reminder-card"><Icon aria-hidden="true" /><div><h2>My {noun}</h2><p>{reminder.text}</p></div></div>
            {reminder.reason && <section className="reminder-reason"><h2 className="habit-section-title">Why it matters to me</h2><p>{reminder.reason}</p></section>}
            <p className="reminder-return">Come back to Keep me on track → {isFocus ? 'A wellbeing focus' : 'A current intention'} whenever you’d like a reminder. You can update this as life changes.</p>
            <p className="reminder-storage">Saved in this browser on this device.</p>
          </>
        )}
        {storageError && <p role="status">Your browser couldn’t save this reminder. Keep this page open to retain it.</p>}
      </section>
    </main>
  );
};

const habitDateKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

const DailyHabitPage = ({ onBack, onHome, userId }) => {
  const storageKey = `willow-daily-habit:${userId ?? 'guest'}`;
  const [habit, setHabit] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (typeof saved?.title === 'string' && typeof saved?.intention === 'string' && Array.isArray(saved?.days)) {
        return { title: saved.title, intention: saved.intention, days: saved.days.filter((day) => typeof day === 'string'), note: typeof saved.note === 'string' ? saved.note : '' };
      }
    } catch { /* Start with a fresh habit when storage is unavailable. */ }
    return { title: 'Daily movement', intention: 'A little each day to feel stronger and more grounded.', days: [], note: '' };
  });
  const [editing, setEditing] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(habit));
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [habit, storageKey]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - (today.getDay() + 6) % 7);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return { date, key: habitDateKey(date) };
  });
  const completed = week.filter(({ key }) => habit.days.includes(key)).length;
  const percentage = Math.round(completed / 7 * 100);

  return (
    <main className="page tracking-page">
      <section className="tracking-content habit-content" aria-labelledby="habit-heading">
        <div className="tracking-brand">Willow<Leaf aria-hidden="true" /></div>
        <TrackingNavigation onBack={onBack} onHome={onHome} />
        <div className="habit-section-heading"><h1 id="habit-heading">Your focus</h1><button type="button" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit'}</button></div>
        {editing ? (
          <form className="habit-edit" onSubmit={(event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            setHabit((current) => ({ ...current, title: fields.get('title').trim(), intention: fields.get('intention').trim() }));
            setEditing(false);
          }}>
            <label>Your habit<input name="title" defaultValue={habit.title} required maxLength={100} pattern=".*\S.*" /></label>
            <label>Why it matters<textarea name="intention" defaultValue={habit.intention} required maxLength={240} /></label>
            <button className="tracking-continue" type="submit">Save focus <Check aria-hidden="true" /></button>
          </form>
        ) : <div className="habit-focus"><Sprout aria-hidden="true" /><div><h2>{habit.title}</h2><p>{habit.intention}</p></div></div>}
        <h2 className="habit-section-title">Your rhythm</h2>
        <div className="habit-week" role="group" aria-label="This week’s daily check-ins">
          {week.map(({ date, key }) => {
            const checked = habit.days.includes(key);
            const label = date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
            return <button key={key} type="button" disabled={date > today} aria-label={label} aria-pressed={checked} onClick={() => setHabit((current) => ({ ...current, days: checked ? current.days.filter((day) => day !== key) : [...current.days, key] }))}>
              <span>{date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1)}</span>
              <span className={`habit-day ${checked ? 'is-complete' : ''}`}>{checked && <Check aria-hidden="true" />}</span>
            </button>;
          })}
        </div>
        <h2 className="habit-section-title">Your momentum</h2>
        <p className="habit-count"><CalendarCheck aria-hidden="true" />{completed} of 7 days this week</p>
        <div className="habit-progress"><progress max="7" value={completed} aria-label="Days completed this week" /><strong>{percentage}%</strong></div>
        <div className="habit-reflection"><Sun aria-hidden="true" /><label><strong>Noticing a difference?</strong><textarea aria-label="How your habit is making a difference" placeholder="How are you feeling? Notice any small shifts?" value={habit.note} maxLength={500} onChange={(event) => setHabit((current) => ({ ...current, note: event.target.value }))} /></label></div>
        {storageError && <p role="status">Your browser couldn’t save these updates. Keep this page open to retain them.</p>}
      </section>
    </main>
  );
};

const SilencePage = ({ onBack, auth, onSignIn }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(300);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTrack, setActiveTrack] = useState(null);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const timerRef = useRef(null);
  const silenceAudioRef = useRef(null);
  const natureAudioRef = useRef(null);
  const recordedTrackRef = useRef(null);

  const startSession = async (track) => {
    const audio = track === 'nature' ? natureAudioRef.current : silenceAudioRef.current;
    const otherAudio = track === 'nature' ? silenceAudioRef.current : natureAudioRef.current;
    if (!audio) return;
    otherAudio?.pause();
    if (otherAudio) otherAudio.currentTime = 0;
    if (activeTrack !== track || secondsRemaining === 0 || audio.ended) {
      audio.currentTime = 0;
      setSecondsRemaining(300);
      setPlaybackPosition(0);
    }
    try {
      await audio.play();
      setActiveTrack(track);
      setIsRunning(true);
      if (recordedTrackRef.current !== track) {
        recordedTrackRef.current = track;
        void recordActivity(track === 'nature' ? 'Five minute break · Nature' : 'Five minute break · Silence', auth.user?.id)
          .catch((error) => console.error('Unable to save break activity:', error));
      }
    } catch (error) {
      console.error(`Failed to start five minutes of ${track}:`, error);
      setIsRunning(false);
    }
  };

  const pauseSession = () => {
    const audio = activeTrack === 'nature' ? natureAudioRef.current : silenceAudioRef.current;
    audio?.pause();
    setIsRunning(false);
  };

  useEffect(() => {
    if (!isRunning) return undefined;
    timerRef.current = window.setInterval(() => {
      const activeAudio = activeTrack === 'nature' ? natureAudioRef.current : silenceAudioRef.current;
      const elapsed = activeAudio?.currentTime ?? 0;
      setPlaybackPosition(elapsed);
      setSecondsRemaining(Math.max(0, Math.ceil(300 - elapsed)));
    }, 250);
    return () => window.clearInterval(timerRef.current);
  }, [activeTrack, isRunning]);

  useEffect(
    () => () => {
      window.clearInterval(timerRef.current);
      silenceAudioRef.current?.pause();
      natureAudioRef.current?.pause();
    },
    [],
  );

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = String(secondsRemaining % 60).padStart(2, '0');
  const formatPlaybackTime = (time) => {
    const safeTime = Number.isFinite(time) ? Math.max(0, Math.floor(time)) : 0;
    return `${Math.floor(safeTime / 60)}:${String(safeTime % 60).padStart(2, '0')}`;
  };

  const seekSession = (event) => {
    const nextTime = Number(event.target.value);
    const audio = activeTrack === 'nature' ? natureAudioRef.current : silenceAudioRef.current;
    if (!audio || !Number.isFinite(nextTime)) return;
    audio.currentTime = nextTime;
    setPlaybackPosition(nextTime);
    setSecondsRemaining(Math.max(0, Math.ceil(300 - nextTime)));
  };

  return (
    <main className="page silence-page">
      <AccountButton auth={auth} onSignIn={onSignIn} />
      <HomeButton onHome={onBack} />
      <section className="silence-content" aria-labelledby="silence-heading">
        <audio
          ref={silenceAudioRef}
          src="/audio/5_minutes_silence_then_bell.mp3"
          preload="none"
          onEnded={() => {
            recordedTrackRef.current = null;
            setSecondsRemaining(0);
            setPlaybackPosition(300);
            setIsRunning(false);
          }}
        />
        <audio
          ref={natureAudioRef}
          src="/audio/5_minute_water_then_bell.mp3"
          preload="none"
          onEnded={() => {
            recordedTrackRef.current = null;
            setSecondsRemaining(0);
            setPlaybackPosition(300);
            setIsRunning(false);
          }}
        />
        <h1 id="silence-heading">A five minute break</h1>
        <p>A gentle bell will ring after five minutes.</p>
        <p className="silence-invitation">Close your eyes and rest.</p>
        <div className="silence-timer" aria-live="polite">
          <span>{minutes}:{seconds}</span>
            <div className="silence-timeline">
              <span>{formatPlaybackTime(playbackPosition)}</span>
              <input
                type="range"
                min="0"
                max="300"
                step="0.1"
                value={Math.min(playbackPosition, 300)}
                onChange={seekSession}
                aria-label="Five minute break playback position"
              />
              <span>5:00</span>
            </div>
          <div className="silence-timer-actions">
            {[
              { track: 'nature', label: 'Sound bath', detail: 'Gentle stream', Icon: Leaf },
              { track: 'silence', label: 'Quiet', detail: 'No sound', Icon: Bell },
            ].map(({ track, label, detail, Icon }) => {
              const playing = isRunning && activeTrack === track;
              return (
                <div className={`silence-option ${track}`} key={track}>
                  <button
                    type="button"
                    aria-label={`${playing ? 'Pause' : 'Start'} ${label.toLowerCase()}`}
                    aria-pressed={playing}
                    onClick={playing ? pauseSession : () => void startSession(track)}
                  >
                    {playing ? <Pause aria-hidden="true" /> : <Icon aria-hidden="true" />}
                  </button>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
};

const MeditationPage = ({ onBack, auth, onSignIn }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const activityRecordedRef = useRef(false);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
        if (!activityRecordedRef.current) {
          activityRecordedRef.current = true;
          void recordActivity('Meditation · Field meditation', auth.user?.id)
            .catch((error) => console.error('Unable to save meditation activity:', error));
        }
      } catch (error) {
        console.error('Failed to start meditation audio:', error);
        setIsPlaying(false);
      }
      return;
    }

    audio.pause();
    setIsPlaying(false);
  };

  const leaveMeditation = (destination) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    destination();
  };

  return (
    <main className="page meditation-page">
      <AccountButton auth={auth} onSignIn={onSignIn} />
      <HomeButton onHome={() => leaveMeditation(onBack)} />

      <section className="meditation-content" aria-labelledby="meditation-heading">
        <p className="meditation-eyebrow">Clearing practice</p>
        <h1 id="meditation-heading">Field meditation</h1>
        <p>Settle in, soften your gaze, and let the guided current carry what you no longer need.</p>

        <div className="meditation-player">
          <audio
            ref={audioRef}
            src="/audio/clearing-meditation.mp3"
            preload="none"
            onEnded={() => {
              activityRecordedRef.current = false;
              setIsPlaying(false);
            }}
          />
          <button
            type="button"
            onClick={() => void togglePlayback()}
            aria-label={isPlaying ? 'Pause meditation' : 'Play meditation'}
          >
            {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            <span>{isPlaying ? 'Pause' : 'Play'} meditation</span>
          </button>
        </div>
      </section>
    </main>
  );
};

const App = () => {
  const [step, setCurrentStep] = useState(0);
  const [pageHistory, setPageHistory] = useState([]);
  const setStep = useCallback((next) => {
    const target = typeof next === 'function' ? next(step) : next;
    if (target === step) return;
    setPageHistory((history) => [...history, step]);
    setCurrentStep(target);
  }, [step]);
  const goBack = useCallback(() => {
    if (!pageHistory.length) return;
    setCurrentStep(pageHistory.at(-1));
    setPageHistory((history) => history.slice(0, -1));
  }, [pageHistory]);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const openArchive = useCallback(() => setArchiveOpen(true), []);
  const [entryContext, setEntryContext] = useState(null);
  const closeArchive = useCallback(() => setArchiveOpen(false), []);
  const [initialThought, setInitialThought] = useState('');
  const [conversationMode, setConversationMode] = useState('break');
  const [activeConversation, setActiveConversation] = useState(null);
  const [resumeConversation, setResumeConversation] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const auth = useAuth();
  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const goHome = useCallback(() => {
    setCurrentStep(0);
    setPageHistory([]);
  }, []);
  const conversationChanged = useCallback(
    (conversation) => {
      if (!auth.user?.id) {
        setResumeConversation(null);
        return;
      }
      setResumeConversation(
        conversation?.user_id === auth.user.id ? conversation : null,
      );
    },
    [auth.user?.id],
  );

  useEffect(() => {
    if (auth.loading) return undefined;
    if (!auth.user?.id) {
      setResumeConversation(null);
      return undefined;
    }
    let active = true;
    void getLatestConversation(auth.user.id).then((conversation) => {
      if (active) setResumeConversation(conversation);
    });
    return () => {
      active = false;
    };
  }, [auth.loading, auth.user?.id]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const target = event.target;
      const isInteractive = target instanceof HTMLElement && target.closest('input, textarea, button, a');
      if (event.key === 'Enter' && !authOpen && !isInteractive) {
        setStep((current) => (current === 0 ? 1 : current));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authOpen, setStep]);

  let page;
  if (step === 0) {
    page = (
      <IntroPage
        onBreak={() => {
          setActiveConversation(null);
          setEntryContext(null);
          setInitialThought('');
          setConversationMode('break');
          setStep(3);
        }}
        onClearing={() => {
          setStep(2);
        }}
        onGrounding={() => {
          setActiveConversation(null);
          setEntryContext(null);
          setStep(6);
        }}
        onTakeStep={() => {
          setActiveConversation(null);
          setEntryContext(null);
          setInitialThought('');
          setConversationMode('core');
          setStep(7);
        }}
        onThoughtSubmit={(thought) => {
          setActiveConversation(null);
          setEntryContext(null);
          setInitialThought(thought);
          setConversationMode('core');
          setStep(4);
        }}
        onKeepOnTrack={() => {
          setStep(8);
        }}
        resumeConversation={resumeConversation}
        onResumeConversation={() => {
          setInitialThought('');
          setConversationMode(resumeConversation.mode);
          setActiveConversation(resumeConversation);
          setStep(4);
        }}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  } else if (step === 1) {
    page = (
      <HomePage
        onHome={goHome}
        onBreak={() => {
          setActiveConversation(null);
          setEntryContext(null);
          setInitialThought('');
          setConversationMode('break');
          setStep(3);
        }}
        onClearing={() => {
          setStep(2);
        }}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  } else if (step === 2) {
    page = (
      <MeditationPage
        onBack={goHome}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  } else if (step === 3) {
    page = (
      <BreakChoicePage
        onBack={goHome}
        onChat={() => setStep(4)}
        onSilence={() => setStep(5)}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  } else if (step === 4) {
    page = (
      <BreakSupportPage
        onBack={goHome}
        entryContext={entryContext}
        initialMessage={initialThought}
        mode={conversationMode}
        savedConversation={activeConversation}
        onConversationChanged={conversationChanged}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  } else if (step === 5) {
    page = <SilencePage onBack={goHome} auth={auth} onSignIn={openAuth} />;
  } else if (step === 8) {
    page = (
      <KeepOnTrackPage
        onBack={goBack}
        onHome={goHome}
        onContinue={(selection) => {
          if (selection === 'A daily habit') {
            setStep(9);
            return;
          }
          setStep(selection === 'A wellbeing focus' ? 10 : 11);
        }}
      />
    );
  } else if (step === 9) {
    page = <DailyHabitPage key={auth.user?.id ?? 'guest'} userId={auth.user?.id} onBack={goBack} onHome={goHome} />;
  } else if (step === 10 || step === 11) {
    const kind = step === 10 ? 'focus' : 'intention';
    page = <PersonalReminderPage key={`${kind}:${auth.user?.id ?? 'guest'}`} kind={kind} userId={auth.user?.id} onBack={goBack} onHome={goHome} />;
  } else if (step === 7) {
    page = (
      <MattersPage
        onHome={goHome}
        onSelect={(choice) => {
          setActiveConversation(null);
          setEntryContext({ activity: 'Move towards what matters', selection: choice });
          setInitialThought(choice === 'Not sure yet'
            ? "I'm not sure what I'd like more of in my life yet."
            : `I'd like a little more ${choice.toLowerCase()} in my life.`);
          setConversationMode('core');
          setStep(4);
        }}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  } else {
    page = (
      <GroundingPage
        onHome={goHome}
        onSelect={(choice) => {
          setActiveConversation(null);
          setEntryContext(null);
          setEntryContext({ activity: 'Grounding', selection: choice });
          setInitialThought(choice);
          setConversationMode('core');
          setStep(4);
        }}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  }

  return (
    <>
      <NavigationContext.Provider value={{ canGoBack: pageHistory.length > 1, goBack }}>
      {page}
      <MainMenu onHome={goHome} onArchive={openArchive} auth={auth} onSignIn={openAuth} />
      {archiveOpen && <Archive key={auth.user?.id ?? 'guest'} userId={auth.user?.id} onClose={closeArchive} />}
      {authOpen && (
        <Suspense fallback={null}>
          <AuthModal isOpen onClose={closeAuth} auth={auth} />
        </Suspense>
      )}
      </NavigationContext.Provider>
    </>
  );
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
