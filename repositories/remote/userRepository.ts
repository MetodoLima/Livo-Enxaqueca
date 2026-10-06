import { supabase } from '@/lib/supabase';
import type { UserRepository } from '@/repositories/types';

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
