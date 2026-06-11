from datetime import datetime

from sqlalchemy import select, func

from app.database import SessionLocal
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteUpdate


class CRUDNote:
    def create(self, db: SessionLocal, data: NoteCreate, user_id: int) -> Note:
        note = Note(user_id=user_id, title=data.title, content=data.content)
        db.add(note)
        db.commit()
        db.refresh(note)
        return note

    def get(self, db: SessionLocal, note_id: int, user_id: int) -> Note | None:
        return db.execute(
            select(Note).where(Note.id == note_id, Note.user_id == user_id)
        ).scalars().first()

    def get_multi(
        self, db: SessionLocal, user_id: int, *, skip: int = 0, limit: int = 50
    ) -> tuple[list[Note], int]:
        total = db.execute(
            select(func.count(Note.id)).where(Note.user_id == user_id)
        ).scalar() or 0

        notes = db.execute(
            select(Note)
            .where(Note.user_id == user_id)
            .order_by(Note.updated_at.desc())
            .offset(skip)
            .limit(limit)
        ).scalars().all()

        return list(notes), total

    def update(self, db: SessionLocal, note_id: int, data: NoteUpdate, user_id: int) -> Note | None:
        note = self.get(db, note_id, user_id)
        if not note:
            return None

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(note, field, value)

        note.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(note)
        return note

    def delete(self, db: SessionLocal, note_id: int, user_id: int) -> bool:
        note = self.get(db, note_id, user_id)
        if not note:
            return False
        db.delete(note)
        db.commit()
        return True


note_crud = CRUDNote()
