import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useConnectivity } from '../hooks/useConnectivity';
import {
  getLastValidatedAt,
  getOfflineSessionStatus,
  removeLastValidatedAt,
  setLastValidatedAt,
  type OfflineSessionStatus,
} from '../util/offlineTolerance';

export type LocalSessionStatus = 'loading' | 'available' | 'absent';

type AuthContextType = {
  session: Session | null;
  localSession: Session | null;
  localSessionStatus: LocalSessionStatus;
  user: User | null;
  loading: boolean;
  isSetupCompleted: boolean;
  offlineSessionStatus: OfflineSessionStatus;
  checkSetupStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  localSession: null,
  localSessionStatus: 'loading',
  user: null,
  loading: true,
  isSetupCompleted: false,
  offlineSessionStatus: 'unknown',
  checkSetupStatus: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { status: connectivityStatus } = useConnectivity();
  const [localSession, setLocalSession] = useState<Session | null>(null);
  const [localSessionStatus, setLocalSessionStatus] = useState<LocalSessionStatus>('loading');
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);
  const [lastValidatedAt, setLastValidatedAtState] = useState<number | null>(null);
  const initializedByAuthEvent = useRef(false);
  const lastKnownUserId = useRef<string | null>(null);
  const validationLoadId = useRef(0);

  const user = localSession?.user ?? null;
  const loading = localSessionStatus === 'loading';
  const offlineSessionStatus = getOfflineSessionStatus(lastValidatedAt);

  const recordOnlineValidation = (userId: string) => {
    const timestamp = Date.now();
    validationLoadId.current += 1;
    setLastValidatedAtState(timestamp);
    void setLastValidatedAt(userId, timestamp).catch(() => undefined);
  };

  const loadLastValidatedAt = (userId: string) => {
    const loadId = ++validationLoadId.current;

    void getLastValidatedAt(userId)
      .then((timestamp) => {
        if (loadId === validationLoadId.current && lastKnownUserId.current === userId) {
          setLastValidatedAtState(timestamp);
        }
      })
      .catch(() => {
        if (loadId === validationLoadId.current && lastKnownUserId.current === userId) {
          setLastValidatedAtState(null);
        }
      });
  };

  const checkSetupStatus = async () => {
    const localSetupCompleted = !!localSession?.user?.user_metadata?.setupCompleted;
    setIsSetupCompleted(localSetupCompleted);

    if (localSession?.user && connectivityStatus === 'online') {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setIsSetupCompleted(!!data.user.user_metadata?.setupCompleted);
        recordOnlineValidation(data.user.id);
      }
    }
    // Offline uses the local session metadata. Unknown is not offline: we only
    // avoid a remote validation until connectivity has been determined.
  };

  useEffect(() => {
    if (localSession?.user) {
      void checkSetupStatus();
    }
  }, [localSession, connectivityStatus]);

  useEffect(() => {
    let cancelled = false;

    const applyLocalSession = (nextSession: Session | null) => {
      if (cancelled) return;

      const previousUserId = lastKnownUserId.current;
      const nextUserId = nextSession?.user?.id ?? null;
      lastKnownUserId.current = nextUserId;
      validationLoadId.current += 1;

      setLocalSession(nextSession);
      setLocalSessionStatus(nextSession ? 'available' : 'absent');
      setIsSetupCompleted(!!nextSession?.user?.user_metadata?.setupCompleted);
      setLastValidatedAtState(null);

      if (nextUserId) {
        loadLastValidatedAt(nextUserId);
      } else {
        if (previousUserId) {
          void removeLastValidatedAt(previousUserId).catch(() => undefined);
        }
      }
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
          if (nextSession) {
            applyLocalSession(nextSession);
            if (nextSession.user?.id && nextSession.access_token && nextSession.refresh_token) {
              recordOnlineValidation(nextSession.user.id);
            }
          }
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
          setLocalSessionStatus('absent');
        }
      })
      .catch((error: unknown) => {
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
        offlineSessionStatus,
        checkSetupStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
