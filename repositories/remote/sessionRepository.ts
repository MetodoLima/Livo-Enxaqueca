import { supabase } from '@/lib/supabase';
import type { AuthOutcome, SessionRepository, SignUpOutcome } from '@/repositories/types';

export const sessionRepository: SessionRepository = {
  async signIn(email: string, senha: string): Promise<AuthOutcome> {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    return { error: error?.message ?? null };
  },

  async signUp({
    email,
    senha,
    nome,
  }: {
    email: string;
    senha: string;
    nome: string;
  }): Promise<SignUpOutcome> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          name: nome,
          setupCompleted: false,
        },
      },
    });
    return { error: error?.message ?? null, signedIn: data.session !== null };
  },

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },

  async markSetupCompleted(): Promise<AuthOutcome> {
    const { error } = await supabase.auth.updateUser({ data: { setupCompleted: true } });
    return { error: error?.message ?? null };
  },
};
