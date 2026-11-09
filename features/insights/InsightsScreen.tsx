import { useState, type ReactNode } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Activity,
  CalendarDays,
  Clock,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import IconBadge from '@/components/ui/IconBadge';
import LoadingState from '@/components/ui/LoadingState';
import Screen from '@/components/ui/Screen';
import ScreenHeader from '@/components/ui/ScreenHeader';
import Text from '@/components/ui/Text';
import { useInsights } from '@/features/insights/useInsights';
import { useQualitativeAnalysis } from '@/features/insights/useQualitativeAnalysis';
import BarList, { type BarTone } from '@/features/insights/components/BarList';
import { SERVIDOR_DE_IA_DISPONIVEL } from '@/services/api';

const ANALYSIS_SECTIONS = [
  { key: 'padroes' as const, label: 'Padrões identificados' },
  { key: 'gatilhos_principais' as const, label: 'Gatilhos principais' },
  { key: 'evolucao' as const, label: 'Evolução das crises' },
];

const GAP_DA_FILEIRA = 12;

const decimal = (n: number) => String(n).replace('.', ',');

function duracao(horas: number): string {
  const h = Math.floor(horas);
  const min = Math.round((horas - h) * 60);
  if (h === 0) return `${min}min`;
  if (min === 0) return `${h}h`;
  return `${h}h ${min}min`;
}

function Numero({
  icon,
  valor,
  unidade,
  rotulo,
  largura,
}: {
  icon: LucideIcon;
  valor: string;
  unidade?: string;
  rotulo: string;
  largura: number;
}) {
  return (
    <Card padding="sm" style={largura > 0 ? { width: largura } : undefined}>
      <View className="gap-2" accessible accessibilityLabel={`${rotulo}: ${valor}${unidade ? ` ${unidade}` : ''}`}>
        <IconBadge icon={icon} />
        <View className="flex-row flex-wrap items-baseline gap-x-1">
          <Text variant="title">{valor}</Text>
          {unidade ? (
            <Text variant="caption" tone="muted">
              {unidade}
            </Text>
          ) : null}
        </View>
        <Text variant="caption" weight="semibold" tone="muted">
          {rotulo}
        </Text>
      </View>
    </Card>
  );
}

function Fileira({ children, onLargura }: { children: ReactNode; onLargura: (w: number) => void }) {
  return (
    <View className="flex-row gap-3" onLayout={(e) => onLargura(e.nativeEvent.layout.width)}>
      {children}
    </View>
  );
}

function Barras({ titulo, itens, tone }: { titulo: string; itens: { nome: string; count: number; pct: number }[]; tone: BarTone }) {
  return (
    <Card padding="sm" className="gap-4">
      <Text variant="heading">{titulo}</Text>
      <BarList items={itens} tone={tone} />
    </Card>
  );
}

export default function InsightsScreen() {
  const router = useRouter();
  const { data, loading, error, refetch } = useInsights();
  const { analysis, loading: analysisLoading, error: analysisError, generate } = useQualitativeAnalysis();
  const [larguraDaFileira, setLarguraDaFileira] = useState(0);

  const larguraDoCartao = larguraDaFileira > 0 ? (larguraDaFileira - GAP_DA_FILEIRA) / 2 : 0;

  if (error) {
    return (
      <Screen scroll>
        <ScreenHeader title="Insights" />
        <ErrorState
          title="Não foi possível carregar"
          message="Verifique a conexão e tente de novo."
          retryLabel="Tentar de novo"
          onRetry={refetch}
        />
      </Screen>
    );
  }

  if (loading || !data) {
    return (
      <Screen scroll>
        <ScreenHeader title="Insights" />
        <LoadingState label="Calculando seus dados…" />
      </Screen>
    );
  }

  if (data.totalCrises === 0) {
    return (
      <Screen scroll>
        <ScreenHeader title="Insights" />
        <EmptyState
          image={require('@/assets/images/LivoSemCrise.png')}
          title="Nenhuma crise registrada"
          message="Registre suas crises para visualizar seus insights aqui."
          actionLabel="Registrar crise"
          onAction={() => router.push('/record-crisis')}
        />
      </Screen>
    );
  }

  const direcao = data.trend?.direction ?? 'stable';
  const pct = data.trend?.pct ?? 0;
  const tendencia = direcao === 'down' ? 'Queda' : direcao === 'up' ? 'Alta' : 'Estável';
  const iconeDaTendencia = direcao === 'down' ? TrendingDown : direcao === 'up' ? TrendingUp : Minus;
  const gatilho = data.topTriggers[0]?.nome ?? '—';

  return (
    <Screen scroll>
      <ScreenHeader title="Insights" />

      <View className="gap-4">
        <Fileira onLargura={setLarguraDaFileira}>
          <Numero
            icon={CalendarDays}
            valor={decimal(data.crisesPerMonth)}
            unidade="crises"
            rotulo="Média de crises / mês"
            largura={larguraDoCartao}
          />
          <Numero
            icon={Activity}
            valor={data.avgIntensity !== null ? decimal(data.avgIntensity) : '—'}
            rotulo="Intensidade média"
            largura={larguraDoCartao}
          />
        </Fileira>

        <Fileira onLargura={setLarguraDaFileira}>
          <Numero
            icon={Clock}
            valor={data.avgDurationHours !== null ? duracao(data.avgDurationHours) : '—'}
            rotulo="Duração média"
            largura={larguraDoCartao}
          />
          <Numero
            icon={iconeDaTendencia}
            valor={tendencia}
            unidade={direcao === 'stable' ? undefined : `${pct}%`}
            rotulo="Tendência"
            largura={larguraDoCartao}
          />
        </Fileira>

        <Card padding="sm">
          <View className="flex-row items-center gap-3" accessible accessibilityLabel={`Gatilho número 1: ${gatilho}`}>
            <IconBadge icon={Zap} tone="attention" />
            <View className="flex-1">
              <Text variant="caption" weight="semibold" tone="muted">
                Gatilho #1
              </Text>
              <Text variant="heading">{gatilho}</Text>
            </View>
          </View>
        </Card>

        <Card padding="sm" className="gap-2">
          <Text variant="heading">Entendendo a tendência</Text>
          <Text tone="muted">
            Comparamos suas crises dos últimos 30 dias com o mês anterior. Se estiver em queda, seu tratamento está no
            caminho certo!
          </Text>
        </Card>

        {data.topTriggers.length > 0 ? <Barras titulo="Todos os gatilhos" itens={data.topTriggers} tone="attention" /> : null}
        {data.topSintomas.length > 0 ? <Barras titulo="Sintomas comuns" itens={data.topSintomas} tone="secondary" /> : null}
        {data.topMedicamentos.length > 0 ? (
          <Barras titulo="Medicamentos" itens={data.topMedicamentos} tone="primary" />
        ) : null}

        {SERVIDOR_DE_IA_DISPONIVEL ? (
          <Card padding="sm" className="gap-3">
            <Text variant="heading">Análise qualitativa</Text>
            {analysisLoading ? (
              <LoadingState label="A IA está analisando seus registros…" />
            ) : analysis ? (
              <>
                {ANALYSIS_SECTIONS.map((section) => (
                  <View key={section.key} className="gap-1">
                    <Text variant="caption" weight="semibold" tone="muted">
                      {section.label}
                    </Text>
                    <Text>{analysis[section.key]}</Text>
                  </View>
                ))}
                <Button title="Atualizar análise" variant="secondary" size="md" icon={RefreshCw} onPress={generate} />
              </>
            ) : (
              <>
                <Text tone="muted">
                  {analysisError
                    ? 'Não foi possível gerar a análise agora. Tente de novo em instantes.'
                    : 'Gere uma análise qualitativa dos seus registros com IA.'}
                </Text>
                <Button
                  title={analysisError ? 'Tentar de novo' : 'Gerar análise'}
                  variant="secondary"
                  size="md"
                  onPress={generate}
                />
              </>
            )}
          </Card>
        ) : null}
      </View>
    </Screen>
  );
}
