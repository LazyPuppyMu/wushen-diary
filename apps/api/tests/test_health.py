from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_organize_is_explicitly_unavailable_until_ai_is_configured(
    monkeypatch,
) -> None:
    monkeypatch.delenv("DASHSCOPE_API_KEY", raising=False)
    response = client.post(
        "/v1/organize",
        json={"entries": [{"id": "e1", "date": "2026-09-28", "content": "今天去散步了。"}]},
    )

    assert response.status_code == 503
