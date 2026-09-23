import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { onReplicated, pullFromServer } from '@/sync/pull';

/**
 * Dispara a replicacao do servidor para o banco local. Issue #49.
 *
 * Replica ao entrar com sessao, e de novo quando a conexao volta. O estado exposto aqui e o
 * que a #51 vai mostrar na interface.
 */

type SyncContextType = {
  replicando: boolean;
  ultimaReplicacao: Date | null;
  erro: string | null;
  replicarAgora: () => Promise<void>;
};

const SyncContext = createContext<SyncContextType>({
  replicando: false,
  ultimaReplicacao: null,
  erro: null,
  replicarAgora: async () => {},
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isOnline } = useConnectivity();

  const [replicando, setReplicando] = useState(false);
  const [ultimaReplicacao, setUltimaReplicacao] = useState<Date | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Duas replicacoes ao mesmo tempo escreveriam na mesma transacao. O ref segura isso sem
  // depender do estado, que so atualiza no render seguinte.
  const emAndamento = useRef(false);

  const replicarAgora = useCallback(async () => {
    if (emAndamento.current) return;
    emAndamento.current = true;
    setReplicando(true);
    setErro(null);
    try {
      // Nao marca a data aqui: quem marca e o ouvinte de onReplicated, logo abaixo, para que
      // replicacao disparada de qualquer lugar atualize as telas do mesmo jeito.
      await pullFromServer();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao sincronizar com o servidor');
    } finally {
      emAndamento.current = false;
      setReplicando(false);
    }
  }, []);

  // Qualquer replicacao, venha de onde vier, atualiza a data e com ela as telas que leem.
  useEffect(() => onReplicated(() => setUltimaReplicacao(new Date())), []);

  // `isOnline` e falso enquanto a conectividade esta sendo determinada, entao esperar por ele
  // ja cobre o boot: nao se tenta replicar antes de saber se ha rede. Quando a conexao volta,
  // isOnline vira true e o efeito roda de novo.
  useEffect(() => {
    if (!user || !isOnline) return;
    void replicarAgora();
  }, [user, isOnline, replicarAgora]);

  return (
    <SyncContext.Provider value={{ replicando, ultimaReplicacao, erro, replicarAgora }}>
      {children}
    </SyncContext.Provider>
  );
};
