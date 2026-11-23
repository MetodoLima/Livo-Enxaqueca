# Infraestrutura de cores dinâmicas

## Intenção

Preparar o Livo para selecionar paletas semânticas em runtime sem alterar a aparência, a persistência ou os fluxos atuais. Nesta etapa só existe a paleta original, cuja fonte continua sendo `constants/colors.json`.

## Arquitetura aprovada

- Uma estrutura `ColorPalette` preserva os grupos `roles`, `pain`, `mood` e `legacy` e exige as mesmas chaves da paleta original.
- Um provider global mantém a paleta ativa como única fonte de verdade, expõe-a por hook para valores JavaScript e deriva dela as variáveis entregues ao `vars()` do NativeWind 4.
- Toda cor recebe uma variável com seu valor original. Cores interpretáveis também recebem canais RGB e alpha separados, preservando valores transparentes como `scrim`.
- A prova de conceito liga `canvas`, `surface`, `content`, `primary`, `line` e `pain-6` às variáveis RGB no Tailwind, inclusive modificadores de opacidade.
- O tema escuro do React Navigation passa a ser calculado a partir da paleta ativa.

## Não objetivos

- Não criar paletas de deuteranopia, protanopia ou tritanopia.
- Não alterar `PreferencesContext`, AsyncStorage ou a interface.
- Não migrar todas as cores JavaScript nem todas as telas.
- Não criar tema claro ou instalar dependências novas.

## Restrições

- NativeWind 4 e Expo SDK 54.
- Aparência original byte a byte na fonte e equivalente na resolução visual.
- Nenhum commit automático.

