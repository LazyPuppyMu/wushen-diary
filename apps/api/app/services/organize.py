from __future__ import annotations

import json
from collections.abc import Sequence
from typing import Protocol

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.schemas.organize import (
    Category,
    Conclusion,
    ConclusionType,
    Confidence,
    EntryInput,
    OrganizeResponse,
)
from app.validators.evidence import EvidenceValidationError, validate_evidence


class CompletionClient(Protocol):
    async def complete(self, system_prompt: str, user_prompt: str) -> str: ...


class AIResponseError(ValueError):
    """Raised when the model output cannot become a valid API response."""


class _AIEvidence(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entry_id: str
    quote: str


class _AIConclusion(BaseModel):
    model_config = ConfigDict(extra="forbid")

    category: Category
    type: ConclusionType
    text: str = Field(min_length=1, max_length=500)
    confidence: Confidence
    evidence: list[_AIEvidence] = Field(min_length=1)


class _AIResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    items: list[_AIConclusion]


SYSTEM_PROMPT = """你是吾身日记整理服务。只输出一个 JSON 对象，不要输出 Markdown 或解释。
JSON 顶层必须是 {\"items\": [...]}。每个 item 必须包含 category、type、text、confidence 和 evidence。
category 只能是 joy、fulfillment、reflection、improvement、gratitude、weight、murmur。
type 只能是 fact 或 inference；confidence 只能是 high、medium、low、insufficient。
每条 evidence 只能提供 entry_id 和 quote，不要提供 start 或 end。quote 必须逐字摘自对应日记。
没有原文证据的结论不要生成。计划不能写成已完成，负面内容不要强行改写成正面。"""


def build_user_prompt(entries: Sequence[EntryInput]) -> str:
    lines = ["请整理以下用户选中的日记，并严格返回 JSON："]
    for entry in entries:
        lines.append(f"\nentry_id: {entry.id}\ndate: {entry.date.isoformat()}\ncontent:\n{entry.content}")
    return "".join(lines)


def parse_ai_response(raw: str, entries: Sequence[EntryInput]) -> OrganizeResponse:
    try:
        payload = json.loads(raw)
    except (TypeError, json.JSONDecodeError) as exc:
        raise AIResponseError("AI returned invalid JSON") from exc

    try:
        parsed = _AIResponse.model_validate(payload)
    except ValidationError as exc:
        raise AIResponseError("AI returned an invalid organize response") from exc

    conclusions: list[Conclusion] = []
    for item in parsed.items:
        raw_evidence = [
            {"entry_id": evidence.entry_id, "quote": evidence.quote}
            for evidence in item.evidence
        ]
        try:
            evidence = validate_evidence(entries, raw_evidence)
        except EvidenceValidationError as exc:
            raise AIResponseError("AI returned invalid evidence") from exc
        conclusions.append(
            Conclusion(
                category=item.category,
                type=item.type,
                text=item.text,
                confidence=item.confidence,
                evidence=evidence,
            )
        )

    return OrganizeResponse(items=conclusions)


class OrganizeService:
    def __init__(self, client: CompletionClient) -> None:
        self.client = client

    async def organize(self, entries: Sequence[EntryInput]) -> OrganizeResponse:
        raw = await self.client.complete(
            SYSTEM_PROMPT,
            build_user_prompt(entries),
        )
        return parse_ai_response(raw, entries)
