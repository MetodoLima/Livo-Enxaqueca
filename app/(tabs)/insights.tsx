import React from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Activity, Clock, Zap } from 'lucide-react-native';
import Card from '@/components/Card';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';
import { useInsights, InsightItem } from '@/hooks/useInsights';

function BarList({ items, color }: { items: InsightItem[]; color: string }) {
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
            <Text className="text-white font-epilogue-medium text-sm flex-1 mr-2" numberOfLines={1}>
              {item.nome}
            </Text>
            <Text className="text-muted text-xs font-epilogue">{item.pct}%</Text>
          </View>
          <View className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{ width: `${item.pct}%`, backgroundColor: color }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function InsightsScreen() {
  const { data, loading, error } = useInsights();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bgDark }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 160, paddingHorizontal: 24, paddingTop: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp} className="flex-row items-center justify-between mb-8">
          <Text className="text-[28px] text-white font-epilogue-light">
            Seus <Text className="font-epilogue-bold">Insights</Text>
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
            <Text className="text-2xl mb-4">📊</Text>
            <Text className="text-white font-epilogue-semi text-center mb-2">
              Nenhuma crise registrada
            </Text>
            <Text className="text-muted text-sm font-epilogue text-center">
              Registre suas crises para visualizar seus insights aqui.
            </Text>
          </View>
        ) : (
          <>
            {/* Stats */}
            <Animated.View entering={FadeInUp.delay(100)} className="flex-row gap-2 mb-8">
              {[
                {
                  icon: Zap,
                  val: String(data?.crisesPerMonth ?? '—'),
                  label: 'Crises/mês',
                  color: Colors.accent,
                },
                {
                  icon: Activity,
                  val: data?.avgIntensity != null ? String(data.avgIntensity) : '—',
                  label: 'Int. média',
                  color: Colors.orange,
                },
                {
                  icon: Clock,
                  val: data?.avgDurationHours != null ? `${data.avgDurationHours}h` : '—',
                  label: 'Duração',
                  color: Colors.muted,
                },
              ].map((s, i) => (
                <View key={i} className="flex-1 bg-slate-800 rounded-3xl p-4 items-center">
                  <View className="mb-2">
                    <s.icon size={20} color={s.color} />
                  </View>
                  <Text className="text-xl font-epilogue-bold" style={{ color: s.color }}>
                    {s.val}
                  </Text>
                  <Text className="text-[9px] text-muted font-epilogue-bold uppercase mt-1 text-center">
                    {s.label}
                  </Text>
                </View>
              ))}
            </Animated.View>

            {/* Triggers */}
            <Animated.View entering={FadeInUp.delay(200)} className="mb-6">
              <Text className="text-xs text-muted font-epilogue-bold uppercase tracking-widest mb-4">
                Principais gatilhos
              </Text>
              <Card>
                <BarList items={data?.topTriggers ?? []} color={Colors.orange} />
              </Card>
            </Animated.View>

            {/* Symptoms */}
            <Animated.View entering={FadeInUp.delay(300)} className="mb-6">
              <Text className="text-xs text-muted font-epilogue-bold uppercase tracking-widest mb-4">
                Sintomas mais comuns
              </Text>
              <Card>
                <BarList items={data?.topSintomas ?? []} color={Colors.purple} />
              </Card>
            </Animated.View>

            {/* Medications */}
            <Animated.View entering={FadeInUp.delay(350)} className="mb-6">
              <Text className="text-xs text-muted font-epilogue-bold uppercase tracking-widest mb-4">
                Medicamentos mais usados
              </Text>
              <Card>
                <BarList items={data?.topMedicamentos ?? []} color={Colors.accent} />
              </Card>
            </Animated.View>

            {/* Pain regions */}
            {(data?.topRegions?.length ?? 0) > 0 && (
              <Animated.View entering={FadeInUp.delay(400)} className="mb-8">
                <Text className="text-xs text-muted font-epilogue-bold uppercase tracking-widest mb-4">
                  Regiões de dor
                </Text>
                <Card>
                  <BarList items={data?.topRegions ?? []} color="#E85A5A" />
                </Card>
              </Animated.View>
            )}

            {/* Trend */}
            {data?.trend && (
              <Animated.View entering={FadeInUp.delay(450)}>
                <Card variant="accent-border">
                  <View className="flex-row gap-4 items-center">
                    <Text className="text-2xl">
                      {data.trend.direction === 'down'
                        ? '📉'
                        : data.trend.direction === 'up'
                        ? '📈'
                        : '📊'}
                    </Text>
                    <View className="flex-1">
                      <Text className="text-[10px] text-muted uppercase tracking-widest font-epilogue-bold mb-1">
                        Tendência (últimos 30 dias)
                      </Text>
                      <Text className="text-sm text-soft font-epilogue" style={{ lineHeight: 20 }}>
                        {data.trend.direction === 'down' && (
                          <>
                            {'Frequência de crises em '}
                            <Text className="text-accent font-epilogue-bold">
                              queda de {data.trend.pct}%
                            </Text>
                            {' em relação ao período anterior.'}
                          </>
                        )}
                        {data.trend.direction === 'up' && (
                          <>
                            {'Frequência de crises em '}
                            <Text style={{ color: '#E85A5A' }} className="font-epilogue-bold">
                              alta de {data.trend.pct}%
                            </Text>
                            {' em relação ao período anterior.'}
                          </>
                        )}
                        {data.trend.direction === 'stable' && (
                          <>
                            {'Frequência de crises '}
                            <Text className="text-accent font-epilogue-bold">estável</Text>
                            {' em relação ao período anterior.'}
                          </>
                        )}
                      </Text>
                    </View>
                  </View>
                </Card>
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
