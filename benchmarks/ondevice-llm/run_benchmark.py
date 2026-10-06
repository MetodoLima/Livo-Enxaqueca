#!/usr/bin/env python3
"""Benchmark de LLMs embarcados para a tarefa de complementação de crise (Livo).

Roda o mesmo prompt/schema de produção (services/onDeviceLlm.ts) contra vários
modelos GGUF via llama-cpp-python — o mesmo motor (ggml/llama.cpp) usado pelo
llama.rn no app. Mede latência, tokens, uso de CPU/memória e acurácia da extração
estruturada contra um gabarito sintético (cases.jsonl).

ATENÇÃO: os números de CPU/memória/latência aqui são de um notebook x86, não de um
celular ARM. Sirvem para triagem rápida entre famílias de modelo; o(s) finalista(s)
ainda precisam ser revalidados em aparelho real antes de decidir o que embarcar.

Uso:
    python run_benchmark.py --download              # baixa os modelos que faltam
    python run_benchmark.py                          # roda todos os modelos de models.yaml
    python run_benchmark.py --models gemma3-1b,qwen2.5-1.5b
    python run_benchmark.py --threads 4 --n-predict 512
"""
from __future__ import annotations

import argparse
import csv
import json
import statistics
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path

import psutil
import requests
import yaml
from tabulate import tabulate

import scoring

HERE = Path(__file__).parent
MODELS_YAML = HERE / "models.yaml"
SYSTEM_PROMPT_FILE = HERE / "system_prompt.txt"
MODELS_DIR = HERE / "models"
RESULTS_DIR = HERE / "results"

ENUM_LOCALIZACAO = {"frontal", "temporal", "occipital", "difusa"}
ENUM_LADO = {"esquerdo", "direito", "bilateral"}
ENUM_INICIO = {"<1h", "1-4h", ">4h"}
ENUM_NIVEL = {"leve", "moderado", "severo"}


# ── Download ──────────────────────────────────────────────────────────────

def download_model(entry: dict) -> Path:
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    dest = MODELS_DIR / entry["filename"]
    if dest.exists():
        print(f"  [{entry['id']}] já baixado em {dest}")
        return dest

    print(f"  [{entry['id']}] baixando {entry['url']}")
    with requests.get(entry["url"], stream=True, timeout=60) as r:
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        done = 0
        tmp = dest.with_suffix(".part")
        with open(tmp, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 20):
                f.write(chunk)
                done += len(chunk)
                if total:
                    pct = done / total * 100
                    print(f"\r    {pct:5.1f}% ({done / 1e6:.0f}MB / {total / 1e6:.0f}MB)", end="")
        print()
        tmp.rename(dest)
    return dest


# ── Parsing/sanitização (espelha onDeviceLlm.ts) ───────────────────────────

def _is_nullish(v) -> bool:
    return v is None or (isinstance(v, str) and v.strip().lower() == "null")


def _nullable_enum(v, allowed: set[str]):
    if not isinstance(v, str):
        return None
    norm = v.strip().lower()
    return norm if norm in allowed else None


def _nullable_number(v):
    if _is_nullish(v):
        return None
    try:
        return float(v) if not isinstance(v, (int, float)) else v
    except (TypeError, ValueError):
        return None


def _nullable_text(v):
    if _is_nullish(v):
        return None
    return v.strip() if isinstance(v, str) else None


def _to_bool(v) -> bool:
    return v is True or v == "true"


def _to_string_array(v) -> list[str]:
    if isinstance(v, list):
        return [x.strip() for x in v if isinstance(x, str) and not _is_nullish(x)]
    if isinstance(v, str) and not _is_nullish(v) and v.strip():
        return [v.strip()]
    return []


def sanitize_structured(raw: dict) -> dict:
    s = raw.get("sintomas_associados") or {}
    return {
        "intensidade_dor": _nullable_number(raw.get("intensidade_dor")),
        "localizacao": _nullable_enum(raw.get("localizacao"), ENUM_LOCALIZACAO),
        "lado": _nullable_enum(raw.get("lado"), ENUM_LADO),
        "qualidade_dor": _to_string_array(raw.get("qualidade_dor")),
        "sintomas_associados": {
            "nausea": _to_bool(s.get("nausea")),
            "vomito": _to_bool(s.get("vomito")),
            "fotofobia": _to_bool(s.get("fotofobia")),
            "fonofobia": _to_bool(s.get("fonofobia")),
            "aura": _to_bool(s.get("aura")),
            "tontura": _to_bool(s.get("tontura")),
            "outros": _to_string_array(s.get("outros")),
        },
        "inicio_estimado": _nullable_enum(raw.get("inicio_estimado"), ENUM_INICIO),
        "medicamentos_tomados": _to_string_array(raw.get("medicamentos_tomados")),
        "fatores_desencadeantes": _to_string_array(raw.get("fatores_desencadeantes")),
        "nivel_incapacidade": _nullable_enum(raw.get("nivel_incapacidade"), ENUM_NIVEL),
        "resumo": _nullable_text(raw.get("resumo")),
    }


def fallback_structured() -> dict:
    return sanitize_structured({})


def parse_structured_json(raw: str) -> tuple[dict, bool]:
    """Mesma estratégia de 3 tentativas do app/backend. Retorna (dado, ok)."""
    attempts = [
        lambda: json.loads(raw),
        lambda: json.loads(raw[raw.index("{"): raw.rindex("}") + 1]),
        lambda: json.loads(raw.replace("```json", "").replace("```", "").strip()),
    ]
    for attempt in attempts:
        try:
            return sanitize_structured(attempt()), True
        except Exception:
            continue
    return fallback_structured(), False


# ── Amostragem de CPU/memória durante a geração ────────────────────────────

class ResourceSampler:
    """Poll em thread separada: pico de RSS e média de CPU% durante uma chamada."""

    def __init__(self, proc: psutil.Process, interval: float = 0.05):
        self._proc = proc
        self._interval = interval
        self._stop = threading.Event()
        self._samples_cpu: list[float] = []
        self._peak_rss = 0
        self._thread = threading.Thread(target=self._run, daemon=True)

    def _run(self):
        self._proc.cpu_percent(None)  # prime
        while not self._stop.is_set():
            time.sleep(self._interval)
            self._samples_cpu.append(self._proc.cpu_percent(None))
            rss = self._proc.memory_info().rss
            self._peak_rss = max(self._peak_rss, rss)

    def __enter__(self):
        self._thread.start()
        return self

    def __exit__(self, *exc):
        self._stop.set()
        self._thread.join(timeout=2)

    @property
    def avg_cpu_percent(self) -> float:
        return statistics.mean(self._samples_cpu) if self._samples_cpu else 0.0

    @property
    def peak_rss_mb(self) -> float:
        return self._peak_rss / 1e6


# ── Execução por caso/modelo ────────────────────────────────────────────────

@dataclass
class CaseResult:
    model_id: str
    case_id: str
    latency_s: float
    prompt_tokens: int | None
    completion_tokens: int | None
    tokens_per_sec: float | None
    avg_cpu_percent: float
    peak_rss_mb: float
    json_ok: bool
    scores: dict = field(default_factory=dict)


def run_case(llm, system_prompt: str, case: dict, n_predict: int, temperature: float) -> tuple[CaseResult, dict]:
    proc = psutil.Process()
    with ResourceSampler(proc) as sampler:
        t0 = time.perf_counter()
        resp = llm.create_chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": case["transcript"]},
            ],
            max_tokens=n_predict,
            temperature=temperature,
        )
        latency = time.perf_counter() - t0

    text = resp["choices"][0]["message"]["content"]
    usage = resp.get("usage", {}) or {}
    completion_tokens = usage.get("completion_tokens")

    actual, json_ok = parse_structured_json(text)
    case_scores = scoring.score_case(case["expected"], actual)

    result = CaseResult(
        model_id="",  # preenchido pelo chamador
        case_id=case["id"],
        latency_s=latency,
        prompt_tokens=usage.get("prompt_tokens"),
        completion_tokens=completion_tokens,
        tokens_per_sec=(completion_tokens / latency) if completion_tokens and latency > 0 else None,
        avg_cpu_percent=sampler.avg_cpu_percent,
        peak_rss_mb=sampler.peak_rss_mb,
        json_ok=json_ok,
        scores=case_scores,
    )
    return result, {"raw_text": text, "parsed": actual}


# ── Orquestração ────────────────────────────────────────────────────────────

def load_models_registry() -> list[dict]:
    return yaml.safe_load(MODELS_YAML.read_text(encoding="utf-8"))


def load_cases(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def summarize(model_entry: dict, load_time_s: float, results: list[CaseResult]) -> dict:
    latencies = [r.latency_s for r in results]
    overall_scores = [r.scores["overall"] for r in results]
    tps = [r.tokens_per_sec for r in results if r.tokens_per_sec]
    model_path = MODELS_DIR / model_entry["filename"]
    size_mb = model_path.stat().st_size / 1e6 if model_path.exists() else None

    return {
        "model_id": model_entry["id"],
        "family": model_entry["family"],
        "params_b": model_entry["params_b"],
        "size_mb": round(size_mb, 1) if size_mb else None,
        "load_time_s": round(load_time_s, 2),
        "latency_p50_s": round(statistics.median(latencies), 2),
        "latency_p95_s": round(sorted(latencies)[max(0, int(len(latencies) * 0.95) - 1)], 2),
        "tokens_per_sec_avg": round(statistics.mean(tps), 1) if tps else None,
        "cpu_percent_avg": round(statistics.mean(r.avg_cpu_percent for r in results), 1),
        "peak_rss_mb_avg": round(statistics.mean(r.peak_rss_mb for r in results), 1),
        "json_valid_rate": round(sum(r.json_ok for r in results) / len(results), 2),
        "accuracy_overall": round(statistics.mean(overall_scores), 3),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--models", help="IDs separados por vírgula (default: todos em models.yaml)")
    parser.add_argument("--cases", default=str(HERE / "cases.jsonl"))
    parser.add_argument("--threads", type=int, default=4, help="n_threads do llama.cpp (default 4, perto de um celular)")
    parser.add_argument("--ctx", type=int, default=2048)
    parser.add_argument("--n-predict", type=int, default=512)
    parser.add_argument("--temperature", type=float, default=0.1)
    parser.add_argument("--download", action="store_true", help="baixa modelos que faltam antes de rodar")
    parser.add_argument("--download-only", action="store_true")
    args = parser.parse_args()

    registry = load_models_registry()
    if args.models:
        wanted = set(args.models.split(","))
        registry = [m for m in registry if m["id"] in wanted]

    if args.download or args.download_only:
        print("Baixando modelos...")
        for entry in registry:
            download_model(entry)
        if args.download_only:
            return

    missing = [m["id"] for m in registry if not (MODELS_DIR / m["filename"]).exists()]
    if missing:
        raise SystemExit(f"Modelos não baixados: {missing}. Rode com --download primeiro.")

    from llama_cpp import Llama  # import tardio: só exige a dependência pesada na hora de rodar

    system_prompt = SYSTEM_PROMPT_FILE.read_text(encoding="utf-8")
    cases = load_cases(Path(args.cases))

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    stamp = time.strftime("%Y%m%d-%H%M%S")
    raw_path = RESULTS_DIR / f"raw_{stamp}.jsonl"
    summary_path = RESULTS_DIR / f"summary_{stamp}.csv"

    summaries = []
    with open(raw_path, "w", encoding="utf-8") as raw_f:
        for entry in registry:
            print(f"\n=== {entry['label']} ===")
            model_path = MODELS_DIR / entry["filename"]

            t0 = time.perf_counter()
            llm = Llama(
                model_path=str(model_path),
                n_ctx=args.ctx,
                n_threads=args.threads,
                verbose=False,
            )
            load_time_s = time.perf_counter() - t0
            print(f"  carregado em {load_time_s:.1f}s")

            case_results: list[CaseResult] = []
            for case in cases:
                result, debug = run_case(llm, system_prompt, case, args.n_predict, args.temperature)
                result.model_id = entry["id"]
                case_results.append(result)
                raw_f.write(json.dumps({
                    "model_id": entry["id"],
                    "case_id": case["id"],
                    "latency_s": result.latency_s,
                    "tokens_per_sec": result.tokens_per_sec,
                    "avg_cpu_percent": result.avg_cpu_percent,
                    "peak_rss_mb": result.peak_rss_mb,
                    "json_ok": result.json_ok,
                    "scores": result.scores,
                    "raw_text": debug["raw_text"],
                    "parsed": debug["parsed"],
                }, ensure_ascii=False) + "\n")
                mark = "ok" if result.json_ok else "FALHA-JSON"
                print(f"    [{case['id']}] {result.latency_s:.2f}s score={result.scores['overall']:.2f} {mark}")

            llm.close() if hasattr(llm, "close") else None
            del llm

            summaries.append(summarize(entry, load_time_s, case_results))

    with open(summary_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(summaries[0].keys()))
        writer.writeheader()
        writer.writerows(summaries)

    summaries.sort(key=lambda s: s["accuracy_overall"], reverse=True)
    print("\n" + tabulate(summaries, headers="keys", tablefmt="github"))
    print(f"\nResultados brutos: {raw_path}")
    print(f"Resumo: {summary_path}")
    print("\nLembrete: estes números são de notebook x86 (CPU/latência não equivalem a celular ARM).")
    print("Revalide o(s) finalista(s) em aparelho real antes de decidir o que embarcar.")


if __name__ == "__main__":
    main()
