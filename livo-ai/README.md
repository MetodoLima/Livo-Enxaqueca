# 🧠 MigraineLog — MVP de Registro de Enxaqueca por Voz

Aplicativo mobile-first para capturar sintomas de enxaqueca por voz,
com toda a IA rodando **100% local** no seu computador.

---

## Arquitetura

```
Microfone (celular/browser)
       │
       ▼ WebM/audio
  FastAPI Backend
       │
       ├──► whisper.cpp (STT local) ──► transcrição em texto
       │
       └──► Ollama LLM ──────────────► JSON estruturado
                │
                ▼
         { intensidade, localização, sintomas, ... }
```

---

## Pré-requisitos

| Componente | Instalação |
|---|---|
| Python 3.10+ | já instalado na maioria dos sistemas |
| **Ollama** | https://ollama.com — `curl -fsSL https://ollama.com/install.sh \| sh` |
| **whisper.cpp** | https://github.com/ggerganov/whisper.cpp |

---

## Instalação rápida

### 1. Instalar Ollama e baixar modelo
```bash
# Instala Ollama (Linux/Mac)
curl -fsSL https://ollama.com/install.sh | sh

# Baixa o modelo (escolha um):
ollama pull llama3        # recomendado, ~4.7GB
ollama pull mistral       # alternativa, ~4.1GB
ollama pull gemma2:2b     # leve, ~1.6GB (menor qualidade)
```

### 2. Instalar whisper.cpp (STT local)

**Opção A — compilar do zero (Linux/Mac):**
```bash
git clone https://github.com/ggerganov/whisper.cpp
cd whisper.cpp
make

# Baixa modelo base (multilíngue, 148MB):
bash models/download-ggml-model.sh base

# Inicia o servidor HTTP:
./build/bin/whisper-server -m models/ggml-base.bin --host 0.0.0.0 --port 8080
```

**Opção B — via Homebrew (Mac):**
```bash
brew install whisper-cpp
# Baixe o modelo manualmente:
bash run.sh download-whisper
```

### 3. Instalar dependências Python e iniciar
```bash
cd migraine-app
bash run.sh setup   # instala pip deps + puxa modelo ollama
bash run.sh start   # inicia o servidor na porta 8000
```

### 4. Acessar pelo celular

1. Descubra o IP local do seu computador:
   ```bash
   # Linux/Mac:
   ip addr show | grep "inet " | grep -v 127
   # Windows:
   ipconfig
   ```
2. No celular (mesma rede Wi-Fi), abra: `http://SEU-IP:8000`
3. Conceda permissão de microfone quando solicitado
4. Toque no botão roxo e fale seus sintomas

---

## Configuração via variáveis de ambiente

```bash
# Trocar modelo LLM
OLLAMA_MODEL=mistral bash run.sh start

# Usar whisper como CLI (sem servidor):
WHISPER_MODE=cli WHISPER_CLI=./whisper.cpp/main bash run.sh start

# Modelo whisper maior (mais preciso):
WHISPER_MODEL=models/ggml-medium.bin bash run.sh start
```

---

## Estrutura do projeto

```
migraine-app/
├── backend/
│   ├── main.py          # FastAPI: STT + LLM pipeline
│   └── requirements.txt
├── frontend/
│   └── index.html       # App mobile-first (HTML/CSS/JS puro)
├── models/              # Modelos whisper.cpp (criado por run.sh)
├── run.sh               # Script de setup e execução
└── README.md
```

---

## JSON de saída (exemplo)

```json
{
  "timestamp": "2024-01-15T14:32:11",
  "transcript": "Dor forte na têmpora direita há duas horas, latejante, com muita náusea e não consigo ver a luz",
  "structured": {
    "intensidade_dor": 8,
    "localizacao": "temporal",
    "lado": "direito",
    "qualidade_dor": ["latejante", "pulsátil"],
    "sintomas_associados": {
      "nausea": true,
      "vomito": false,
      "fotofobia": true,
      "fonofobia": false,
      "aura": false,
      "tontura": false,
      "outros": []
    },
    "inicio_estimado": "1-4h",
    "medicamentos_tomados": [],
    "fatores_desencadeantes": [],
    "nivel_incapacidade": "severo",
    "resumo": "Enxaqueca temporal direita severa com náusea e fotofobia"
  }
}
```

---

## Modelos Whisper disponíveis

| Modelo | Tamanho | Qualidade | Velocidade |
|---|---|---|---|
| tiny | 75MB | ⭐⭐ | ⚡⚡⚡⚡ |
| base | 148MB | ⭐⭐⭐ | ⚡⚡⚡ |
| small | 488MB | ⭐⭐⭐⭐ | ⚡⚡ |
| medium | 1.5GB | ⭐⭐⭐⭐⭐ | ⚡ |

Para enxaqueca, `base` é suficiente e rápido.

---

## Solução de problemas

**"Permissão de microfone negada"**
> No celular, acesse via `http://` (não `https://`) — ou use HTTPS com certificado self-signed.

**"Erro na transcrição (Whisper)"**
> Verifique se o whisper-server está rodando: `curl http://localhost:8080/`
> Ou troque para modo CLI: `WHISPER_MODE=cli bash run.sh start`

**"Erro na extração LLM (Ollama)"**
> Verifique se o Ollama está rodando: `ollama list`
> E se o modelo está baixado: `ollama pull llama3`

**Celular não alcança o servidor**
> Desative o firewall para a porta 8000, ou abra a porta:
> `sudo ufw allow 8000` (Ubuntu)
