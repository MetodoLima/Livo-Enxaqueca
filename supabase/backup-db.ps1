# Backup do banco do Livo. Issue #34.
#
# Gera dois arquivos por execucao, guardados FORA da arvore do repositorio:
#
#   livo-<stamp>-auth.sql     dados de auth.users e auth.identities
#   livo-<stamp>-public.sql   estrutura e dados do schema public
#
# Sao dois porque a ORDEM DA RESTAURACAO importa: auth primeiro, public depois. Ao
# contrario, a chave estrangeira usuarios.user_id -> auth.users(id) falha, e o banco
# restaurado fica com o historico clinico sem vinculo com as contas.
#
# SEGURANCA
#
# Este arquivo nao contem credencial nenhuma e e seguro estar num repositorio
# publico. O acesso ao banco vem do CLI do Supabase, que cria um login role
# temporario no Postgres a partir do token da conta de quem executa. Sem
# `npx supabase login` e `npx supabase link` feitos na maquina, o script falha.
# Clonar o repositorio nao da acesso a dado nenhum.
#
# OS ARQUIVOS GERADOS sao outra historia: contem prontuario clinico e os hashes de
# senha dos usuarios. Ficam fora do projeto de proposito e nunca devem ser
# commitados. Quando houver paciente real, essa pasta merece criptografia de disco.
#
# ATENCAO AO EDITAR: mantenha este arquivo em ASCII puro. O PowerShell 5.1 le .ps1
# sem BOM usando a codepage do sistema, e um caractere UTF-8 fora do ASCII quebra o
# parser de um jeito que a mensagem de erro nao explica.
#
# USO
#
#   .\supabase\backup-db.ps1
#
# Rode antes de qualquer migracao destrutiva.

$ErrorActionPreference = 'Stop'

# --- Configuracao ------------------------------------------------------------

# pg_dump 17 ou mais novo. O servidor esta no Postgres 17.6, e o pg_dump precisa
# ser igual ou mais novo que ele.
$PgDump    = 'D:\pgsql\bin\pg_dump.exe'
$BackupDir = 'D:\LivoBackups'
$KeepLast  = 10   # quantos backups manter, contando cada par como um

# --- Verificacoes antes de tocar em qualquer coisa ---------------------------

if (-not (Test-Path $PgDump)) {
    throw "pg_dump nao encontrado em $PgDump. Ajuste a variavel PgDump no topo deste script."
}

# O destino nao pode cair dentro do repositorio. Dado clinico no git status de um
# repositorio publico e um acidente sem desfazer.
$repoRoot = [System.IO.Path]::GetFullPath((git rev-parse --show-toplevel))
$destFull = [System.IO.Path]::GetFullPath($BackupDir)
if ($destFull.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "BackupDir ($destFull) esta dentro do repositorio ($repoRoot). Escolha uma pasta fora."
}

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
    Write-Host "Pasta criada: $BackupDir"
}

# --- Credenciais, sem pedir senha --------------------------------------------

# O `db dump --dry-run` imprime o script que o CLI executaria, incluindo as
# variaveis do login role temporario. Aproveitamos so essas variaveis e rodamos o
# pg_dump local, porque o db dump de verdade exige Docker.
#
# O redirecionamento acontece dentro do cmd de proposito. No PowerShell 5.1, usar
# 2>&1 num executavel nativo transforma cada linha de stderr em erro, e o CLI
# escreve "Initialising login role..." em stderr, o que abortaria o script.
Write-Host "Obtendo credenciais temporarias do projeto..."

$dryRun = & cmd /c "npx supabase db dump --linked --dry-run 2>&1" | Out-String

$pgEnv = @{}
foreach ($line in ($dryRun -split "`r?`n")) {
    if ($line -match '^\s*export\s+(PG[A-Z]+)=(.*)$') {
        $pgEnv[$Matches[1]] = $Matches[2].Trim().Trim('"')
    }
}

foreach ($required in @('PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE')) {
    if (-not $pgEnv.ContainsKey($required)) {
        throw "Nao consegui obter $required do CLI. Confira se `npx supabase login` e `npx supabase link` foram feitos nesta maquina."
    }
}

# Nao imprima $pgEnv. PGPASSWORD e credencial, ainda que efemera.
foreach ($k in $pgEnv.Keys) { Set-Item -Path "env:$k" -Value $pgEnv[$k] }

# --- Dumps -------------------------------------------------------------------

$stamp     = Get-Date -Format 'yyyyMMdd-HHmmss'
$outAuth   = Join-Path $BackupDir "livo-$stamp-auth.sql"
$outPublic = Join-Path $BackupDir "livo-$stamp-public.sql"

# --role postgres e obrigatorio nos dois: o login role temporario le o catalogo,
# que basta para estrutura, mas nao tem SELECT nas tabelas. Sem isso o pg_dump
# falha com "permission denied for table usuarios".
$dumps = @(
    @{
        Nome  = 'auth (contas)'
        Saida = $outAuth
        # So os dados. O schema auth e gerenciado pela plataforma e ja existe em
        # qualquer projeto Supabase novo, entao recriar a estrutura dele daria
        # conflito. refresh_tokens e sessions ficam de fora por serem efemeros:
        # quem restaura faz login de novo.
        Args  = @('--data-only', '--table=auth.users', '--table=auth.identities', '--role=postgres')
    },
    @{
        Nome  = 'public (dados clinicos)'
        Saida = $outPublic
        # Sem --schema-only de proposito: e o que traz as linhas.
        # --no-owner facilita restaurar num projeto diferente, onde o dono muda.
        Args  = @('--schema=public', '--no-owner', '--role=postgres')
    }
)

try {
    foreach ($d in $dumps) {
        Write-Host "Gerando dump de $($d.Nome)..."

        $dumpArgs = @($d.Args) + @("--file=$($d.Saida)")

        # ErrorActionPreference volta para Continue durante a chamada porque o
        # pg_dump pode escrever avisos em stderr, e no PowerShell 5.1 isso viraria
        # erro terminal. Quem decide sucesso aqui e o codigo de saida.
        $prevEap = $ErrorActionPreference
        $ErrorActionPreference = 'Continue'
        & $PgDump @dumpArgs
        $code = $LASTEXITCODE
        $ErrorActionPreference = $prevEap

        if ($code -ne 0) {
            # Um dump que falhou no meio deixa arquivo parcial, e arquivo parcial
            # parece backup ate o dia em que alguem tenta restaurar. Remove o par
            # inteiro para nao sobrar metade.
            foreach ($x in @($outAuth, $outPublic)) {
                if (Test-Path $x) { Remove-Item $x -Force }
            }
            throw "pg_dump de $($d.Nome) terminou com codigo $code. Arquivos parciais removidos."
        }
    }
}
finally {
    # A credencial nao deve sobrar na sessao do PowerShell.
    foreach ($k in $pgEnv.Keys) { Remove-Item "env:$k" -ErrorAction SilentlyContinue }
}

# --- Resumo ------------------------------------------------------------------

Write-Host ""
foreach ($f in @($outAuth, $outPublic)) {
    $nome = Split-Path $f -Leaf
    $kb   = [math]::Round((Get-Item $f).Length / 1KB, 1)
    $rows = (Select-String -Path $f -Pattern '^COPY |^INSERT INTO ' -AllMatches | Measure-Object).Count
    Write-Host "$nome  -  $kb KB, $rows bloco(s) de dados"
    if ($rows -eq 0) {
        Write-Warning "$nome nao tem bloco de dados nenhum."
    }
}

Write-Host ""
Write-Host "Para restaurar, a ordem importa: primeiro o -auth.sql, depois o -public.sql."

# --- Retencao ----------------------------------------------------------------

# Agrupa por timestamp para nao contar o par como dois backups.
$stamps = Get-ChildItem $BackupDir -Filter 'livo-*.sql' |
          ForEach-Object { if ($_.BaseName -match '^livo-(\d{8}-\d{6})-') { $Matches[1] } } |
          Sort-Object -Unique -Descending

$velhos = @($stamps | Select-Object -Skip $KeepLast)
if ($velhos.Count -gt 0) {
    foreach ($s in $velhos) {
        Get-ChildItem $BackupDir -Filter "livo-$s-*.sql" | Remove-Item -Force
    }
    Write-Host "Removidos $($velhos.Count) backup(s) antigo(s), mantendo os $KeepLast mais recentes."
}
