import { useEffect, useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ShieldCheck, X } from 'lucide-react';

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
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
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
    setCanResend(false);
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
        setMessage({
          type: 'success',
          text: 'Check your email for a confirmation link, then return to sign in.',
        });
        setPassword('');
      }
    } catch (error) {
      const emailNotConfirmed = error.message?.toLowerCase().includes('email not confirmed');
      setCanResend(emailNotConfirmed);
      setMessage({
        type: 'error',
        text: emailNotConfirmed
          ? 'Please confirm your email before signing in.'
          : error.message || 'Something went wrong. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    setSubmitting(true);
    try {
      await auth.resendConfirmation(email);
      setCanResend(false);
      setMessage({ type: 'success', text: 'Confirmation email sent.' });
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Unable to resend the email.' });
    } finally {
      setSubmitting(false);
    }
  };

  const continueAsGuest = () => {
    auth.skipSignIn();
    onClose();
  };

  return (
    <div className="auth-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
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
            <p>Sign in to personalize your wellness journey and manage your reminders.</p>
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
                ? 'Enter your credentials to access your account.'
                : 'Join Willow to save your progress and preferences.'}
            </p>
          </div>

          <label className="auth-field" htmlFor={`${tab}-email`}>
            <span>
              <Mail aria-hidden="true" />
              Email
            </span>
            <input
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

          {canResend && (
            <button className="auth-secondary" type="button" onClick={resend} disabled={submitting}>
              Resend confirmation email
            </button>
          )}

          {tab === 'signin' && (
            <button className="auth-guest" type="button" onClick={continueAsGuest}>
              Continue without signing in
            </button>
          )}
        </form>
      </section>
    </div>
  );
};
