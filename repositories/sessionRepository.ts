import { supabase } from '@/lib/supabase';
import type { AuthOutcome, SessionRepository, SignUpOutcome } from './types';

/**
 * Entrada, cadastro e saida. Issue #48.
 *
 * Envelope fino: as telas ja tratam falha mostrando Alert com a mensagem, entao devolver
 * `{ error }` preserva o que elas fazem hoje em vez de obrigar cada uma a um try/catch.
 *
 * O que NAO esta aqui: leitura e validacao da sessao corrente. Isso vive em
 * contexts/AuthContext.tsx, que e onde a trilha de sessao offline esta trabalhando nas
 * T3.9 a T3.13. Este arquivo cobre so os pontos que estavam soltos nas telas.
 */
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
          setupCompleted: false, // Define status do setup inicial
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
