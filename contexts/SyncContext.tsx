import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { contarPendentes, onDadosLocaisMudaram, sincronizar } from '@/sync';

/**
 * Sincronizacao: envia a fila e replica do servidor. Issues #49 e #50.
 *
 * Roda ao entrar com sessao e de novo quando a conexao volta. O estado exposto aqui e o que a
 * #51 vai mostrar na interface — especialmente `pendentes`, que e o numero de registros
 * gravados no aparelho e ainda nao enviados.
 */

type SyncContextType = {
  sincronizando: boolean;
  ultimaAtualizacao: Date | null;
  pendentes: number;
  erro: string | null;
  sincronizarAgora: () => Promise<void>;
};

const SyncContext = createContext<SyncContextType>({
  sincronizando: false,
  ultimaAtualizacao: null,
  pendentes: 0,
  erro: null,
  sincronizarAgora: async () => {},
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isOnline } = useConnectivity();

  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [pendentes, setPendentes] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  const montado = useRef(true);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  const sincronizarAgora = useCallback(async () => {
    setSincronizando(true);
    setErro(null);
    try {
      // A trava contra concorrencia vive no modulo de sincronizacao, nao aqui: a gravacao
      // dispara envio de dentro do repositorio, fora do React, e um guarda de componente nao
      // veria aquela chamada.
      const resultado = await sincronizar();
      if (montado.current) setPendentes(resultado.pendentes);
    } catch (e: any) {
      if (montado.current) setErro(e?.message ?? 'Erro ao sincronizar com o servidor');
    } finally {
      if (montado.current) setSincronizando(false);
    }
  }, []);

  // Qualquer replicacao, venha de onde vier, atualiza a data e com ela as telas que leem.
  useEffect(() => onDadosLocaisMudaram(() => setUltimaAtualizacao(new Date())), []);

  // O contador precisa estar certo antes da primeira sincronizacao: se o app abriu offline
  // com fila cheia, o numero tem que aparecer sem esperar rede.
  useEffect(() => {
    contarPendentes()
      .then((total) => {
        if (montado.current) setPendentes(total);
      })
      .catch(() => undefined);
  }, [ultimaAtualizacao]);

  // `isOnline` e falso enquanto a conectividade esta sendo determinada, entao esperar por ele
  // ja cobre o boot: nao se tenta sincronizar antes de saber se ha rede. Quando a conexao
  // volta, isOnline vira true e o efeito roda de novo.
  useEffect(() => {
    if (!user || !isOnline) return;
    void sincronizarAgora();
  }, [user, isOnline, sincronizarAgora]);

  return (
    <SyncContext.Provider
      value={{ sincronizando, ultimaAtualizacao, pendentes, erro, sincronizarAgora }}
    >
      {children}
    </SyncContext.Provider>
  );
};
