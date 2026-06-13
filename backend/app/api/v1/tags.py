from fastapi import APIRouter, Depends, Query

from app.api.deps import get_db, get_current_user
from app.crud.task import task_crud
from app.schemas.task import TagSuggestionsResponse

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/suggestions", response_model=TagSuggestionsResponse)
def get_tag_suggestions(
    q: str = Query("", min_length=0),
    limit: int = Query(10, ge=1, le=50),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    tags = task_crud.get_tag_suggestions(db, current_user.id, query=q, limit=limit)
    return TagSuggestionsResponse(tags=tags)
