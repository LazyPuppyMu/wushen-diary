"""Check fictional evaluation assets against the current API without model calls."""

import json
import sys
from pathlib import Path

from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "apps" / "api"))

from app.schemas.organize import OrganizeRequest  # noqa: E402
from app.services.organize import AIResponseError, parse_ai_response  # noqa: E402


def check_case(case: dict) -> None:
    case_id = case["id"]
    expected = case["expected"]
    behavior = expected["behavior"]
    payload = {"consent": True, "entries": case["entries"]}
    if behavior == "reject_input":
        try:
            OrganizeRequest.model_validate(payload)
        except ValidationError:
            return
        raise AssertionError(f"{case_id}: invalid input was accepted")

    request = OrganizeRequest.model_validate(payload)
    if behavior in {"reject_evidence", "reject_model_output"}:
        raw = json.dumps(case["raw_model_output"], ensure_ascii=False)
        try:
            parse_ai_response(raw, request.entries)
        except AIResponseError:
            return
        raise AssertionError(f"{case_id}: invalid output was accepted")

    assert behavior in {"emit", "emit_empty_items"}, f"{case_id}: unknown behavior"
    items = expected["items"]
    assert bool(items) == (behavior == "emit"), f"{case_id}: unexpected item count"
    # Reference items must obey the model contract before server offsets exist.
    for item in items:
        for evidence in item["evidence"]:
            assert set(evidence) == {"entry_id", "quote"}, f"{case_id}: model evidence fields"
    response = parse_ai_response(json.dumps({"items": items}, ensure_ascii=False), request.entries)
    entries_by_id = {entry.id: entry for entry in request.entries}
    actual_ranges = []
    for item in response.items:
        for evidence in item.evidence:
            content = entries_by_id[evidence.entry_id].content
            assert evidence.start == content.find(evidence.quote), f"{case_id}: not the first occurrence"
            assert evidence.end == evidence.start + len(evidence.quote), f"{case_id}: wrong quote length"
            assert content[evidence.start:evidence.end] == evidence.quote, f"{case_id}: wrong range"
            actual_ranges.append(evidence.model_dump())
    if "evidence_ranges" in expected:
        assert actual_ranges == expected["evidence_ranges"], f"{case_id}: wrong expected ranges"
    assert request.model_dump(mode="json")["entries"] == case["entries"], f"{case_id}: changed text"


def main() -> None:
    assets = ROOT / "eval"
    cases = json.loads((assets / "cases.json").read_text(encoding="utf-8"))["cases"]
    assert len(cases) >= 10, "At least 10 fictional cases are required"
    case_ids = [case["id"] for case in cases]
    assert len(case_ids) == len(set(case_ids)), "Duplicate case IDs"
    for case in cases:
        check_case(case)

    demo = json.loads((assets / "demo-entries.json").read_text(encoding="utf-8"))
    entries = demo["entries"]
    request = OrganizeRequest.model_validate({"consent": True, "entries": entries})
    assert len(entries) == 3, "Three demo entries are required"
    assert len({entry.id for entry in request.entries}) == len(entries), "Duplicate demo IDs"
    assert request.model_dump(mode="json")["entries"] == entries, "Changed demo text"
    print(f"Offline assets: {len(cases)} cases and {len(entries)} fictional demo entries passed. No Qwen calls.")


if __name__ == "__main__":
    main()
