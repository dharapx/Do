import os
import shutil
from datetime import datetime
from uuid import uuid4

from fastapi import UploadFile

from app.database import SessionLocal
from app.models.attachment import Attachment
from app.models.task import Task
from app.models.history import TaskHistory

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


class CRUDAttachment:
    def create(self, db: SessionLocal, task_id: int, file: UploadFile, user_id: int) -> Attachment:
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        ext = os.path.splitext(file.filename or "file")[1]
        stored_name = f"{uuid4().hex}{ext}"
        stored_path = os.path.join(UPLOAD_DIR, stored_name)

        contents = file.file.read()
        with open(stored_path, "wb") as f:
            f.write(contents)

        attachment = Attachment(
            task_id=task_id,
            user_id=user_id,
            filename=file.filename or "file",
            stored_path=stored_path,
            mime_type=file.content_type or "application/octet-stream",
            size=len(contents),
        )
        db.add(attachment)

        task = db.get(Task, task_id)
        if task:
            task.updated_at = datetime.utcnow()

        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            field_changed="attachment",
            old_value=None,
            new_value=f"Added: {file.filename}",
        )
        db.add(history)
        db.commit()
        db.refresh(attachment)
        return attachment

    def get_attachments(self, db: SessionLocal, task_id: int) -> list[Attachment]:
        return (
            db.query(Attachment)
            .filter(Attachment.task_id == task_id)
            .order_by(Attachment.created_at.desc())
            .all()
        )

    def get_by_id(self, db: SessionLocal, att_id: int) -> Attachment | None:
        return db.get(Attachment, att_id)

    def delete(self, db: SessionLocal, task_id: int, att_id: int, user_id: int) -> bool:
        attachment = db.get(Attachment, att_id)
        if not attachment or attachment.task_id != task_id or attachment.user_id != user_id:
            return False

        if os.path.exists(attachment.stored_path):
            os.remove(attachment.stored_path)

        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            field_changed="attachment",
            old_value=f"Removed: {attachment.filename}",
            new_value=None,
        )
        db.add(history)
        db.delete(attachment)
        db.commit()
        return True


attachment_crud = CRUDAttachment()
