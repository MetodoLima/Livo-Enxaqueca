# Auditoria funcional, visual e de acessibilidade dos modos de visão de cores

Data: 19/11/2026
Branch auditada: `daltonismo`

## Escopo e método

Esta auditoria cobre Original, Deuteranopia, Protanopia e Tritanopia sem alterar as
paletas. Foram usados inspeção do código, testes Node, TypeScript, compilação Tailwind,
exports Expo, cálculo WCAG 2.2 dos pares realmente usados e inspeção dos PNGs. Export e
teste unitário não comprovam renderização nativa; tudo que depende de Android/iOS está
marcado como pendente de dispositivo.

## Estado após a Etapa 7

| Identificador | Estado | Resultado |
|---|---|---|
| LIVO-CVA-001 | Corrigido | texto de apoio selecionado usa `content`; contraste entre 8,75:1 e 9,56:1 |
| LIVO-CVA-002 | Corrigido na apresentação | Original 9/10 recebeu contorno de 12,76:1; `colors.json` permaneceu igual |
| LIVO-CVA-003 | Corrigido | paleta própria do PDF testada; badges ficam entre 7,09:1 e 8,31:1 |
| LIVO-CVA-004 | Pendente de validação perceptual | imagens de humor têm expressão, texto e estado; sem falha objetiva para justificar troca |
| LIVO-CVA-005 | Pendente de validação perceptual | imagens fixas mantidas; número, texto, borda e check continuam disponíveis |
| LIVO-CVA-006 | Corrigido | Emergência usa a primitiva `Text` e todas as preferências tipográficas |
| LIVO-CVA-007 | Pendente de validação com usuários | pares adjacentes mantêm número, posição, rótulo e estado falado |
| LIVO-CVA-008 | Mantido por decisão de risco | invalidar leitura após 500 ms evitaria troca tardia, mas poderia ignorar a preferência salva |
| LIVO-CVA-009 | Pendente, risco não confirmado | política de erro de gravação exige decisão comum às preferências locais |
| LIVO-CVA-010 | Corrigido | menu Perfil agora menciona “cores” |

As correções de contraste foram localizadas. Nenhum valor de `colors.json` ou das três
paletas alternativas foi modificado. Na Emergência Original, o número selecionado fica
sobre um pequeno núcleo `canvas` com texto `content` (12,76:1), preservando a cor de
intensidade no restante do controle. O botão principal usa `canvas` sobre `accent`, em vez
de branco fixo.

No PDF, a paleta clara permanece independente do tema do aplicativo. Os pares mínimos
após a correção são 5,89:1 para texto secundário sobre cartão, 6,85:1 para pills e 7,09:1
para badges. Conteúdo, cálculos, datas, filtros e bandas clínicas não mudaram.

Arquivos e fluxos centrais inspecionados:

- `contexts/PreferencesContext.tsx` e `contexts/preferencesPersistence.ts`;
- `contexts/ColorPaletteContext.ts` e `contexts/ColorThemeContext.tsx`;
- `app/_layout.tsx` e `app/(tabs)/_layout.tsx`;
- `features/preferences/AppearanceScreen.tsx` e `components/ui/OptionCard.tsx`;
- Home, Calendário, Insights, registro de crise, Emergência, Perfil e AppLock;
- `constants/colors.json`, `constants/accessibilityPalettes.ts`, Tailwind e os testes de cor;
- imagens de humor, intensidade e localização, e `features/profile/usePdfExport.ts`.

## Resultado funcional das preferências

| Comportamento | Evidência | Resultado |
|---|---|---|
| Quatro identificadores e quatro paletas | registro tipado e testes de integridade | Confirmado |
| Seleção por identificador | `selectColorPalette` e bridge em `app/_layout.tsx` | Confirmado por código/teste |
| Atualização de consumidores JavaScript sem remount | `colorPaletteContext.test.mjs` | Confirmado |
| NativeWind recebe 43 tokens e alpha em runtime | `colorTheme.test.mjs` e compilação Tailwind | Confirmado estruturalmente |
| Persistência do modo junto da tipografia | serialização v1 e testes | Confirmado |
| Payload v1 antigo sem modo | teste preserva tipografia e aplica Original | Confirmado |
| Modo inválido e JSON malformado | testes de normalização | Confirmado |
| Restaurar padrão | teste repõe tipografia e Original juntos | Confirmado |
| Escritas consecutivas | teste bloqueia a primeira escrita e comprova a ordem | Confirmado |
| Hidratação posterior a mudança local | teste de revisão e guarda no provider | Confirmado |
| Reabertura real do processo | requer AsyncStorage e splash nativos | Pendente Android/iOS |
| Repaint real de NativeWind, Lucide, Navigation e controles nativos | requer dispositivo | Pendente Android/iOS |

O estado possui uma única origem: `PreferencesContext`. O modo seleciona uma entrada de
`colorPalettes`, e `ColorThemeProvider` entrega a mesma paleta ao contexto JavaScript e às
variáveis NativeWind. React Navigation e a barra de abas leem a paleta em renderização.

## Cobertura dos componentes

| Área | Situação |
|---|---|
| Perfil e Aparência | opções tipadas, estado de radio, descrição, prévia decorativa e anúncio de seleção |
| Home | tokens NativeWind e cores JavaScript dinâmicas; ilustrações permanecem rasterizadas |
| Registro de crise | escala 0–10 usa `pain-*`; número, rótulo, posição e controle ajustável não dependem de cor |
| Emergência | modos alternativos usam a escala ativa; Original mantém exceções legadas |
| Calendário | fundo com alpha, marcador sólido, bordas e contagem usam tokens dinâmicos; rótulo fala os dados |
| Insights | barras usam tokens; nome e porcentagem visíveis e falados preservam o significado |
| Modais e diálogos | todos os `Modal` encontrados reaplicam `ColorVariableScope` sem novo estado de paleta |
| Navegação | tabs e tema React Navigation leem `roles` em runtime |
| Formulários e botões | campos, seleção, placeholder, ícones, Switch e ActivityIndicator usam a paleta ativa |
| Humor | PNGs e expressões fixos; os tokens `mood` não têm consumidor visual atual |
| PDF | paleta própria fixa; não acompanha o modo selecionado |

## Achados por gravidade

### Crítico

Nenhum problema crítico foi confirmado por inspeção ou testes automatizados.

### Alto

#### LIVO-CVA-001 — contraste da descrição da opção selecionada

1. **Identificador:** `LIVO-CVA-001` — confirmado.
2. **Descrição:** `OptionCard` mantém a descrição em `contentMuted` quando o cartão
   selecionado usa `primarySubtle`.
3. **Arquivo/componente:** `components/ui/OptionCard.tsx`, usado em
   `features/preferences/AppearanceScreen.tsx`.
4. **Evidência:** cálculo WCAG e teste diagnóstico. Razões: Original 4,23:1,
   Deuteranopia 4,48:1, Protanopia 4,45:1 e Tritanopia 4,62:1.
5. **Impacto:** o texto normal de 13 px falha 4,5:1 em três modos justamente no controle
   principal da funcionalidade.
6. **Correção recomendada:** na Etapa 7, avaliar `content` para a descrição selecionada ou
   ajustar apenas a combinação semântica pertinente; validar também estados pressionado e
   desabilitado.
7. **Prioridade:** P0.

#### LIVO-CVA-002 — falhas preexistentes no modo Original

1. **Identificador:** `LIVO-CVA-002` — confirmado e separado das paletas novas.
2. **Descrição:** `pain-9` e `pain-10` não alcançam 3:1 sobre `canvas`; na Emergência, o
   texto branco das intensidades 1–9 não alcança 4,5:1.
3. **Arquivo/componente:** `constants/colors.json`, `features/crisis/components/IntensityScale.tsx`
   e `features/crisis/EmergencyScreen.tsx`.
4. **Evidência:** testes existentes; `pain-9` = 2,39:1 e `pain-10` = 1,86:1.
5. **Impacto:** marcadores e rótulos podem perder legibilidade no Original. Número, posição,
   texto e estado acessível reduzem o risco de interpretação clínica incorreta.
6. **Correção recomendada:** tratar em mudança explicitamente autorizada da aparência
   Original; não corrigir alterando dados ou retirando pistas não cromáticas.
7. **Prioridade:** P1.

#### LIVO-CVA-003 — contraste insuficiente na exportação PDF

1. **Identificador:** `LIVO-CVA-003` — confirmado, fora do tema runtime.
2. **Descrição:** diversos textos pequenos do PDF ficam abaixo de 4,5:1; os badges brancos
   de intensidade têm 2,28:1, 2,15:1 e 3,76:1 nos três fundos usados.
3. **Arquivo/componente:** `features/profile/usePdfExport.ts`.
4. **Evidência:** cálculo com as cores CSS reais. Outros exemplos: label estatística 4,21:1,
   pill 3,84:1, duração 3,40:1 e texto `#bbb` 1,92:1.
5. **Impacto:** relatório clínico exportado pode ser difícil de ler, embora a intensidade
   continue escrita numericamente e não dependa somente da cor.
6. **Correção recomendada:** auditoria própria do PDF, escolhendo foregrounds de alto
   contraste e mantendo valores/rótulos textuais. Não ligar automaticamente o documento ao
   tema escuro do aplicativo.
7. **Prioridade:** P1, em tarefa separada conforme a restrição desta etapa.

### Médio

#### LIVO-CVA-004 — indicadores de humor não consomem os tokens `mood`

1. **Identificador:** `LIVO-CVA-004` — confirmado.
2. **Descrição:** as cinco cores `mood` existem e são testadas, mas a UI apresenta PNGs
   fixos em todos os modos.
3. **Arquivo/componente:** `constants/data.ts`, `features/daily-record/MoodSelector.tsx`,
   `DailyRecordDetailScreen.tsx` e `DailyRecordListItem.tsx`.
4. **Evidência:** busca de consumidores encontrou `mood` somente na infraestrutura/testes;
   inspeção dos PNGs mostrou expressões faciais diferentes com identidade ciano fixa.
5. **Impacto:** o modo não altera visualmente essas imagens. O significado continua
   disponível por expressão, rótulo, seleção geométrica e acessibilidade falada.
6. **Correção recomendada:** decidir com design e usuários se um pequeno acento semântico
   vetorial/dinâmico agrega valor; não aplicar filtro ou recoloração indiscriminada ao PNG.
7. **Prioridade:** P2.

#### LIVO-CVA-005 — imagens de intensidade e localização permanecem fixas

1. **Identificador:** `LIVO-CVA-005` — risco potencial.
2. **Descrição:** ilustrações de dor e mapas de localização têm pixels ciano/laranja que não
   respondem à paleta.
3. **Arquivo/componente:** `assets/images/crisis/intensity/`,
   `assets/images/crisis/locations/`, `IntensityScale` e `LocationPicker`.
4. **Evidência:** inspeção de assets e ausência de transformação runtime.
5. **Impacto:** a localização destacada pode ser menos evidente em algum tipo de visão de
   cores. A escala conserva número, rótulo, posição e imagem expressiva; localização conserva
   texto, borda e check de seleção.
6. **Correção recomendada:** teste com usuários e, se necessário, criar assets acessíveis
   com contorno/padrão/forma, em vez de filtros de simulação.
7. **Prioridade:** P2.

#### LIVO-CVA-006 — Emergência não acompanha preferências tipográficas

1. **Identificador:** `LIVO-CVA-006` — confirmado, preexistente.
2. **Descrição:** a tela usa `Text` do React Native e classes fixas, fora da primitiva `Text`.
3. **Arquivo/componente:** `features/crisis/EmergencyScreen.tsx`.
4. **Evidência:** inspeção; a exceção já está registrada em `docs/ARCHITECTURE.md`.
5. **Impacto:** fonte Legível/Dislexia, negrito e espaçamentos escolhidos pela pessoa não são
   aplicados numa tela usada durante uma crise.
6. **Correção recomendada:** migração isolada ao design system, preservando fluxo e cores
   Original, com testes de fonte máxima.
7. **Prioridade:** P2.

#### LIVO-CVA-007 — distinguibilidade adjacente da escala não é comprovada

1. **Identificador:** `LIVO-CVA-007` — risco potencial.
2. **Descrição:** o screening automatizado cobre bandas 0/5/10, não cada par adjacente.
3. **Arquivo/componente:** `tests/colorAccessibility.test.mjs` e `IntensityScale`.
4. **Evidência:** menores distâncias OKLab após screening Machado foram 0,018
   (Deuteranopia 0–1), 0,023 (Protanopia 0–1) e 0,015 (Tritanopia 0–1). Isso é triagem, não
   prova perceptual.
5. **Impacto:** tons vizinhos podem parecer próximos. O valor clínico permanece distinguível
   por número, posição, rótulo e estado falado.
6. **Correção recomendada:** validar com pessoas dos três grupos; considerar forma/padrão
   somente se os testes indicarem necessidade, sem modificar a associação 0–10.
7. **Prioridade:** P2.

#### LIVO-CVA-008 — leitura após o timeout pode causar troca visual tardia

1. **Identificador:** `LIVO-CVA-008` — risco confirmado por fluxo de código, não reproduzido
   em dispositivo.
2. **Descrição:** após 500 ms a splash pode liberar o conteúdo; se a leitura terminar depois
   e não houver edição local, a preferência persistida ainda é aplicada.
3. **Arquivo/componente:** `contexts/PreferencesContext.tsx`.
4. **Evidência:** o timeout altera apenas `pronto`; a revisão continua igual até uma edição.
5. **Impacto:** armazenamento excepcionalmente lento pode mostrar Original e depois trocar
   para o modo salvo. A guarda de revisão impede que essa leitura sobrescreva uma mudança do
   usuário.
6. **Correção recomendada:** medir em dispositivo antes de mudar; na Etapa 7 decidir entre
   invalidar leitura após timeout ou aceitar atualização tardia com comportamento documentado.
7. **Prioridade:** P2.

#### LIVO-CVA-009 — erro de gravação não é comunicado

1. **Identificador:** `LIVO-CVA-009` — risco potencial.
2. **Descrição:** falhas de `AsyncStorage.setItem` são descartadas após a fila rejeitar.
3. **Arquivo/componente:** `contexts/PreferencesContext.tsx` e
   `contexts/preferencesPersistence.ts`.
4. **Evidência:** `.catch(() => undefined)` no chamador; a fila se recupera para a escrita
   seguinte, conforme teste.
5. **Impacto:** a seleção reage na sessão, mas pode voltar ao valor anterior na próxima
   abertura sem aviso.
6. **Correção recomendada:** definir política comum às preferências locais (telemetria local,
   aviso ou retry limitado), sem criar armazenamento paralelo.
7. **Prioridade:** P2.

### Baixo

#### LIVO-CVA-010 — descrição do menu Aparência não menciona cores

1. **Identificador:** `LIVO-CVA-010` — confirmado.
2. **Descrição:** o item do Perfil diz apenas “Tamanho, fonte e espaçamento do texto”.
3. **Arquivo/componente:** `features/profile/ProfileScreen.tsx`.
4. **Evidência:** inspeção da cópia do menu.
5. **Impacto:** reduz a descoberta do recurso, sem impedir o acesso.
6. **Correção recomendada:** incluir “cores” em revisão futura de conteúdo.
7. **Prioridade:** P3.

## Acessibilidade de interação

Pontos confirmados por código:

- cada modo é `radio` com `accessibilityState.checked` e fica em `radiogroup`;
- nome e descrição integram o rótulo falado; a prévia colorida é decorativa e ocultada;
- o indicador selecionado muda forma/preenchimento, não apenas cor;
- `OptionCard` tem mínimo de 56 px e o cartão inteiro é tocável;
- a seleção e a restauração geram anúncio explícito;
- escala de dor é `adjustable`, expõe 0–10 e ações de incremento/decremento;
- calendário, barras e registros apresentam texto/número além da cor;
- `Dialog` gerencia foco inicial, retorno de foco, escape e modalidade acessível.

TalkBack/VoiceOver ainda precisam comprovar ordem real, ausência de anúncios duplicados,
foco em `Modal`, gesto ajustável e comportamento com fonte do sistema elevada.

## Recursos visuais pendentes

| Recurso | Precisa adaptar agora? | Fundamentação |
|---|---|---|
| Rostos de humor | Não automaticamente | expressão, rótulo e estado selecionado carregam significado |
| Imagens de intensidade | Não automaticamente | número, texto, posição e controle ajustável são primários |
| Imagens de localização | Avaliar com usuários | destaque gráfico pode ajudar, mas label/check/borda já existem |
| Ilustrações da Home/empty states | Não | decorativas, ocultadas ou acompanhadas por texto |
| Gráficos de Insights | Já cobertos estruturalmente | nome e porcentagem não dependem da cor |
| Emergência legada | Sim, em etapa controlada | contraste Original e tipografia têm falhas conhecidas |
| PDF | Sim, em tarefa própria | pares de texto confirmadamente abaixo da WCAG |

## Limites da validação e roteiro Android

Não existe APK/AAB ou Development Build local. `expo-dev-client` está instalado, mas não
há diretório `android/`, Android SDK, ADB, Gradle ou dispositivo consultável. Portanto não
foi feita validação visual nativa.

Quando houver Development Build compatível:

1. abrir o app com TalkBack desligado e selecionar os quatro modos em Perfil → Aparência;
2. confirmar troca imediata sem reload e retorno exato ao Original;
3. repetir com TalkBack, validando nome, descrição, radio marcado e anúncio após seleção;
4. percorrer Home, tabs, Calendário, Insights, Perfil e registro de crise em cada modo;
5. conferir escala 0–10, registros já salvos e calendário antes/depois da troca;
6. abrir Dialog, Exportação, AppLock e Emergência; verificar scrim, foco, voltar e cores;
7. trocar rapidamente modo, tamanho, fonte e espaçamentos; fechar forçadamente e reabrir;
8. confirmar última preferência, ausência de perda tipográfica e comportamento da splash;
9. usar “Restaurar padrão”, reabrir e confirmar Original e tipografia padrão;
10. repetir com fonte do sistema máxima e registrar screenshots dos quatro modos.

## Pendências e preparação para a Etapa 8

As correções automatizáveis de maior gravidade estão implementadas. Antes de homologação,
ainda é necessário executar o roteiro Android e registrar evidência de NativeWind,
Navigation, modais, tipografia ampliada, PDF impresso e persistência após encerramento do
processo. Imagens só devem ser adaptadas se avaliação com usuários demonstrar perda de
compreensão; número, texto, forma e estado acessível devem permanecer.

Nenhuma paleta global, dado clínico, autenticação, banco ou sincronização foi modificada.
