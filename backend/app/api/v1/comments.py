from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import get_db, get_current_user
from app.crud.comment import comment_crud
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse

router = APIRouter(prefix="/tasks/{task_id}/comments", tags=["comments"])


@router.post("", response_model=CommentResponse, status_code=201)
def create_comment(task_id: int, data: CommentCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return comment_crud.create(db, task_id, data, current_user.id)


@router.get("", response_model=list[CommentResponse])
def list_comments(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    return comment_crud.get_multi(db, task_id)


@router.patch("/{comment_id}", response_model=CommentResponse)
def update_comment(task_id: int, comment_id: int, data: CommentUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    comment = comment_crud.update(db, comment_id, data, current_user.id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return comment


@router.delete("/{comment_id}", status_code=204)
def delete_comment(task_id: int, comment_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    deleted = comment_crud.delete(db, comment_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Comment not found")
