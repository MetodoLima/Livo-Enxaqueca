# Banco de dados

Esta pasta guarda o schema do banco em migrations e o script de backup. O banco em si
vive no Supabase, no projeto `ivnmiarxbepchopvdoxl`.

Antes desta pasta existir, nenhum objeto de banco estava versionado: schema, políticas de
RLS e views existiam apenas dentro do painel. Se o projeto fosse apagado, não havia de
onde reconstruir, e nenhuma alteração passava por revisão. Isso foi a issue #76.

```
migrations/     estado do banco, em ordem cronológica
config.toml     configuração do CLI, espelhando o projeto remoto
backup-db.ps1   gera cópia completa do banco, fora do repositório
```

## Pré-requisitos

O CLI do Supabase é dependência de desenvolvimento do projeto, então `npm install` já o
traz. Depois disso, **cada pessoa precisa se autenticar na própria máquina** — o vínculo
fica em `supabase/.temp/`, que é ignorado pelo git de propósito:

```powershell
npx supabase login
npx supabase link --project-ref ivnmiarxbepchopvdoxl
```

Para backup e restauração você também precisa do `pg_dump` e do `psql`, **versão 17 ou
mais nova**, porque o servidor está no Postgres 17.6. Não é preciso instalar o PostgreSQL:
baixe os binários em <https://www.enterprisedb.com/download-postgresql-binaries>, extraia
só a pasta `bin` e aponte o caminho no topo do `backup-db.ps1`.

**Docker não é necessário para nada do que está documentado aqui**, e é por isso que
alguns comandos abaixo parecem mais complicados do que o esperado.

## Alterações de banco

**Toda alteração nasce como migration.** Mudança feita pelo painel não é capturada por
nada e deixa o repositório desatualizado sem aviso — e sem Docker não temos o
`supabase db pull` para recuperar a diferença depois.

```powershell
npx supabase migration new nome_curto_da_alteracao
# escreva o SQL no arquivo que ele criar
npx supabase db push
```

O `db push` **não** precisa de Docker. Ele aplica direto no projeto remoto, e não pede a
senha do banco: o CLI cria um login role temporário no Postgres a partir do token da sua
conta. É aquele `Initialising login role...` que aparece em todo comando.

Antes de aplicar, vale conferir o que seria enviado:

```powershell
npx supabase db push --dry-run
```

### A primeira migration é especial

`20260919112110_remote_schema.sql` é o retrato do banco no dia em que adotamos migrations,
e **nunca deve ser executada** — os objetos dela já existem. Ela está registrada como já
aplicada no histórico remoto, via `supabase migration repair`. Se algum dia o histórico se
perder, é isso que precisa ser refeito antes de qualquer push.

## Backup

Não existe backup automático: o plano gratuito do Supabase não oferece backup nem
restauração em ponto no tempo. Isso é a issue #34.

### Gerar

```powershell
.\supabase\backup-db.ps1
```

**Rode antes de qualquer migração destrutiva.** Gera dois arquivos em `D:\LivoBackups`
(configurável no topo do script):

| Arquivo | Conteúdo |
|---|---|
| `livo-<stamp>-auth.sql` | dados de `auth.users` e `auth.identities` — as contas |
| `livo-<stamp>-public.sql` | estrutura e dados do schema `public` — os prontuários |

São dois porque a ordem da restauração importa. Mantém os 10 backups mais recentes e apaga
os anteriores.

Os arquivos contêm prontuário clínico e hashes de senha. Ficam fora da árvore do projeto
de propósito e **nunca devem ser commitados** — o repositório é público. Quando houver
paciente real, essa pasta merece criptografia de disco.

### Restaurar

Precisa de um projeto de destino. Para testar, crie um descartável — o plano gratuito
permite dois projetos por organização:

```powershell
npx supabase projects create livo-restore-test --org-id uleokjarqpekmbvzbweg --region sa-east-1
```

Anote a senha do banco que você definir: ela não é recuperável depois, e aqui ela **é**
necessária, porque o CLI está vinculado ao projeto principal e não a esse.

**O host.** A conexão direta (`db.<ref>.supabase.co`) é IPv6-only e costuma não funcionar,
então use o pooler. O cluster varia por projeto: o principal está em
`aws-1-sa-east-1.pooler.supabase.com`, mas um projeto novo pode cair em `aws-0`. Se der
`tenant/user not found`, troque o número. O usuário é sempre `postgres.<ref>`.

Guarde a senha na sessão, para o prompt não se perder no redirecionamento:

```powershell
$sec = Read-Host "Senha do banco de destino" -AsSecureString
$env:PGPASSWORD = [System.Net.NetworkCredential]::new('', $sec).Password
```

**A ordem é `auth` primeiro, `public` depois:**

```powershell
cmd /c "D:\pgsql\bin\psql.exe -h aws-0-sa-east-1.pooler.supabase.com -p 5432 -U postgres.<REF> -d postgres -f D:\LivoBackups\livo-<stamp>-auth.sql > restore-auth.log 2>&1"
cmd /c "D:\pgsql\bin\psql.exe -h aws-0-sa-east-1.pooler.supabase.com -p 5432 -U postgres.<REF> -d postgres -f D:\LivoBackups\livo-<stamp>-public.sql > restore-public.log 2>&1"
```

Ao contrário, a chave estrangeira `usuarios.user_id -> auth.users(id)` falha e **o banco
restaurado fica com o histórico clínico sem vínculo com as contas** — ninguém consegue
logar e ver seus próprios dados. O erro aparece no log, mas é fácil passar batido no meio
de dois mil comandos.

O redirecionamento vai dentro do `cmd` porque no PowerShell 5.1 o `2>&1` num executável
nativo transforma cada linha de aviso em erro.

### Dois erros que são esperados

```
ERROR: schema "public" already exists
ERROR: permission denied to change default privileges
```

O primeiro acontece porque o projeto de destino já tem o schema. O segundo são os
`ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin`, que o usuário `postgres` do projeto
não pode alterar por não ser superusuário. Nenhum dos dois afeta dados. **Qualquer outro
erro merece leitura.**

### Conferir que funcionou

```powershell
& "D:\pgsql\bin\psql.exe" -h <host> -p 5432 -U postgres.<REF> -d postgres -c "select conname, convalidated from pg_constraint where conname = 'usuarios_user_id_fkey';"
```

`convalidated = t` significa que o vínculo entre contas e prontuários foi recriado. Depois
compare as contagens das tabelas principais com a origem.

Terminado o teste, **apague o projeto descartável**, senão ele ocupa o segundo slot da
organização e ninguém consegue criar outro:

```powershell
npx supabase projects delete <REF>
```

## Gerar um dump de schema novo, sem Docker

Tanto `db pull` quanto `db dump` exigem Docker, porque o CLI roda o `pg_dump` em
container. Para gerar o schema sem instalar Docker, aproveite o script que o próprio CLI
monta:

```powershell
npx supabase db dump --linked --schema public --dry-run
```

Copie a saída a partir do `#!/usr/bin/env bash` e, antes de rodar, faça **uma** correção:
trocar `--quote-all-identifier` por `--quote-all-identifiers`, no plural. O `pg_dump` do
Linux aceita a abreviação, o do Windows não. Depois rode o script com um `pg_dump` 17+ no
PATH.

O script traz umas trinta substituições que limpam o que é específico da plataforma —
publicações de realtime, event triggers, permissões de schemas internos. Vale usá-lo em
vez de escrever o `pg_dump` à mão.

## Comandos que não devem ser rodados

**`supabase db reset --linked`** recria o banco remoto a partir das migrations e apaga
todo o conteúdo. O nome parece inofensivo; o `--linked` é o que torna destrutivo.

**`supabase config push`** empurra este `config.toml` para o projeto. Rode `config pull` e
`config diff` antes, sempre. Hoje o `config diff` reporta `update: 0`, ou seja, o arquivo
está alinhado com o remoto — mas isso deixa de valer no instante em que alguém alterar
algo pelo painel.

**`supabase init --force`** sobrescreve o `config.toml`, descartando o alinhamento com o
projeto.

## Limitações conhecidas

**O bloco `[auth.sms.twilio]` está comentado no `config.toml`** para ficar fora do alcance
do `config push`. Login por SMS está desligado no projeto e não há credencial configurada;
o que o remoto reporta como `twilio.enabled = true` é apenas o provedor selecionado no
painel, que não aceita "nenhum".

**O backup não cobre o schema `auth` inteiro**, só `users` e `identities`.
`refresh_tokens` e `sessions` ficam de fora por serem efêmeros — quem restaura faz login
de novo.

**O schema `auth` não entra na migration de baseline**, porque é gerenciado pela
plataforma. Isso significa que aquele arquivo reconstrói o schema `public` num projeto
Supabase novo, não num Postgres comum: ele depende de `auth.users` e da função
`auth.uid()` existirem.

**MFA por TOTP está habilitado no projeto** e nenhuma tela usa. Nada quebra por isso, mas
quem trabalhar na sessão offline precisa saber que esse caminho existe.
