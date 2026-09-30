import json

from fastapi.testclient import TestClient

from app.main import app
from app.routes import organize as organize_route
from app.services.qwen import QwenTimeoutError


client = TestClient(app)


class FakeClient:
    def __init__(self, response: str | Exception) -> None:
        self.response = response

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        del system_prompt, user_prompt
        if isinstance(self.response, Exception):
            raise self.response
        return self.response


def _request() -> dict[str, object]:
    return {
        "consent": True,
        "entries": [
            {
                "id": "e1",
                "date": "2026-09-28",
                "content": "今天去散步了，心情轻松一些。",
            }
        ]
    }


def _ai_response(quote: str = "心情轻松一些。") -> str:
    return json.dumps(
        {
            "items": [
                {
                    "category": "joy",
                    "type": "fact",
                    "text": "散步后感到轻松。",
                    "confidence": "high",
                    "evidence": [
                        {
                            "entry_id": "e1",
                            "quote": quote,
                        }
                    ],
                }
            ]
        },
        ensure_ascii=False,
    )


def test_organize_returns_validated_ai_result(monkeypatch) -> None:
    monkeypatch.setattr(
        organize_route,
        "get_qwen_client",
        lambda: FakeClient(_ai_response()),
    )

    response = client.post("/v1/organize", json=_request())

    assert response.status_code == 200
    assert response.json()["items"][0]["evidence"] == [
        {
            "entry_id": "e1",
            "quote": "心情轻松一些。",
            "start": 7,
            "end": 14,
        }
    ]


def test_organize_rejects_invalid_quote(monkeypatch) -> None:
    monkeypatch.setattr(
        organize_route,
        "get_qwen_client",
        lambda: FakeClient(_ai_response("AI 编造的内容")),
    )

    response = client.post("/v1/organize", json=_request())

    assert response.status_code == 502
    assert response.json() == {
        "detail": "AI organization returned an unusable result"
    }


def test_organize_rejects_invalid_json(monkeypatch) -> None:
    monkeypatch.setattr(
        organize_route,
        "get_qwen_client",
        lambda: FakeClient("not-json"),
    )

    response = client.post("/v1/organize", json=_request())

    assert response.status_code == 502


def test_organize_maps_timeout(monkeypatch) -> None:
    monkeypatch.setattr(
        organize_route,
        "get_qwen_client",
        lambda: FakeClient(QwenTimeoutError("timed out")),
    )

    response = client.post("/v1/organize", json=_request())

    assert response.status_code == 504
    assert response.json() == {"detail": "AI organization timed out"}


def test_organize_rejects_empty_entries() -> None:
    response = client.post(
        "/v1/organize", json={"consent": True, "entries": []}
    )

    assert response.status_code == 422


def test_organize_rejects_entry_content_over_limit() -> None:
    request = _request()
    request["entries"][0]["content"] = "x" * 10001

    response = client.post("/v1/organize", json=request)

    assert response.status_code == 422


def test_organize_requires_explicit_consent() -> None:
    request = _request()
    del request["consent"]

    response = client.post("/v1/organize", json=request)

    assert response.status_code == 422


def test_organize_rejects_false_consent() -> None:
    request = _request()
    request["consent"] = False

    response = client.post("/v1/organize", json=request)

    assert response.status_code == 422


def test_organize_rejects_non_boolean_consent() -> None:
    for value in (1, "true"):
        request = _request()
        request["consent"] = value

        response = client.post("/v1/organize", json=request)

        assert response.status_code == 422


def test_organize_rejects_extra_ai_evidence_fields(monkeypatch) -> None:
    payload = json.loads(_ai_response())
    payload["items"][0]["evidence"][0]["start"] = 0
    monkeypatch.setattr(
        organize_route,
        "get_qwen_client",
        lambda: FakeClient(json.dumps(payload)),
    )

    response = client.post("/v1/organize", json=_request())

    assert response.status_code == 502


def test_organize_rejects_extra_ai_response_fields(monkeypatch) -> None:
    payload = json.loads(_ai_response())
    payload["unexpected"] = True
    monkeypatch.setattr(
        organize_route,
        "get_qwen_client",
        lambda: FakeClient(json.dumps(payload)),
    )

    response = client.post("/v1/organize", json=_request())

    assert response.status_code == 502


def test_organize_rejects_blank_entry_content() -> None:
    request = _request()
    request["entries"] = [
        {
            "id": "e1",
            "date": "2026-09-28",
            "content": "   \n\t",
        }
    ]

    response = client.post("/v1/organize", json=request)

    assert response.status_code == 422
