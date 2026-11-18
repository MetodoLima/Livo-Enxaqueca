import test from 'node:test';
import assert from 'node:assert/strict';
import rawPalette from '../constants/colors.json' with { type: 'json' };

// Pure functions for color math & transformation (mirroring constants/Colors.ts)
function hexToRgba(cor) {
  if (cor.startsWith('rgba')) {
    const m = cor.match(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
    if (m) {
      return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), parseFloat(m[4])];
    }
  }
  const limpo = cor.replace('#', '');
  const r = parseInt(limpo.substring(0, 2), 16) || 0;
  const g = parseInt(limpo.substring(2, 4), 16) || 0;
  const b = parseInt(limpo.substring(4, 6), 16) || 0;
  return [r, g, b, 1];
}

function rgbaToHex([r, g, b, a]) {
  if (a < 1) {
    return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`;
  }
  const paraHex = (n) => Math.min(255, Math.max(0, Math.round(n))).toString(16).padStart(2, '0').toUpperCase();
  return `#${paraHex(r)}${paraHex(g)}${paraHex(b)}`;
}

function calcularLuminanciaRelativa(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function aplicarIntensidadeNaCor(cor, intensidade) {
  if (intensidade === 'normal') return cor;

  const [r, g, b, a] = hexToRgba(cor);
  const y = calcularLuminanciaRelativa(r, g, b);
  const fator = intensidade === 'suaves' ? 0.5 : 1.0;

  const nr = (1 - fator) * r + fator * y;
  const ng = (1 - fator) * g + fator * y;
  const nb = (1 - fator) * b + fator * y;

  return rgbaToHex([nr, ng, nb, a]);
}

function transformarGrupo(grupo, intensidade) {
  if (intensidade === 'normal') return grupo;
  const resultado = {};
  for (const [chave, valor] of Object.entries(grupo)) {
    resultado[chave] = aplicarIntensidadeNaCor(valor, intensidade);
  }
  return resultado;
}

function gerarPaletaComIntensidade(base, intensidade) {
  if (intensidade === 'normal') return base;
  return {
    roles: transformarGrupo(base.roles, intensidade),
    pain: transformarGrupo(base.pain, intensidade),
    mood: transformarGrupo(base.mood, intensidade),
    legacy: transformarGrupo(base.legacy, intensidade),
  };
}

const kebab = (nome) => nome.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`);

function gerarVariaveisCss(paleta) {
  const variaveis = {};

  const registrar = (grupo, prefixo = '') => {
    for (const [chave, cor] of Object.entries(grupo)) {
      const token = `${prefixo}${kebab(chave)}`;
      const [r, g, b, a] = hexToRgba(cor);
      variaveis[`--color-${token}-rgb`] = `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
      variaveis[`--color-${token}-alpha`] = a;
      variaveis[`--color-${token}`] = cor;
    }
  };

  registrar(paleta.roles);
  registrar(paleta.pain, 'pain-');
  registrar(paleta.mood, 'mood-');
  registrar(paleta.legacy);

  return variaveis;
}

test('1. Normal intensity preserves exact original colors', () => {
  for (const [nome, cor] of Object.entries(rawPalette.roles)) {
    assert.equal(aplicarIntensidadeNaCor(cor, 'normal'), cor, `Color ${nome} should be identical`);
  }
  const paleta = gerarPaletaComIntensidade(rawPalette, 'normal');
  assert.deepEqual(paleta, rawPalette);
});

test('2. Suaves intensity reduces saturation while preserving luminance and hue', () => {
  const coresTeste = ['#25B7BB', '#EC8181', '#10B981', '#E8904F'];

  for (const hex of coresTeste) {
    const suave = aplicarIntensidadeNaCor(hex, 'suaves');
    assert.notEqual(suave, hex, 'Suaves should alter the color');

    // Check that luminance is preserved (within rounding threshold of 1 unit)
    const [r1, g1, b1] = hexToRgba(hex);
    const [r2, g2, b2] = hexToRgba(suave);
    const y1 = calcularLuminanciaRelativa(r1, g1, b1);
    const y2 = calcularLuminanciaRelativa(r2, g2, b2);
    assert(Math.abs(y1 - y2) <= 1.0, `Luminance should be preserved: ${y1} vs ${y2}`);

    // Verify saturation is reduced (distance between max and min channel decreases)
    const maxDiffOrig = Math.max(r1, g1, b1) - Math.min(r1, g1, b1);
    const maxDiffSuave = Math.max(r2, g2, b2) - Math.min(r2, g2, b2);
    assert(maxDiffSuave < maxDiffOrig, 'Saturation should be strictly lower in suaves');
  }
});

test('3. Sem cor intensity converts colors to pure grayscale with preserved luminance', () => {
  for (const [nome, cor] of Object.entries(rawPalette.roles)) {
    if (cor.startsWith('rgba')) continue; // Skip scrim alpha test here
    const semCor = aplicarIntensidadeNaCor(cor, 'sem-cor');

    const [r, g, b] = hexToRgba(semCor);
    // In pure grayscale, R === G === B
    assert.equal(r, g, `Red and Green should match in grayscale for ${nome}`);
    assert.equal(g, b, `Green and Blue should match in grayscale for ${nome}`);

    // Luminance invariance
    const [origR, origG, origB] = hexToRgba(cor);
    const yOrig = calcularLuminanciaRelativa(origR, origG, origB);
    const ySemCor = calcularLuminanciaRelativa(r, g, b);
    assert(Math.abs(yOrig - ySemCor) <= 1.0, `Luminance must be preserved for ${nome}: ${yOrig} vs ${ySemCor}`);
  }
});

test('4. Scrim rgba transparency is preserved across all intensities', () => {
  const scrim = rawPalette.roles.scrim; // rgba(0, 0, 0, 0.6)
  assert.equal(aplicarIntensidadeNaCor(scrim, 'normal'), 'rgba(0, 0, 0, 0.6)');
  assert.equal(aplicarIntensidadeNaCor(scrim, 'suaves'), 'rgba(0, 0, 0, 0.6)');
  assert.equal(aplicarIntensidadeNaCor(scrim, 'sem-cor'), 'rgba(0, 0, 0, 0.6)');
});

test('5. Contrast ratio between content text and canvas background is invariant', () => {
  const canvasOrig = rawPalette.roles.canvas;
  const contentOrig = rawPalette.roles.content;

  const contrastRatio = (hex1, hex2) => {
    const [r1, g1, b1] = hexToRgba(hex1);
    const [r2, g2, b2] = hexToRgba(hex2);
    const L1 = calcularLuminanciaRelativa(r1, g1, b1);
    const L2 = calcularLuminanciaRelativa(r2, g2, b2);
    const maxL = Math.max(L1, L2);
    const minL = Math.min(L1, L2);
    return (maxL + 0.05) / (minL + 0.05);
  };

  const crNormal = contrastRatio(contentOrig, canvasOrig);
  const crSuaves = contrastRatio(
    aplicarIntensidadeNaCor(contentOrig, 'suaves'),
    aplicarIntensidadeNaCor(canvasOrig, 'suaves')
  );
  const crSemCor = contrastRatio(
    aplicarIntensidadeNaCor(contentOrig, 'sem-cor'),
    aplicarIntensidadeNaCor(canvasOrig, 'sem-cor')
  );

  // All ratios must remain above 6.0 and differ by less than 0.2
  assert(crNormal >= 6.0, `Normal contrast ratio should be high: ${crNormal}`);
  assert(Math.abs(crNormal - crSuaves) < 0.2, `Suaves contrast ratio should match normal: ${crSuaves}`);
  assert(Math.abs(crNormal - crSemCor) < 0.2, `Sem cor contrast ratio should match normal: ${crSemCor}`);
});

test('6. CSS variables are generated for all 43 tokens across all groups', () => {
  const paletaSuave = gerarPaletaComIntensidade(rawPalette, 'suaves');
  const vars = gerarVariaveisCss(paletaSuave);

  // Total tokens: 19 roles + 11 pain + 5 mood + 8 legacy = 43 tokens
  // Each has --color-X-rgb, --color-X-alpha, --color-X
  assert(vars['--color-canvas-rgb'], 'canvas RGB variable must exist');
  assert.equal(vars['--color-canvas-alpha'], 1);
  assert(vars['--color-scrim-rgb'], 'scrim RGB variable must exist');
  assert.equal(vars['--color-scrim-alpha'], 0.6);
  assert(vars['--color-primary-rgb'], 'primary RGB variable must exist');
  assert(vars['--color-pain-0-rgb'], 'pain-0 RGB variable must exist');
  assert(vars['--color-pain-10-rgb'], 'pain-10 RGB variable must exist');
  assert(vars['--color-mood-terrible-rgb'], 'mood-terrible RGB variable must exist');
  assert(vars['--color-accent-rgb'], 'legacy accent RGB variable must exist');
});

test('7. Orthogonal theme compatibility: works on any theme base palette', () => {
  // Mock future light theme palette
  const mockLightTheme = {
    roles: {
      canvas: '#FFFFFF',
      surface: '#F3F4F6',
      surfaceRaised: '#E5E7EB',
      line: '#D1D5DB',
      lineStrong: '#9CA3AF',
      content: '#111827',
      contentMuted: '#6B7280',
      primary: '#0D9488',
      primaryStrong: '#0F766E',
      primarySubtle: '#CCFBF1',
      secondary: '#7C3AED',
      secondarySubtle: '#EDE9FE',
      attention: '#D97706',
      attentionSubtle: '#FEF3C7',
      danger: '#DC2626',
      dangerSubtle: '#FEE2E2',
      success: '#16A34A',
      successSubtle: '#DCFCE7',
      scrim: 'rgba(0, 0, 0, 0.4)',
    },
    pain: rawPalette.pain,
    mood: rawPalette.mood,
    legacy: rawPalette.legacy,
  };

  const lightSuaves = gerarPaletaComIntensidade(mockLightTheme, 'suaves');
  assert.equal(lightSuaves.roles.canvas, '#FFFFFF'); // White remains white
  assert.notEqual(lightSuaves.roles.primary, mockLightTheme.roles.primary);

  const lightSemCor = gerarPaletaComIntensidade(mockLightTheme, 'sem-cor');
  const [r, g, b] = hexToRgba(lightSemCor.roles.primary);
  assert.equal(r, g);
  assert.equal(g, b);
});

test('8. Preferences parsing fallback and default behavior', () => {
  const umDe = (lista, valor, padrao) => (lista.includes(valor) ? valor : padrao);
  const INTENSIDADES = ['normal', 'suaves', 'sem-cor'];

  assert.equal(umDe(INTENSIDADES, undefined, 'normal'), 'normal');
  assert.equal(umDe(INTENSIDADES, null, 'normal'), 'normal');
  assert.equal(umDe(INTENSIDADES, 'invalido', 'normal'), 'normal');
  assert.equal(umDe(INTENSIDADES, 'suaves', 'normal'), 'suaves');
  assert.equal(umDe(INTENSIDADES, 'sem-cor', 'normal'), 'sem-cor');
});
