# Arquitetura

Como o código do Livo está organizado e onde colocar cada coisa.

## Estrutura

```text
app/                Rotas. Cada arquivo só reexporta uma tela.
features/           O app dividido por área.
  auth/             Login e criação de conta
  onboarding/       Os 9 passos do cadastro inicial
  home/             Tela inicial
  daily-record/     Registro diário: detalhe, humor, hooks
  crisis/           Crise: registro, crise em andamento, detalhe, passos
  calendar/         Calendário
  insights/         Insights
  profile/          Perfil e relatório em PDF
  app-lock/         Bloqueio por PIN e biometria
components/ui/      Peças visuais usadas por mais de uma feature
contexts/           Estado global, montado no app/_layout.tsx
hooks/              Hooks sem dono: conectividade, gravação de áudio
lib/                Código sem React: formatação, cliente Supabase
repositories/       Única porta de entrada dos dados
db/  sync/          Banco no aparelho e sincronização com o servidor
services/           Servidor de IA
types/ constants/   Modelo de domínio, catálogos, cores
```

## Onde colocar

| Preciso de… | Vai em… |
|---|---|
| Uma tela nova | `features/<área>/NomeScreen.tsx` e uma rota em `app/` |
| Uma área nova do app | uma pasta nova em `features/` |
| Um pedaço de uma tela | `features/<área>/components/` |
| Um hook de uma área | `features/<área>/useNome.ts` |
| Um componente usado por várias áreas | `components/ui/` |
| Formatar data, duração, sono, água, intensidade ou humor | `lib/format.ts` |
| Ler ou gravar dados | `@/repositories` |
| Estado que o app inteiro usa | `contexts/` |

## Dados da pessoa

O app não mostra como dado da pessoa nada que não venha dos registros dela. Quando um
cálculo não tem base suficiente, ele diz isso em vez de mostrar um valor.

Isso vale para texto fixo que parece descoberta pessoal ("dormir antes das 23h evitou
crises") e, principalmente, para valor calculado sobre poucos registros. Um padrão tirado de
três crises existe como número, mas não significa nada, e mostrar sem ressalva engana do
mesmo jeito. Num app de saúde, isso pode mudar o comportamento de quem usa.

## Regras

1. **Rota só reexporta.** Um arquivo em `app/` tem uma linha:
   `export { default } from '@/features/calendar/CalendarScreen';`
   Lógica e layout ficam na feature. A exceção são os `_layout.tsx`.

2. **Dependência entre features tem direção.**
   - Features de domínio (`crisis`, `daily-record`, `app-lock`) não importam de outra
     feature.
   - Telas que juntam informação (`home`, `calendar`, `insights`, `profile`) podem importar
     das features de domínio.
   - O que duas features precisam e não é de nenhuma delas sobe para `components/ui/`,
     `lib/` ou `hooks/`.

3. **Dados só por `@/repositories`.** Telas e hooks nunca importam `lib/supabase` nem `db/`.
   A leitura vem do banco do aparelho, e a gravação vai primeiro para ele e sobe depois.

4. **Tela grande se divide dentro da feature.** O arquivo `XxxScreen.tsx` fica com a
   composição, e as partes vão para `features/<área>/components/`.

5. **Sem cópia local de formatação.** Se precisar de um formato novo, ele entra em
   `lib/format.ts`.

6. **Estilo pelo design system.** NativeWind com os tokens e as primitivas de
   `components/ui/`, conforme a seção [Design system](#design-system). Vale para toda tela
   nova e para cada tela migrada. As telas ainda não migradas mantêm `StyleSheet`, hex e o
   grupo `legacy` até serem redesenhadas.

7. **Nomes em inglês.** Tela `XxxScreen.tsx`, componente `PascalCase.tsx`, hook `useXxx.ts`,
   pasta em `kebab-case`. Tabelas, colunas e textos da tela continuam em português.

8. **Sem comentários no código.** O porquê de uma decisão vai na descrição do pull request.

## Design system

O Livo é usado por quem está em crise de enxaqueca: fotofobia, náusea, dificuldade de
concentração, muitas vezes no escuro. As regras abaixo existem por causa disso. Elas valem
para toda tela nova e para toda tela migrada, e são cobradas em revisão de pull request.

### Tokens

Ficam em `constants/colors.json` e `tailwind.config.js`. Em tela, são usados por classe. Onde
`className` não chega (cor de ícone, `placeholderTextColor`), use `color`, `painColor` ou
`moodColor` de `constants/Colors.ts`.

| Grupo | Tokens |
|---|---|
| Fundo | `canvas` (tela), `surface` (cartão), `surface-raised` (algo sobre o cartão: campo, botão de ícone) |
| Borda | `line` (divisória, borda de cartão), `line-strong` (borda de controle: campo, chip selecionável) |
| Texto | `content` (principal), `content-muted` (secundário, legenda, placeholder) |
| Ação | `primary` (área pequena), `primary-strong` (fundo de botão), `primary-subtle` (fundo tingido) |
| Papel | `secondary`, `attention`, `danger`, `success`, cada um com `-subtle` |
| Outros | `scrim` (fundo atrás de modal) |
| Domínio | `pain-0` a `pain-10` (intensidade), `mood-*` (humor) |
| Tipografia | `text-caption` 13, `text-body` 16, `text-heading` 18, `text-title` 24, `text-display` 32, `text-hero` 48 |
| Espaçamento | escala do Tailwind restrita (ver regra DS9), mais `gutter` 24 e `section` 32 |
| Raio | `rounded-sm` 8, `rounded-md` 16, `rounded-lg` 24, `rounded-full` |

O grupo `legacy` (`accent`, `bg-dark`, `muted`, `soft`, `card-dark`, `border-dark`, `purple`,
`orange`, e o `Colors` em JavaScript) existe só para as telas não migradas. Tela migrada não
usa nada dele. Ele sai quando a última tela migrar.

### Primitivas

`Text`, `Button`, `IconButton`, `Screen`, `Card`, `Chip`, `ScreenHeader`, `SectionDivider`,
`EmptyState`, `LoadingState`, `ErrorState`, `TextField`, `TimeField`, `TimeWheel`,
`KeyboardAwareScroll`, `ProgressSteps` e `IconBadge`, em `components/ui/`. Antes de montar
algo à mão numa tela, veja se uma delas já resolve.

Alguns comportamentos que não aparecem no nome:

- `TimeField` é o campo de horário. Mostra "--:--" até ser preenchido e, ao toque, abre um
  diálogo flutuante sobre `scrim` com o `TimeWheel`. O diálogo só grava em "Confirmar";
  fechar descarta.
- `TimeWheel` é a roda circular de hora e minuto. Aceita toque no número vizinho, digitação
  (toque no número do centro) e o ajuste do leitor de tela. Não exige arrastar.
- `KeyboardAwareScroll` rola o campo em digitação para cima do teclado. O `Screen` com
  `scroll` já usa; um diálogo com campo de texto também deve usar.
- `Button` com `done` mostra uma confirmação no próprio botão: bloqueia o toque sem ficar
  apagado. O texto da confirmação diz a verdade sobre o envio, ou seja, "Salvo no aparelho"
  quando ficou na fila.
- `TextField` aceita `accessory`, um elemento dentro do campo, à direita.

### Regras do design system

DS1. **Nenhuma cor fora dos tokens.** Em tela migrada, não pode haver hex, `rgb()`, `rgba()`,
`'white'`, `'black'` nem classe de cor do Tailwind fora dos tokens (`text-white`,
`bg-red-500`, `text-[#…]`).

DS2. **Texto colorido só sobre `canvas` e `surface`.** Sobre fundo tingido (`*-subtle`) e
sobre `primary-strong`, o texto é `content`, e a cor do papel vai no ícone ou na borda.
Abaixo disso, o contraste fica menor que 4,5.

DS3. **`primary` é cor de área pequena:** ícone, link, seleção, progresso e foco. Fundo de
botão é `primary-strong`, pelo `Button`. Área grande só em `canvas`, `surface` e
`surface-raised`.

DS4. **Borda decorativa e borda de controle são diferentes.** `line` é para divisória e
cartão. `line-strong` é para o que precisa ser reconhecido como controle: campo, chip
selecionável, caixa de seleção. Borda de controle precisa de 3:1.

DS5. **Texto só pelo `Text`.** Proibido `fontSize`, `fontFamily`, `fontWeight` e
`lineHeight` soltos, e as classes `text-sm`, `text-lg`, `text-[15px]` e `font-epilogue-*`
direto na tela. Tamanho, peso e cor vêm de `variant`, `weight` e `tone`.

DS6. **Um botão `primary` por tela.** O resto é `secondary` ou `ghost`.

DS7. **Tocável é primitiva, com área de 48 ou mais.** Em tela migrada, toque é `Button`,
`IconButton`, `Chip` ou `Card` com `onPress`. Proibido `TouchableOpacity` e `Pressable`
direto na tela, e proibido `hitSlop` para compensar alvo pequeno.

DS8. **Texto nunca dentro de altura fixa.** Em contêiner que tem texto, use `min-h-*`,
nunca `h-*` nem `max-h-*`. Proibido `allowFontScaling={false}` e `maxFontSizeMultiplier`.
Toda tela migrada é testada com a fonte do sistema no máximo.

Exceção: a roda do `TimeWheel` precisa de altura fixa por item para encaixar a rolagem. Essa
altura é a base (48 ou 64) multiplicada pela escala de fonte do sistema, então cresce junto
com o texto.

DS9. **Espaçamento só da lista fechada.** Em `p`, `px`, `py`, `pt`, `pb`, `pl`, `pr`, `m`
(e variações) e `gap`, os únicos valores aceitos são:

| Sufixo da classe | `0` | `1` | `2` | `3` | `4` | `5` | `6` | `8` | `10` | `12` | `14` | `gutter` | `section` |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Valor em px | 0 | 4 | 8 | 12 | 16 | 20 | 24 | 32 | 40 | 48 | 56 | 24 | 32 |

Proibido:

- valor arbitrário entre colchetes: `p-[18px]`, `m-[14px]`, `gap-[10px]`, `mt-[-2px]`;
- degrau fora da lista: `p-7`, `mb-9`, `gap-11`, `p-0.5`, `gap-2.5`, `py-3.5`;
- `style={{ padding: … }}`, `margin`, `gap` ou similares em tela migrada.

Como cobrar na revisão: a busca abaixo no arquivo da tela tem que voltar vazia.

```text
\b-?(p|m|gap)[xytrbl]?-(\[|7\b|9\b|11\b|13\b|1[5-9]\b|[2-9]\d\b|\d+\.5\b)|\b(padding|margin|gap)\w*\s*:
```

DS10. **Raio só `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-full` ou
`rounded-none`.** Proibido `rounded-xl`, `rounded-2xl`, `rounded-3xl` e `rounded-[…]`.

DS11. **Movimento que informa é permitido; movimento que decora, não.**
- **Informa:** a transição simples entre telas, que mostra que a tela mudou. Ajuda quem
  tem dificuldade de concentração.
- **Decora, e é proibido:** entradas escalonadas (`FadeInUp.delay(…)` em sequência), pulsos
  em loop, itens aparecendo um a um e animação de entrada de bloco dentro da tela.
- **No registro de crise não há movimento nenhum** além da transição de tela: na
  `RecordCrisisScreen`, nos passos de `features/crisis/steps/` e na `ActiveCrisisScreen`,
  nada de `entering`, `exiting` ou `LayoutAnimation`.
- Toda animação permitida respeita o "reduzir movimento" do sistema. Exceção aprovada: o
  `PulsingMic`, enquanto grava, até ser revisto.

DS12. **Toda tela que carrega dado trata os três estados** com `LoadingState`,
`EmptyState` e `ErrorState`. A mensagem de erro é escrita para o paciente: nunca exibe
`err.message`, código ou texto técnico.

DS13. **Mesma aparência no Android e no iOS.**
- Proibido `Platform.OS` para decidir estilo.
- Proibido `BlurView`: no Android ele vira só um fundo translúcido.
- **Sombra colorida é proibida.** No iOS ela vira um brilho da cor, e no Android a
  `elevation` é sempre cinza, então as duas plataformas ficam diferentes.
- **Sombra neutra, se usada, vem de um token de elevação** com valor equivalente nas duas
  plataformas. Esse token ainda não existe: é pendência. Até ele existir, profundidade se
  mostra pelos tons de `canvas`, `surface` e `surface-raised`.

DS14. **Nenhum código pode assumir que o tema é escuro.** O plano é ter temas (pelo menos
claro, escuro e alto contraste) e personalização de interface, incluindo desligar as
animações do app, e os tokens são a camada que torna isso possível. Primitiva e tela se referem a papéis (`content`, `surface`), nunca
a "texto claro" ou "fundo escuro".

DS15. **Fileira de itens de mesma largura divide o espaço de forma explícita.** Calcule a
largura de cada item a partir da largura medida da fileira. Não confie em `flex-1` com
conteúdo de tamanho próprio, e nunca use largura percentual (`w-full`, `aspect-square`) em
imagem dentro de item flexível: o item passa a medir a imagem, e a fileira estoura.

### O que falta para trocar de tema

Hoje existe um tema só, e os valores dos tokens são fixos. Para suportar troca:

- **Tokens como variáveis:** os papéis de `colors.json` viram um conjunto por tema. As cores
  do `tailwind.config.js` passam a apontar para variáveis CSS
  (`rgb(var(--canvas) / <alpha-value>)`), aplicadas por um provedor de tema no
  `app/_layout.tsx` com o `vars()` do NativeWind.
- **Cores em JavaScript:** o `color` de `constants/Colors.ts` é lido uma vez, na importação,
  e não muda com o tema. Ele vira um hook (`useThemeColors()`).
- **Desligar animação** entra na mesma personalização, ao lado dos temas claro e alto
  contraste: uma preferência do app que se soma ao "reduzir movimento" do sistema.
- **Lacunas atuais:** falta um token `on-primary` para o texto do botão, e a barra de
  status do `Screen` é fixa em clara. Telas não migradas, com hex e `legacy`, não mudam de
  tema.

## Rotas e telas

| Rota | Tela |
|---|---|
| `/(auth)/login` | `features/auth/LoginScreen` |
| `/(auth)/register` | `features/auth/RegisterScreen` |
| `/(setup)/step1` a `step9` | `features/onboarding/*Step` (fenotipagem, premonitória, aura, sono, jejum, comorbidades, medicamentos, abortivos, impacto) |
| `/(tabs)` | `features/home/HomeScreen` |
| `/(tabs)/calendar` | `features/calendar/CalendarScreen` |
| `/(tabs)/crisis` | `features/crisis/ActiveCrisisScreen` |
| `/(tabs)/insights` | `features/insights/InsightsScreen` |
| `/(tabs)/profile` | `features/profile/ProfileScreen` |
| `/record-crisis` | `features/crisis/RecordCrisisScreen` |
| `/crisis/[id]` | `features/crisis/CrisisDetailScreen` |
| `/daily-record/[id]` | `features/daily-record/DailyRecordDetailScreen` |
| `/emergency` | `features/crisis/EmergencyScreen` |
