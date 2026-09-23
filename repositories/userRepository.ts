import { supabase } from '@/lib/supabase';
import type { UserRepository } from './types';

/**
 * Traducao do usuario autenticado para a linha de public.usuarios. Issue #48.
 *
 * Esta funcao existia copiada em tres arquivos: useRegistroEvento, useRegistroCalendar e
 * step9. As tres faziam a mesma coisa com tratamento de erro diferente, uma com `single` e
 * duas com `maybeSingle`. Centralizar e o que a #33 pede, e passa a ser o unico lugar a
 * mudar quando a leitura vier do banco local.
 *
 * A crise nao usa isto: a funcao salvar_crise resolve o usuario dentro do banco, pela #40.
 * Quem ainda precisa e registro_diario e respostas_setup, que gravam user_id direto.
 */
export const userRepository: UserRepository = {
  async currentUsuarioId(): Promise<number | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('usuarios')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) return null;
    return data.id;
  },
};
