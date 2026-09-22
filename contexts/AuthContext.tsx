import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { classifyAuthError } from '../util/authError';

export type LocalSessionStatus = 'loading' | 'available' | 'absent';

type AuthContextType = {
  session: Session | null;
  localSession: Session | null;
  localSessionStatus: LocalSessionStatus;
  user: User | null;
  loading: boolean;
  isSetupCompleted: boolean;
  checkSetupStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  localSession: null,
  localSessionStatus: 'loading',
  user: null,
  loading: true,
  isSetupCompleted: false,
  checkSetupStatus: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [localSession, setLocalSession] = useState<Session | null>(null);
  const [localSessionStatus, setLocalSessionStatus] = useState<LocalSessionStatus>('loading');
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const initializedByAuthEvent = useRef(false);

  const user = localSession?.user ?? null;
  const loading = localSessionStatus === 'loading';

  const checkSetupStatus = async () => {
    if (localSession?.user) {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('[Auth] getUser error classified as', classifyAuthError(error));
      }
      if (!error && data?.user) {
        setIsSetupCompleted(!!data.user.user_metadata?.setupCompleted);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const applyLocalSession = (nextSession: Session | null) => {
      if (cancelled) return;

      setLocalSession(nextSession);
      setLocalSessionStatus(nextSession ? 'available' : 'absent');
      setIsSetupCompleted(!!nextSession?.user?.user_metadata?.setupCompleted);
    };

    const handleAuthStateChange = (event: AuthChangeEvent, nextSession: Session | null) => {
      initializedByAuthEvent.current = true;

      switch (event) {
        case 'INITIAL_SESSION':
        case 'SIGNED_IN':
        case 'USER_UPDATED':
          applyLocalSession(nextSession);
          break;
        case 'TOKEN_REFRESHED':
          if (nextSession) applyLocalSession(nextSession);
          break;
        case 'SIGNED_OUT':
          applyLocalSession(null);
          break;
        default:
          break;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    supabase.auth
      .getSession()
      .then(({ data: { session: storedSession }, error }) => {
        if (cancelled || initializedByAuthEvent.current) return;

        if (!error) {
          applyLocalSession(storedSession);
        } else {
          console.warn('[Auth] getSession error classified as', classifyAuthError(error));
          setLocalSessionStatus('absent');
        }
      })
      .catch((error: unknown) => {
        console.warn('[Auth] getSession exception classified as', classifyAuthError(error));
        if (!cancelled && !initializedByAuthEvent.current) {
          setLocalSessionStatus('absent');
        }
      });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session: localSession,
        localSession,
        localSessionStatus,
        user,
        loading,
        isSetupCompleted,
        checkSetupStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
