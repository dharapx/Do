from fastapi import APIRouter, Depends, HTTPException, Body

from app.api.deps import get_db, get_current_user
from app.crud.time_entry import time_entry_crud
from app.schemas.time_entry import TimeEntryCreate, TimeEntryUpdate, TimeEntryResponse, TimeTrackingResponse

router = APIRouter(prefix="/tasks/{task_id}/time", tags=["time"])


@router.post("", response_model=TimeEntryResponse, status_code=201)
def add_time_entry(task_id: int, data: TimeEntryCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return time_entry_crud.create(db, task_id, data, current_user.id)


@router.get("", response_model=list[TimeEntryResponse])
def list_time_entries(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    return time_entry_crud.get_entries(db, task_id)


@router.get("/total", response_model=TimeTrackingResponse)
def get_total_time(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    total = time_entry_crud.get_totals(db, task_id)
    return TimeTrackingResponse(task_id=task_id, total_time=total)


@router.post("/start", response_model=TimeEntryResponse, status_code=201)
def start_timer(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    return time_entry_crud.start_timer(db, task_id, current_user.id)


@router.post("/stop", response_model=TimeEntryResponse)
def stop_timer(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    entry = time_entry_crud.stop_timer(db, task_id, current_user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="No running timer found for this task")
    return entry


@router.put("/{entry_id}", response_model=TimeEntryResponse)
def update_time_entry(task_id: int, entry_id: int, data: TimeEntryUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    entry = time_entry_crud.update_entry(db, task_id, entry_id, data, current_user.id)
    if not entry:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return entry


@router.delete("/{entry_id}", status_code=204)
def delete_time_entry(task_id: int, entry_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    deleted = time_entry_crud.delete_entry(db, task_id, entry_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Time entry not found")
