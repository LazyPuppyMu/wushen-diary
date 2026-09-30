import json

import httpx
import pytest

from app.services.qwen import (
    QwenClient,
    QwenConfigurationError,
    QwenSettings,
    QwenTimeoutError,
    QwenUpstreamError,
)


def test_qwen_settings_read_from_environment(monkeypatch) -> None:
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")
    monkeypatch.setenv("QWEN_MODEL", "qwen-test")
    monkeypatch.setenv("QWEN_TIMEOUT_SECONDS", "12.5")

    settings = QwenSettings.from_env()

    assert settings == QwenSettings(
        api_key="test-key",
        model="qwen-test",
        timeout_seconds=12.5,
    )


def test_qwen_settings_reject_invalid_timeout(monkeypatch) -> None:
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")
    monkeypatch.setenv("QWEN_TIMEOUT_SECONDS", "nope")

    with pytest.raises(QwenConfigurationError, match="positive number"):
        QwenSettings.from_env()


@pytest.mark.parametrize("timeout", ["nan", "inf", "-inf"])
def test_qwen_settings_reject_non_finite_timeout(monkeypatch, timeout: str) -> None:
    monkeypatch.setenv("DASHSCOPE_API_KEY", "test-key")
    monkeypatch.setenv("QWEN_TIMEOUT_SECONDS", timeout)

    with pytest.raises(QwenConfigurationError, match="positive number"):
        QwenSettings.from_env()


@pytest.mark.anyio
async def test_qwen_client_sends_configured_request_and_returns_content() -> None:
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        return httpx.Response(
            200,
            json={"choices": [{"message": {"content": '{"items": []}'}}]},
            request=request,
        )

    client = QwenClient(
        QwenSettings(api_key="test-key", model="qwen-test", timeout_seconds=2),
        transport=httpx.MockTransport(handler),
    )

    result = await client.complete("system", "user")

    assert result == '{"items": []}'
    assert len(requests) == 1
    assert requests[0].headers["authorization"] == "Bearer test-key"
    payload = json.loads(requests[0].content)
    assert payload["model"] == "qwen-test"
    assert payload["messages"] == [
        {"role": "system", "content": "system"},
        {"role": "user", "content": "user"},
    ]


@pytest.mark.anyio
async def test_qwen_client_maps_timeout_without_exposing_response_data() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ReadTimeout("timed out", request=request)

    client = QwenClient(
        QwenSettings(api_key="test-key"),
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(QwenTimeoutError, match="timed out"):
        await client.complete("system", "user")


@pytest.mark.anyio
async def test_qwen_client_rejects_malformed_provider_response() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json={"choices": []}, request=request)

    client = QwenClient(
        QwenSettings(api_key="test-key"),
        transport=httpx.MockTransport(handler),
    )

    with pytest.raises(QwenUpstreamError, match="message content"):
        await client.complete("system", "user")
