import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnectivity } from '@/hooks/useConnectivity';
import { onDadosLocaisMudaram, sincronizar } from '@/sync';
import { FILA_VAZIA, lerEstadoDaFila, type EstadoDaFila } from '@/sync/status';

/**
 * Sincronizacao: envia a fila e replica do servidor. Issues #49, #50 e #51.
 *
 * Roda ao entrar com sessao e de novo quando a conexao volta. NAO existe acao manual de
 * sincronizar exposta a interface, e isso e decisao da #51: o envio recua ate seis horas mas
 * nunca desiste, entao um botao de "tentar de novo" nao mudaria o resultado. Gerenciar
 * sincronizacao nao e tarefa do paciente.
 */

type SyncContextType = {
  sincronizando: boolean;
  ultimaAtualizacao: Date | null;
  /** O que a interface le para marcar o historico e para avisar quando algo travou. */
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
      // A trava contra concorrencia vive no modulo de sincronizacao, nao aqui: a gravacao
      // dispara envio de dentro do repositorio, fora do React, e um guarda de componente nao
      // veria aquela chamada.
      await sincronizar();
    } catch (e: any) {
      if (montado.current) setErro(e?.message ?? 'Erro ao sincronizar com o servidor');
    } finally {
      if (montado.current) setSincronizando(false);
    }
  }, []);

  // Qualquer replicacao, venha de onde vier, atualiza a data e com ela as telas que leem.
  useEffect(() => onDadosLocaisMudaram(() => setUltimaAtualizacao(new Date())), []);

  // O estado da fila e lido do banco local, nao deduzido do resultado da sincronizacao: se o
  // app abriu offline com fila cheia, o historico tem que marcar as pendentes sem esperar rede.
  useEffect(() => {
    lerEstadoDaFila()
      .then((estado) => {
        if (montado.current) setFila(estado);
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
    <SyncContext.Provider value={{ sincronizando, ultimaAtualizacao, fila, erro }}>
      {children}
    </SyncContext.Provider>
  );
};
