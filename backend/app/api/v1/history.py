from fastapi import APIRouter, Depends

from app.api.deps import get_db, get_current_user
from app.crud.history import history_crud
from app.schemas.history import HistoryResponse

router = APIRouter(prefix="/tasks/{task_id}/history", tags=["history"])


@router.get("", response_model=list[HistoryResponse])
def get_task_history(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    return history_crud.get_multi(db, task_id)
