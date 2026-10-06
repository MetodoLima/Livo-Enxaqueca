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

export interface DailyRecord {
  id: string;
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
  createdAt: string;
  enviado: boolean;
}

export interface NewDailyRecord {
  data: string;
  relato: string | null;
  horasSono: number | null;
  mlAgua: number | null;
  humor: HumorId | null;
}

export interface DailyRecordRepository {
  listBetween(de: string, ate: string): Promise<DailyRecord[]>;
  save(registro: NewDailyRecord): Promise<SaveOutcome>;
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
