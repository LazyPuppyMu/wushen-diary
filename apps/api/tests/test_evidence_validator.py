from datetime import date

import pytest

from app.schemas.organize import EntryInput, Evidence
from app.validators.evidence import EvidenceValidationError, validate_evidence


def entry(entry_id: str, content: str) -> EntryInput:
    return EntryInput(id=entry_id, date=date(2026, 9, 28), content=content)


def test_validate_evidence_calculates_position_from_submitted_entry() -> None:
    entries = [entry("e1", "今天去散步了，心情轻松一些。")]
    raw_evidence = {"entry_id": "e1", "quote": "心情轻松一些。"}

    result = validate_evidence(entries, raw_evidence)

    assert result == Evidence(entry_id="e1", quote="心情轻松一些。", start=7, end=14)
    assert raw_evidence == {"entry_id": "e1", "quote": "心情轻松一些。"}


def test_validate_evidence_rejects_quote_that_is_not_in_entry() -> None:
    entries = [entry("e1", "今天去散步了。")]

    with pytest.raises(EvidenceValidationError, match="quote was not found"):
        validate_evidence(entries, {"entry_id": "e1", "quote": "心情轻松一些。"})


def test_validate_evidence_rejects_entry_id_that_is_not_submitted() -> None:
    entries = [entry("e1", "今天去散步了。")]

    with pytest.raises(EvidenceValidationError, match="entry_id 'missing' was not submitted"):
        validate_evidence(entries, {"entry_id": "missing", "quote": "今天去散步了。"})


def test_validate_evidence_rejects_empty_quote() -> None:
    entries = [entry("e1", "今天去散步了。")]

    with pytest.raises(EvidenceValidationError, match="quote must be a non-empty string"):
        validate_evidence(entries, {"entry_id": "e1", "quote": ""})


def test_validate_evidence_uses_first_position_for_repeated_quote() -> None:
    entries = [entry("e1", "好消息：今天有好消息。")]

    result = validate_evidence(entries, {"entry_id": "e1", "quote": "好消息"})

    assert result.start == 0
    assert result.end == len("好消息")
