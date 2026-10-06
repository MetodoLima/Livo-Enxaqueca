"""Compara a saída estruturada de um modelo com o gabarito sintético de cases.jsonl.

Mesma política de "não invente" usada em services/onDeviceLlm.ts: campos nulos/vazios
no gabarito representam informação que não estava no relato, então o modelo deveria
também deixá-los nulos/vazios. Um modelo que "alucina" valores é penalizado tanto
quanto um que erra o valor certo.
"""
from __future__ import annotations

STRICT_FIELDS = [
    "intensidade_dor",
    "localizacao",
    "lado",
    "inicio_estimado",
    "nivel_incapacidade",
]

BOOL_FIELDS = ["nausea", "vomito", "fotofobia", "fonofobia", "aura", "tontura"]

LIST_FIELDS = ["qualidade_dor", "medicamentos_tomados", "fatores_desencadeantes"]


def _normalize_text(s: str) -> str:
    return s.strip().lower()


def _score_strict(expected, actual) -> float:
    return 1.0 if expected == actual else 0.0


def _score_list(expected: list[str], actual) -> float:
    """F1 por palavra-chave: cada item esperado "bate" se aparece como substring
    em algum item da lista obtida (e vice-versa para penalizar itens inventados)."""
    if not isinstance(actual, list):
        actual = []
    actual_norm = [_normalize_text(str(x)) for x in actual]
    expected_norm = [_normalize_text(str(x)) for x in expected]

    if not expected_norm and not actual_norm:
        return 1.0
    if not expected_norm:
        return 0.0  # modelo inventou itens que não deveriam existir
    if not actual_norm:
        return 0.0  # modelo deixou de citar itens que estavam no relato

    hits_recall = sum(1 for e in expected_norm if any(e in a or a in e for a in actual_norm))
    hits_precision = sum(1 for a in actual_norm if any(e in a or a in e for e in expected_norm))

    recall = hits_recall / len(expected_norm)
    precision = hits_precision / len(actual_norm)
    if precision + recall == 0:
        return 0.0
    return 2 * precision * recall / (precision + recall)


def score_case(expected: dict, actual: dict) -> dict:
    """Retorna {field: score 0..1} para um caso, mais a média geral em "overall"."""
    scores: dict[str, float] = {}

    for field in STRICT_FIELDS:
        scores[field] = _score_strict(expected.get(field), actual.get(field))

    exp_sint = expected.get("sintomas_associados", {}) or {}
    act_sint = actual.get("sintomas_associados", {}) or {}
    for field in BOOL_FIELDS:
        scores[f"sintomas.{field}"] = _score_strict(
            bool(exp_sint.get(field, False)), bool(act_sint.get(field, False))
        )
    scores["sintomas.outros"] = _score_list(exp_sint.get("outros", []), act_sint.get("outros", []))

    for field in LIST_FIELDS:
        scores[field] = _score_list(expected.get(field, []), actual.get(field, []))

    # resumo é texto livre: não entra na nota, só fica registrado para leitura humana.
    scores["overall"] = sum(v for k, v in scores.items() if k != "overall") / len(scores)
    return scores
