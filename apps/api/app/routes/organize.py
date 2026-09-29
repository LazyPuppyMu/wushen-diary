from fastapi import APIRouter, HTTPException, status

from app.schemas.organize import OrganizeRequest, OrganizeResponse
from app.services.organize import AIResponseError, OrganizeService
from app.services.qwen import (
    QwenClient,
    QwenConfigurationError,
    QwenTimeoutError,
    QwenUpstreamError,
)

router = APIRouter(prefix="/v1", tags=["organize"])


def get_qwen_client() -> QwenClient:
    return QwenClient.from_env()


@router.post("/organize", response_model=OrganizeResponse)
async def organize_entries(request: OrganizeRequest) -> OrganizeResponse:
    try:
        client = get_qwen_client()
    except QwenConfigurationError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI organization is not configured",
        ) from exc

    try:
        return await OrganizeService(client).organize(request.entries)
    except QwenTimeoutError as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="AI organization timed out",
        ) from exc
    except (QwenUpstreamError, AIResponseError) as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI organization returned an unusable result",
        ) from exc
