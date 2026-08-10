import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, Leaf, User } from 'lucide-react';
import './styles.css';

const GradientButton = ({ children, onClick, ariaLabel }) => (
  <button className="gradient-button" type="button" onClick={onClick} aria-label={ariaLabel}>
    <span>{children}</span>
    <ArrowRight aria-hidden="true" size={25} strokeWidth={2.5} />
  </button>
);

const SignIn = () => (
  <button className="sign-in" type="button" aria-label="Sign in">
    <User aria-hidden="true" size={28} strokeWidth={3} />
    <span>Sign In</span>
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

const IntroPage = ({ onBegin }) => (
  <main className="page intro-page">
    <SignIn />
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

const WelcomePage = ({ onNext }) => (
  <main className="page welcome-page">
    <SignIn />
    <section className="welcome-content">
      <div className="welcome-card">
        <p>
          <strong>Welcome to Willow!</strong> This is your personal sanctuary - this journey offers a
          reset for the mind and body-helping restore calm, clarity, and long-term wellbeing, one
          small shift at a time.
        </p>
      </div>
      <GradientButton onClick={onNext} ariaLabel="Next">
        Next
      </GradientButton>
    </section>
  </main>
);

const App = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Enter') {
        setStep((current) => Math.min(current + 1, 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return step === 0 ? (
    <IntroPage onBegin={() => setStep(1)} />
  ) : (
    <WelcomePage onNext={() => setStep(1)} />
  );
};

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
