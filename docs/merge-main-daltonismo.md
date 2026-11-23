# Integração da main na daltonismo

## A. Situação inicial

| Item | Valor |
|---|---|
| Branch inicial | `main` |
| Commit original da `daltonismo` | `ee3c8da1ec24fd184a3a0dd93fe7fb7fbe58fc24` |
| Commit incorporado de `origin/main` | `a599eeced3cabbd3e0c005113e8a9059927838f0` |
| Divergência | 2 commits exclusivos da `daltonismo` e 9 da `origin/main` |
| Alterações locais | Árvore limpa, sem arquivos não rastreados ou operação Git em andamento |
| Backup local | `backup/daltonismo-before-main-20261123T175841Z` |

A branch `daltonismo` existia no remoto. Após `git fetch origin`, `git switch daltonismo` criou a branch local com rastreamento de `origin/daltonismo`. A `main` local e `origin/main` apontam para o mesmo commit registrado na inspeção inicial.

## B. Arquivos com conflitos

Todos os conflitos foram de conteúdo. As branches alteraram os mesmos trechos para tornar as cores dinâmicas. A tabela registra as alterações de cada lado, a causa, a solução e o que precisa ser verificado no aplicativo. O risco comum nas linhas de componentes é o contraste da paleta combinada em execução.

## C. Resumo das resoluções

| Arquivo | Motivo do conflito | Resolução aplicada | Status |
|---|---|---|---|
| `app/(tabs)/_layout.tsx` | A main passou as cores das abas para `useTema` e a daltonismo migrou para `useColorPalette`. | As abas consomem a paleta do contexto, inclusive os estados de seleção. | Resolvido |
| `app/_layout.tsx` | A main calculou o tema de navegação e as variáveis na raiz. A daltonismo introduziu o provedor e a cor de fundo por contexto. | O provedor recebe as três preferências. O React Navigation usa as cores do contexto e mantém as bases clara e escura. Validar inicialização e transições. | Resolvido |
| `components/ui/Button.tsx` | As duas branches moveram as cores de ícones para hooks. A main introduziu `onPrimary`. | Ícone e texto primários usam `onPrimary` com o fundo `primaryStrong`. | Resolvido |
| `components/ui/Chip.tsx` | A main calculou tons com `corDoTom` e a daltonismo criou `useToneColor`. | O hook do contexto fornece as cores neutra e ativa. Verificar seleção e remoção. | Resolvido |
| `components/ui/Dialog.tsx` | As branches aplicaram as variáveis do tema em pontos diferentes do modal. | O escopo do contexto envolve o modal. Permanecem a área segura, o comportamento do teclado e o fechamento acessível. | Resolvido |
| `components/ui/IconBadge.tsx` | A main corrigiu a cor temática com `corDoTom` e a daltonismo aplicou `useToneColor`. | O ícone continua reagindo ao tom por meio do contexto. | Resolvido |
| `components/ui/IconButton.tsx` | As branches moveram o mapa de tons para hooks diferentes. | Os quatro tons usam as cores da paleta no contexto. | Resolvido |
| `components/ui/LoadingState.tsx` | Cada branch conectou o indicador de carregamento a um hook diferente. | O indicador usa a cor primária reativa do contexto. | Resolvido |
| `components/ui/Notice.tsx` | A main introduziu `corDoTom` e a daltonismo introduziu `useToneColor`. | O ícone recebe o tom da paleta ativa. | Resolvido |
| `components/ui/OptionCard.tsx` | Os hooks de tema se sobrepuseram ao helper de contraste da daltonismo. | Preservados o hook, o helper para texto secundário e os estados de seleção. | Resolvido |
| `components/ui/SwitchRow.tsx` | As duas branches calcularam as cores do switch em tempo de renderização. | Trilho, botão e fundo do iOS usam a paleta do contexto. | Resolvido |
| `components/ui/TextField.tsx` | A main tornou o rótulo opcional e migrou as cores para `useTema`. A daltonismo já usava o contexto. | Rótulo opcional para o novo registro de medicamentos e cores de placeholder e seleção por contexto. | Resolvido |
| `components/ui/TimeWheel.tsx` | As duas branches migraram as cores da roda de horário para hooks. | Mantidas as cores do contexto e a lógica da roda. | Resolvido |
| `components/ui/tone.ts` | A main introduziu uma função de mapeamento de tons e a daltonismo introduziu um hook. | Um único mapeamento no hook `useToneColor` usa os papéis semânticos da paleta. | Resolvido |
| `constants/Colors.ts` | A main resolve tema e intensidade e fornece acesso legado por proxies. A daltonismo tipa a paleta e fornece quatro opções ao contexto. Ambas definem os mesmos papéis semânticos. | O resolvedor usa o tema da main e reaproveita as tonalidades adaptadas para os papéis cromáticos, a dor e o humor. Mantém os contratos legados de leitura. | Resolvido |
| `constants/typography.ts` | A main adicionou as novas preferências no arquivo. A daltonismo já extraía as definições para `constants/preferences.ts`. | Tipografia reexporta as definições compartilhadas. Tema, intensidade e visão de cores têm valores padrão. | Resolvido |
| `contexts/PreferencesContext.tsx` | A main atualizava a paleta no carregamento e nas alterações. A daltonismo tinha controle de hidratação tardia e fila de gravação. | Mantidos a leitura v1, a fila e o controle de corrida, com atualização da paleta legada nos dois pontos. O mesmo resolvedor fornece a paleta aos dois pontos e ao provedor de cores. | Resolvido |
| `features/app-lock/AppLockScreen.tsx` | As branches duplicaram a migração das cores do switch. | O switch usa o contexto. A lógica do bloqueio foi preservada. | Resolvido |
| `features/calendar/components/CrisisListItem.tsx` | Cada branch adotou um hook de paleta. | A apresentação da crise usa a paleta do contexto. | Resolvido |
| `features/calendar/components/DailyRecordListItem.tsx` | Cada branch adotou um hook de paleta. | O registro diário usa a paleta do contexto. | Resolvido |
| `features/crisis/ActiveCrisisScreen.tsx` | Os hooks de cores nativas se sobrepuseram. | Mantidas as cores de contexto na crise ativa. | Resolvido |
| `features/crisis/components/LocationPicker.tsx` | Os hooks de cor do seletor se sobrepuseram. | O seletor usa a paleta do contexto. | Resolvido |
| `features/crisis/components/PastPhaseCard.tsx` | Os hooks de cor do cartão se sobrepuseram. | O cartão de fases usa a paleta do contexto. | Resolvido |
| `features/crisis/steps/StepTime.tsx` | Os hooks de cor da etapa de horário se sobrepuseram. | A etapa usa a paleta do contexto. | Resolvido |
| `features/home/HomeScreen.tsx` | Os hooks de cor da tela inicial se sobrepuseram. | A tela inicial usa a paleta do contexto. | Resolvido |
| `features/home/components/DayTile.tsx` | As duas branches moveram os tons primário e secundário do ícone para o render. | Os dois tons usam a paleta do contexto. | Resolvido |
| `features/home/components/Elipse.tsx` | As duas branches moveram a cor do SVG para hooks. | A elipse usa a paleta do contexto. | Resolvido |
| `features/onboarding/ComorbiditiesStep.tsx` | As duas branches trocaram as cores estáticas por hooks. | Paleta do contexto na etapa de comorbidades. | Resolvido |
| `features/onboarding/MedicationsStep.tsx` | As duas branches trocaram as cores estáticas por hooks. | Paleta do contexto na etapa de medicamentos. | Resolvido |
| `features/onboarding/SleepStep.tsx` | As duas branches trocaram as cores estáticas por hooks. | Paleta do contexto na etapa de sono. | Resolvido |
| `features/preferences/AppearanceScreen.tsx` | A main adicionou tema e intensidade. A daltonismo adicionou quatro modos com prévias e anúncios. | A tela mantém todos os controles e anúncios. As prévias de visão de cores e intensidade usam o resolvedor com as outras escolhas atuais. | Resolvido |
| `features/profile/ExportModal.tsx` | Cada branch conectou as cores do modal a um hook diferente. | O modal usa a paleta do contexto. Verificar o fluxo de exportação de PDF em execução. | Resolvido |
| `features/profile/ProfileScreen.tsx` | Hooks diferentes para ícones e descrições diferentes para Aparência. | O perfil mantém os ícones reativos e indica tema, cores e tipografia no acesso à tela. | Resolvido |
| `tailwind.config.js` | As duas branches mapearam os mesmos tokens para variáveis RGB e alfa. A main adicionou valores de fallback. | Preservados as variáveis dinâmicas, os fallbacks e os novos tokens de foco e texto do botão. | Resolvido |

## D. Verificação de integridade

`resolverPaleta(tema, intensidade, modoDeCores)` usa a estrutura de Escuro, Claro e Alto contraste
da main. Em Original e intensidade Normal, a comparação automatizada com o JSON da main
confirma igualdade de todos os tokens. Intensidades Suaves e Sem cor continuam disponíveis,
inclusive no modo Original.

Os modos adaptados reaproveitam as tonalidades das paletas de daltonismo para os acentos, o
preenchimento de botão, a escala de dor e o humor. O resolvedor ajusta a luminância em RGB linear
para manter o contraste sobre o tema selecionado. Fundos, superfícies, bordas, sobreposição de
modal, foco e o texto do botão continuam vinculados ao tema. Em Alto contraste, cada par medido
foi comparado com o mesmo par no modo Original, na mesma intensidade.

O `ColorThemeProvider` e o `ColorPaletteProvider` fornecem a paleta usada em JavaScript,
na navegação e nas variáveis NativeWind. `useTema` e `useColorPalette` leem a mesma fonte.
Os proxies de `constants/Colors.ts` continuam disponíveis para acessos legados. Registros
v1 da main e da daltonismo são lidos pela mesma rotina, com valores padrão apenas para campos
ausentes ou inválidos. Tema e visão de cores são atualizados e persistidos independentemente.

O calendário usa a cor resolvida da dor. A opacidade da marcação de fundo cai de 30% para 20%
somente quando Alto contraste está combinado com um modo adaptado. Isso preserva o contraste
do número da data com o fundo sem retirar a cor do indicador de crise.

A revisão do índice confirmou os novos seletores de sintomas e medicamentos e suas imagens.
As alterações de apresentação e de preferências preservam as regras de autenticação e de
persistência clínica. O mesmo resolvedor atende os componentes com estilos nativos e os
componentes com tokens NativeWind.

## E. Validações

Foram verificadas as 36 combinações de três temas, quatro modos de visão de cores e três
intensidades. Para as paletas adaptadas, a matriz cobre texto e acentos nas superfícies,
acentos em fundos semânticos, rótulo e ícone do botão primário, dor e humor. Os 11 níveis
de dor e cinco indicadores de humor têm cores distintas em Normal e Suaves nas nove
combinações adaptadas. Sem cor usa escala de cinza por escolha explícita.

| Tema | Menor razão em texto e acentos | Rótulo de dor sobre a cor da escala | Indicador de humor sobre superfície elevada |
|---|---:|---:|---:|
| Escuro | 4,504:1 | 4,527:1 | 3,145:1 |
| Claro | 4,860:1 | 4,506:1 | 3,004:1 |
| Alto contraste | 7,594:1 | 4,512:1 | 4,766:1 |

A coluna de dor mede a razão entre o token `canvas` usado no texto e a cor da escala,
como nos rótulos adaptados de Emergência. No Calendário, o menor contraste de data nas
36 combinações foi 5,876:1. Em Alto contraste, o mínimo foi 10,559:1, e os fundos de data
adaptados atenderam ou superaram suas referências originais em todos os níveis medidos.

| Comando | Resultado |
|---|---|
| `npm ci` | Concluído. |
| `npm test` | 64 passaram. Inclui contraste, calendário, persistência v1 e troca reativa de tema e modo sem remontar o consumidor. |
| `npx tsc --noEmit` | Aprovado. |
| `npx tailwindcss -i global.css -o /tmp/livo-merge-tailwind.css` | Aprovado. |
| `npx expo export --platform android` | Aprovado. Bundle Hermes e recursos exportados para diretório temporário. |
| `npx expo export --platform ios` | Aprovado. Bundle Hermes e recursos exportados para diretório temporário. |
| `git diff --check` e `git diff --cached --check` | Aprovados. Índice sem arquivos não mesclados e busca sem marcadores de conflito. |

Os exports verificam o empacotamento, e a suíte verifica valores de cor e reatividade do
contexto. Ainda falta executar em dispositivo a inicialização, a navegação, o registro de
crises, o calendário, Emergência, os modais e a exportação de PDF. O ambiente não ofereceu
ADB nem ferramentas de simulador iOS. As medições não são uma avaliação clínica ou visual
com participantes.

## F. Resultado final

- 34 arquivos com conflito, 34 resolvidos, nenhum pendente.
- Commit de merge: `c1849f26d75ac65bd77a485b6eaf50126179330b`.
- Branch ativa `daltonismo`. A main local e `origin/main` permaneceram em `a599eec`.
- O relatório registra o hash em um commit de documentação posterior ao merge. A árvore de trabalho está limpa.
- Nenhum push ou alteração de Pull Request foi executado.
