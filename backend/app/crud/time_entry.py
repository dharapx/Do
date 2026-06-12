from datetime import datetime, timedelta

from sqlalchemy import select, func, and_, cast, Date

from app.database import SessionLocal
from app.models.time_entry import TimeEntry
from app.models.task import Task
from app.models.history import TaskHistory
from app.schemas.time_entry import TimeEntryCreate, TimeEntryUpdate


class CRUDTimeEntry:
    def create(self, db: SessionLocal, task_id: int, data: TimeEntryCreate, user_id: int) -> TimeEntry:
        now = datetime.utcnow()
        entry = TimeEntry(
            task_id=task_id,
            user_id=user_id,
            duration=data.duration,
            description=data.description,
            started_at=now,
        )
        db.add(entry)

        task = db.get(Task, task_id)
        if task:
            task.total_time_spent = (task.total_time_spent or 0) + data.duration
            task.updated_at = datetime.utcnow()

        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            field_changed="time_spent",
            old_value=None,
            new_value=f"+{data.duration}s (manual)",
        )
        db.add(history)
        db.commit()
        db.refresh(entry)
        return entry

    def update_entry(self, db: SessionLocal, task_id: int, entry_id: int, data: TimeEntryUpdate, user_id: int) -> TimeEntry | None:
        entry = db.get(TimeEntry, entry_id)
        if not entry or entry.task_id != task_id or entry.user_id != user_id:
            return None

        old_duration = entry.duration
        if data.duration is not None:
            entry.duration = data.duration
        if data.description is not None:
            entry.description = data.description

        task = db.get(Task, task_id)
        if task and data.duration is not None:
            task.total_time_spent = (task.total_time_spent or 0) - old_duration + data.duration
            task.updated_at = datetime.utcnow()

        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            field_changed="time_spent",
            old_value=f"{old_duration}s",
            new_value=f"{entry.duration}s (edited)",
        )
        db.add(history)
        db.commit()
        db.refresh(entry)
        return entry

    def delete_entry(self, db: SessionLocal, task_id: int, entry_id: int, user_id: int) -> bool:
        entry = db.get(TimeEntry, entry_id)
        if not entry or entry.task_id != task_id or entry.user_id != user_id:
            return False

        task = db.get(Task, task_id)
        if task:
            task.total_time_spent = max(0, (task.total_time_spent or 0) - entry.duration)
            task.updated_at = datetime.utcnow()

        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            field_changed="time_spent",
            old_value=f"{entry.duration}s",
            new_value=None,
        )
        db.add(history)
        db.delete(entry)
        db.commit()
        return True

    def get_totals(self, db: SessionLocal, task_id: int) -> int:
        task = db.get(Task, task_id)
        return task.total_time_spent if task else 0

    def get_entries(self, db: SessionLocal, task_id: int) -> list[TimeEntry]:
        stmt = (
            select(TimeEntry)
            .where(TimeEntry.task_id == task_id)
            .order_by(TimeEntry.created_at.desc())
        )
        return list(db.execute(stmt).scalars().all())

    def start_timer(self, db: SessionLocal, task_id: int, user_id: int) -> TimeEntry:
        entry = TimeEntry(
            task_id=task_id,
            user_id=user_id,
            duration=0,
            started_at=datetime.utcnow(),
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    def stop_timer(self, db: SessionLocal, task_id: int, user_id: int) -> TimeEntry | None:
        stmt = (
            select(TimeEntry)
            .where(TimeEntry.task_id == task_id)
            .where(TimeEntry.user_id == user_id)
            .where(TimeEntry.started_at.isnot(None))
            .where(TimeEntry.stopped_at.is_(None))
            .order_by(TimeEntry.started_at.desc())
            .limit(1)
        )
        entry = db.execute(stmt).scalars().first()
        if not entry:
            return None

        now = datetime.utcnow()
        entry.stopped_at = now
        if entry.started_at:
            entry.duration = int((now - entry.started_at).total_seconds())

        task = db.get(Task, task_id)
        if task:
            task.total_time_spent = (task.total_time_spent or 0) + entry.duration
            task.updated_at = now

        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            field_changed="time_spent",
            old_value=None,
            new_value=f"+{entry.duration}s (timer)",
        )
        db.add(history)
        db.commit()
        db.refresh(entry)
        return entry


    def get_time_timeline(self, db: SessionLocal, user_id: int, date_from: str | None = None, date_to: str | None = None) -> list[dict]:
        ts_col = func.coalesce(TimeEntry.started_at, TimeEntry.created_at)
        conditions = [TimeEntry.user_id == user_id, TimeEntry.duration > 0]
        if date_from:
            conditions.append(ts_col >= datetime.fromisoformat(date_from))
        if date_to:
            conditions.append(ts_col < datetime.fromisoformat(date_to) + timedelta(days=1))

        rows = db.execute(
            select(
                cast(ts_col, Date).label("date"),
                TimeEntry.task_id,
                Task.title.label("task_title"),
                func.sum(TimeEntry.duration).label("total_seconds"),
            )
            .join(Task, TimeEntry.task_id == Task.id)
            .where(and_(*conditions))
            .group_by("date", TimeEntry.task_id, Task.title)
            .order_by("date")
        ).all()

        return [
            {
                "date": str(row.date),
                "task_id": row.task_id,
                "task_title": row.task_title,
                "total_seconds": int(row.total_seconds),
            }
            for row in rows
        ]


time_entry_crud = CRUDTimeEntry()
