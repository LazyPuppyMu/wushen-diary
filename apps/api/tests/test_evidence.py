import pytest

from app.schemas.organize import EntryInput, Evidence
from app.validators.evidence import EvidenceValidationError, validate_evidence


def _entry(content: str, entry_id: str = "e1") -> EntryInput:
    return EntryInput(id=entry_id, date="2026-09-28", content=content)


def test_validate_evidence_calculates_positions_from_entry_content() -> None:
    entries = [_entry("今天去散步了，心情轻松一些。")]

    result = validate_evidence(
        entries,
        [{"entry_id": "e1", "quote": "心情轻松一些。", "start": 999, "end": 1000}],
    )

    assert result == [
        Evidence(entry_id="e1", quote="心情轻松一些。", start=7, end=14)
    ]


def test_validate_evidence_uses_first_occurrence_for_repeated_quote() -> None:
    entries = [_entry("重复，内容。重复，内容。")]

    result = validate_evidence(
        entries, [{"entry_id": "e1", "quote": "重复，内容。"}]
    )

    assert result[0].start == 0
    assert result[0].end == len("重复，内容。")


@pytest.mark.parametrize(
    ("evidence", "message"),
    [
        ({"entry_id": "missing", "quote": "内容"}, "entry_id"),
        ({"entry_id": ["e1"], "quote": "内容"}, "entry_id"),
        ({"entry_id": "e1", "quote": ""}, "non-empty string"),
        ({"entry_id": "e1", "quote": None}, "non-empty string"),
        ({"entry_id": "e1", "quote": "不存在"}, "not found"),
    ],
)
def test_validate_evidence_rejects_invalid_references(
    evidence: dict[str, str], message: str
) -> None:
    with pytest.raises(EvidenceValidationError, match=message):
        validate_evidence([_entry("可验证的内容")], [evidence])
