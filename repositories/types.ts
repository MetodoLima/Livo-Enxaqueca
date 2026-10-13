import { CrisisRecord } from '@/types/crisis';

export interface Phase {
  id: string;
  intensidadeDor: number | null;
  regiaoDor: string | null;
  lado: string | null;
  nivelIncapacidade: string | null;
  resumo: string | null;
  sintomas: string[];
  medicamentos: string[];
  medicamentosLivres: string[];
  fatores: string[];
}

export interface Crisis {
  id: string;
  inicioCrise: Date | null;
  fimCrise: Date | null;
  fases: Phase[];
  enviado: boolean;
}

export interface CrisisFilter {
  desde?: Date;
  ate?: Date;
  comecouAntesDe?: Date;
  terminaApos?: Date;
  ordem?: 'asc' | 'desc';
}

export interface SaveOutcome {
  enviado: boolean;
}

export interface CrisisRepository {
  list(filtro?: CrisisFilter): Promise<Crisis[]>;
  lastEndedAt(): Promise<Date | null>;
  countSince(data: Date): Promise<number>;
  intensities(): Promise<number[]>;
  save(crisis: CrisisRecord, fases: CrisisRecord[]): Promise<SaveOutcome>;
}

export type HumorId = 'terrible' | 'bad' | 'so-so' | 'okay' | 'great';

export interface RegistroDia {
  data: string;
  dormiAs: string | null;
  acordeiAs: string | null;
  mlAgua: number | null;
  createdAt: string;
  enviado: boolean;
}

export interface SonoDoDia {
  dormiAs: string;
  acordeiAs: string;
}

export interface RegistroDiaPatch {
  sono?: SonoDoDia | null;
  mlAgua?: number | null;
}

export interface DailyRecordRepository {
  listBetween(de: string, ate: string): Promise<RegistroDia[]>;
  salvarDia(data: string, patch: RegistroDiaPatch): Promise<SaveOutcome>;
}

export interface Momento {
  id: string;
  registradoEm: string;
  humor: HumorId | null;
  relato: string | null;
  enviado: boolean;
}

export interface NovoMomento {
  humor: HumorId | null;
  relato: string | null;
}

export interface MomentRepository {
  listBetween(de: string, ate: string): Promise<Momento[]>;
  ultimoDoDia(data: string): Promise<Momento | null>;
  registrar(novo: NovoMomento): Promise<SaveOutcome>;
}

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

export interface UserRepository {
  currentUsuarioId(): Promise<number | null>;
}

export interface AuthOutcome {
  error: string | null;
}

export interface SignUpOutcome extends AuthOutcome {
  signedIn: boolean;
}

export interface SessionRepository {
  signIn(email: string, senha: string): Promise<AuthOutcome>;
  signUp(dados: { email: string; senha: string; nome: string }): Promise<SignUpOutcome>;
  signOut(): Promise<void>;
  markSetupCompleted(): Promise<AuthOutcome>;
}
