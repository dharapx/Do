from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_db, get_current_user
from app.crud.note import note_crud
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("", response_model=NoteResponse, status_code=201)
def create_note(data: NoteCreate, db=Depends(get_db), current_user=Depends(get_current_user)):
    return note_crud.create(db, data, current_user.id)


@router.get("", response_model=NoteListResponse)
def list_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db=Depends(get_db),
    current_user=Depends(get_current_user),
):
    notes, total = note_crud.get_multi(db, current_user.id, skip=skip, limit=limit)
    return NoteListResponse(items=notes, total=total)


@router.get("/{note_id}", response_model=NoteResponse)
def get_note(note_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    note = note_crud.get(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.patch("/{note_id}", response_model=NoteResponse)
def update_note(note_id: int, data: NoteUpdate, db=Depends(get_db), current_user=Depends(get_current_user)):
    note = note_crud.update(db, note_id, data, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return note


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    deleted = note_crud.delete(db, note_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Note not found")
