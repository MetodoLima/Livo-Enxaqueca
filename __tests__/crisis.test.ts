import {
  createEmptyCrisis,
  mergeAiResultIntoCrisis,
  crisisToMigraineStructured,
  INTENSITY_CONFIG,
  LOCATIONS,
  SIDES,
  SYMPTOMS,
  MEDICATIONS,
  CrisisRecord,
} from '../types/crisis';
import { MigraineStructured, SintomasAssociados } from '../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Retorna um MigraineStructured completamente vazio (todos os campos nulos/falsos). */
function emptyStructured(): MigraineStructured {
  return {
    intensidade_dor: null,
    localizacao: null,
    lado: null,
    qualidade_dor: [],
    sintomas_associados: {
      nausea: false,
      vomito: false,
      fotofobia: false,
      fonofobia: false,
      aura: false,
      tontura: false,
      outros: [],
    },
    inicio_estimado: null,
    medicamentos_tomados: [],
    fatores_desencadeantes: [],
    nivel_incapacidade: null,
    resumo: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// createEmptyCrisis
// ─────────────────────────────────────────────────────────────────────────────

describe('createEmptyCrisis', () => {
  it('retorna um objeto com todos os campos esperados', () => {
    const crisis = createEmptyCrisis();

    expect(crisis).toHaveProperty('startTime');
    expect(crisis).toHaveProperty('endTime');
    expect(crisis).toHaveProperty('intensity');
    expect(crisis).toHaveProperty('location');
    expect(crisis).toHaveProperty('side');
    expect(crisis).toHaveProperty('symptoms');
    expect(crisis).toHaveProperty('medications');
    expect(crisis).toHaveProperty('customMedications');
    expect(crisis).toHaveProperty('triggers');
    expect(crisis).toHaveProperty('aiComplement');
  });

  it('startTime é uma instância válida de Date', () => {
    const crisis = createEmptyCrisis();
    expect(crisis.startTime).toBeInstanceOf(Date);
    expect(isNaN(crisis.startTime.getTime())).toBe(false);
  });

  it('campos opcionais começam como null', () => {
    const crisis = createEmptyCrisis();
    expect(crisis.endTime).toBeNull();
    expect(crisis.intensity).toBeNull();
    expect(crisis.location).toBeNull();
    expect(crisis.side).toBeNull();
    expect(crisis.aiComplement).toBeNull();
  });

  it('arrays começam vazios', () => {
    const crisis = createEmptyCrisis();
    expect(crisis.symptoms).toEqual([]);
    expect(crisis.medications).toEqual([]);
    expect(crisis.customMedications).toEqual([]);
    expect(crisis.triggers).toEqual([]);
  });

  it('cada chamada retorna um novo objeto independente', () => {
    const a = createEmptyCrisis();
    const b = createEmptyCrisis();
    a.symptoms.push('nausea');
    expect(b.symptoms).toEqual([]); // modificar um não afeta o outro
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mergeAiResultIntoCrisis
// ─────────────────────────────────────────────────────────────────────────────

describe('mergeAiResultIntoCrisis', () => {
  let baseCrisis: CrisisRecord;

  beforeEach(() => {
    baseCrisis = createEmptyCrisis();
  });

  // ── Intensidade ────────────────────────────────────────────────────────────

  describe('intensidade', () => {
    it('aplica intensidade quando a IA retorna um valor', () => {
      const structured = { ...emptyStructured(), intensidade_dor: 7 };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.intensity).toBe(7);
    });

    it('não define intensity quando a IA retorna null', () => {
      const structured = { ...emptyStructured(), intensidade_dor: null };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch).not.toHaveProperty('intensity');
    });

    it('aceita intensidade zero', () => {
      const structured = { ...emptyStructured(), intensidade_dor: 0 };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.intensity).toBe(0);
    });
  });

  // ── Localização ───────────────────────────────────────────────────────────

  describe('localização', () => {
    it('aplica localização quando a IA retorna um valor', () => {
      const structured = { ...emptyStructured(), localizacao: 'frontal' as const };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.location).toBe('frontal');
    });

    it('não define location quando a IA retorna null (preserva seleção do usuário)', () => {
      baseCrisis.location = 'temporal';
      const structured = { ...emptyStructured(), localizacao: null };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch).not.toHaveProperty('location');
    });
  });

  // ── Lado ──────────────────────────────────────────────────────────────────

  describe('lado', () => {
    it('aplica lado quando a IA retorna um valor', () => {
      const structured = { ...emptyStructured(), lado: 'bilateral' as const };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.side).toBe('bilateral');
    });

    it('não define side quando a IA retorna null', () => {
      const structured = { ...emptyStructured(), lado: null };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch).not.toHaveProperty('side');
    });
  });

  // ── Sintomas ──────────────────────────────────────────────────────────────

  describe('sintomas', () => {
    it('adiciona sintomas da IA quando o usuário não tinha nenhum', () => {
      const structured: MigraineStructured = {
        ...emptyStructured(),
        sintomas_associados: {
          ...emptyStructured().sintomas_associados,
          nausea: true,
          fotofobia: true,
        },
      };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.symptoms).toContain('nausea');
      expect(patch.symptoms).toContain('fotofobia');
    });

    it('faz a união entre sintomas do usuário e da IA, sem duplicatas', () => {
      baseCrisis.symptoms = ['nausea', 'tontura'];
      const structured: MigraineStructured = {
        ...emptyStructured(),
        sintomas_associados: {
          ...emptyStructured().sintomas_associados,
          nausea: true,   // já existe — não deve duplicar
          fotofobia: true, // novo — deve ser adicionado
        },
      };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.symptoms).toEqual(
        expect.arrayContaining(['nausea', 'tontura', 'fotofobia'])
      );
      // Conta as ocorrências de 'nausea' — deve ser exatamente 1
      expect(patch.symptoms!.filter((s) => s === 'nausea')).toHaveLength(1);
    });

    it('todos os sintomas da IA são capturados corretamente', () => {
      const sintomas: SintomasAssociados = {
        nausea: true,
        vomito: true,
        fotofobia: true,
        fonofobia: true,
        aura: true,
        tontura: true,
        outros: [],
      };
      const structured = { ...emptyStructured(), sintomas_associados: sintomas };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.symptoms).toEqual(
        expect.arrayContaining(['nausea', 'vomito', 'fotofobia', 'fonofobia', 'aura', 'tontura'])
      );
    });

    it('quando a IA não detecta nenhum sintoma, patch.symptoms é array vazio', () => {
      const structured = { ...emptyStructured() };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.symptoms).toEqual([]);
    });
  });

  // ── Medicamentos ──────────────────────────────────────────────────────────

  describe('medicamentos', () => {
    it('separa medicamentos conhecidos de customizados', () => {
      const structured = {
        ...emptyStructured(),
        medicamentos_tomados: ['dipirona', 'Tylenol'],
      };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.medications).toContain('dipirona');
      expect(patch.customMedications).toContain('Tylenol');
    });

    it('remove "nenhum" quando a IA detecta medicamentos reais', () => {
      baseCrisis.medications = ['nenhum'];
      const structured = {
        ...emptyStructured(),
        medicamentos_tomados: ['paracetamol'],
      };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.medications).not.toContain('nenhum');
      expect(patch.medications).toContain('paracetamol');
    });

    it('faz a união de medicamentos conhecidos sem duplicatas', () => {
      baseCrisis.medications = ['ibuprofeno'];
      const structured = {
        ...emptyStructured(),
        medicamentos_tomados: ['ibuprofeno', 'dipirona'], // ibuprofeno já existia
      };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.medications!.filter((m) => m === 'ibuprofeno')).toHaveLength(1);
      expect(patch.medications).toContain('dipirona');
    });

    it('não altera medicamentos quando a IA não retorna nenhum', () => {
      const structured = { ...emptyStructured(), medicamentos_tomados: [] };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch).not.toHaveProperty('medications');
      expect(patch).not.toHaveProperty('customMedications');
    });

    it('ignora "nenhum" retornado pela IA', () => {
      const structured = {
        ...emptyStructured(),
        medicamentos_tomados: ['nenhum'],
      };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      // 'nenhum' não deve aparecer em nenhuma das listas
      expect(patch.medications ?? []).not.toContain('nenhum');
      expect(patch.customMedications ?? []).not.toContain('nenhum');
    });
  });

  // ── Fatores desencadeantes ────────────────────────────────────────────────

  describe('fatores desencadeantes', () => {
    it('adiciona triggers da IA quando o usuário não tinha nenhum', () => {
      const structured = {
        ...emptyStructured(),
        fatores_desencadeantes: ['estresse', 'falta de sono'],
      };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.triggers).toEqual(
        expect.arrayContaining(['estresse', 'falta de sono'])
      );
    });

    it('faz a união com triggers do usuário, sem duplicatas', () => {
      baseCrisis.triggers = ['estresse'];
      const structured = {
        ...emptyStructured(),
        fatores_desencadeantes: ['estresse', 'falta de sono'],
      };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch.triggers!.filter((t) => t === 'estresse')).toHaveLength(1);
      expect(patch.triggers).toContain('falta de sono');
    });

    it('não define triggers quando a IA não retorna nenhum', () => {
      const structured = { ...emptyStructured(), fatores_desencadeantes: [] };
      const patch = mergeAiResultIntoCrisis(baseCrisis, structured);
      expect(patch).not.toHaveProperty('triggers');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// crisisToMigraineStructured
// ─────────────────────────────────────────────────────────────────────────────

describe('crisisToMigraineStructured', () => {
  let baseCrisis: CrisisRecord;

  beforeEach(() => {
    baseCrisis = createEmptyCrisis();
  });

  // ── Localização ───────────────────────────────────────────────────────────

  describe('localização', () => {
    it('converte localização conhecida corretamente', () => {
      baseCrisis.location = 'frontal';
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.localizacao).toBe('frontal');
    });

    it('mapeia "atras_olhos" para null (backend não conhece esse valor)', () => {
      baseCrisis.location = 'atras_olhos';
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.localizacao).toBeNull();
    });

    it('retorna null quando localização é null', () => {
      baseCrisis.location = null;
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.localizacao).toBeNull();
    });
  });

  // ── Nível de incapacidade ─────────────────────────────────────────────────

  describe('nivel_incapacidade', () => {
    it('intensidade null → nivel_incapacidade null', () => {
      baseCrisis.intensity = null;
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.nivel_incapacidade).toBeNull();
    });

    it.each([0, 1, 2, 3])('intensidade %i → leve', (intensity) => {
      baseCrisis.intensity = intensity;
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.nivel_incapacidade).toBe('leve');
    });

    it.each([4, 5, 6])('intensidade %i → moderado', (intensity) => {
      baseCrisis.intensity = intensity;
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.nivel_incapacidade).toBe('moderado');
    });

    it.each([7, 8, 9, 10])('intensidade %i → severo', (intensity) => {
      baseCrisis.intensity = intensity;
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.nivel_incapacidade).toBe('severo');
    });
  });

  // ── Sintomas ──────────────────────────────────────────────────────────────

  describe('sintomas_associados', () => {
    it('mapeia todos os sintomas selecionados para true', () => {
      baseCrisis.symptoms = ['nausea', 'aura', 'fonofobia'];
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.sintomas_associados.nausea).toBe(true);
      expect(result.sintomas_associados.aura).toBe(true);
      expect(result.sintomas_associados.fonofobia).toBe(true);
    });

    it('sintomas não selecionados ficam como false', () => {
      baseCrisis.symptoms = ['nausea'];
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.sintomas_associados.vomito).toBe(false);
      expect(result.sintomas_associados.fotofobia).toBe(false);
      expect(result.sintomas_associados.tontura).toBe(false);
    });

    it('sem nenhum sintoma, todos ficam false', () => {
      baseCrisis.symptoms = [];
      const result = crisisToMigraineStructured(baseCrisis);
      const s = result.sintomas_associados;
      expect(Object.values(s).every((v) => v === false || (Array.isArray(v) && v.length === 0))).toBe(true);
    });
  });

  // ── Medicamentos ──────────────────────────────────────────────────────────

  describe('medicamentos_tomados', () => {
    it('filtra "nenhum" da lista final', () => {
      baseCrisis.medications = ['nenhum', 'dipirona'];
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.medicamentos_tomados).not.toContain('nenhum');
      expect(result.medicamentos_tomados).toContain('dipirona');
    });

    it('inclui customMedications na lista final', () => {
      baseCrisis.customMedications = ['Tylenol', 'Aspirina'];
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.medicamentos_tomados).toContain('Tylenol');
      expect(result.medicamentos_tomados).toContain('Aspirina');
    });

    it('combina medicamentos conhecidos e customizados', () => {
      baseCrisis.medications = ['paracetamol'];
      baseCrisis.customMedications = ['Tylenol'];
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.medicamentos_tomados).toEqual(
        expect.arrayContaining(['paracetamol', 'Tylenol'])
      );
    });

    it('lista vazia quando não há medicamentos', () => {
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.medicamentos_tomados).toEqual([]);
    });
  });

  // ── Fatores desencadeantes ────────────────────────────────────────────────

  describe('fatores_desencadeantes', () => {
    it('copia triggers da crise para o resultado', () => {
      baseCrisis.triggers = ['estresse', 'cafeína'];
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.fatores_desencadeantes).toEqual(['estresse', 'cafeína']);
    });

    it('retorna array vazio quando não há triggers', () => {
      const result = crisisToMigraineStructured(baseCrisis);
      expect(result.fatores_desencadeantes).toEqual([]);
    });
  });

  // ── Outros campos ─────────────────────────────────────────────────────────

  it('lado é mapeado corretamente', () => {
    baseCrisis.side = 'esquerdo';
    const result = crisisToMigraineStructured(baseCrisis);
    expect(result.lado).toBe('esquerdo');
  });

  it('intensidade é preservada no campo intensidade_dor', () => {
    baseCrisis.intensity = 6;
    const result = crisisToMigraineStructured(baseCrisis);
    expect(result.intensidade_dor).toBe(6);
  });

  it('campos não preenchidos ficam como null ou array vazio', () => {
    const result = crisisToMigraineStructured(baseCrisis);
    expect(result.inicio_estimado).toBeNull();
    expect(result.resumo).toBeNull();
    expect(result.qualidade_dor).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────

describe('INTENSITY_CONFIG', () => {
  it('tem exatamente 11 itens (valores de 0 a 10)', () => {
    expect(INTENSITY_CONFIG).toHaveLength(11);
  });

  it('valores vão de 0 a 10 sem lacunas', () => {
    const values = INTENSITY_CONFIG.map((c) => c.value);
    for (let i = 0; i <= 10; i++) {
      expect(values).toContain(i);
    }
  });

  it('cada item tem todos os campos obrigatórios preenchidos', () => {
    for (const config of INTENSITY_CONFIG) {
      expect(config.value).toBeDefined();
      expect(config.label).toBeTruthy();
      expect(config.sublabel).toBeTruthy();
      expect(config.emoji).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/); // cor hexadecimal válida
    }
  });
});

describe('LOCATIONS', () => {
  it('contém as localizações esperadas', () => {
    const ids = LOCATIONS.map((l) => l.id);
    expect(ids).toContain('frontal');
    expect(ids).toContain('temporal');
    expect(ids).toContain('occipital');
    expect(ids).toContain('atras_olhos');
    expect(ids).toContain('difusa');
  });
});

describe('SYMPTOMS', () => {
  it('contém os 6 sintomas esperados', () => {
    expect(SYMPTOMS).toHaveLength(6);
    const ids = SYMPTOMS.map((s) => s.id);
    expect(ids).toContain('nausea');
    expect(ids).toContain('fotofobia');
    expect(ids).toContain('fonofobia');
    expect(ids).toContain('tontura');
    expect(ids).toContain('aura');
    expect(ids).toContain('vomito');
  });
});

describe('MEDICATIONS', () => {
  it('contém "nenhum" como opção', () => {
    const ids = MEDICATIONS.map((m) => m.id);
    expect(ids).toContain('nenhum');
  });

  it('cada medicamento tem id, label e emoji', () => {
    for (const med of MEDICATIONS) {
      expect(med.id).toBeTruthy();
      expect(med.label).toBeTruthy();
      expect(med.emoji).toBeTruthy();
    }
  });
});
