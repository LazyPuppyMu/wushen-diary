from collections.abc import Mapping, Sequence

from app.schemas.organize import EntryInput, Evidence


class EvidenceValidationError(ValueError):
    """Raised when model evidence cannot be tied to a submitted entry."""


def validate_evidence(
    entries: Sequence[EntryInput], raw_evidence: Mapping[str, object]
) -> Evidence:
    """Build trusted evidence offsets from the submitted entry content."""
    entry_id = raw_evidence.get("entry_id")
    if not isinstance(entry_id, str) or not entry_id:
        raise EvidenceValidationError("entry_id must be a non-empty string")

    submitted_entry = next((entry for entry in entries if entry.id == entry_id), None)
    if submitted_entry is None:
        raise EvidenceValidationError(f"entry_id '{entry_id}' was not submitted")

    quote = raw_evidence.get("quote")
    if not isinstance(quote, str) or not quote:
        raise EvidenceValidationError("quote must be a non-empty string")

    start = submitted_entry.content.find(quote)
    if start < 0:
        raise EvidenceValidationError(f"quote was not found in entry '{entry_id}'")

    return Evidence(
        entry_id=entry_id,
        quote=quote,
        start=start,
        end=start + len(quote),
    )
