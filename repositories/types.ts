import { CrisisRecord } from '@/types/crisis';

/**
 * Contratos de acesso a dado do projeto. Issue #48.
 *
 * Os tipos abaixo descrevem o dado em termos de dominio e nao em termos do PostgREST: sem
 * select aninhado, sem nome de coluna em snake_case, com Date no lugar de string ISO.
 *
 * Isso e de proposito e e o ponto da tarefa. A T3.6 vai escrever uma segunda implementacao
 * destes mesmos contratos contra o SQLite local, e banco local nao devolve o formato de
 * select aninhado do Supabase. Se a interface falasse o formato do PostgREST, so existiria
 * uma forma de implementa-la, e a camada nao serviria para nada.
 *
 * Os nomes dos campos seguem o schema, em portugues, como o resto do projeto. Os nomes dos
 * metodos seguem o ingles dos arquivos e das funcoes.
 */

// ─── Crise ────────────────────────────────────────────────────────────────────

export interface Phase {
  id: string;
  intensidadeDor: number | null;
  regiaoDor: string | null;
  lado: string | null;
  nivelIncapacidade: string | null;
  resumo: string | null;
  /** Ids do catalogo fixo de types/crisis.ts. O rotulo e resolvido na exibicao. */
  sintomas: string[];
  medicamentos: string[];
  /** Digitados pelo usuario. Texto livre, sem catalogo. */
  medicamentosLivres: string[];
  fatores: string[];
}

export interface Crisis {
  id: string;
  /**
   * Nulo e possivel: a coluna inicio_crise aceita nulo no schema. Os hooks de hoje ja
   * tratam esse caso, uns filtrando e outros escrevendo "data desconhecida", e o contrato
   * precisa dizer a verdade para que continuem tratando. Sem o nulo aqui, uma crise sem
   * inicio viraria 1º de janeiro de 1970 em silencio.
   */
  inicioCrise: Date | null;
  fimCrise: Date | null;
  fases: Phase[];
}

/**
 * Recortes de data. Os quatro campos existem porque o calendario precisa de duas consultas
 * diferentes: as crises que comecam no mes, e as que comecaram antes e ainda terminam nele.
 */
export interface CrisisFilter {
  /** inicio_crise >= desde */
  desde?: Date;
  /** inicio_crise <= ate */
  ate?: Date;
  /** inicio_crise < comecouAntesDe */
  comecouAntesDe?: Date;
  /** fim_crise >= terminaApos */
  terminaApos?: Date;
  /** Ordem por inicio_crise. Padrao crescente. */
  ordem?: 'asc' | 'desc';
}

export interface CrisisRepository {
  list(filtro?: CrisisFilter): Promise<Crisis[]>;
  /** fim_crise da crise encerrada mais recente, ou null se nenhuma foi encerrada. */
  lastEndedAt(): Promise<Date | null>;
  countSince(data: Date): Promise<number>;
  /** Intensidades de todas as fases, para media. Nulos ficam de fora. */
  intensities(): Promise<number[]>;
  /**
   * Grava a crise e todas as fases. Os identificadores sao gerados aqui, no aparelho,
   * como a #44 exige, e a gravacao e atomica, como a #40 exige.
   */
  save(crisis: CrisisRecord, fases: CrisisRecord[]): Promise<void>;
}

// ─── Registro diario ──────────────────────────────────────────────────────────

export type HumorId = 'terrible' | 'bad' | 'so-so' | 'okay' | 'great';

export interface DailyRecord {
  id: string;
  /** Dia do registro em YYYY-MM-DD. Nao e timestamp: o registro e do dia, nao do instante. */
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
  createdAt: string;
}

export interface NewDailyRecord {
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
}

export interface DailyRecordRepository {
  /** Intervalo fechado, nos dois extremos, em YYYY-MM-DD. */
  listBetween(de: string, ate: string): Promise<DailyRecord[]>;
  save(registro: NewDailyRecord): Promise<void>;
}

// ─── Setup ────────────────────────────────────────────────────────────────────

export interface SetupOption {
  id: number;
  texto: string;
}

export interface SetupQuestion {
  id: number;
  texto: string;
  tipo: string;
  passoSetup: number;
  opcoes: SetupOption[];
}

export interface SetupAnswer {
  usuarioId: number;
  perguntaId: number;
  valorNumero?: number;
  valorTexto?: string;
  valorBooleano?: boolean;
  opcaoId?: number;
  valorAcimaMax?: boolean;
  valorAbaixoMin?: boolean;
}

export interface SetupRepository {
  listQuestions(): Promise<SetupQuestion[]>;
  saveAnswers(respostas: SetupAnswer[]): Promise<void>;
}

// ─── Usuario ──────────────────────────────────────────────────────────────────

export interface UserRepository {
  /**
   * Traduz o usuario autenticado para a linha de public.usuarios.
   *
   * Existia copiada em tres arquivos, com tratamento de erro diferente em cada um. E o que
   * a #33 pede que passe a morar num lugar so. Devolve null quando nao ha sessao ou quando
   * o perfil nao existe: as duas situacoes significam a mesma coisa para quem chama, que e
   * nao ha onde gravar.
   */
  currentUsuarioId(): Promise<number | null>;
}

// ─── Sessao ───────────────────────────────────────────────────────────────────

/**
 * Envelope em vez de excecao: as telas de login e cadastro ja tratam erro mostrando
 * Alert com a mensagem, e nao com try/catch.
 */
export interface AuthOutcome {
  error: string | null;
}

export interface SignUpOutcome extends AuthOutcome {
  /**
   * Falso quando o projeto exige confirmacao de e-mail: a conta e criada mas a sessao nao,
   * e a tela precisa mandar o usuario conferir a caixa de entrada em vez de seguir.
   */
  signedIn: boolean;
}

export interface SessionRepository {
  signIn(email: string, senha: string): Promise<AuthOutcome>;
  signUp(dados: { email: string; senha: string; nome: string }): Promise<SignUpOutcome>;
  signOut(): Promise<void>;
  markSetupCompleted(): Promise<AuthOutcome>;
}
