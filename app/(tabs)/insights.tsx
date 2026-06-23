import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Card from '@/components/Card';
import ScreenBackground from '@/components/ScreenBackground';
import { Colors } from '@/constants/Colors';
import { InsightItem, useInsights } from '@/hooks/useInsights';
import { useQualitativeAnalysis } from '@/hooks/useQualitativeAnalysis';

function BarList({ items, gradientColors }: { items: InsightItem[]; gradientColors: readonly [string, string, ...string[]] }) {
  if (items.length === 0) {
    return (
      <Text className="text-muted text-sm font-epilogue text-center py-2">
        Nenhum dado registrado
      </Text>
    );
  }
  return (
    <View className="gap-4">
      {items.map((item) => (
        <View key={item.nome}>
          <View className="flex-row justify-between mb-1">
            <Text className="text-white font-epilogue-medium text-[15px] flex-1 mr-2" numberOfLines={1}>
              {item.nome}
            </Text>
            <Text className="text-white text-[14px] font-epilogue-bold">{item.pct}%</Text>
          </View>
          <View className="h-2 bg-black/30 rounded-full overflow-hidden">
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ width: `${item.pct}%`, height: '100%', borderRadius: 9999 }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

const ANALYSIS_SECTIONS = [
  { key: 'padroes' as const, label: 'Padrões identificados' },
  { key: 'gatilhos_principais' as const, label: 'Gatilhos principais' },
  { key: 'evolucao' as const, label: 'Evolução das crises' },
];

export default function InsightsScreen() {
  const { data, loading, error } = useInsights();
  const { analysis, loading: analysisLoading, error: analysisError, generate } = useQualitativeAnalysis();

  const crisesVal = data?.crisesPerMonth ?? 0;
  const intVal = data?.avgIntensity != null ? data.avgIntensity : '—';
  const durVal = data?.avgDurationHours != null ? `${data.avgDurationHours}h` : '—';
  const topTrigger = data?.topTriggers?.[0]?.nome ?? '—';

  const trendDir = data?.trend?.direction ?? 'stable';
  const trendPct = data?.trend?.pct ?? 0;

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160, paddingHorizontal: 20, paddingTop: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp} className="mb-10 ml-2">
          <Text className="text-[28px] text-white/60 font-epilogue-light text-left">
            Seus <Text className="font-epilogue-bold text-white">Insights</Text>
          </Text>
        </Animated.View>

        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text className="text-muted text-sm font-epilogue mt-4">Calculando seus dados...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-muted text-sm font-epilogue text-center">{error}</Text>
          </View>
        ) : data?.totalCrises === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-3xl mb-4">📊</Text>
            <Text className="text-white font-epilogue-semi text-center mb-2">
              Nenhuma crise registrada
            </Text>
            <Text className="text-muted text-sm font-epilogue text-center">
              Registre suas crises para visualizar seus insights aqui.
            </Text>
          </View>
        ) : (
          <>
            {/* BIG RECTANGLE WIDGET: Crises */}
            <Animated.View entering={FadeInUp.delay(100)} style={{ marginTop: 20, marginBottom: 20 }}>
              <View style={[styles.bigWidget, { overflow: 'hidden' }]}>
                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                <LinearGradient
                  colors={['rgba(37, 183, 187, 0.75)', 'rgba(20, 60, 81, 0.4)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
                  <View className="flex-row justify-between">
                    <Text style={styles.widgetTitle}>Média de Crises / Mês</Text>
                    <Zap size={20} color="rgba(255,255,255,0.7)" />
                  </View>
                  <View className="flex-row items-end mt-2">
                    <Text style={styles.bigNumber}>{crisesVal}</Text>
                    <Text style={styles.unitText}>crises</Text>
                  </View>
                </View>
              </View>
            </Animated.View>

            {/* SQUARE WIDGETS GRID */}
            <View style={styles.grid}>
              {/* INTENSIDADE */}
              <Animated.View entering={FadeInUp.delay(200)} style={styles.gridItem}>
                <View style={[styles.squareWidget, { overflow: 'hidden' }]}>
                  <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                  <LinearGradient
                    colors={['rgba(139, 163, 167, 0.75)', 'rgba(20, 60, 81, 0.4)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
                    <Text style={styles.widgetTitle}>Intensidade Média</Text>
                    <View className="flex-row items-end mt-auto">
                      <Text style={styles.midNumber}>{intVal}</Text>
                      <Text style={styles.unitText}>/ 10</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* DURAÇÃO */}
              <Animated.View entering={FadeInUp.delay(300)} style={styles.gridItem}>
                <View style={[styles.squareWidget, { overflow: 'hidden' }]}>
                  <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                  <LinearGradient
                    colors={['rgba(20, 60, 81, 0.85)', 'rgba(37, 183, 187, 0.3)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
                    <Text style={styles.widgetTitle}>Duração Média</Text>
                    <View className="flex-row items-end mt-auto">
                      <Text style={styles.midNumber}>{durVal}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* TENDÊNCIA */}
              <Animated.View entering={FadeInUp.delay(400)} style={styles.gridItem}>
                <View style={[styles.squareWidget, { overflow: 'hidden' }]}>
                  <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                  <LinearGradient
                    colors={trendDir === 'down' ? ['rgba(37, 183, 187, 0.75)', 'rgba(139, 163, 167, 0.25)'] : trendDir === 'up' ? ['rgba(20, 60, 81, 0.8)', 'rgba(20, 60, 81, 0.4)'] : ['rgba(139, 163, 167, 0.5)', 'rgba(20, 60, 81, 0.25)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
                    <Text style={styles.widgetTitle}>Tendência</Text>
                    <View className="flex-row items-end mt-auto">
                      <Text style={styles.midNumber}>{trendDir === 'stable' ? '-' : `${trendPct}%`}</Text>
                      <Text style={[styles.unitText, { marginLeft: 4 }]}>
                        {trendDir === 'down' ? 'Queda' : trendDir === 'up' ? 'Alta' : ''}
                      </Text>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* GATILHO */}
              <Animated.View entering={FadeInUp.delay(500)} style={styles.gridItem}>
                <View style={[styles.squareWidget, { overflow: 'hidden' }]}>
                  <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                  <LinearGradient
                    colors={['rgba(231, 234, 232, 0.15)', 'rgba(139, 163, 167, 0.3)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                  <View style={{ flex: 1, padding: 20, justifyContent: 'space-between' }}>
                    <Text style={styles.widgetTitle}>Gatilho #1</Text>
                    <Text style={[styles.midNumber, { fontSize: 24, marginTop: 'auto' }]} numberOfLines={2}>
                      {topTrigger}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            </View>

            {/* AI / INFO EXPLANATION CARD */}
            <Animated.View entering={FadeInUp.delay(550)} className="mt-2 mb-6">
              <Card style={{ backgroundColor: 'rgba(37, 183, 187, 0.08)', borderWidth: 1, borderColor: 'rgba(37, 183, 187, 0.2)', padding: 20 }}>
                <View className="flex-row gap-3">
                  <View style={{ marginTop: 2 }}>
                    <Text style={{ fontSize: 18 }}>💡</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text className="text-white font-epilogue-bold text-sm mb-1">Entendendo a Tendência</Text>
                    <Text className="text-muted text-xs font-epilogue" style={{ lineHeight: 18 }}>
                      Comparamos suas crises dos <Text className="text-white font-epilogue-medium">últimos 30 dias</Text> com o mês anterior. Se estiver em <Text className="text-[#25B7BB] font-epilogue-medium">queda</Text>, seu tratamento está no caminho certo!
                    </Text>
                  </View>
                </View>
              </Card>
            </Animated.View>

            {/* BAR LISTS IN FROSTED GLASS CARDS */}
            <View className="mt-8 gap-4">
              {/* Gatilhos Completos */}
              {(data?.topTriggers?.length ?? 0) > 0 && (
                <Animated.View entering={FadeInUp.delay(600)}>
                  <View style={[styles.listWidget, { overflow: 'hidden' }]}>
                    <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                    <LinearGradient
                      colors={['rgba(232, 144, 79, 0.4)', 'rgba(168, 98, 47, 0.1)']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={{ padding: 24 }}>
                      <Text className="text-white font-epilogue-bold text-lg mb-6">Todos os Gatilhos</Text>
                      <BarList items={data?.topTriggers ?? []} gradientColors={['#E8904F', '#C26A28']} />
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Sintomas */}
              {(data?.topSintomas?.length ?? 0) > 0 && (
                <Animated.View entering={FadeInUp.delay(650)}>
                  <View style={[styles.listWidget, { overflow: 'hidden' }]}>
                    <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                    <LinearGradient
                      colors={['rgba(139, 111, 192, 0.4)', 'rgba(98, 76, 143, 0.1)']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={{ padding: 24 }}>
                      <Text className="text-white font-epilogue-bold text-lg mb-6">Sintomas Comuns</Text>
                      <BarList items={data?.topSintomas ?? []} gradientColors={['#8B6FC0', '#624C8F']} />
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Medicamentos */}
              {(data?.topMedicamentos?.length ?? 0) > 0 && (
                <Animated.View entering={FadeInUp.delay(700)}>
                  <View style={[styles.listWidget, { overflow: 'hidden' }]}>
                    <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                    <LinearGradient
                      colors={['rgba(37, 183, 187, 0.4)', 'rgba(19, 121, 124, 0.1)']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={{ padding: 24 }}>
                      <Text className="text-white font-epilogue-bold text-lg mb-6">Medicamentos</Text>
                      <BarList items={data?.topMedicamentos ?? []} gradientColors={['#25B7BB', '#13797C']} />
                    </View>
                  </View>
                </Animated.View>
              )}
            </View>

            {/* Qualitative Analysis */}
            <Animated.View entering={FadeInUp.delay(750)} style={{ marginTop: 32 }}>
              <View style={[styles.listWidget, { overflow: 'hidden' }]}>
                <BlurView intensity={40} tint="dark" style={[StyleSheet.absoluteFillObject, { borderRadius: 32 }]} />
                <LinearGradient
                  colors={['rgba(37, 183, 187, 0.3)', 'rgba(17, 47, 61, 0.6)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={{ padding: 24 }}>
                  <Text className="text-white font-epilogue-bold text-lg mb-6">Análise Qualitativa</Text>
                  {analysisLoading ? (
                    <View className="items-center py-6">
                      <ActivityIndicator size="small" color={Colors.accent} />
                      <Text className="text-muted text-sm font-epilogue mt-3 text-center">
                        A IA está analisando seus registros...
                      </Text>
                    </View>
                  ) : analysis ? (
                    <View className="gap-5">
                      {ANALYSIS_SECTIONS.map((section) => (
                        <View key={section.key}>
                          <Text className="text-[10px] text-muted uppercase tracking-widest font-epilogue-bold mb-2">
                            {section.label}
                          </Text>
                          <Text className="text-soft text-sm font-epilogue" style={{ lineHeight: 22 }}>
                            {analysis[section.key]}
                          </Text>
                        </View>
                      ))}
                      <TouchableOpacity
                        onPress={generate}
                        className="mt-2 items-center py-3 rounded-2xl"
                        style={{ backgroundColor: Colors.cardDark }}
                      >
                        <Text className="text-muted text-xs font-epilogue-bold uppercase tracking-widest">
                          Atualizar análise
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View className="items-center py-4 gap-3">
                      {analysisError ? (
                        <Text className="text-muted text-sm font-epilogue text-center mb-2">
                          {analysisError}
                        </Text>
                      ) : (
                        <Text className="text-muted text-sm font-epilogue text-center">
                          Gere uma análise qualitativa dos seus registros com IA.
                        </Text>
                      )}
                      <TouchableOpacity
                        onPress={generate}
                        className="px-6 py-3 rounded-2xl"
                        style={{ backgroundColor: Colors.accent }}
                      >
                        <Text className="text-white text-sm font-epilogue-bold">
                          {analysisError ? 'Tentar novamente' : 'Gerar análise'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  bigWidget: {
    borderRadius: 32,
    height: 180,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '47%',
    aspectRatio: 1,
    marginBottom: 20,
  },
  squareWidget: {
    flex: 1,
    borderRadius: 32,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  listWidget: {
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  widgetTitle: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Epilogue_400Regular',
    fontSize: 14,
  },
  bigNumber: {
    color: 'white',
    fontFamily: 'Epilogue_700Bold',
    fontSize: 56,
    lineHeight: 64,
  },
  midNumber: {
    color: 'white',
    fontFamily: 'Epilogue_700Bold',
    fontSize: 38,
    lineHeight: 44,
  },
  unitText: {
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'Epilogue_400Regular',
    fontSize: 16,
    marginLeft: 8,
    marginBottom: 6,
  },
});
