import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Leaf,
  LogOut,
  Pause,
  Play,
  Settings,
  User,
} from 'lucide-react';
import { AuthModal } from './AuthModal';
import { BreakSupport } from './BreakSupport';
import { useAuth } from './useAuth';
import './styles.css';

const HOME_ACTIONS = [
  'Grounding',
  'Take a Break',
  'Clearing',
  'Deepen your roots',
  'Follow What Matters',
];

const GradientButton = ({ children, onClick, ariaLabel }) => (
  <button className="gradient-button" type="button" onClick={onClick} aria-label={ariaLabel}>
    <span>{children}</span>
    <ArrowRight aria-hidden="true" size={25} strokeWidth={2.5} />
  </button>
);

const AccountButton = ({ auth, onSignIn }) => {
  if (auth.loading) {
    return <span className="account-loading" aria-label="Loading account" />;
  }

  if (!auth.user || auth.isGuest) {
    return (
      <button className="sign-in" type="button" onClick={onSignIn} aria-label="Sign in">
        <User aria-hidden="true" size={28} strokeWidth={3} />
        <span>Sign In</span>
      </button>
    );
  }

  return (
    <details className="account-menu">
      <summary aria-label="Open account menu">{auth.user.email?.charAt(0).toUpperCase()}</summary>
      <div className="account-popover">
        <p>{auth.user.email}</p>
        <button type="button" disabled>
          <Settings aria-hidden="true" />
          Settings
        </button>
        <button className="account-signout" type="button" onClick={auth.signOut}>
          <LogOut aria-hidden="true" />
          Sign out
        </button>
      </div>
    </details>
  );
};

const HomeButton = ({ onHome }) => (
  <button className="home-button" type="button" onClick={onHome} aria-label="Return to home page">
    <Home aria-hidden="true" />
    <span>Home</span>
  </button>
);

const WillowLogo = () => (
  <h1 className="willow-logo" aria-label="Willow">
    <span className="willow-word">Willow</span>
    <span className="leaf-mark" aria-hidden="true">
      <Leaf size={152} strokeWidth={4.8} />
    </span>
  </h1>
);

const IntroPage = ({ onBegin, onHome, auth, onSignIn }) => (
  <main className="page intro-page">
    <AccountButton auth={auth} onSignIn={onSignIn} />
    <HomeButton onHome={onHome} />
    <section className="intro-content">
      <WillowLogo />
      <p className="tagline">
        Wellness from the inside out.
        <br />
        Small moments. Real change.
      </p>
      <GradientButton onClick={onBegin} ariaLabel="Begin">
        Begin
      </GradientButton>
    </section>
  </main>
);

const HomePage = ({ onHome, onBreak, onClearing, auth, onSignIn }) => (
  <main className="page home-page">
    <AccountButton auth={auth} onSignIn={onSignIn} />
    <HomeButton onHome={onHome} />
    <section className="home-content" aria-labelledby="home-heading">
      <header className="home-heading">
        <p className="home-eyebrow">
          WILLOW
          <br />
          ~ Your personal sanctuary ~
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

      <p className="home-footer">
        This journey offers a reset for the mind and body-helping restore calm, clarity, and
        long-term wellbeing,
        <br />
        ~ one small shift at a time.
      </p>
    </section>
  </main>
);

const BreakSupportPage = ({ onBack, onHome, auth, onSignIn }) => (
  <main className="page break-support-page">
    <AccountButton auth={auth} onSignIn={onSignIn} />
    <HomeButton onHome={onHome} />
    <button className="back-button" type="button" onClick={onBack}>
      <ArrowLeft aria-hidden="true" />
      Back
    </button>
    <BreakSupport />
  </main>
);

const MeditationPage = ({ onBack, onHome, auth, onSignIn }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
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
      <HomeButton onHome={() => leaveMeditation(onHome)} />
      <button className="back-button" type="button" onClick={() => leaveMeditation(onBack)}>
        <ArrowLeft aria-hidden="true" />
        Back
      </button>

      <section className="meditation-content" aria-labelledby="meditation-heading">
        <p className="meditation-eyebrow">Clearing practice</p>
        <h1 id="meditation-heading">River meditation</h1>
        <p>Settle in, soften your gaze, and let the guided current carry what you no longer need.</p>

        <div className="meditation-player">
          <audio
            ref={audioRef}
            src="/audio/clearing-meditation.mp3"
            preload="metadata"
            onEnded={() => setIsPlaying(false)}
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
  const [step, setStep] = useState(0);
  const [authOpen, setAuthOpen] = useState(false);
  const auth = useAuth();
  const openAuth = useCallback(() => setAuthOpen(true), []);
  const closeAuth = useCallback(() => setAuthOpen(false), []);
  const goHome = useCallback(() => setStep(0), []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter' && !authOpen) {
        setStep((current) => (current === 0 ? 1 : current));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [authOpen]);

  let page;
  if (step === 0) {
    page = <IntroPage onBegin={() => setStep(1)} onHome={goHome} auth={auth} onSignIn={openAuth} />;
  } else if (step === 1) {
    page = (
      <HomePage
        onHome={goHome}
        onBreak={() => setStep(3)}
        onClearing={() => setStep(2)}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  } else if (step === 2) {
    page = (
      <MeditationPage
        onBack={() => setStep(1)}
        onHome={goHome}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  } else {
    page = (
      <BreakSupportPage
        onBack={() => setStep(1)}
        onHome={goHome}
        auth={auth}
        onSignIn={openAuth}
      />
    );
  }

  return (
    <>
      {page}
      <AuthModal isOpen={authOpen} onClose={closeAuth} auth={auth} />
    </>
  );
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
