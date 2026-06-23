import os
import json
import re
import shutil
import subprocess
import tempfile
from datetime import datetime
from typing import List, Optional

import httpx
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

REGRAS (em ordem de prioridade — regras superiores vencem):
1. CORREÇÕES EXPLÍCITAS têm prioridade máxima: se o relato contiver um comando direto de mudança ("mude para", "corrija para", "na verdade é", "quero mudar", "é X", "coloca X"), aplique imediatamente o novo valor — mesmo que o campo já esteja preenchido no registro atual
2. CONTRADIÇÕES: se o relato mencionar um valor diferente do que está no registro para o mesmo campo, use o valor do relato (é mais recente e detalhado)
3. PRESERVE os valores já preenchidos que não foram corrigidos nem contraditos
4. Para sintomas_associados: se um campo já for true, mantenha true; só mude de false para true se o relato mencionar explicitamente
5. PREENCHA os campos null usando informações do relato, quando disponível
6. Para arrays (sensacao_dor, medicamentos_tomados, fatores_desencadeantes): ADICIONE itens novos mencionados no relato — nunca remova itens existentes
7. NUNCA invente dados que não estão no registro nem no relato
8. Atualize o "resumo" integrando ambas as fontes (máximo 15 palavras)

EXEMPLO 1 (complemento):
Registro atual: {{"intensidade_dor": 6, "localizacao": "temporal", "lado": "direito", "sensacao_dor": [], "sintomas_associados": {{"nausea": false, "vomito": false, "fotofobia": true, "fonofobia": false, "aura": false, "tontura": false, "outros": []}}, "inicio_estimado": null, "medicamentos_tomados": [], "fatores_desencadeantes": [], "nivel_incapacidade": "moderado", "resumo": null}}
Relato: "tomei ibuprofeno mas não ajudou, estava com estômago enjoado e a dor é pulsante"
Saída: {{"intensidade_dor": 6, "localizacao": "temporal", "lado": "direito", "sensacao_dor": ["pulsante"], "sintomas_associados": {{"nausea": true, "vomito": false, "fotofobia": true, "fonofobia": false, "aura": false, "tontura": false, "outros": []}}, "inicio_estimado": null, "medicamentos_tomados": ["ibuprofeno"], "fatores_desencadeantes": [], "nivel_incapacidade": "moderado", "resumo": "dor pulsante temporal direita com náusea, ibuprofeno sem efeito"}}

EXEMPLO 2 (correção explícita de campo já preenchido):
Registro atual: {{"intensidade_dor": 5, "localizacao": "frontal", "lado": "bilateral", "sensacao_dor": [], "sintomas_associados": {{"nausea": true, "vomito": false, "fotofobia": false, "fonofobia": false, "aura": false, "tontura": false, "outros": []}}, "inicio_estimado": "1-4h", "medicamentos_tomados": [], "fatores_desencadeantes": [], "nivel_incapacidade": "leve", "resumo": "dor frontal bilateral com náusea"}}
Relato: "mude a intensidade para 7"
Saída: {{"intensidade_dor": 7, "localizacao": "frontal", "lado": "bilateral", "sensacao_dor": [], "sintomas_associados": {{"nausea": true, "vomito": false, "fotofobia": false, "fonofobia": false, "aura": false, "tontura": false, "outros": []}}, "inicio_estimado": "1-4h", "medicamentos_tomados": [], "fatores_desencadeantes": [], "nivel_incapacidade": "leve", "resumo": "dor frontal bilateral com náusea, intensidade 7/10"}}

Retorne o JSON completo e atualizado."""

OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "intensidade_dor": {
            "anyOf": [{"type": "number", "minimum": 0, "maximum": 10}, {"type": "null"}]
        },
        "localizacao": {
            "anyOf": [{"type": "string", "enum": ["frontal", "temporal", "occipital", "difusa"]}, {"type": "null"}]
        },
        "lado": {
            "anyOf": [{"type": "string", "enum": ["esquerdo", "direito", "bilateral"]}, {"type": "null"}]
        },
        "sensacao_dor": {"type": "array", "items": {"type": "string"}},
        "sintomas_associados": {
            "type": "object",
            "properties": {
                "nausea":    {"type": "boolean"},
                "vomito":    {"type": "boolean"},
                "fotofobia": {"type": "boolean"},
                "fonofobia": {"type": "boolean"},
                "aura":      {"type": "boolean"},
                "tontura":   {"type": "boolean"},
                "outros":    {"type": "array", "items": {"type": "string"}},
            },
            "required": ["nausea", "vomito", "fotofobia", "fonofobia", "aura", "tontura", "outros"],
        },
        "inicio_estimado": {
            "anyOf": [{"type": "string", "enum": ["<1h", "1-4h", ">4h"]}, {"type": "null"}]
        },
        "medicamentos_tomados":    {"type": "array", "items": {"type": "string"}},
        "fatores_desencadeantes":  {"type": "array", "items": {"type": "string"}},
        "nivel_incapacidade": {
            "anyOf": [{"type": "string", "enum": ["leve", "moderado", "severo"]}, {"type": "null"}]
        },
        "resumo": {"anyOf": [{"type": "string"}, {"type": "null"}]},
    },
    "required": [
        "intensidade_dor", "localizacao", "lado", "sensacao_dor",
        "sintomas_associados", "inicio_estimado", "medicamentos_tomados",
        "fatores_desencadeantes", "nivel_incapacidade", "resumo",
    ],
}

_VALID_LOCALIZACAO = {"frontal", "temporal", "occipital", "difusa"}
_VALID_LADO        = {"esquerdo", "direito", "bilateral"}
_VALID_INICIO      = {"<1h", "1-4h", ">4h"}
_VALID_NIVEL       = {"leve", "moderado", "severo"}
_SINTOMA_BOOLS     = {"nausea", "vomito", "fotofobia", "fonofobia", "aura", "tontura"}


def validate_structured(data: dict) -> dict:
    if data.get("localizacao") not in _VALID_LOCALIZACAO:
        data["localizacao"] = None
    if data.get("lado") not in _VALID_LADO:
        data["lado"] = None
    if data.get("inicio_estimado") not in _VALID_INICIO:
        data["inicio_estimado"] = None
    if data.get("nivel_incapacidade") not in _VALID_NIVEL:
        data["nivel_incapacidade"] = None

    intensidade = data.get("intensidade_dor")
    if intensidade is not None and not (isinstance(intensidade, (int, float)) and 0 <= intensidade <= 10):
        data["intensidade_dor"] = None

    for field in ("sensacao_dor", "medicamentos_tomados", "fatores_desencadeantes"):
        if not isinstance(data.get(field), list):
            data[field] = []

    sintomas = data.get("sintomas_associados") or {}
    for key in _SINTOMA_BOOLS:
        if not isinstance(sintomas.get(key), bool):
            sintomas[key] = False
    if not isinstance(sintomas.get("outros"), list):
        sintomas["outros"] = []
    data["sintomas_associados"] = sintomas

    return data

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
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": OUTPUT_SCHEMA,
                "options": {"temperature": 0},
            },
        )
        r.raise_for_status()
        raw = r.json().get("response", "")

    print("\n=== RAW LLM COMPLEMENT RESPONSE ===")
    print(raw)
    print("===================================\n")

    parsed = None
    try:
        parsed = json.loads(raw)
    except Exception:
        pass
    if parsed is None:
        try:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            parsed = json.loads(raw[start:end])
        except Exception:
            pass
    if parsed is None:
        try:
            parsed = json.loads(fix_json_string(raw))
        except Exception as e:
            print("Erro no complement fallback:", e)

    if parsed is None:
        return pre_filled

    return validate_structured(parsed)


# Análise qualitativa

INSIGHTS_ANALYSIS_PROMPT = """Você é um assistente médico especializado em enxaqueca.

Abaixo estão todos os registros de crise de um paciente em ordem cronológica:

{registros}

Analise esses registros de forma qualitativa e retorne um JSON com exatamente 3 campos:

- "padroes": descreva padrões recorrentes observados (horários, duração, intensidade, sintomas que aparecem juntos). Se houver poucos dados, diga o que já é possível observar.
- "gatilhos_principais": analise os fatores desencadeantes mais frequentes e possíveis correlações entre eles.
- "evolucao": descreva como as crises evoluíram ao longo do tempo (melhoraram, pioraram, ficaram estáveis, mudaram de característica).

Se houver menos de 3 registros, ainda assim responda com o que for possível concluir.
Escreva em português, de forma clara e direta para o paciente.
Retorne apenas o JSON, sem texto adicional."""

INSIGHTS_OUTPUT_SCHEMA = {
    "type": "object",
    "properties": {
        "padroes":            {"type": "string"},
        "gatilhos_principais": {"type": "string"},
        "evolucao":           {"type": "string"},
    },
    "required": ["padroes", "gatilhos_principais", "evolucao"],
}


class CriseRecord(BaseModel):
    data: str
    intensidade: Optional[float] = None
    localizacao: Optional[str] = None
    lado: Optional[str] = None
    duracao_horas: Optional[float] = None
    sintomas: List[str] = []
    medicamentos: List[str] = []
    gatilhos: List[str] = []
    nivel_incapacidade: Optional[str] = None
    resumo: Optional[str] = None


class AnalyzeInsightsRequest(BaseModel):
    crises: List[CriseRecord]


def format_crises_for_prompt(crises: List[CriseRecord]) -> str:
    lines = []
    for i, c in enumerate(crises, 1):
        parts = [f"Crise {i} ({c.data})"]
        if c.intensidade is not None:
            parts.append(f"  Intensidade: {c.intensidade}/10")
        if c.localizacao:
            loc = c.localizacao
            if c.lado:
                loc += f" {c.lado}"
            parts.append(f"  Localização: {loc}")
        if c.duracao_horas is not None:
            parts.append(f"  Duração: {c.duracao_horas}h")
        if c.nivel_incapacidade:
            parts.append(f"  Incapacidade: {c.nivel_incapacidade}")
        if c.sintomas:
            parts.append(f"  Sintomas: {', '.join(c.sintomas)}")
        if c.medicamentos:
            parts.append(f"  Medicamentos: {', '.join(c.medicamentos)}")
        if c.gatilhos:
            parts.append(f"  Gatilhos: {', '.join(c.gatilhos)}")
        if c.resumo:
            parts.append(f"  Resumo: {c.resumo}")
        lines.append("\n".join(parts))
    return "\n\n".join(lines)


async def analyze_insights_with_llm(crises: List[CriseRecord]) -> dict:
    registros = format_crises_for_prompt(crises)
    prompt = INSIGHTS_ANALYSIS_PROMPT.format(registros=registros)

    async with httpx.AsyncClient(timeout=1200) as client:
        r = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": INSIGHTS_OUTPUT_SCHEMA,
                "options": {"temperature": 0},
            },
        )
        r.raise_for_status()
        raw = r.json().get("response", "")

    print("\n=== RAW LLM INSIGHTS RESPONSE ===")
    print(raw)
    print("==================================\n")

    parsed = None
    try:
        parsed = json.loads(raw)
    except Exception:
        pass
    if parsed is None:
        try:
            start = raw.find("{")
            end = raw.rfind("}") + 1
            parsed = json.loads(raw[start:end])
        except Exception:
            pass
    if parsed is None:
        try:
            parsed = json.loads(fix_json_string(raw))
        except Exception as e:
            print("Erro no insights fallback:", e)

    if parsed is None:
        return {
            "padroes": "Não foi possível gerar análise. Tente novamente.",
            "gatilhos_principais": "",
            "evolucao": "",
        }

    return parsed


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


@app.post("/api/analyze-insights")
async def analyze_insights(body: AnalyzeInsightsRequest):
    if not body.crises:
        return {
            "padroes": "Nenhum registro encontrado para análise.",
            "gatilhos_principais": "",
            "evolucao": "",
        }
    return await analyze_insights_with_llm(body.crises)


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

