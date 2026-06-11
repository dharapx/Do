from sqlalchemy import select, func

from app.database import SessionLocal
from app.models.comment import TaskComment
from app.models.history import TaskHistory
from app.schemas.comment import CommentCreate, CommentUpdate


class CRUDComment:
    def create(self, db: SessionLocal, task_id: int, data: CommentCreate, user_id: int) -> TaskComment:
        comment = TaskComment(task_id=task_id, user_id=user_id, content=data.content)
        db.add(comment)
        db.flush()

        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            field_changed="comment",
            old_value=None,
            new_value=data.content[:200],
        )
        db.add(history)
        db.commit()
        db.refresh(comment)
        return comment

    def update(self, db: SessionLocal, comment_id: int, data: CommentUpdate, user_id: int) -> TaskComment | None:
        comment = db.get(TaskComment, comment_id)
        if not comment:
            return None

        old_content = comment.content
        comment.content = data.content
        comment.updated_at = func.now()

        history = TaskHistory(
            task_id=comment.task_id,
            user_id=user_id,
            field_changed="comment",
            old_value=old_content[:200],
            new_value=data.content[:200],
        )
        db.add(history)
        db.commit()
        db.refresh(comment)
        return comment

    def delete(self, db: SessionLocal, comment_id: int, user_id: int) -> bool:
        comment = db.get(TaskComment, comment_id)
        if not comment:
            return False

        task_id = comment.task_id
        content = comment.content[:200]
        db.delete(comment)

        history = TaskHistory(
            task_id=task_id,
            user_id=user_id,
            field_changed="comment",
            old_value=content,
            new_value=None,
        )
        db.add(history)
        db.commit()
        return True

    def get_multi(self, db: SessionLocal, task_id: int) -> list[TaskComment]:
        stmt = (
            select(TaskComment)
            .where(TaskComment.task_id == task_id)
            .order_by(TaskComment.created_at.desc())
        )
        return list(db.execute(stmt).scalars().all())


comment_crud = CRUDComment()
