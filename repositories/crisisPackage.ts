import type { CrisisRecord } from '@/types/crisis';
import { randomUUID } from 'expo-crypto';
import type { CrisePayload, FasePayload } from './remote/crisisRepository';

/**
 * Conversao de uma crise registrada no app para o pacote que o banco guarda.
 *
 * Existe num lugar so porque tem dois usuarios: a gravacao local da #50, e o envio direto ao
 * servidor quando o banco local nao abre. As regras aqui dentro — nivel de incapacidade
 * derivado da intensidade, o "nenhum" que nao e medicamento — escritas duas vezes dariam duas
 * crises diferentes para o mesmo registro conforme o caminho.
 *
 * Os identificadores nascem aqui, antes de qualquer rede. E o que torna o reenvio seguro: a
 * funcao salvar_crise usa `on conflict (id) do nothing`, e so funciona se o id ja existir
 * quando o pacote e montado.
 */

export type PacoteCrise = {
  crise: CrisePayload;
  fases: FasePayload[];
};

// Derivado da intensidade, nao escolhido pelo usuario.
function nivelIncapacidade(intensidade: number | null): string | null {
  if (intensidade === null) return null;
  if (intensidade <= 3) return 'leve';
  if (intensidade <= 6) return 'moderado';
  return 'severo';
}

export function montarPacoteCrise(crisis: CrisisRecord, fases: CrisisRecord[] = []): PacoteCrise {
  const todasAsFases = [...fases, crisis];
  const agora = new Date().toISOString();

  return {
    crise: {
      id: randomUUID(),
      inicio_crise: todasAsFases[0].startTime.toISOString(),
      fim_crise: crisis.endTime ? crisis.endTime.toISOString() : null,
      updated_at: agora,
    },
    fases: todasAsFases.map((fase) => ({
      id: randomUUID(),
      intensidade_dor: fase.intensity,
      regiao_dor: fase.location,
      lado: fase.side,
      nivel_incapacidade: nivelIncapacidade(fase.intensity),
      resumo: fase.aiComplement?.aiResult?.structured?.resumo ?? null,
      sintomas: fase.symptoms,
      // 'nenhum' e opcao de interface para dizer que nao tomou nada, nao medicamento.
      medicamentos: fase.medications.filter((m) => m !== 'nenhum'),
      medicamentos_livres: fase.customMedications,
      fatores: fase.triggers,
      updated_at: agora,
    })),
  };
}
