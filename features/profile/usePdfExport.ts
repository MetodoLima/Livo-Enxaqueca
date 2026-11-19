import { crisisRepository, type Crisis } from '@/repositories';
import { medicationLabel, symptomLabel } from '@/types/crisis';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { formatDuration } from '@/lib/format';
import { PDF_COLORS, pdfIntensityBackground } from '@/features/profile/pdfPresentation';

const REGION_LABELS: Record<string, string> = {
  frontal: 'Frontal',
  temporal: 'Temporal',
  occipital: 'Occipital',
  atras_olhos: 'Atrás dos olhos',
  difusa: 'Difusa',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function phaseLabels(r: any): { sintomas: string[]; medicamentos: string[]; fatores: string[] } {
  return {
    sintomas: ((r.sintomas ?? []) as string[]).map(symptomLabel),
    medicamentos: [
      ...((r.medicamentos ?? []) as string[]).map(medicationLabel),
      ...((r.medicamentos_livres ?? []) as string[]),
    ],
    fatores: (r.fatores ?? []) as string[],
  };
}

function countTop(items: string[], limit = 5): Array<{ nome: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item] = (counts[item] ?? 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([nome, count]) => ({ nome, count }));
}

function toReportRows(crises: Crisis[]) {
  return crises.map((c) => ({
    id: c.id,
    inicio_crise: c.inicioCrise ? c.inicioCrise.toISOString() : null,
    fim_crise: c.fimCrise ? c.fimCrise.toISOString() : null,
    registro_crise: c.fases.map((f) => ({
      intensidade_dor: f.intensidadeDor,
      regiao_dor: f.regiaoDor,
      lado: f.lado,
      nivel_incapacidade: f.nivelIncapacidade,
      resumo: f.resumo,
      sintomas: f.sintomas,
      medicamentos: f.medicamentos,
      medicamentos_livres: f.medicamentosLivres,
      fatores: f.fatores,
    })),
  }));
}

async function fetchCrises(months: number) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const crises = await crisisRepository.list({ desde: since, ordem: 'desc' });
  return toReportRows(crises);
}

function buildHtml(crises: any[], userName: string, months: number): string {
  const now = new Date();
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const total = crises.length;

  const allRegistros = crises.flatMap((c) =>
    Array.isArray(c.registro_crise) ? c.registro_crise : []
  );

  const intensities = allRegistros
    .map((r: any) => r.intensidade_dor)
    .filter((v: any): v is number => v != null);
  const avgIntensity =
    intensities.length > 0
      ? (intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length).toFixed(1)
      : '—';

  const durations = crises
    .filter((c) => c.inicio_crise && c.fim_crise)
    .map(
      (c) =>
        (new Date(c.fim_crise).getTime() - new Date(c.inicio_crise).getTime()) / (1000 * 60 * 60)
    );
  const avgDuration =
    durations.length > 0
      ? (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(1)
      : '—';

  const crisesPerMonth = (total / months).toFixed(1);

  const allSintomas = allRegistros.flatMap((r: any) => phaseLabels(r).sintomas);
  const allMeds = allRegistros.flatMap((r: any) => phaseLabels(r).medicamentos);
  const allTriggers = allRegistros.flatMap((r: any) => phaseLabels(r).fatores);

  const topSintomas = countTop(allSintomas);
  const topMeds = countTop(allMeds);
  const topTriggers = countTop(allTriggers);

  const pillsHtml = (items: Array<{ nome: string; count: number }>) =>
    items.length
      ? `<div class="pills-row">${items.map((i) => `<span class="pill">${i.nome} (${i.count}×)</span>`).join('')}</div>`
      : '<span class="no-items">Nenhum registrado</span>';

  const crisisRows = crises
    .map((c) => {
      const registros = Array.isArray(c.registro_crise) ? c.registro_crise : [];

      const maxIntensity = registros
        .map((r: any) => r.intensidade_dor)
        .filter((v: any): v is number => v != null)
        .reduce((max: number, v: number) => Math.max(max, v), -1);

      const sintomas = [...new Set(registros.flatMap((r: any) => phaseLabels(r).sintomas))];
      const meds = [...new Set(registros.flatMap((r: any) => phaseLabels(r).medicamentos))];
      const triggers = [...new Set(registros.flatMap((r: any) => phaseLabels(r).fatores))];

      const regions = [
        ...new Set(registros.map((r: any) => r.regiao_dor).filter(Boolean)),
      ] as string[];

      const resumo = registros.map((r: any) => r.resumo).filter(Boolean)[0] as string | undefined;
      const color = maxIntensity >= 0 ? pdfIntensityBackground(maxIntensity) : PDF_COLORS.line;

      return `
      <div class="crisis-item">
        <div class="crisis-header">
          <div>
            <div class="crisis-date">${formatDateTime(c.inicio_crise)}</div>
            <div class="crisis-duration">Duração: ${formatDuration(new Date(c.inicio_crise), c.fim_crise ? new Date(c.fim_crise) : null)}</div>
          </div>
          ${maxIntensity >= 0 ? `<div class="intensity-badge" style="background:${color}">Intensidade ${maxIntensity}/10</div>` : ''}
        </div>
        ${regions.length ? `<div class="crisis-row"><strong>Localização:</strong> ${regions.map((r) => REGION_LABELS[r] ?? r).join(', ')}</div>` : ''}
        ${sintomas.length ? `<div class="crisis-row"><strong>Sintomas:</strong> ${sintomas.join(', ')}</div>` : ''}
        ${meds.length ? `<div class="crisis-row"><strong>Medicamentos:</strong> ${meds.join(', ')}</div>` : ''}
        ${triggers.length ? `<div class="crisis-row"><strong>Gatilhos:</strong> ${triggers.join(', ')}</div>` : ''}
        ${resumo ? `<div class="crisis-row resumo">${resumo}</div>` : ''}
      </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: ${PDF_COLORS.page}; color: ${PDF_COLORS.bodyText}; padding: 28px; font-size: 13px; line-height: 1.5; }
  .header { background: ${PDF_COLORS.header}; color: ${PDF_COLORS.headerText}; padding: 24px 28px; border-radius: 12px; margin-bottom: 28px; }
  .app-name { font-size: 26px; font-weight: 700; color: ${PDF_COLORS.brand}; letter-spacing: 1px; }
  .report-subtitle { font-size: 14px; color: ${PDF_COLORS.headerMuted}; margin-top: 4px; }
  .header-meta { margin-top: 14px; font-size: 11px; color: ${PDF_COLORS.headerMuted}; display: flex; flex-wrap: wrap; gap: 16px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 12px; font-weight: 700; color: ${PDF_COLORS.bodyText}; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 2px solid ${PDF_COLORS.brand}; padding-bottom: 6px; margin-bottom: 14px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat-card { background: ${PDF_COLORS.statCard}; border: 1px solid ${PDF_COLORS.line}; border-radius: 10px; padding: 14px 10px; text-align: center; }
  .stat-value { font-size: 22px; font-weight: 700; color: ${PDF_COLORS.bodyText}; }
  .stat-label { font-size: 10px; color: ${PDF_COLORS.statLabel}; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }
  .pills-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .pill { background: ${PDF_COLORS.pillBackground}; color: ${PDF_COLORS.pillText}; border: 1px solid ${PDF_COLORS.line}; border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 500; }
  .no-items { font-size: 12px; color: ${PDF_COLORS.subtleText}; font-style: italic; }
  .crisis-item { border: 1px solid ${PDF_COLORS.line}; border-radius: 10px; padding: 14px; margin-bottom: 10px; background: ${PDF_COLORS.card}; }
  .crisis-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .crisis-date { font-size: 13px; font-weight: 700; color: ${PDF_COLORS.bodyText}; }
  .crisis-duration { font-size: 11px; color: ${PDF_COLORS.subtleText}; margin-top: 2px; }
  .intensity-badge { color: ${PDF_COLORS.badgeText}; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .crisis-row { margin-top: 5px; font-size: 11px; color: ${PDF_COLORS.subtleText}; }
  .crisis-row strong { color: ${PDF_COLORS.bodyText}; }
  .resumo { color: ${PDF_COLORS.subtleText}; font-style: italic; margin-top: 8px; padding-top: 8px; border-top: 1px solid ${PDF_COLORS.line}; }
  .no-data { text-align: center; padding: 32px; color: ${PDF_COLORS.subtleText}; font-style: italic; }
  .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid ${PDF_COLORS.line}; font-size: 10px; color: ${PDF_COLORS.subtleText}; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div class="app-name">LIVO</div>
    <div class="report-subtitle">Relatório de Crises de Enxaqueca</div>
    <div class="header-meta">
      <span>Paciente: ${userName}</span>
      <span>Período: ${formatDate(since.toISOString())} — ${formatDate(now.toISOString())}</span>
      <span>Gerado em: ${formatDateTime(now.toISOString())}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Resumo do Período</div>
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${total}</div>
        <div class="stat-label">Total de crises</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${crisesPerMonth}</div>
        <div class="stat-label">Crises por mês</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgIntensity}</div>
        <div class="stat-label">Intensidade média</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${avgDuration === '—' ? '—' : avgDuration + 'h'}</div>
        <div class="stat-label">Duração média</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Sintomas Mais Frequentes</div>
    ${pillsHtml(topSintomas)}
  </div>

  <div class="section">
    <div class="section-title">Medicamentos Mais Usados</div>
    ${pillsHtml(topMeds)}
  </div>

  <div class="section">
    <div class="section-title">Principais Gatilhos</div>
    ${pillsHtml(topTriggers)}
  </div>

  <div class="section">
    <div class="section-title">Histórico de Crises (${total})</div>
    ${total === 0 ? '<div class="no-data">Nenhuma crise registrada no período selecionado.</div>' : crisisRows}
  </div>

  <div class="footer">
    Gerado pelo aplicativo Livo • ${formatDate(now.toISOString())} • Este documento é apenas informativo e não substitui orientação médica profissional.
  </div>
</body>
</html>`;
}

export function usePdfExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportPdf = async (months: number, userName: string) => {
    setLoading(true);
    setError(null);
    try {
      const crises = await fetchCrises(months);
      const html = buildHtml(crises, userName, months);

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exportar relatório de crises',
        UTI: 'com.adobe.pdf',
      });
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao gerar PDF');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { exportPdf, loading, error };
}
