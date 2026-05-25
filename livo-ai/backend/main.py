import os
import json
import re
import shutil
import subprocess
import tempfile
from datetime import datetime
from typing import Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Migraine Voice Logger")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Variaveis de ambiente
OLLAMA_URL    = os.getenv("OLLAMA_URL",    "http://localhost:11434")
OLLAMA_MODEL  = os.getenv("OLLAMA_MODEL",  "gemma2:9b")
WHISPER_URL   = os.getenv("WHISPER_URL",   "http://localhost:8080")
WHISPER_MODE  = os.getenv("WHISPER_MODE",  "server")
WHISPER_CLI   = os.getenv("WHISPER_CLI",   "whisper-cli")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "models/ggml-medium.bin")

# Whisper


async def transcribe_via_server(audio_bytes: bytes, filename: str) -> str:
    # Converte para WAV 
    suffix = os.path.splitext(filename)[1] or ".webm"
    
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f_in:
        f_in.write(audio_bytes)
        tmp_in = f_in.name

    tmp_out = tmp_in.replace(suffix, ".wav")

    try:
        subprocess.run(
            ["ffmpeg", "-y", "-i", tmp_in,
             "-ar", "16000",   # 16kHz exigido pelo Whisper
             "-ac", "1",       # mono
             "-f", "wav", tmp_out],
            capture_output=True, check=True
        )

        with open(tmp_out, "rb") as f:
            wav_bytes = f.read()

        async with httpx.AsyncClient(timeout=600) as client:
            r = await client.post(
                f"{WHISPER_URL}/inference",
                files={"file": ("audio.wav", wav_bytes, "audio/wav")},
                data={"language": "pt", "response_format": "json",
                      "initial_prompt": "enxaqueca, cefaleia, fotofobia, fonofobia, náusea, vômito, tontura, aura, ibuprofeno, paracetamol, dipirona, sumatriptano, occipital, temporal, frontal, bilateral"},
            )
            r.raise_for_status()
            return r.json().get("text", "").strip()

    finally:
        if os.path.exists(tmp_in):
            os.unlink(tmp_in)
        if os.path.exists(tmp_out):
            os.unlink(tmp_out)


def transcribe_via_cli(audio_bytes: bytes, suffix: str) -> str:
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        result = subprocess.run(
            [WHISPER_CLI, "-m", WHISPER_MODEL, "-l", "pt",
             "-f", tmp_path, "--output-txt"],
            capture_output=True, text=True, timeout=120
        )
        txt_path = tmp_path + ".txt"
        if os.path.exists(txt_path):
            text = open(txt_path).read().strip()
            os.unlink(txt_path)
            return text
        return result.stdout.strip()
    finally:
        os.unlink(tmp_path)


async def transcribe(audio_bytes: bytes, filename: str) -> str:
    if WHISPER_MODE == "server":
        return await transcribe_via_server(audio_bytes, filename)
    elif WHISPER_MODE == "cli":
        suffix = os.path.splitext(filename)[1] or ".webm"
        return transcribe_via_cli(audio_bytes, suffix)
    else:
        raise HTTPException(400, "WHISPER_MODE inválido")

# LLM


COMPLEMENT_PROMPT = """Você é um assistente médico especializado em enxaqueca.

O paciente já respondeu um questionário estruturado sobre sua crise. Este é o registro atual:

REGISTRO ATUAL (questionário):
{registro_atual}

O paciente forneceu um relato verbal adicional para complementar o registro:

RELATO ADICIONAL:
"{relato}"

Sua tarefa é retornar o registro unificado e completo.

REGRAS ABSOLUTAS:
- Retorne SOMENTE o JSON, sem texto antes ou depois
- PRESERVE os valores já preenchidos no registro atual — não os apague
- Para sintomas_associados: se um campo já for true, mantenha true; só mude de false para true se o relato mencionar explicitamente
- PREENCHA os campos null usando informações do relato, quando disponível
- Para arrays (sensacao_dor, medicamentos_tomados, fatores_desencadeantes): ADICIONE ao array todos os itens novos mencionados no relato — nunca remova itens que já existem no array
- Se o relato contradizer algo do registro, use o valor do relato (é mais detalhado)
- NUNCA invente dados que não estão no registro nem no relato
- Atualize o "resumo" integrando ambas as fontes (máximo 15 palavras)

EXEMPLO:
Registro atual: {{"intensidade_dor": 6, "localizacao": "temporal", "lado": "direito", "sensacao_dor": [], "sintomas_associados": {{"nausea": false, "vomito": false, "fotofobia": true, "fonofobia": false, "aura": false, "tontura": false, "outros": []}}, "inicio_estimado": null, "medicamentos_tomados": [], "fatores_desencadeantes": [], "nivel_incapacidade": "moderado", "resumo": null}}
Relato: "tomei ibuprofeno mas não ajudou, estava com estômago enjoado e a dor é pulsante"
Saída: {{"intensidade_dor": 6, "localizacao": "temporal", "lado": "direito", "sensacao_dor": ["pulsante"], "sintomas_associados": {{"nausea": true, "vomito": false, "fotofobia": true, "fonofobia": false, "aura": false, "tontura": false, "outros": []}}, "inicio_estimado": null, "medicamentos_tomados": ["ibuprofeno"], "fatores_desencadeantes": [], "nivel_incapacidade": "moderado", "resumo": "dor pulsante temporal direita com náusea, ibuprofeno sem efeito"}}

Retorne o JSON completo e atualizado:
{{
  "intensidade_dor": <número 0-10 ou null>,
  "localizacao": <"frontal"|"temporal"|"occipital"|"difusa"|null>,
  "lado": <"esquerdo"|"direito"|"bilateral"|null>,
  "sensacao_dor": [],
  "sintomas_associados": {{
    "nausea": false,
    "vomito": false,
    "fotofobia": false,
    "fonofobia": false,
    "aura": false,
    "tontura": false,
    "outros": []
  }},
  "inicio_estimado": <"<1h"|"1-4h"|">4h"|null>,
  "medicamentos_tomados": [],
  "fatores_desencadeantes": [],
  "nivel_incapacidade": <"leve"|"moderado"|"severo"|null>,
  "resumo": "<máximo 15 palavras>"
}}"""

def fix_json_string(raw: str) -> str:
    raw = raw.strip()

    start = raw.find("{")
    end = raw.rfind("}") + 1
    if start != -1 and end != 0:
        raw = raw[start:end]

    raw = re.sub(r",\s*}", "}", raw)
    raw = re.sub(r",\s*]", "]", raw)
    raw = raw.replace("'", '"')

    return raw


async def merge_with_complement(pre_filled: dict, transcript: str) -> dict:
    registro_atual = json.dumps(pre_filled, ensure_ascii=False, indent=2)
    prompt = COMPLEMENT_PROMPT.format(registro_atual=registro_atual, relato=transcript)

    async with httpx.AsyncClient(timeout=1200) as client:
        r = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False, "format": "json",
                  "options": {"temperature": 0}},
        )
        r.raise_for_status()
        raw = r.json().get("response", "")

    print("\n=== RAW LLM COMPLEMENT RESPONSE ===")
    print(raw)
    print("===================================\n")

    try:
        return json.loads(raw)
    except Exception:
        pass
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        return json.loads(raw[start:end])
    except Exception:
        pass
    try:
        return json.loads(fix_json_string(raw))
    except Exception as e:
        print("Erro no complement fallback:", e)

    return pre_filled


#Endpoints

@app.post("/api/complement-crisis")
async def complement_crisis(
    pre_filled: str = Form(...),
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    try:
        pre_filled_data = json.loads(pre_filled)
    except Exception:
        raise HTTPException(400, "JSON pré-preenchido inválido")

    transcript = ""
    if file and file.filename:
        audio_bytes = await file.read()
        if audio_bytes:
            transcript = await transcribe(audio_bytes, file.filename or "audio.webm")
    elif text:
        transcript = text.strip()

    if not transcript:
        return {
            "timestamp": datetime.now().isoformat(),
            "transcript": "",
            "structured": pre_filled_data,
        }

    structured = await merge_with_complement(pre_filled_data, transcript)
    return {
        "timestamp": datetime.now().isoformat(),
        "transcript": transcript,
        "structured": structured,
    }


@app.get("/api/health")
async def health():
    status = {"ollama": False, "whisper": False}
    async with httpx.AsyncClient(timeout=5) as client:
        try:
            await client.get(f"{OLLAMA_URL}/api/tags")
            status["ollama"] = True
        except Exception:
            pass

        if WHISPER_MODE == "server":
            try:
                await client.get(f"{WHISPER_URL}/")
                status["whisper"] = True
            except Exception:
                pass
        elif WHISPER_MODE == "cli":
            status["whisper"] = shutil.which(WHISPER_CLI) is not None

    return status

