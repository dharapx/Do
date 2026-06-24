import os

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse

from app.api.deps import get_db, get_current_user
from app.crud.note import note_crud
from app.crud.attachment import attachment_crud
from app.schemas.note import NoteCreate, NoteUpdate, NoteResponse, NoteListResponse
from app.schemas.attachment import AttachmentResponse

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


@router.post("/{note_id}/attachments", response_model=AttachmentResponse, status_code=201)
def upload_note_attachment(note_id: int, file: UploadFile = File(...), db=Depends(get_db), current_user=Depends(get_current_user)):
    note = note_crud.get(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    MAX_SIZE = 10 * 1024 * 1024
    contents = file.file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    file.file.seek(0)
    return attachment_crud.create(db, file, current_user.id, note_id=note_id)


@router.get("/{note_id}/attachments", response_model=list[AttachmentResponse])
def list_note_attachments(note_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    note = note_crud.get(db, note_id, current_user.id)
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    return attachment_crud.get_attachments(db, note_id=note_id)


@router.get("/{note_id}/attachments/{attachment_id}")
def download_note_attachment(note_id: int, attachment_id: int, db=Depends(get_db)):
    attachment = attachment_crud.get_by_id(db, attachment_id)
    if not attachment or attachment.note_id != note_id:
        raise HTTPException(status_code=404, detail="Attachment not found")
    if not os.path.exists(attachment.stored_path):
        raise HTTPException(status_code=404, detail="File not found on disk")
    return FileResponse(
        path=attachment.stored_path,
        media_type=attachment.mime_type,
        filename=attachment.filename,
    )


@router.delete("/{note_id}/attachments/{attachment_id}", status_code=204)
def delete_note_attachment(note_id: int, attachment_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    attachment = attachment_crud.get_by_id(db, attachment_id)
    if not attachment or attachment.note_id != note_id:
        raise HTTPException(status_code=404, detail="Attachment not found")
    deleted = attachment_crud.delete(db, attachment_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Attachment not found")
