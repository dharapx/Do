from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_db, get_current_user
from app.crud.task import task_crud
from app.crud.time_entry import time_entry_crud
from pydantic import BaseModel

from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse


class UpdateChildrenRequest(BaseModel):
    child_ids: list[int]


class SetParentRequest(BaseModel):
    parent_id: int | None = None

router = APIRouter(prefix="/tasks", tags=["tasks"])


@router.post("", response_model=TaskResponse, status_code=201)
def create_task(data: TaskCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    task = task_crud.create(db, data, current_user.id)
    return task


@router.get("", response_model=TaskListResponse)
def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: str | None = None,
    priority: str | None = None,
    tags: str | None = None,
    parent_id: int | None = Query(None),
    type: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    keyword: str | None = None,
    search: str | None = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    tasks, total = task_crud.get_multi(
        db,
        current_user.id,
        skip=skip,
        limit=limit,
        status=status,
        priority=priority,
        tags=tags,
        parent_id=parent_id,
        type=type,
        date_from=date_from,
        date_to=date_to,
        keyword=keyword,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return TaskListResponse(items=tasks, total=total)


@router.post("/{goal_id}/children", response_model=TaskResponse)
def update_task_children(
    goal_id: int,
    data: UpdateChildrenRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        goal = task_crud.update_children(db, goal_id, data.child_ids, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal


@router.put("/{task_id}/parent", response_model=TaskResponse)
def set_task_parent(
    task_id: int,
    data: SetParentRequest,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        task = task_crud.set_parent(db, task_id, data.parent_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.get("/dashboard/stats")
def dashboard_stats(
    date_from: str | None = None,
    date_to: str | None = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    return task_crud.get_dashboard_stats(db, current_user.id, date_from=date_from, date_to=date_to)


@router.get("/dashboard/time-timeline")
def dashboard_time_timeline(
    date_from: str | None = None,
    date_to: str | None = None,
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    return time_entry_crud.get_time_timeline(db, current_user.id, date_from=date_from, date_to=date_to)


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    task = task_crud.get(db, task_id, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(task_id: int, data: TaskUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    task = task_crud.update(db, task_id, data, current_user.id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.delete("/{task_id}", status_code=204)
def delete_task(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    deleted = task_crud.delete(db, task_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")
