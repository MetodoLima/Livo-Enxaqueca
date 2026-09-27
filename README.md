# Livo

Livo é um aplicativo para registrar crises de enxaqueca e acompanhar como elas se comportam ao
longo do tempo.

## Motivação

A enxaqueca é uma das doenças neurológicas mais comuns e mais incapacitantes. Para quem convive
com ela, entender o próprio padrão faz diferença no tratamento: com que frequência as crises
aparecem, quanto duram, o que as desencadeia e o que alivia. É esse histórico que o médico
pede na consulta, e quase sempre ele é reconstruído de memória.

O problema é o momento do registro. Uma crise vem com dor forte, sensibilidade à luz e ao som,
náusea e dificuldade de concentração. Quem está em crise, muitas vezes deitado no escuro, não
consegue preencher um formulário longo. E o que não é anotado na hora se perde.

## Objetivo

Tornar o registro possível justamente no pior momento, e transformar os registros em
informação útil para o paciente e para o médico.

Três princípios guiam o projeto:

- **Registrar tem que ser rápido.** A crise é registrada em passos curtos, com toque, e pode ser
  complementada por voz ou por texto livre, que uma IA interpreta e organiza.
- **O registro não pode se perder.** O app funciona sem internet. Tudo é gravado primeiro no
  aparelho e enviado ao servidor quando há conexão, sem depender do usuário.
- **Dado de saúde é sensível.** Os dados ficam criptografados no aparelho, o acesso pode ser
  protegido por PIN ou biometria, e a IA roda em servidor próprio, sem enviar o relato para
  serviços externos.

## O que o app faz

- **Registro de crise** em passos: intensidade, localização da dor, sintomas, medicação e
  horário. Uma crise pode ter várias fases, para acompanhar como a dor muda ao longo das horas.
- **Complemento por voz ou texto**, interpretado por IA para preencher o que ficou faltando.
- **Registro diário** de sono, água e humor, para cruzar hábitos com as crises.
- **Histórico e calendário** das crises.
- **Insights** sobre frequência, intensidade, sintomas e medicações mais comuns, com uma análise
  qualitativa gerada pela IA.
- **Relatório em PDF** para levar à consulta.

## Sobre o projeto

Livo é um projeto acadêmico desenvolvido por uma equipe de cinco pessoas. Ainda não tem
usuários reais: está em desenvolvimento e sendo testado pelo próprio time.
