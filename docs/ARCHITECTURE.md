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

6. **Estilo com NativeWind (`className`).** Cores de `constants/colors.json`, pelas classes
   (`bg-accent`, `text-muted`) ou por `Colors` onde `className` não chega. Sem hex escrito
   na tela. As telas atuais ainda têm `StyleSheet` e cor em hex, que saem conforme cada uma
   for redesenhada.

7. **Nomes em inglês.** Tela `XxxScreen.tsx`, componente `PascalCase.tsx`, hook `useXxx.ts`,
   pasta em `kebab-case`. Tabelas, colunas e textos da tela continuam em português.

8. **Sem comentários no código.** O porquê de uma decisão vai na descrição do pull request.

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
