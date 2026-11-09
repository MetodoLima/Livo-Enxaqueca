import { Check, ChevronRight, CircleAlert, Clock, Mic, Plus, X, Zap } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import Animated, { FadeInUp, useReducedMotion } from 'react-native-reanimated';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Chip from '@/components/ui/Chip';
import Dialog from '@/components/ui/Dialog';
import IconBadge from '@/components/ui/IconBadge';
import IconButton from '@/components/ui/IconButton';
import LoadingState from '@/components/ui/LoadingState';
import Notice from '@/components/ui/Notice';
import PulsingMic from '@/components/ui/PulsingMic';
import Screen from '@/components/ui/Screen';
import SectionDivider from '@/components/ui/SectionDivider';
import Text from '@/components/ui/Text';
import TextField from '@/components/ui/TextField';
import { color } from '@/constants/Colors';
import { useCrisis } from '@/contexts/CrisisContext';
import CrisisEmptyState from '@/features/crisis/components/CrisisEmptyState';
import { IntensityEditor, LocationEditor, MedicationsEditor, SymptomsEditor } from '@/features/crisis/components/EditModals';
import { IntensityMarker } from '@/features/crisis/components/IntensityScale';
import PastPhaseCard from '@/features/crisis/components/PastPhaseCard';
import { useCrisisAiComplement } from '@/hooks/useCrisisAiComplement';
import { crisisRepository, ehBancoLocalIndisponivel } from '@/repositories';
import { SERVIDOR_DE_IA_DISPONIVEL } from '@/services/api';
import {
  LOCATIONS,
  MEDICATIONS,
  SIDES,
  SYMPTOMS,
  crisisToMigraineStructured,
  mergeAiResultIntoCrisis,
} from '@/types/crisis';

type Campo = 'intensity' | 'location' | 'symptoms' | 'medications';

const fmtTime = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const fmtSecs = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

interface ItemDoResumoProps {
  titulo: string;
  rotuloEditar: string;
  onEditar: () => void;
  editarRef: RefObject<View | null>;
  children: ReactNode;
}

function ItemDoResumo({ titulo, rotuloEditar, onEditar, editarRef, children }: ItemDoResumoProps) {
  return (
    <Card padding="sm">
      <View className="flex-row items-center gap-3">
        <View className="flex-1 gap-1">
          <Text variant="caption" weight="semibold" tone="muted">
            {titulo}
          </Text>
          {children}
        </View>
        <Button ref={editarRef} title="Editar" variant="ghost" size="md" accessibilityLabel={rotuloEditar} onPress={onEditar} />
      </View>
    </Card>
  );
}

function NaoDefinido({ children }: { children: string }) {
  return <Text tone="muted">{children}</Text>;
}

export default function ActiveCrisisScreen() {
  const { activeCrisis, phases, updateActiveCrisis, addPhase, removePhase, clearCrisis, hasActiveCrisis, hydrated } = useCrisis();
  const reduceMotion = useReducedMotion();

  const [editingField, setEditingField] = useState<Campo | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [registrada, setRegistrada] = useState(false);
  const [erroAoFinalizar, setErroAoFinalizar] = useState<string | null>(null);
  const [confirmandoFim, setConfirmandoFim] = useState(false);
  const [confirmandoFase, setConfirmandoFase] = useState(false);

  const [showVoice, setShowVoice] = useState(false);
  const [text, setText] = useState('');

  const finalizarRef = useRef<View>(null);
  const novaFaseRef = useRef<View>(null);
  const complementoRef = useRef<View>(null);
  const intensidadeRef = useRef<View>(null);
  const localizacaoRef = useRef<View>(null);
  const sintomasRef = useRef<View>(null);
  const medicamentosRef = useRef<View>(null);

  const {
    useLocalAi,
    toggleLocalAi,
    onDeviceAvailable,
    audioAvailable,
    isRecording,
    recordSecs,
    micError,
    startRecording,
    stopAndProcess: stopAndProcessAi,
    cancelRecording,
    submitText: submitTextAi,
    isProcessing,
    stageLabel,
    error,
  } = useCrisisAiComplement();

  const [savedIntensity, setSavedIntensity] = useState<number | null>(null);
  const [ficouNaFila, setFicouNaFila] = useState(false);

  const finalizar = async () => {
    if (salvando || !activeCrisis) return;
    setConfirmandoFim(false);
    setSalvando(true);
    setErroAoFinalizar(null);
    try {
      const crisisToSave = activeCrisis.endTime ? activeCrisis : { ...activeCrisis, endTime: new Date() };
      const { enviado } = await crisisRepository.save(crisisToSave, phases);
      setSavedIntensity(activeCrisis.intensity ?? null);
      setFicouNaFila(!enviado);
      setRegistrada(true);
      clearCrisis();
      AccessibilityInfo.announceForAccessibility('Crise registrada com sucesso!');
    } catch (e) {
      setErroAoFinalizar(
        ehBancoLocalIndisponivel(e)
          ? 'Não foi possível salvar agora. Sua crise continua guardada neste aparelho e você pode finalizá-la quando tiver internet.'
          : 'Não foi possível salvar a crise. Ela continua guardada neste aparelho. Tente de novo.',
      );
      AccessibilityInfo.announceForAccessibility('Erro ao salvar a crise.');
    } finally {
      setSalvando(false);
    }
  };

  useEffect(() => {
    if (!registrada) return;
    const timer = setTimeout(() => {
      setRegistrada(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [registrada]);

  if (registrada) {
    return (
      <View
        className="flex-1 items-center justify-center gap-4 bg-canvas px-gutter"
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={
          ficouNaFila
            ? 'Crise registrada. Salva no aparelho, será enviada com internet.'
            : savedIntensity != null
            ? `Crise registrada! Intensidade ${savedIntensity} de 10.`
            : 'Crise registrada com sucesso.'
        }
      >
        <View className="h-12 w-12 items-center justify-center rounded-md bg-success-subtle">
          <Check size={24} color={color.success} />
        </View>
        <Text variant="title" className="text-center">Crise registrada!</Text>
        <Text tone="muted" className="text-center">
          {ficouNaFila
            ? 'Salva no aparelho. Será enviada quando houver internet.'
            : savedIntensity != null
            ? `Intensidade ${savedIntensity}/10`
            : 'Registro salvo com sucesso.'}
        </Text>
      </View>
    );
  }

  if (!hydrated) return null;

  if (!hasActiveCrisis || !activeCrisis) return <CrisisEmptyState />;

  const crisis = activeCrisis;
  const locationData = LOCATIONS.find((l) => l.id === crisis.location);
  const sideData = SIDES.find((s) => s.id === crisis.side);
  const local = [locationData?.label, sideData?.label].filter(Boolean).join(' · ');
  const symptoms = crisis.symptoms.map((id) => SYMPTOMS.find((s) => s.id === id)).filter((s) => !!s);
  const medicationNames = [
    ...crisis.medications.map((id) => MEDICATIONS.find((m) => m.id === id)?.label).filter((m) => !!m),
    ...crisis.customMedications,
  ];
  const intensityLabel = crisis.intensity !== null ? `${crisis.intensity} de 10` : 'não definida';

  const stopAndProcess = async () => {
    AccessibilityInfo.announceForAccessibility('Analisando seu áudio...');
    const preFilled = crisisToMigraineStructured(crisis);
    const result = await stopAndProcessAi(preFilled);
    if (!result) {
      AccessibilityInfo.announceForAccessibility('Erro ao processar áudio.');
      return;
    }
    updateActiveCrisis({
      ...mergeAiResultIntoCrisis(crisis, result.structured),
      aiComplement: { audioUri: null, textNote: null, aiResult: result },
    });
    setShowVoice(false);
    AccessibilityInfo.announceForAccessibility('Detalhes adicionados com sucesso!');
  };

  const submitText = async () => {
    if (!text.trim()) return;
    AccessibilityInfo.announceForAccessibility('Analisando seu texto...');
    const preFilled = crisisToMigraineStructured(crisis);
    const result = await submitTextAi(preFilled, text.trim());
    if (!result) {
      AccessibilityInfo.announceForAccessibility('Erro ao processar texto.');
      return;
    }
    updateActiveCrisis({
      ...mergeAiResultIntoCrisis(crisis, result.structured),
      aiComplement: { audioUri: null, textNote: text.trim(), aiResult: result },
    });
    setText('');
    setShowVoice(false);
    AccessibilityInfo.announceForAccessibility('Detalhes adicionados com sucesso!');
  };

  const fecharComplemento = () => {
    setShowVoice(false);
    if (isRecording) cancelRecording();
  };

  const getDuration = () => {
    if (!crisis.endTime) return 'Em andamento';
    const diff = crisis.endTime.getTime() - crisis.startTime.getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 60) return `${mins}min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}min`;
  };

  const registrarFase = () => {
    setConfirmandoFase(false);
    addPhase();
    AccessibilityInfo.announceForAccessibility(`Fase ${phases.length + 1} salva. Preencha os dados da nova fase.`);
  };

  const currentPhaseNumber = phases.length + 1;
  const structured = crisis.aiComplement?.aiResult?.structured;
  const gatilhos = crisis.triggers;
  const mostrarAnalise = !!structured?.resumo || gatilhos.length > 0;

  return (
    <Screen scroll className="pt-6">
      <Animated.View entering={reduceMotion ? undefined : FadeInUp}>
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <Text variant="title" className="flex-1">
              Resumo da crise
            </Text>
            <Button
              ref={finalizarRef}
              title="Finalizar"
              size="md"
              icon={Check}
              loading={salvando}
              accessibilityLabel="Finalizar e salvar esta crise"
              accessibilityHint="Será pedida confirmação"
              onPress={() => setConfirmandoFim(true)}
            />
          </View>

          {erroAoFinalizar ? <Notice icon={CircleAlert} tone="danger">{erroAoFinalizar}</Notice> : null}

          {phases.map((phase, i) => (
            <PastPhaseCard key={i} phase={phase} index={i} onDelete={() => removePhase(i)} />
          ))}

          <View className="flex-row gap-3">
            <Card padding="sm" className="flex-1 gap-1">
              <Text variant="caption" weight="semibold" tone="muted">
                Hora de início
              </Text>
              <Text variant="heading">{fmtTime(crisis.startTime)}</Text>
            </Card>
            <Card padding="sm" className="flex-1 gap-1">
              <Text variant="caption" weight="semibold" tone="muted">
                Duração
              </Text>
              <Text variant="heading" tone={crisis.endTime ? 'content' : 'attention'}>
                {getDuration()}
              </Text>
            </Card>
          </View>

          {crisis.endTime ? (
            <Button
              title="Remover hora de fim"
              variant="ghost"
              size="md"
              icon={X}
              accessibilityLabel="Remover hora de fim e voltar para em andamento"
              onPress={() => updateActiveCrisis({ endTime: null })}
            />
          ) : (
            <Button
              title="Definir hora de fim"
              variant="secondary"
              size="md"
              icon={Clock}
              accessibilityLabel="Definir hora de fim como agora"
              onPress={() => updateActiveCrisis({ endTime: new Date() })}
            />
          )}

          <SectionDivider label={`Fase ${currentPhaseNumber}`} />

          <ItemDoResumo
            titulo="Intensidade"
            rotuloEditar={`Editar intensidade, atual ${intensityLabel}`}
            onEditar={() => setEditingField('intensity')}
            editarRef={intensidadeRef}
          >
            {crisis.intensity !== null ? (
              <IntensityMarker value={crisis.intensity} />
            ) : (
              <NaoDefinido>Não definida</NaoDefinido>
            )}
          </ItemDoResumo>

          <ItemDoResumo
            titulo="Localização"
            rotuloEditar={`Editar localização, atual ${local || 'não definida'}`}
            onEditar={() => setEditingField('location')}
            editarRef={localizacaoRef}
          >
            {local ? <Text weight="semibold">{local}</Text> : <NaoDefinido>Não definida</NaoDefinido>}
          </ItemDoResumo>

          <ItemDoResumo
            titulo="Sintomas"
            rotuloEditar="Editar sintomas"
            onEditar={() => setEditingField('symptoms')}
            editarRef={sintomasRef}
          >
            {symptoms.length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {symptoms.map((s) => (
                  <Chip key={s.id} label={s.label} />
                ))}
              </View>
            ) : (
              <NaoDefinido>Nenhum selecionado</NaoDefinido>
            )}
          </ItemDoResumo>

          <ItemDoResumo
            titulo="Medicamentos"
            rotuloEditar="Editar medicamentos"
            onEditar={() => setEditingField('medications')}
            editarRef={medicamentosRef}
          >
            {medicationNames.length > 0 ? (
              <Text weight="semibold">{medicationNames.join(', ')}</Text>
            ) : (
              <NaoDefinido>Nenhum selecionado</NaoDefinido>
            )}
          </ItemDoResumo>

          <Card
            ref={novaFaseRef}
            padding="sm"
            onPress={() => setConfirmandoFase(true)}
            accessibilityLabel="Registrar nova fase da crise. Salva a fase atual e começa uma nova."
          >
            <View className="flex-row items-center gap-3">
              <IconBadge icon={Plus} tone="primary" />
              <View className="flex-1 gap-1">
                <Text weight="semibold">Registrar nova fase</Text>
                <Text variant="caption" tone="muted">
                  Salva a fase atual e começa uma nova
                </Text>
              </View>
              <ChevronRight size={20} color={color.contentMuted} />
            </View>
          </Card>

          {mostrarAnalise ? (
            <Card padding="sm" variant="accent-border" className="gap-3">
              <Text variant="caption" weight="semibold" tone="muted">
                Análise da IA
              </Text>
              {structured?.resumo ? <Text>{structured.resumo}</Text> : null}
              {gatilhos.length > 0 ? (
                <View className="gap-1">
                  <Text variant="caption" weight="semibold" tone="muted">
                    Possíveis gatilhos
                  </Text>
                  {gatilhos.map((g, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                      <Zap size={16} color={color.attention} />
                      <Text className="flex-1">{g}</Text>
                      <IconButton
                        icon={X}
                        accessibilityLabel={`Remover gatilho: ${g}`}
                        onPress={() =>
                          updateActiveCrisis({
                            triggers: crisis.triggers.filter((_, idx) => idx !== i),
                          })
                        }
                      />
                    </View>
                  ))}
                </View>
              ) : null}
            </Card>
          ) : null}

          {SERVIDOR_DE_IA_DISPONIVEL ? (
            <Card
              ref={complementoRef}
              padding="sm"
              onPress={() => setShowVoice(true)}
              accessibilityLabel="Adicionar mais detalhes por voz ou texto"
            >
              <View className="flex-row items-center gap-3">
                <IconBadge icon={Mic} tone="primary" />
                <View className="flex-1 gap-1">
                  <Text weight="semibold">Adicionar mais detalhes</Text>
                  <Text variant="caption" tone="muted">
                    Por voz ou texto
                  </Text>
                </View>
                <ChevronRight size={20} color={color.contentMuted} />
              </View>
            </Card>
          ) : null}
        </View>
      </Animated.View>

      <Dialog
        visible={confirmandoFim}
        title="Finalizar esta crise?"
        onClose={() => setConfirmandoFim(false)}
        returnFocusTo={finalizarRef}
        footer={
          <View className="flex-row flex-wrap gap-3">
            <Button title="Cancelar" variant="ghost" onPress={() => setConfirmandoFim(false)} className="flex-grow" />
            <Button title="Finalizar" accessibilityLabel="Finalizar e salvar a crise" onPress={finalizar} className="flex-grow" />
          </View>
        }
      >
        <Text tone="muted">Os dados serão salvos permanentemente.</Text>
      </Dialog>

      <Dialog
        visible={confirmandoFase}
        title="Registrar nova fase?"
        onClose={() => setConfirmandoFase(false)}
        returnFocusTo={novaFaseRef}
        footer={
          <View className="flex-row flex-wrap gap-3">
            <Button title="Cancelar" variant="ghost" onPress={() => setConfirmandoFase(false)} className="flex-grow" />
            <Button
              title="Confirmar"
              accessibilityLabel="Salvar a fase atual e começar uma nova"
              onPress={registrarFase}
              className="flex-grow"
            />
          </View>
        }
      >
        <Text tone="muted">A fase atual será salva e os campos serão reiniciados para a nova fase.</Text>
      </Dialog>

      {SERVIDOR_DE_IA_DISPONIVEL ? (
        <Dialog
          visible={showVoice}
          title="Complementar registro"
          onClose={fecharComplemento}
          returnFocusTo={complementoRef}
          posicao="base"
          botaoFechar
          footer={
            isProcessing ? null : (
              <Button
                title="Analisar"
                accessibilityLabel="Analisar texto escrito"
                disabled={!text.trim() || isRecording}
                onPress={submitText}
              />
            )
          }
        >
          {isProcessing ? (
            <LoadingState label={stageLabel ?? 'Analisando...'} />
          ) : (
            <View className="gap-4">
              {onDeviceAvailable ? (
                <Chip label="IA local (beta)" tone="primary" selected={useLocalAi} onPress={toggleLocalAi} />
              ) : null}
              {isRecording ? (
                <View className="items-center gap-2">
                  <PulsingMic onStop={stopAndProcess} size={72} iconSize={28} />
                  <Text weight="semibold" tone="danger" accessibilityLiveRegion="polite">
                    {fmtSecs(recordSecs)}
                  </Text>
                </View>
              ) : null}
              <TextField
                label="Detalhes"
                value={text}
                onChangeText={setText}
                placeholder="Escreva detalhes adicionais..."
                hint="Ex: acordei com dor, tomei ibuprofeno, estresse no trabalho..."
                multiline
                editable={!isRecording}
                accessibilityLabel="Detalhes adicionais em texto"
                accessory={
                  audioAvailable && !isRecording ? (
                    <IconButton
                      icon={Mic}
                      tone="primary"
                      filled
                      accessibilityLabel="Gravar áudio"
                      accessibilityHint="Toque para iniciar a gravação"
                      onPress={startRecording}
                    />
                  ) : undefined
                }
              />
              {error || micError ? <Notice icon={CircleAlert} tone="danger">{(error || micError) ?? ''}</Notice> : null}
            </View>
          )}
        </Dialog>
      ) : null}

      <IntensityEditor
        visible={editingField === 'intensity'}
        onClose={() => setEditingField(null)}
        returnFocusTo={intensidadeRef}
        value={crisis.intensity}
        onChange={(v) => updateActiveCrisis({ intensity: v })}
      />
      <LocationEditor
        visible={editingField === 'location'}
        onClose={() => setEditingField(null)}
        returnFocusTo={localizacaoRef}
        location={crisis.location}
        side={crisis.side}
        onChange={updateActiveCrisis}
      />
      <SymptomsEditor
        visible={editingField === 'symptoms'}
        onClose={() => setEditingField(null)}
        returnFocusTo={sintomasRef}
        symptoms={crisis.symptoms}
        onChange={(symptoms) => updateActiveCrisis({ symptoms })}
      />
      <MedicationsEditor
        visible={editingField === 'medications'}
        onClose={() => setEditingField(null)}
        returnFocusTo={medicamentosRef}
        medications={crisis.medications}
        customMedications={crisis.customMedications}
        onChange={updateActiveCrisis}
      />
    </Screen>
  );
}
