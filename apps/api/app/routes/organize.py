from fastapi import APIRouter, HTTPException, status

from app.schemas.organize import OrganizeRequest, OrganizeResponse

router = APIRouter(prefix="/v1", tags=["organize"])


@router.post("/organize", response_model=OrganizeResponse)
def organize_entries(request: OrganizeRequest) -> OrganizeResponse:
    del request
    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="AI organization is not configured yet",
    )
