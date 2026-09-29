from collections.abc import Mapping, Sequence
from typing import Any

from app.schemas.organize import EntryInput, Evidence


class EvidenceValidationError(ValueError):
    """Raised when an AI-provided evidence item cannot be verified."""


def validate_evidence(
    entries: Sequence[EntryInput],
    evidence: Sequence[Evidence | Mapping[str, Any]],
) -> list[Evidence]:
    """Validate AI evidence against the entries submitted for this request.

    The returned models always contain positions calculated from the submitted
    entry content. Any ``start`` or ``end`` values supplied by the AI are
    ignored.
    """

    entries_by_id = {entry.id: entry for entry in entries}
    validated: list[Evidence] = []

    for index, item in enumerate(evidence):
        entry_id, quote = _read_evidence_item(item, index)

        if not isinstance(entry_id, str) or entry_id not in entries_by_id:
            raise EvidenceValidationError(
                f"evidence[{index}]: entry_id {entry_id!r} does not match a submitted entry"
            )

        if not isinstance(quote, str) or not quote:
            raise EvidenceValidationError(
                f"evidence[{index}]: quote must be a non-empty string"
            )

        content = entries_by_id[entry_id].content
        start = content.find(quote)
        if start == -1:
            raise EvidenceValidationError(
                f"evidence[{index}]: quote was not found in entry {entry_id!r}"
            )

        validated.append(
            Evidence(
                entry_id=entry_id,
                quote=quote,
                start=start,
                end=start + len(quote),
            )
        )

    return validated


def _read_evidence_item(item: Evidence | Mapping[str, Any], index: int) -> tuple[Any, Any]:
    if isinstance(item, Evidence):
        return item.entry_id, item.quote

    if isinstance(item, Mapping):
        return item.get("entry_id"), item.get("quote")

    raise EvidenceValidationError(
        f"evidence[{index}]: expected an Evidence object or mapping"
    )
