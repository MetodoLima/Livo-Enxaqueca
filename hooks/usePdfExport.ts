import { supabase } from '@/lib/supabase';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Platform } from 'react-native';

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

function formatDuration(start: string, end: string | null): string {
  if (!end) return 'Em andamento';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function intensityColor(v: number): string {
  if (v <= 3) return '#22c55e';
  if (v <= 6) return '#f59e0b';
  return '#ef4444';
}

function countTop(items: string[], limit = 5): Array<{ nome: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const item of items) counts[item] = (counts[item] ?? 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([nome, count]) => ({ nome, count }));
}

async function fetchCrises(months: number) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const { data, error } = await supabase
    .from('crise_enxaqueca')
    .select(`
      id, inicio_crise, fim_crise,
      registro_crise (
        intensidade_dor, regiao_dor, lado, nivel_incapacidade, resumo,
        sintoma_registro_crise ( sintomas ( nome ) ),
        medicamentos_registro_crise ( medicamentos ( nome ) ),
        fatores_desencadeantes_registro_crise ( fatores_desencadeantes ( nome ) )
      )
    `)
    .gte('inicio_crise', since.toISOString())
    .order('inicio_crise', { ascending: false });

  if (error) throw error;
  return data ?? [];
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

  const allSintomas = allRegistros.flatMap((r: any) =>
    (r.sintoma_registro_crise ?? []).map((s: any) => s.sintomas?.nome).filter(Boolean)
  );
  const allMeds = allRegistros.flatMap((r: any) =>
    (r.medicamentos_registro_crise ?? []).map((m: any) => m.medicamentos?.nome).filter(Boolean)
  );
  const allTriggers = allRegistros.flatMap((r: any) =>
    (r.fatores_desencadeantes_registro_crise ?? []).map(
      (f: any) => f.fatores_desencadeantes?.nome
    ).filter(Boolean)
  );

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

      const sintomas = [
        ...new Set(
          registros.flatMap((r: any) =>
            (r.sintoma_registro_crise ?? []).map((s: any) => s.sintomas?.nome).filter(Boolean)
          )
        ),
      ] as string[];

      const meds = [
        ...new Set(
          registros.flatMap((r: any) =>
            (r.medicamentos_registro_crise ?? []).map((m: any) => m.medicamentos?.nome).filter(Boolean)
          )
        ),
      ] as string[];

      const triggers = [
        ...new Set(
          registros.flatMap((r: any) =>
            (r.fatores_desencadeantes_registro_crise ?? [])
              .map((f: any) => f.fatores_desencadeantes?.nome)
              .filter(Boolean)
          )
        ),
      ] as string[];

      const regions = [
        ...new Set(registros.map((r: any) => r.regiao_dor).filter(Boolean)),
      ] as string[];

      const resumo = registros.map((r: any) => r.resumo).filter(Boolean)[0] as string | undefined;
      const color = maxIntensity >= 0 ? intensityColor(maxIntensity) : '#aaa';

      return `
      <div class="crisis-item">
        <div class="crisis-header">
          <div>
            <div class="crisis-date">${formatDateTime(c.inicio_crise)}</div>
            <div class="crisis-duration">Duração: ${formatDuration(c.inicio_crise, c.fim_crise)}</div>
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
  body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #fff; color: #1a1a2e; padding: 28px; font-size: 13px; line-height: 1.5; }
  .header { background: #112F3D; color: white; padding: 24px 28px; border-radius: 12px; margin-bottom: 28px; }
  .app-name { font-size: 26px; font-weight: 700; color: #25B7BB; letter-spacing: 1px; }
  .report-subtitle { font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .header-meta { margin-top: 14px; font-size: 11px; color: rgba(255,255,255,0.5); display: flex; flex-wrap: wrap; gap: 16px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 12px; font-weight: 700; color: #112F3D; text-transform: uppercase; letter-spacing: 0.6px; border-bottom: 2px solid #25B7BB; padding-bottom: 6px; margin-bottom: 14px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .stat-card { background: #f0fafa; border: 1px solid #ceeaea; border-radius: 10px; padding: 14px 10px; text-align: center; }
  .stat-value { font-size: 22px; font-weight: 700; color: #112F3D; }
  .stat-label { font-size: 10px; color: #777; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.3px; }
  .pills-row { display: flex; flex-wrap: wrap; gap: 6px; }
  .pill { background: #e8f9f9; color: #0e8a8d; border: 1px solid #b2e8e8; border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 500; }
  .no-items { font-size: 12px; color: #bbb; font-style: italic; }
  .crisis-item { border: 1px solid #e8e8e8; border-radius: 10px; padding: 14px; margin-bottom: 10px; background: #fafafa; }
  .crisis-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .crisis-date { font-size: 13px; font-weight: 700; color: #112F3D; }
  .crisis-duration { font-size: 11px; color: #888; margin-top: 2px; }
  .intensity-badge { color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .crisis-row { margin-top: 5px; font-size: 11px; color: #555; }
  .crisis-row strong { color: #112F3D; }
  .resumo { color: #777; font-style: italic; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; }
  .no-data { text-align: center; padding: 32px; color: #bbb; font-style: italic; }
  .footer { margin-top: 36px; padding-top: 14px; border-top: 1px solid #eee; font-size: 10px; color: #bbb; text-align: center; }
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

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exportar relatório de crises',
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (err: any) {
      setError(err?.message ?? 'Erro ao gerar PDF');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { exportPdf, loading, error };
}
