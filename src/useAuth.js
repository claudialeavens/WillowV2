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
      if (session?.user) {
        window.localStorage.removeItem(GUEST_SESSION_KEY);
        setIsGuest(false);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!active) return;
      if (error) console.error('Unable to restore the Willow account session:', error);
      if (sessionData?.session?.user) {
        window.localStorage.removeItem(GUEST_SESSION_KEY);
        setIsGuest(false);
      }
      setUser(sessionData?.session?.user ?? null);
      setLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session || !data.user) {
      throw new Error('Sign in did not create a session. Please try again.');
    }
    window.localStorage.removeItem(GUEST_SESSION_KEY);
    setIsGuest(false);
    setUser(data.user);
    return data.user;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    if (!data.session || !data.user) {
      throw new Error('Unable to sign in after creating your account. Please try signing in.');
    }
    window.localStorage.removeItem(GUEST_SESSION_KEY);
    setIsGuest(false);
    setUser(data.user);
    return data.user;
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
    skipSignIn,
    signOut,
  };
};
