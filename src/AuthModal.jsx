import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, X, Laptop, Tablet, Smartphone, Leaf } from 'lucide-react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const getPasswordError = (password) => {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[a-z]/.test(password)) return 'Add at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Add at least one uppercase letter.';
  if (!/\d/.test(password)) return 'Add at least one number.';
  return '';
};

const PasswordField = ({ id, label, value, onChange, visible, onToggle, autoComplete }) => (
  <label className="auth-field" htmlFor={id}>
    <span>
      <Lock aria-hidden="true" />
      {label}
    </span>
    <span className="password-input">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={label}
        autoComplete={autoComplete}
        required
      />
      <button
        className="password-toggle"
        type="button"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </span>
  </label>
);

export const AuthModal = ({ isOpen, onClose, auth }) => {
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [showSignInInfo, setShowSignInInfo] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const privacyVisibleRef = useRef(false);
  const privacyCloseRef = useRef(null);
  privacyVisibleRef.current = showPrivacy;
  const infoVisibleRef = useRef(showSignInInfo);
  const infoOkRef = useRef(null);
  const emailRef = useRef(null);
  infoVisibleRef.current = showSignInInfo;

  useEffect(() => {
    if (!isOpen) return;
    if (showPrivacy) privacyCloseRef.current?.focus();
    else if (showSignInInfo) infoOkRef.current?.focus();
    else emailRef.current?.focus();
  }, [isOpen, showSignInInfo, showPrivacy]);

  useEffect(() => {
    if (!isOpen) return undefined;

    setTab('signin');
    setPassword('');
    setPasswordVisible(false);
    setMessage(null);
    setShowSignInInfo(true);
    setShowPrivacy(false);

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (privacyVisibleRef.current) { setShowPrivacy(false); return; }
        if (infoVisibleRef.current) setShowSignInInfo(false);
        else onClose();
      }
    };

    document.body.classList.add('modal-open');
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetFeedback = () => {
    setMessage(null);
  };

  const selectTab = (nextTab) => {
    setTab(nextTab);
    setPassword('');
    setPasswordVisible(false);
    resetFeedback();
  };

  const submit = async (event) => {
    event.preventDefault();
    resetFeedback();

    if (!EMAIL_PATTERN.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (tab === 'signup') {
      const passwordError = getPasswordError(password);
      if (passwordError) {
        setMessage({ type: 'error', text: passwordError });
        return;
      }
    }

    setSubmitting(true);
    try {
      if (tab === 'signin') {
        await auth.signIn(email, password);
        onClose();
      } else {
        await auth.signUp(email, password);
        onClose();
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const continueAsGuest = () => {
    auth.skipSignIn();
    onClose();
  };

  return createPortal(
    <div className="auth-overlay" role="presentation" onClick={() => { if (!showSignInInfo) onClose(); }}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal={!showSignInInfo && !showPrivacy}
        aria-hidden={(showSignInInfo || showPrivacy) || undefined}
        inert={showSignInInfo || showPrivacy ? '' : undefined}
        aria-labelledby="auth-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button className="auth-close" type="button" onClick={onClose} aria-label="Close sign in">
          <X aria-hidden="true" />
        </button>

        <header className="auth-header">
          <span className="auth-shield" aria-hidden="true">
            <ShieldCheck />
          </span>
          <div>
            <p className="auth-kicker">Secure access</p>
            <h2 id="auth-title">Welcome to Willow</h2>
          </div>
        </header>

        <div className="auth-tabs" role="tablist" aria-label="Account access">
          <button
            className={tab === 'signin' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={tab === 'signin'}
            onClick={() => selectTab('signin')}
          >
            Sign In
          </button>
          <button
            className={tab === 'signup' ? 'active' : ''}
            type="button"
            role="tab"
            aria-selected={tab === 'signup'}
            onClick={() => selectTab('signup')}
          >
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={submit}>
          <div className="auth-form-heading">
            <h3>{tab === 'signin' ? 'Sign in to Willow' : 'Create your account'}</h3>
            <p>
              {tab === 'signin'
                ? 'Enter your credentials to continue your saved conversations.'
                : 'Create an account to continue conversations across devices.'}
            </p>
          </div>

          <label className="auth-field" htmlFor={`${tab}-email`}>
            <span>
              <Mail aria-hidden="true" />
              Email
            </span>
            <input
              ref={emailRef}
              id={`${tab}-email`}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              autoFocus
              required
            />
          </label>

          <PasswordField
            id={`${tab}-password`}
            label={tab === 'signin' ? 'Password' : 'Create a password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            visible={passwordVisible}
            onToggle={() => setPasswordVisible((current) => !current)}
            autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
          />

          {tab === 'signup' && (
            <p className="password-help">8+ characters with uppercase, lowercase, and a number.</p>
          )}

          {message && (
            <p className={`auth-message ${message.type}`} role="status">
              {message.text}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting
              ? 'Please wait…'
              : tab === 'signin'
                ? 'Sign In'
                : 'Create Account'}
          </button>

          <button className="auth-guest" type="button" onClick={continueAsGuest}>
            {tab === 'signup' ? 'Continue without signing up' : 'Continue without signing in'}
          </button>
          <button className="auth-privacy-link" type="button" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
        </form>
      </section>
      {showSignInInfo && <div className="signin-info-overlay" onClick={(event) => event.stopPropagation()}>
        <section className="signin-info-dialog" role="dialog" aria-modal={!showPrivacy} aria-label="Sign-in information"
          inert={showPrivacy ? '' : undefined} aria-hidden={showPrivacy || undefined}
          aria-describedby="signin-info-text" onKeyDown={(event) => {
            if (event.key !== 'Tab') return;
            const buttons = event.currentTarget.querySelectorAll('button');
            const first = buttons[0], last = buttons[buttons.length - 1];
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
          }}>
          <button className="signin-info-close" type="button" aria-label="Close account introduction" onClick={onClose}><X aria-hidden="true" /></button>
          <div className="signin-devices" aria-hidden="true"><div className="signin-laptop"><Laptop /><Leaf /></div><Tablet /><Smartphone /></div>
          <h2>Continuity between<br />visits and devices</h2>
          <p id="signin-info-text">To enable continuity in your Willow experience, between visits and devices, <button ref={infoOkRef} className="signin-info-inline" type="button" onClick={() => { selectTab('signup'); setShowSignInInfo(false); }}>sign up here</button>.</p>
          <button className="signin-info-signup" type="button" onClick={() => { selectTab('signup'); setShowSignInInfo(false); }}>Sign Up</button>
          <p className="signin-info-existing">Already have an account? <button type="button" onClick={() => { selectTab('signin'); setShowSignInInfo(false); }}>Sign in</button></p>
          <button className="signin-privacy-link" type="button" onClick={() => setShowPrivacy(true)}>Privacy Policy</button>
        </section>
      </div>}
      {showPrivacy && <div className="signin-privacy-overlay" onClick={(event) => { event.stopPropagation(); setShowPrivacy(false); }}>
          <section className="signin-privacy-dialog" role="dialog" aria-modal="true" aria-label="Privacy Policy" onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => { if (event.key === 'Tab') { event.preventDefault(); privacyCloseRef.current?.focus(); } }}>
            <button ref={privacyCloseRef} className="signin-info-close" type="button" aria-label="Close Privacy Policy" onClick={() => setShowPrivacy(false)}><X aria-hidden="true" /></button>
            <span className="privacy-shield" aria-hidden="true"><ShieldCheck /></span>
            <p>Our commitment is to keep your data secure and protected to the highest standards. ...</p>
          </section>
        </div>}
    </div>,
    document.body,
  );
};
