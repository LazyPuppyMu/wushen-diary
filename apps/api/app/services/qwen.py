from __future__ import annotations

import math
import os
from dataclasses import dataclass
from typing import Any

import httpx


DEFAULT_QWEN_MODEL = "qwen-plus"
DEFAULT_QWEN_TIMEOUT_SECONDS = 30.0
QWEN_CHAT_COMPLETIONS_URL = (
    "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"
)


class QwenConfigurationError(RuntimeError):
    """Raised when the Qwen client is not configured for this process."""


class QwenTimeoutError(RuntimeError):
    """Raised when the Qwen request exceeds its configured timeout."""


class QwenUpstreamError(RuntimeError):
    """Raised when Qwen cannot provide a usable completion."""


@dataclass(frozen=True)
class QwenSettings:
    api_key: str
    model: str = DEFAULT_QWEN_MODEL
    timeout_seconds: float = DEFAULT_QWEN_TIMEOUT_SECONDS

    @classmethod
    def from_env(cls) -> QwenSettings:
        api_key = os.getenv("DASHSCOPE_API_KEY", "").strip()
        if not api_key:
            raise QwenConfigurationError("DASHSCOPE_API_KEY is not configured")

        model = os.getenv("QWEN_MODEL", DEFAULT_QWEN_MODEL).strip()
        if not model:
            raise QwenConfigurationError("QWEN_MODEL must not be empty")

        raw_timeout = os.getenv(
            "QWEN_TIMEOUT_SECONDS", str(DEFAULT_QWEN_TIMEOUT_SECONDS)
        ).strip()
        try:
            timeout_seconds = float(raw_timeout)
        except ValueError as exc:
            raise QwenConfigurationError(
                "QWEN_TIMEOUT_SECONDS must be a positive number"
            ) from exc
        if not math.isfinite(timeout_seconds) or timeout_seconds <= 0:
            raise QwenConfigurationError(
                "QWEN_TIMEOUT_SECONDS must be a positive number"
            )

        return cls(api_key=api_key, model=model, timeout_seconds=timeout_seconds)


class QwenClient:
    def __init__(
        self,
        settings: QwenSettings,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
        endpoint: str = QWEN_CHAT_COMPLETIONS_URL,
    ) -> None:
        self.settings = settings
        self.transport = transport
        self.endpoint = endpoint

    @classmethod
    def from_env(
        cls,
        *,
        transport: httpx.AsyncBaseTransport | None = None,
    ) -> QwenClient:
        return cls(QwenSettings.from_env(), transport=transport)

    async def complete(self, system_prompt: str, user_prompt: str) -> str:
        payload = {
            "model": self.settings.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
        }
        headers = {
            "Authorization": f"Bearer {self.settings.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(
                timeout=self.settings.timeout_seconds,
                transport=self.transport,
            ) as client:
                response = await client.post(
                    self.endpoint,
                    headers=headers,
                    json=payload,
                )
        except httpx.TimeoutException as exc:
            raise QwenTimeoutError("Qwen request timed out") from exc
        except httpx.HTTPError as exc:
            raise QwenUpstreamError("Qwen request failed") from exc

        if response.is_error:
            raise QwenUpstreamError(
                f"Qwen returned HTTP {response.status_code}"
            )

        try:
            data = response.json()
        except ValueError as exc:
            raise QwenUpstreamError("Qwen returned invalid JSON") from exc

        content = _extract_content(data)
        if content is None:
            raise QwenUpstreamError("Qwen response did not contain message content")
        return content


def _extract_content(data: Any) -> str | None:
    if not isinstance(data, dict):
        return None
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        return None
    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        return None
    message = first_choice.get("message")
    if not isinstance(message, dict):
        return None
    content = message.get("content")
    return content if isinstance(content, str) else None
