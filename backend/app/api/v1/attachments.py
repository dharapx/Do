import os

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse

from app.api.deps import get_db, get_current_user
from app.crud.attachment import attachment_crud
from app.schemas.attachment import AttachmentResponse

router = APIRouter(prefix="/tasks/{task_id}/attachments", tags=["attachments"])


@router.post("", response_model=AttachmentResponse, status_code=201)
def upload_attachment(task_id: int, file: UploadFile = File(...), db=Depends(get_db), current_user=Depends(get_current_user)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    contents = file.file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    file.file.seek(0)
    return attachment_crud.create(db, file, current_user.id, task_id=task_id)


@router.get("", response_model=list[AttachmentResponse])
def list_attachments(task_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    return attachment_crud.get_attachments(db, task_id=task_id)


@router.get("/{attachment_id}")
def download_attachment(task_id: int, attachment_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    attachment = attachment_crud.get_by_id(db, attachment_id)
    if not attachment or attachment.task_id != task_id:
        raise HTTPException(status_code=404, detail="Attachment not found")
    if not os.path.exists(attachment.stored_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=attachment.stored_path,
        media_type=attachment.mime_type,
        filename=attachment.filename,
    )


@router.delete("/{attachment_id}", status_code=204)
def delete_attachment(task_id: int, attachment_id: int, db=Depends(get_db), current_user=Depends(get_current_user)):
    deleted = attachment_crud.delete(db, attachment_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Attachment not found")
