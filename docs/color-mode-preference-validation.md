# Validação da preferência de visão de cores

## Persistência e compatibilidade

A seleção usa a entrada já existente `livo.preferencias.v1` do AsyncStorage. O formato continua com `versao: 1` e recebe o campo aditivo `modoDeCores`, cujo valor é um de `original`, `deuteranopia`, `protanopia` ou `tritanopia`.

- Um payload v1 antigo, sem o campo, preserva todas as preferências tipográficas válidas e recebe `original`.
- Um modo desconhecido volta somente para `original`; os campos tipográficos válidos são preservados.
- JSON malformado, payload ausente ou versão incompatível usa o conjunto completo de preferências padrão.
- Mudanças são mescladas ao estado atual e gravadas em uma fila, de modo que uma gravação anterior não possa terminar depois e substituir a mais recente.
- Uma leitura iniciada antes de uma mudança local é descartada se terminar tarde.
- Restaurar padrão repõe tipografia e `modoDeCores: original` na mesma atualização.

## Aplicação em runtime

`PreferencesContext` é a única origem do identificador selecionado. O bridge em `app/_layout.tsx` resolve `colorPalettes[modoDeCores]` e entrega a paleta e o modo explícito ao `ColorThemeProvider`. O provider atualiza, sem remontar a árvore, o contexto JavaScript e as variáveis NativeWind usadas por telas, navegação e escopos de modal.

A tela permanece protegida pela hidratação existente antes de a splash screen ser ocultada. Assim, em uma inicialização normal, a paleta persistida já está no provider quando o conteúdo se torna visível.

## Roteiro manual — Android e iOS

Executar o roteiro separadamente em um aparelho ou simulador Android e em um iPhone/simulador iOS. Os testes automatizados e os exports não comprovam renderização nativa.

1. Abrir Perfil → Aparência → Visão de cores.
2. Com TalkBack ou VoiceOver ativo, percorrer as quatro opções e confirmar que cada uma é anunciada como botão de opção, com nome, descrição e estado marcado/desmarcado.
3. Confirmar que o cartão inteiro tem área de toque confortável e que a opção marcada é reconhecível pelo indicador circular preenchido, sem depender da prévia colorida.
4. Selecionar Original, Deuteranopia, Protanopia e Tritanopia, um por vez. Em cada toque, confirmar atualização imediata, anúncio do modo e ausência de tela em branco ou reinicialização.
5. Após cada seleção, navegar por Home, Calendário, registro de crise, crise ativa e Perfil. Conferir fundos, textos, botões, ícones, aba selecionada, estados de atenção/sucesso/perigo e indicadores de humor.
6. Conferir a escala de dor de 0 a 10 na Home, Calendário, formulários e registro rápido. Validar ordem, números, intensidade registrada e pistas não cromáticas; somente a apresentação deve mudar.
7. Abrir diálogos e modais (horário/data, exportação e registro rápido) e confirmar que conteúdo, scrim, bordas, botões e ícones acompanham o modo ativo.
8. Em um modo alternativo, fechar completamente e reabrir o aplicativo. Confirmar que a splash não exibe uma tela visível em Original antes do modo salvo e que tipografia e modo foram restaurados.
9. Alterar tamanho, fonte, negrito e espaçamentos, trocar o modo várias vezes rapidamente e reabrir o app. Confirmar que a última seleção e todas as preferências tipográficas permanecem.
10. Tocar em Restaurar padrão. Confirmar retorno imediato à paleta Original e às preferências tipográficas padrão; fechar e reabrir para confirmar a persistência.
11. Repetir os passos relevantes com tamanho de fonte do sistema elevado e com as três fontes do Livo, verificando que descrições, indicadores e prévias continuam alcançáveis.

## Limitação conhecida da validação automatizada

Os testes verificam normalização, migração, fila de escrita, proteção contra hidratação tardia, integridade das paletas e atualização reativa do contexto. A herança real de variáveis NativeWind em superfícies nativas, portais de `Modal`, React Navigation, Lucide e animações precisa ser confirmada pelo roteiro acima em cada plataforma.
