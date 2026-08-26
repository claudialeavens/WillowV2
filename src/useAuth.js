import { useEffect, useState } from 'react';
import { supabase } from './supabase';

const GUEST_SESSION_KEY = 'willow_guest_session';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(
    () => window.localStorage.getItem(GUEST_SESSION_KEY) === 'true',
  );

  useEffect(() => {
    let active = true;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (!active) return;
      setUser(sessionData.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    window.localStorage.removeItem(GUEST_SESSION_KEY);
    setIsGuest(false);
  };

  const signUp = async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
  };

  const resendConfirmation = async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    if (error) throw error;
  };

  const skipSignIn = () => {
    window.localStorage.setItem(GUEST_SESSION_KEY, 'true');
    setIsGuest(true);
  };

  const signOut = async () => {
    if (user) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    window.localStorage.removeItem(GUEST_SESSION_KEY);
    setIsGuest(false);
    setUser(null);
  };

  return {
    user,
    loading,
    isGuest,
    signIn,
    signUp,
    resendConfirmation,
    skipSignIn,
    signOut,
  };
};
