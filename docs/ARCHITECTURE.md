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

## Registro do dia e momento

O registro diário são duas coisas com ritmos diferentes, guardadas em duas tabelas.

**Registro do dia** (`registro_diario`): sono e água. Uma linha por pessoa e por dia, com
chave `(user_id, data)`. A linha é atualizada, não duplicada. O sono costuma entrar de
manhã e a água à noite, e cada envio preenche só os campos informados.

- `data` é a data local do aparelho, enviada pelo app. Nunca derive a data de um
  timestamp no servidor: água registrada às 23h em Fortaleza cairia no dia seguinte em UTC.
- O sono pertence ao dia em que a pessoa acordou. Quem dormiu às 23h do dia 10 e acordou às
  7h do dia 11 tem esse sono no registro do dia 11.
- A duração do sono não é gravada. Ficam `dormi_as` e `acordei_as`, e a duração sai de
  `duracaoSono`, em `lib/format.ts`, que trata a virada da meia-noite.

**Momento** (`registro_momento`): humor e relato. Várias linhas por dia, cada uma com
`registrado_em`, a hora do aparelho no instante do registro, mesmo que o envio aconteça
depois. O id é gerado no aparelho, e o envio só insere: um momento nunca é atualizado.

**O humor de um momento pode ter sido herdado.** Ao registrar um momento, o seletor já vem
marcado com o humor do momento anterior do mesmo dia, e a pessoa só muda se quiser. Por
isso, o humor gravado num momento não foi necessariamente reafirmado pela pessoa naquele
instante: humor igual em momentos seguidos pode ser só o seletor que ninguém mexeu. Quem
analisar esses dados (insights, exportação, IA) precisa levar isso em conta. Na virada do
dia nada é herdado.

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

9. **Tabela nova traz o grant na mesma migração.** Toda migração que cria tabela em
   `public` traz, junto do `enable row level security` e das políticas, o `grant` explícito
   para `authenticated` e `service_role`, só com as operações que as políticas permitem.
   `anon` nunca recebe grant. O grant é verificado antes da RLS: sem ele, a Data API
   responde `permission denied`, inclusive num banco recriado pelas migrações. Desde
   30/10/2026 o Supabase não concede mais esse acesso sozinho, e a migração
   `explicit_table_grants` removeu os privilégios padrão que faziam isso no projeto.
   Tabela que nenhuma tela acessa fica só com `service_role`.
   - A única exceção é `perguntas_setup`, que tem `select` para `anon` porque o keepalive
     do GitHub Actions consulta essa tabela com a chave anônima. Não há política para
     `anon`: a resposta vem vazia, e o keepalive só confere o código 200.
   - Tabela apagada por migração sai também do keepalive
     (`.github/workflows/keep-supabase-awake.yml`), se for a que ele consulta.

10. **Funcionalidade que depende do servidor de IA fica atrás de
    `SERVIDOR_DE_IA_DISPONIVEL`.** A constante mora em `services/api.ts` e hoje vale
    `false`, porque o servidor de IA não está no ar. Enquanto for `false`, a tela esconde a
    funcionalidade inteira, sem apagar o código: o complemento da crise em andamento
    (`ActiveCrisisScreen`) e a análise qualitativa dos Insights. Quando o servidor voltar,
    basta trocar o valor.

## Design system

O Livo é usado por quem está em crise de enxaqueca: fotofobia, náusea, dificuldade de
concentração, muitas vezes no escuro. As regras abaixo existem por causa disso. Elas valem
para toda tela nova e para toda tela migrada, e são cobradas em revisão de pull request.

### Tokens

Ficam em `constants/colors.json` e `tailwind.config.js`; a tipografia fica em
`constants/typography.ts` (ver Tipografia). Em tela, são usados por classe. Onde
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
| Tipografia | `variant` do `Text`: `caption` 13, `body` 16, `heading` 18, `title` 24, `display` 32, `hero` 48 (tamanho base, antes das preferências) |
| Espaçamento | escala do Tailwind restrita (ver regra DS9), mais `gutter` 24 e `section` 32 |
| Raio | `rounded-sm` 8, `rounded-md` 16, `rounded-lg` 24, `rounded-full` |

O grupo `legacy` (`accent`, `bg-dark`, `muted`, `soft`, `card-dark`, `border-dark`, `purple`,
`orange`, e o `Colors` em JavaScript) existe só para as telas não migradas. Tela migrada não
usa nada dele. Ele sai quando a última tela migrar.

### Primitivas

`Text`, `Button`, `IconButton`, `Screen`, `Card`, `Chip`, `ScreenHeader`, `SectionDivider`,
`EmptyState`, `LoadingState`, `ErrorState`, `TextField`, `TimeField`, `DateField`, `TimeWheel`,
`KeyboardAwareScroll`, `Dialog`, `ProgressSteps`, `IconBadge`, `OptionCard`, `ChoiceGroup`,
`SwitchRow` e `Notice`, em
`components/ui/`. Antes de montar
algo à mão numa tela, veja se uma delas já resolve.

Alguns comportamentos que não aparecem no nome:

- `TimeField` é o campo de horário. Mostra "--:--" até ser preenchido e, ao toque, abre o
  `TimeWheel` num `Dialog`. O diálogo só grava em "Confirmar"; "Cancelar" e fechar descartam.
  Com `clearable` (o padrão), o diálogo oferece "Limpar horário" quando já há valor.
- `DateField` é o campo de data. Ao toque, abre um `Dialog` com três colunas, dia, mês e ano,
  cada uma com setas de 48 e o ajuste do leitor de tela, que lê a data por extenso. O dia se
  ajusta ao último dia do mês escolhido. Como o `TimeField`, só grava em "Confirmar".
- `TimeWheel` é a roda circular de hora e minuto. Aceita toque no número vizinho, digitação
  (toque no número do centro) e o ajuste do leitor de tela. Não exige arrastar.
- `KeyboardAwareScroll` rola o campo em foco para cima do teclado. O `TextField` e o
  `TimeWheel` avisam a rolagem sozinhos, pelo `useRevelarAcimaDoTeclado`. Um controle novo
  que abra o teclado precisa fazer o mesmo; sem isso, a rolagem só ganha espaço no fim e o
  campo continua coberto. O `Screen` com `scroll` já usa, e um diálogo com campo de texto
  também deve usar.
- `Button` com `done` mostra uma confirmação no próprio botão: bloqueia o toque sem ficar
  apagado. O texto da confirmação diz a verdade sobre o envio, ou seja, "Salvo no aparelho"
  quando ficou na fila.
- `Button` com `shape="pill"` tem os cantos totalmente arredondados, para a ação principal
  dentro de um cartão ilustrado, como o cartão de crise da Home. O padrão é `shape="rounded"`.
  A forma vem sempre da prop, nunca de `rounded-*` no `className`, porque não há garantia de
  qual classe vence.
- `Button` aceita `ref`, para o `Dialog` devolver o foco a ele ao fechar (`returnFocusTo`).
- `Button` aceita `iconPosition="end"`, que põe o ícone depois do texto, como no "Avançar"
  do registro de crise. O padrão é `"start"`. Com `iconOnly`, mostra só o ícone e o `title`
  vira o `accessibilityLabel`, então o nome falado continua existindo. Sem texto, o botão
  não tem largura própria: a largura vem do `className`, como o `w-24` do voltar no rodapé
  do registro.
- `TextField` aceita `accessory`, um elemento dentro do campo, à direita, e `ref`, que aponta
  para o `TextInput`, para a tela levar o foco ao campo com erro.
- `Dialog` é o diálogo flutuante sobre `scrim`: título, conteúdo e rodapé, tudo dentro da
  área rolável, para os botões continuarem alcançáveis com a fonte do sistema no máximo. Ao
  abrir, o foco do leitor de tela vai para o título; ao fechar, volta para o elemento passado
  em `returnFocusTo`. Fecha pelo voltar do Android e tocando no `scrim`.
- `Dialog` com `posicao="base"` é o painel inferior, o componente BottomSheet da página
  Components do Figma. Fica preso na base da tela, com os cantos arredondados só em cima,
  título em `heading` e no mínimo 24 abaixo do rodapé, respeitando a barra de navegação do
  Android. Com `botaoFechar`, mostra um X de 48 ao lado do título. Não tem gesto de arrastar:
  fecha pelo X, pelo voltar do Android e pelo `scrim`. As edições da crise em andamento usam.
- `Card` aceita `surface="raised"`, com fundo `surface-raised`, e `ref`.
- `Screen` aceita `footer`, um rodapé fixo fora da área rolável, com borda `line` em cima, que
  respeita a barra de navegação do Android (no mínimo 24 abaixo). Como fica fora da rolagem,
  nenhum conteúdo fica escondido atrás dele. O cadastro inicial e o registro de crise usam.
- `OptionCard` é a opção selecionável em lista. `mode="radio"` é seleção única e
  `mode="checkbox"` é múltipla, com o papel e o `accessibilityState.checked` correspondentes.
  O cartão inteiro é o alvo de toque, e a seleção muda a forma do indicador, não só a cor.
  Aceita `icon` ou `emoji` à esquerda, `description` e `tag`. Opções de seleção única ficam
  dentro de uma `View` com `accessibilityRole="radiogroup"`.
- `Notice` é o aviso em caixa: ícone de 20 e texto `caption` em `content`, sobre o fundo
  `*-subtle` e a borda do `tone`. `primary` é dica, `attention` é alerta.
- `Text` aceita `tone="canvas"`, para texto sobre fundo sólido claro, como o contador de
  crises do calendário sobre `danger` (5,91:1).
- `ChoiceGroup` é a escolha única com opções lado a lado, de largura igual, medida pela
  largura da fileira (DS15). Tem `accessibilityRole="radiogroup"`, e cada opção é `radio`
  com `checked`. Aceita `renderSample`, uma amostra acima do rótulo, como o "A" de cada
  tamanho na tela de Aparência. O texto quebra linha e a opção cresce, sem cortar.
- `SwitchRow` é o interruptor em cartão: título, descrição e o `Switch` nas cores dos
  tokens. O título vira o nome falado e a descrição vira a dica. A Segurança e a Aparência
  usam.
- `Text` aceita `amostra`, que troca parte das preferências só naquele texto. Serve para
  mostrar como fica cada opção antes de escolher. Fora da tela de Aparência, não use.
- `TimeWheel` aceita `visibleItems` (3 ou 5) e `onInteraction`, que avisa quando a pessoa
  mexeu na roda. A roda sempre mostra um número, então um valor que a pessoa precisa
  informar só conta como preenchido depois de `onInteraction`: valor que ninguém escolheu
  não é dado da pessoa.

### Tipografia

O `Text` é o único ponto de tipografia. A escala base, as famílias e os multiplicadores
ficam em `constants/typography.ts`, e `estiloDeTexto(variante, peso, preferências)` calcula
família, tamanho, altura de linha e espaço entre letras. O `TextField` e a digitação do
`TimeWheel` usam a mesma função. Não existem classes de tamanho de texto no Tailwind.

A pessoa ajusta o texto em Perfil → Aparência. As preferências ficam no aparelho, não na
conta, em `livo.preferencias.v1` no AsyncStorage, com um campo de versão. Valor inválido ou
de outra versão volta ao padrão. A splash espera a leitura por até 500 ms; se estourar ou
falhar, o app abre no padrão. O `PreferencesProvider` só troca o valor quando uma preferência
muda de fato, então os textos só são redesenhados nessa hora.

| Ajuste | Padrão | Médio ou Grande | Amplo ou Maior |
|---|---|---|---|
| Tamanho | 1 | 1,15 | 1,3 |
| Espaço entre linhas (sobre a altura de linha do token) | 1 | 1,15 | 1,3 |
| Espaço entre letras | 0 | 0,05 em | 0,12 em |

- **Negrito** sobe um degrau: regular vira semibold, semibold e bold viram bold.
- **Fontes:** Padrão é Epilogue, Legível é Atkinson Hyperlegible Next, e Dislexia é
  OpenDyslexic. A OpenDyslexic não tem semibold e usa Bold no lugar, e a altura de linha
  dela é multiplicada por 1,2, porque as ascendentes cortam no Android. As três carregam na
  abertura do app. Os arquivos ficam em `assets/fonts/`, com a licença SIL OFL 1.1 de cada
  uma ao lado, e não são modificados (a OpenDyslexic tem nome reservado).
- **Escala do sistema:** continua ligada e se soma à preferência. O `Text` limita a escala
  do sistema a `2 / multiplicador do tamanho`, então o texto nunca passa de 2× o token, o que
  cumpre os 200% da WCAG 1.4.4. Fica 2 no Padrão, 1,74 no Grande e 1,54 no Maior.
- **O que fica fixo:** ícones, porque a opção é de texto e os de 24 já ficam em áreas de
  48, e o PDF de exportação, porque é documento e tem tipografia própria.
- **Exceção conhecida:** a `EmergencyScreen` ainda usa o `Text` do React Native com classes
  próprias e não segue as preferências. Sai quando ela migrar para o design system.
- **Controles com altura calculada:** a barra de abas soma a altura de linha do rótulo
  (`caption`) à base. No padrão continua com 70.

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

Exceção: no calendário do Histórico, a borda do dia de hoje usa a cor da dor mais forte do
dia (`pain-*`) ou `line-strong` quando não há crise. Com `pain-9` e `pain-10`, essa borda fica
abaixo de 3:1 sobre o `canvas`. O `accessibilityLabel` do dia compensa, porque diz "hoje". O
dia selecionado usa `primary`, que passa de 3:1.

DS5. **Texto só pelo `Text`.** Proibido `fontSize`, `fontFamily`, `fontWeight` e
`lineHeight` soltos, e as classes `text-sm`, `text-lg`, `text-[15px]` e `font-epilogue-*`
direto na tela. Tamanho, peso e cor vêm de `variant`, `weight` e `tone`; família, tamanho
final, altura de linha e espaço entre letras vêm das preferências, pelo `Text`.

DS6. **Um botão `primary` por tela.** O resto é `secondary` ou `ghost`.

DS7. **Tocável é primitiva, com área de 48 ou mais.** Em tela migrada, toque é `Button`,
`IconButton`, `Chip` ou `Card` com `onPress`. Proibido `TouchableOpacity` e `Pressable`
direto na tela, e proibido `hitSlop` para compensar alvo pequeno.

Exceção: a grade do calendário do Histórico usa células de 44 de altura e cerca de 44 de
largura (a largura útil de 312 dividida por 7). Sete colunas de 48 não cabem numa tela de
360. A célula de 44 passa do mínimo de 24 da WCAG 2.2 AA (critério 2.5.8). O resto da tela,
inclusive as setas de mês e os filtros, segue a regra de 48.

DS8. **Texto nunca dentro de altura fixa.** Em contêiner que tem texto, use `min-h-*`,
nunca `h-*` nem `max-h-*`. Proibido `allowFontScaling={false}` e `maxFontSizeMultiplier`
na tela: o teto de escala é do `Text` (ver Tipografia). Toda tela migrada é testada com a
fonte do sistema no máximo e com Aparência em Maior e Dislexia.

Exceção: a roda do `TimeWheel` precisa de altura fixa por item para encaixar a rolagem, e o
número usa altura de linha igual à do item para ficar centralizado. Essa altura é a base (48
ou 64) multiplicada pelo tamanho escolhido, pela escala do sistema (com o mesmo teto do
`Text`) e pelo ajuste de altura de linha da fonte, então cresce junto com o texto.

Exceção: a escala de dor do `IntensityScale` divide a altura disponível em 11 linhas de
altura fixa, uma por nível, para o toque e o arraste caírem no nível certo. A linha tem no
máximo 48 e diminui quando falta espaço. O número de cada linha é `caption`, e a coluna dos
números cresce com ele, com largura mínima de 24. A escala inteira
é um só controle `adjustable` para o leitor de tela, que fala o nível e o rótulo, e o número
grande e o rótulo ao lado repetem o valor escolhido. Por isso o número da linha é apoio
visual, não a única forma de ler o valor.

Exceção: o número do dia no calendário do Histórico encolhe até 70% para caber em uma
linha (`adjustsFontSizeToFit`), porque a largura da célula é fixa pelas sete colunas. O
`accessibilityLabel` do dia continua dizendo a data inteira.

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

DS16. **Controle desabilitado diz por quê.** Botão desabilitado leva no `accessibilityHint`
o que falta para habilitá-lo. Sem isso, quem usa leitor de tela toca, nada acontece e não há
explicação.

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
