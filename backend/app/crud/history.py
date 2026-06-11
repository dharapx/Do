from sqlalchemy import select

from app.database import SessionLocal
from app.models.history import TaskHistory


class CRUDHistory:
    def create(self, db: SessionLocal, task_id: int, field_changed: str, old_value: str | None, new_value: str | None) -> TaskHistory:
        history = TaskHistory(
            task_id=task_id,
            field_changed=field_changed,
            old_value=old_value,
            new_value=new_value,
        )
        db.add(history)
        db.commit()
        db.refresh(history)
        return history

    def get_multi(self, db: SessionLocal, task_id: int) -> list[TaskHistory]:
        stmt = (
            select(TaskHistory)
            .where(TaskHistory.task_id == task_id)
            .order_by(TaskHistory.created_at.desc())
        )
        return list(db.execute(stmt).scalars().all())


history_crud = CRUDHistory()
