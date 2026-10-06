import { Colors } from '@/constants/Colors';
import ScreenBackground from '@/components/ui/ScreenBackground';
import { BENCHMARK_MODELS, type BenchmarkModel } from '@/benchmark/models';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Tela interna (não está em nenhuma tab/menu) para rodar no aparelho o mesmo
// benchmark de benchmarks/ondevice-llm/ — acesse navegando manualmente para
// /dev-benchmark. Segue o padrão defensivo de services/onDeviceComplement.ts:
// módulos que dependem de llama.rn são carregados via require() dentro de
// try/catch, então a tela não derruba o bundle em Expo Go/web, onde o módulo
// nativo não existe.
let _runner: typeof import('@/services/onDeviceBenchmarkRunner') | null = null;
try {
  _runner = require('@/services/onDeviceBenchmarkRunner');
} catch {}

const runnerAvailable = !!_runner;

type ModelStatus = 'idle' | 'downloading' | 'loading' | 'running' | 'done' | 'error';

interface ModelUiState {
  status: ModelStatus;
  progress: number; // 0..1, usado só durante download
  currentCase?: string;
  summary?: import('@/services/onDeviceBenchmarkRunner').ModelRunSummary;
  error?: string;
}

function fmtMs(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function DevBenchmarkScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(BENCHMARK_MODELS.map((m) => m.id)),
  );
  const [states, setStates] = useState<Record<string, ModelUiState>>({});
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const logScrollRef = useRef<ScrollView>(null);

  const appendLog = (line: string) => {
    setLog((prev) => [...prev.slice(-200), line]);
    requestAnimationFrame(() => logScrollRef.current?.scrollToEnd({ animated: true }));
  };

  const patchState = (id: string, patch: Partial<ModelUiState>) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], status: prev[id]?.status ?? 'idle', progress: prev[id]?.progress ?? 0, ...patch } }));
  };

  const toggleModel = (id: string) => {
    if (running) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runSelected = async () => {
    if (!_runner || running) return;
    const models = BENCHMARK_MODELS.filter((m) => selected.has(m.id));
    if (models.length === 0) return;

    setRunning(true);
    setLog([]);

    for (const model of models) {
      try {
        if (!_runner.isBenchmarkModelDownloaded(model)) {
          patchState(model.id, { status: 'downloading', progress: 0 });
          appendLog(`[${model.id}] baixando (${model.approxSizeMb}MB)...`);
          await _runner.downloadBenchmarkModel(model, (fraction) => {
            patchState(model.id, { progress: fraction });
          });
        }

        await _runner.runBenchmarkForModel(model, (p) => {
          if (p.stage === 'loading') {
            patchState(model.id, { status: 'loading' });
            appendLog(`[${model.id}] carregando modelo...`);
          } else if (p.stage === 'running') {
            patchState(model.id, { status: 'running', currentCase: p.caseId });
            appendLog(`[${model.id}] caso ${p.index + 1}/${p.total}: ${p.caseId}`);
          } else if (p.stage === 'model-done') {
            patchState(model.id, { status: 'done', summary: p.summary });
            appendLog(
              `[${model.id}] concluído — latência p50=${fmtMs(p.summary.latencyP50Ms)} acurácia=${p.summary.accuracyOverall.toFixed(2)}`,
            );
          }
        });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        patchState(model.id, { status: 'error', error: message });
        appendLog(`[${model.id}] ERRO: ${message}`);
      }
    }

    setRunning(false);
  };

  const exportResults = async () => {
    if (!_runner) return;
    const summaries = Object.values(states)
      .map((s) => s.summary)
      .filter((s): s is NonNullable<typeof s> => !!s);
    if (summaries.length === 0) return;

    const report = _runner.buildReport(summaries);
    const { Directory, File, Paths } = await import('expo-file-system');
    const Sharing = await import('expo-sharing');

    const dir = new Directory(Paths.cache, 'benchmark-reports');
    if (!dir.exists) dir.create({ intermediates: true });
    const file = new File(dir, `ondevice-benchmark-${Date.now()}.json`);
    file.write(JSON.stringify(report, null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Exportar resultados do benchmark',
    });
  };

  const hasResults = Object.values(states).some((s) => s.summary);

  if (!runnerAvailable) {
    return (
      <ScreenBackground>
        <View style={styles.center}>
          <Text style={styles.title}>Benchmark indisponível</Text>
          <Text style={styles.subtitle}>
            IA on-device não está disponível neste build (Expo Go ou web). Rode num
            dev-client gerado via EAS.
          </Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 80 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
            <ChevronLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Benchmark on-device</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.hint}>
          Mesmos 13 casos sintéticos e o mesmo prompt de produção. Baixa cada modelo
          selecionado (se preciso) e roda no aparelho, um de cada vez.
        </Text>

        {BENCHMARK_MODELS.map((model) => (
          <ModelRow
            key={model.id}
            model={model}
            selected={selected.has(model.id)}
            disabled={running}
            state={states[model.id]}
            onToggle={() => toggleModel(model.id)}
          />
        ))}

        <TouchableOpacity
          onPress={runSelected}
          disabled={running || selected.size === 0}
          style={[styles.runBtn, (running || selected.size === 0) && { opacity: 0.5 }]}
        >
          {running ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.runBtnText}>Rodar {selected.size} modelo(s) selecionado(s)</Text>
          )}
        </TouchableOpacity>

        {hasResults && (
          <TouchableOpacity onPress={exportResults} style={styles.exportBtn} disabled={running}>
            <Text style={styles.exportBtnText}>Exportar resultados (compartilhar JSON)</Text>
          </TouchableOpacity>
        )}

        {log.length > 0 && (
          <View style={styles.logBox}>
            <ScrollView ref={logScrollRef} style={{ maxHeight: 220 }}>
              {log.map((line, i) => (
                <Text key={i} style={styles.logLine}>{line}</Text>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function ModelRow({
  model,
  selected,
  disabled,
  state,
  onToggle,
}: {
  model: BenchmarkModel;
  selected: boolean;
  disabled: boolean;
  state?: ModelUiState;
  onToggle: () => void;
}) {
  const status = state?.status ?? 'idle';

  return (
    <View style={styles.row}>
      <Switch value={selected} onValueChange={onToggle} disabled={disabled} trackColor={{ false: 'rgba(139,163,167,0.3)', true: Colors.accent }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.rowLabel}>{model.label}</Text>
        <Text style={styles.rowSub}>
          {model.family} · {model.paramsB}B · ~{model.approxSizeMb}MB
        </Text>
        {status === 'downloading' && (
          <Text style={styles.rowStatus}>baixando {Math.round((state?.progress ?? 0) * 100)}%</Text>
        )}
        {status === 'loading' && <Text style={styles.rowStatus}>carregando modelo...</Text>}
        {status === 'running' && <Text style={styles.rowStatus}>rodando: {state?.currentCase}</Text>}
        {status === 'error' && <Text style={[styles.rowStatus, { color: '#EF4444' }]}>erro: {state?.error}</Text>}
        {status === 'done' && state?.summary && (
          <Text style={styles.rowResult}>
            p50={fmtMs(state.summary.latencyP50Ms)} tok/s={state.summary.tokensPerSecondAvg.toFixed(1)}{' '}
            json={Math.round(state.summary.jsonValidRate * 100)}% acurácia={state.summary.accuracyOverall.toFixed(2)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  headerTitle: { fontSize: 18, fontFamily: 'Epilogue_700Bold', color: 'white' },
  title: { fontSize: 20, fontFamily: 'Epilogue_700Bold', color: 'white', marginBottom: 8 },
  subtitle: { fontSize: 14, fontFamily: 'Epilogue_400Regular', color: Colors.muted, textAlign: 'center' },
  hint: { fontSize: 13, fontFamily: 'Epilogue_400Regular', color: Colors.muted, marginBottom: 20, lineHeight: 19 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(139,163,167,0.18)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  rowLabel: { fontSize: 14, fontFamily: 'Epilogue_600SemiBold', color: 'white' },
  rowSub: { fontSize: 12, fontFamily: 'Epilogue_400Regular', color: Colors.muted, marginTop: 2 },
  rowStatus: { fontSize: 12, fontFamily: 'Epilogue_400Regular', color: Colors.accent, marginTop: 6 },
  rowResult: { fontSize: 11, fontFamily: 'Epilogue_400Regular', color: Colors.soft, marginTop: 6 },
  runBtn: {
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  runBtnText: { color: 'white', fontSize: 15, fontFamily: 'Epilogue_700Bold' },
  exportBtn: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accent,
    paddingVertical: 14,
    alignItems: 'center',
  },
  exportBtnText: { color: Colors.accent, fontSize: 14, fontFamily: 'Epilogue_600SemiBold' },
  logBox: {
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 12,
  },
  logLine: { fontSize: 11, fontFamily: 'Epilogue_400Regular', color: Colors.muted, marginBottom: 2 },
});
