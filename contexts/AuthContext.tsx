import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  isSetupCompleted: boolean;
  checkSetupStatus: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  isSetupCompleted: false,
  checkSetupStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSetupCompleted, setIsSetupCompleted] = useState(false);

  const checkSetupStatus = async () => {
    if (session?.user) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setIsSetupCompleted(!!data.user.user_metadata?.setupCompleted);
      }
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsSetupCompleted(!!session?.user?.user_metadata?.setupCompleted);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsSetupCompleted(!!session?.user?.user_metadata?.setupCompleted);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, isSetupCompleted, checkSetupStatus }}>
      {children}
    </AuthContext.Provider>
  );
};
