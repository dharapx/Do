from fastapi import APIRouter, Depends, Query

from app.api.deps import get_db, get_current_user
from app.crud.task import task_crud
from app.schemas.task import TaskResponse, TaskListResponse

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=TaskListResponse)
def search_tasks(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    tasks, total = task_crud.get_multi(db, current_user.id, search=q, skip=skip, limit=limit)
    return TaskListResponse(items=tasks, total=total)
