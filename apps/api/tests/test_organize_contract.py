import pytest
from pydantic import ValidationError
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.organize import OrganizeRequest, OrganizeResponse

client = TestClient(app)


def valid_request() -> dict[str, object]:
    return {
        "consent": True,
        "entries": [
            {
                "id": "entry-1",
                "date": "2026-09-28",
                "content": "今天去散步了，心情轻松一些。",
            }
        ],
    }


@pytest.mark.parametrize(
    "request_body",
    [
        {"entries": [{"id": "entry-1", "date": "2026-09-28", "content": "虚构记录。"}]},
        {
            "consent": False,
            "entries": [{"id": "entry-1", "date": "2026-09-28", "content": "虚构记录。"}],
        },
    ],
)
def test_organize_rejects_missing_or_false_consent(request_body: dict[str, object]) -> None:
    with pytest.raises(ValidationError):
        OrganizeRequest.model_validate(request_body)

    response = client.post("/v1/organize", json=request_body)
    assert response.status_code == 422


def test_organize_request_accepts_valid_contract_shape() -> None:
    request_body = valid_request()
    request_body["entries"][0]["content"] = "  今天去散步了，心情轻松一些。 \n"
    request = OrganizeRequest.model_validate(request_body)

    assert request.consent is True
    assert request.entries[0].date.isoformat() == "2026-09-28"
    assert request.entries[0].content == "  今天去散步了，心情轻松一些。 \n"


@pytest.mark.parametrize(
    "entry",
    [
        {"id": "entry-1", "date": "2026-02-30", "content": "虚构记录。"},
        {"id": "entry-1", "date": "2026-09-28T12:00:00", "content": "虚构记录。"},
        {"id": "entry-1", "date": "2026-09-28", "content": " \t\n "},
        {"id": "", "date": "2026-09-28", "content": "虚构记录。"},
        {"id": "x" * 101, "date": "2026-09-28", "content": "虚构记录。"},
        {"id": "entry-1", "date": "2026-09-28", "content": "x" * 10001},
    ],
)
def test_organize_request_rejects_invalid_entry_boundaries(
    entry: dict[str, str],
) -> None:
    with pytest.raises(ValidationError):
        OrganizeRequest.model_validate({"consent": True, "entries": [entry]})


def test_organize_request_enforces_selected_entry_count() -> None:
    request_body = valid_request()
    request_body["entries"] = []

    with pytest.raises(ValidationError):
        OrganizeRequest.model_validate(request_body)

    request_body["entries"] = [
        {"id": f"entry-{index}", "date": "2026-09-28", "content": "虚构记录。"}
        for index in range(21)
    ]
    with pytest.raises(ValidationError):
        OrganizeRequest.model_validate(request_body)


def test_organize_response_matches_contract_shape() -> None:
    response_body = {
        "items": [
            {
                "category": "joy",
                "type": "fact",
                "text": "散步后感到轻松。",
                "confidence": "high",
                "evidence": [
                    {
                        "entry_id": "entry-1",
                        "quote": "心情轻松一些。",
                        "start": 7,
                        "end": 14,
                    }
                ],
            }
        ]
    }

    response = OrganizeResponse.model_validate(response_body)
    assert response.model_dump(mode="json") == response_body
    assert OrganizeResponse.model_validate({"items": []}).items == []


def test_openapi_documents_organize_request_and_response_constraints() -> None:
    openapi = app.openapi()
    operation = openapi["paths"]["/v1/organize"]["post"]
    schemas = openapi["components"]["schemas"]
    request_schema = schemas["OrganizeRequest"]
    entry_schema = schemas["EntryInput"]
    response_schema = schemas["OrganizeResponse"]
    conclusion_schema = schemas["Conclusion"]
    evidence_schema = schemas["Evidence"]
    enum_schemas = {
        name: schema["enum"]
        for name, schema in schemas.items()
        if name in {"Category", "ConclusionType", "Confidence"}
    }

    assert operation["requestBody"]["required"] is True
    assert operation["requestBody"]["content"]["application/json"]["schema"][
        "$ref"
    ].endswith("/OrganizeRequest")
    assert operation["responses"]["200"]["content"]["application/json"]["schema"][
        "$ref"
    ].endswith("/OrganizeResponse")
    assert set(request_schema["required"]) == {"consent", "entries"}
    assert request_schema["properties"]["consent"]["const"] is True
    entries_schema = request_schema["properties"]["entries"]
    assert entries_schema["minItems"] == 1
    assert entries_schema["maxItems"] == 20
    assert entries_schema["items"]["$ref"].endswith("/EntryInput")

    assert entry_schema["properties"]["date"]["format"] == "date"
    assert entry_schema["properties"]["id"]["minLength"] == 1
    assert entry_schema["properties"]["id"]["maxLength"] == 100
    assert entry_schema["properties"]["content"]["minLength"] == 1
    assert entry_schema["properties"]["content"]["maxLength"] == 10000
    assert "non-whitespace character" in entry_schema["properties"]["content"][
        "description"
    ]

    assert set(response_schema["required"]) == {"items"}
    assert response_schema["properties"]["items"]["items"]["$ref"].endswith(
        "/Conclusion"
    )
    assert set(conclusion_schema["required"]) == {
        "category",
        "type",
        "text",
        "confidence",
        "evidence",
    }
    assert conclusion_schema["properties"]["text"]["minLength"] == 1
    assert conclusion_schema["properties"]["text"]["maxLength"] == 500
    assert conclusion_schema["properties"]["evidence"]["minItems"] == 1
    assert enum_schemas == {
        "Category": [
            "joy",
            "fulfillment",
            "reflection",
            "improvement",
            "gratitude",
            "weight",
            "murmur",
        ],
        "ConclusionType": ["fact", "inference"],
        "Confidence": ["high", "medium", "low", "insufficient"],
    }
    assert evidence_schema["properties"]["entry_id"]["minLength"] == 1
    assert evidence_schema["properties"]["entry_id"]["maxLength"] == 100
    assert evidence_schema["properties"]["quote"]["minLength"] == 1
    assert evidence_schema["properties"]["start"]["minimum"] == 0
    assert evidence_schema["properties"]["end"]["minimum"] == 1
