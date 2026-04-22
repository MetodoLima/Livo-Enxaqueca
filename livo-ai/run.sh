#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
#  script de setup e execução (refatorado)
#  Uso: bash run.sh [start|setup|whisper-server|check|download-whisper]
# ────────────────────────────────────────────────────────────────
set -e

BOLD='\033[1m'; CYAN='\033[0;36m'; GREEN='\033[0;32m'
YELLOW='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'

log()  { echo -e "${CYAN}▶${NC} $*"; }
ok()   { echo -e "${GREEN}✓${NC} $*"; }
warn() { echo -e "${YELLOW}⚠${NC}  $*"; }
err()  { echo -e "${RED}✗${NC}  $*"; }

CMD=${1:-start}
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
VENV_DIR="$BACKEND_DIR/.venv"

# ── utils ────────────────────────────────────────────────────────
activate_venv() {
  if [ ! -d "$VENV_DIR" ]; then
    err "Ambiente virtual não encontrado. Rode: bash run.sh setup"
    exit 1
  fi
  # shellcheck disable=SC1090
  source "$VENV_DIR/bin/activate"
}

create_venv() {
  if [ -d "$VENV_DIR" ]; then
    ok "Ambiente virtual já existe"
  else
    log "Criando ambiente virtual em .venv..."
    python3 -m venv "$VENV_DIR"
    ok "Ambiente virtual criado"
  fi
}

# ── check ────────────────────────────────────────────────────────
check_deps() {
  log "Verificando dependências..."

  command -v python3 >/dev/null || { err "python3 não encontrado"; exit 1; }
  command -v pip3    >/dev/null || { err "pip3 não encontrado"; exit 1; }

  ok "Python OK: $(python3 --version)"

  if command -v ollama &>/dev/null; then
    ok "Ollama encontrado: $(ollama --version 2>/dev/null || echo 'instalado')"
  else
    warn "Ollama não encontrado → https://ollama.com"
  fi

  if command -v whisper-server &>/dev/null || command -v whisper-cli &>/dev/null; then
    ok "whisper.cpp encontrado"
  else
    warn "whisper.cpp não encontrado (opcional)"
  fi
}

# ── setup ────────────────────────────────────────────────────────
setup() {
  check_deps

  log "Preparando ambiente Python..."
  cd "$BACKEND_DIR"

  create_venv
  activate_venv

  log "Atualizando pip..."
  pip install --upgrade pip -q

  log "Instalando dependências..."
  pip install -r requirements.txt -q
  ok "Dependências instaladas"

  log "Verificando modelo Ollama..."
  MODEL=${OLLAMA_MODEL:-gemma2:2b}

  if command -v ollama &>/dev/null; then
    if ollama list 2>/dev/null | grep -q "$MODEL"; then
      ok "Modelo '$MODEL' já disponível"
    else
      log "Baixando modelo '$MODEL' (pode demorar)..."
      ollama pull "$MODEL"
      ok "Modelo '$MODEL' pronto"
    fi
  fi
}

# ── whisper ──────────────────────────────────────────────────────
start_whisper() {
  MODEL_PATH=${WHISPER_MODEL:-"$ROOT_DIR/models/ggml-base.bin"}

  if [ ! -f "$MODEL_PATH" ]; then
    warn "Modelo Whisper não encontrado em '$MODEL_PATH'"
    warn "Use: bash run.sh download-whisper"
    return
  fi

  log "Iniciando whisper.cpp server (porta 8080)..."
  whisper-server -m "$MODEL_PATH" --host 0.0.0.0 --port 8080 &
  ok "Whisper rodando em background (PID $!)"
}

download_whisper_model() {
  mkdir -p "$ROOT_DIR/models"

  log "Baixando modelo Whisper base (~148MB)..."
  curl -L -o "$ROOT_DIR/models/ggml-base.bin" \
    "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin"

  ok "Modelo salvo em models/ggml-base.bin"
}

# ── start ────────────────────────────────────────────────────────
start_server() {
  cd "$BACKEND_DIR"
  activate_venv

  log "Iniciando backend..."

  echo ""
  echo -e "${BOLD}  ┌─────────────────────────────────────┐${NC}"
  echo -e "${BOLD}  │   🧠  MigraineLog MVP               │${NC}"
  echo -e "${BOLD}  │   App:  http://localhost:8000      │${NC}"
  echo -e "${BOLD}  │   Docs: http://localhost:8000/docs │${NC}"
  echo -e "${BOLD}  └─────────────────────────────────────┘${NC}"
  echo ""

  echo -e "  ${YELLOW}Variáveis de ambiente:${NC}"
  echo -e "  OLLAMA_MODEL  = ${OLLAMA_MODEL:-llama3}"
  echo -e "  WHISPER_MODE  = ${WHISPER_MODE:-server}"
  echo -e "  OLLAMA_URL    = ${OLLAMA_URL:-http://localhost:11434}"
  echo -e "  WHISPER_URL   = ${WHISPER_URL:-http://localhost:8080}"
  echo ""

  python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
}

# ── router ───────────────────────────────────────────────────────
case "$CMD" in
  setup)              setup ;;
  check)              check_deps ;;
  whisper-server)     start_whisper ;;
  download-whisper)   download_whisper_model ;;
  start|*)            start_server ;;
esac
