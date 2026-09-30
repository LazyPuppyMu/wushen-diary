from collections.abc import Mapping, Sequence
from typing import Any, overload

from app.schemas.organize import EntryInput, Evidence


class EvidenceValidationError(ValueError):
    """Raised when an AI-provided evidence item cannot be verified."""


@overload
def validate_evidence(
    entries: Sequence[EntryInput], evidence: Mapping[str, Any]
) -> Evidence: ...


@overload
def validate_evidence(
    entries: Sequence[EntryInput], evidence: Sequence[Evidence | Mapping[str, Any]]
) -> list[Evidence]: ...


def validate_evidence(
    entries: Sequence[EntryInput],
    evidence: Mapping[str, Any] | Sequence[Evidence | Mapping[str, Any]],
) -> Evidence | list[Evidence]:
    """Calculate trusted evidence offsets from submitted entry content.

    A single mapping is supported for the original validator API. Model
    conclusions use a sequence and receive one validated model per item.
    Any supplied ``start`` or ``end`` values are ignored.
    """

    is_single = isinstance(evidence, Mapping)
    items = [evidence] if is_single else evidence
    entries_by_id = {entry.id: entry for entry in entries}
    validated: list[Evidence] = []

    for index, item in enumerate(items):
        entry_id, quote = _read_evidence_item(item, index)

        if not isinstance(entry_id, str) or entry_id not in entries_by_id:
            raise EvidenceValidationError(
                f"evidence[{index}]: entry_id {entry_id!r} was not submitted"
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

    return validated[0] if is_single else validated


def _read_evidence_item(
    item: Evidence | Mapping[str, Any], index: int
) -> tuple[Any, Any]:
    if isinstance(item, Evidence):
        return item.entry_id, item.quote

    if isinstance(item, Mapping):
        return item.get("entry_id"), item.get("quote")

    raise EvidenceValidationError(
        f"evidence[{index}]: expected an Evidence object or mapping"
    )
