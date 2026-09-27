import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { onDadosLocaisMudaram, sincronizar } from '@/sync';
import { FILA_VAZIA, lerEstadoDaFila, type EstadoDaFila } from '@/sync/status';

type SyncContextType = {
  sincronizando: boolean;
  ultimaAtualizacao: Date | null;
  fila: EstadoDaFila;
  erro: string | null;
};

const SyncContext = createContext<SyncContextType>({
  sincronizando: false,
  ultimaAtualizacao: null,
  fila: FILA_VAZIA,
  erro: null,
});

export const useSync = () => useContext(SyncContext);

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { isOnline } = useConnectivity();

  const [sincronizando, setSincronizando] = useState(false);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [fila, setFila] = useState<EstadoDaFila>(FILA_VAZIA);
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
      await sincronizar();
    } catch (e: any) {
      if (montado.current) setErro(e?.message ?? 'Erro ao sincronizar com o servidor');
    } finally {
      if (montado.current) setSincronizando(false);
    }
  }, []);

  useEffect(() => onDadosLocaisMudaram(() => setUltimaAtualizacao(new Date())), []);

  const usuarioId = user?.id ?? null;
  useEffect(() => {
    if (!usuarioId) {
      setFila(FILA_VAZIA);
      return;
    }
    lerEstadoDaFila()
      .then((estado) => {
        if (montado.current) setFila(estado);
      })
      .catch(() => undefined);
  }, [ultimaAtualizacao, usuarioId]);

  useEffect(() => {
    if (!user || !isOnline) return;
    void sincronizarAgora();
  }, [user, isOnline, sincronizarAgora]);

  return (
    <SyncContext.Provider value={{ sincronizando, ultimaAtualizacao, fila, erro }}>
      {children}
    </SyncContext.Provider>
  );
};
