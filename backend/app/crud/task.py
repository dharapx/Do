from datetime import datetime, timedelta

from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload

from app.database import SessionLocal
from app.models.task import Task
from app.models.tag import TaskTag
from app.models.history import TaskHistory
from app.models.comment import TaskComment
from app.schemas.task import TaskCreate, TaskUpdate


def _recompute_parent_progress(db: SessionLocal, parent_id: int):
    children = (
        db.execute(select(Task).where(Task.parent_id == parent_id))
        .scalars()
        .all()
    )
    if not children:
        return
    avg = sum(c.progress for c in children) // len(children)
    db.execute(
        Task.__table__.update().where(Task.id == parent_id).values(progress=avg)
    )


class CRUDTask:
    def create(self, db: SessionLocal, data: TaskCreate, user_id: int) -> Task:
        parent_id = data.parent_id
        if parent_id:
            parent = db.execute(select(Task).where(Task.id == parent_id)).scalars().first()
            if not parent or parent.type != "goal":
                parent_id = None
            max_sort = (
                db.execute(
                    select(func.coalesce(func.max(Task.sort_order), 0)).where(
                        Task.parent_id == parent_id
                    )
                ).scalar()
                or 0
            )
        else:
            max_sort = 0
        task = Task(
            user_id=user_id,
            title=data.title,
            description=data.description,
            priority=data.priority,
            type=data.type,
            parent_id=parent_id,
            reference_id=data.reference_id,
            sort_order=max_sort + 1 if parent_id else 0,
        )
        db.add(task)
        db.flush()

        for tag_name in data.tags:
            tag = TaskTag(task_id=task.id, name=tag_name.strip())
            db.add(tag)

        history = TaskHistory(
            task_id=task.id,
            user_id=user_id,
            field_changed="task_created",
            old_value=None,
            new_value=f"Task '{task.title}' created",
        )
        db.add(history)
        db.commit()
        db.refresh(task)
        return task

    def get(self, db: SessionLocal, task_id: int, user_id: int) -> Task | None:
        stmt = (
            select(Task)
            .options(
                selectinload(Task.tags),
                selectinload(Task.comments),
                selectinload(Task.children),
                selectinload(Task.reference),
            )
            .where(Task.id == task_id, Task.user_id == user_id)
        )
        return db.execute(stmt).scalars().first()

    def get_multi(
        self,
        db: SessionLocal,
        user_id: int,
        *,
        skip: int = 0,
        limit: int = 50,
        status: str | None = None,
        priority: str | None = None,
        tags: str | None = None,
        parent_id: int | None = None,
        type: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
        keyword: str | None = None,
        search: str | None = None,
        sort_by: str = "created_at",
        sort_order: str = "desc",
    ) -> tuple[list[Task], int]:
        conditions = [Task.user_id == user_id]

        if status:
            status_list = [s.strip() for s in status.split(",")]
            conditions.append(Task.status.in_(status_list))
        if priority:
            priority_list = [p.strip() for p in priority.split(",")]
            conditions.append(Task.priority.in_(priority_list))
        if type:
            conditions.append(Task.type == type)
        if parent_id == 0:
            conditions.append(Task.parent_id.is_(None))
        elif parent_id is not None:
            conditions.append(Task.parent_id == parent_id)
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            conditions.append(
                Task.tags.any(TaskTag.name.in_(tag_list))
            )
        if date_from:
            conditions.append(Task.created_at >= datetime.fromisoformat(date_from))
        if date_to:
            conditions.append(Task.created_at < datetime.fromisoformat(date_to) + timedelta(days=1))
        if keyword:
            like_pattern = f"%{keyword}%"
            conditions.append(
                or_(
                    Task.title.ilike(like_pattern),
                    Task.description.ilike(like_pattern),
                )
            )
        if search:
            like_pattern = f"%{search}%"
            conditions.append(
                or_(
                    Task.title.ilike(like_pattern),
                    Task.description.ilike(like_pattern),
                    Task.comments.any(TaskComment.content.ilike(like_pattern)),
                )
            )

        base_query = select(Task).options(selectinload(Task.tags), selectinload(Task.comments), selectinload(Task.reference))

        if conditions:
            base_query = base_query.where(and_(*conditions))

        count_query = select(func.count()).select_from(Task)
        if conditions:
            count_query = count_query.where(and_(*conditions))
        total = db.execute(count_query).scalar() or 0

        sort_column = getattr(Task, sort_by, Task.created_at)
        if sort_order == "asc":
            base_query = base_query.order_by(sort_column.asc())
        else:
            base_query = base_query.order_by(sort_column.desc())

        base_query = base_query.offset(skip).limit(limit)
        tasks = db.execute(base_query).scalars().all()
        return list(tasks), total

    def update(self, db: SessionLocal, task_id: int, data: TaskUpdate, user_id: int) -> Task | None:
        task = self.get(db, task_id, user_id)
        if not task:
            return None

        update_data = data.model_dump(exclude_unset=True)
        tracked_fields = {"title", "description", "status", "priority"}
        old_parent_id = task.parent_id
        status_changed = False
        progress_changed = False
        parent_changed = False

        if "progress" in update_data:
            update_data["progress"] = max(0, min(100, update_data["progress"]))

        if "parent_id" in update_data:
            new_parent_id = update_data.pop("parent_id")
            if task.status == "done":
                pass
            else:
                parent_changed = True
                task.parent_id = new_parent_id

        if "reference_id" in update_data:
            task.reference_id = update_data.pop("reference_id")

        if "type" in update_data:
            task.type = update_data.pop("type")

        for field, value in update_data.items():
            if field == "tags" and value is not None:
                existing_tags = {t.name for t in task.tags}
                new_tags = set(value)
                if existing_tags != new_tags:
                    for tag in list(task.tags):
                        db.delete(tag)
                    for tag_name in new_tags:
                        db.add(TaskTag(task_id=task.id, name=tag_name))
                    history = TaskHistory(
                        task_id=task.id,
                        user_id=user_id,
                        field_changed="tags",
                        old_value=",".join(sorted(existing_tags)),
                        new_value=",".join(sorted(new_tags)),
                    )
                    db.add(history)
                continue

            if field in tracked_fields:
                old_val = str(getattr(task, field, ""))
                new_val = str(value)
                if old_val != new_val:
                    setattr(task, field, value)
                    history = TaskHistory(
                        task_id=task.id,
                        user_id=user_id,
                        field_changed=field,
                        old_value=old_val,
                        new_value=new_val,
                    )
                    db.add(history)

                    if field == "status":
                        status_changed = True
                        if value == "done":
                            task.completed_at = datetime.utcnow()
                            task.progress = 100
                        elif value == "wont_do":
                            task.completed_at = datetime.utcnow()
                            task.progress = 0
                        else:
                            task.completed_at = None

            if field == "progress":
                old_val = str(getattr(task, "progress", 0))
                new_val = str(value)
                if old_val != new_val:
                    task.progress = value
                    progress_changed = True
                    history = TaskHistory(
                        task_id=task.id,
                        user_id=user_id,
                        field_changed="progress",
                        old_value=old_val,
                        new_value=new_val,
                    )
                    db.add(history)

        if progress_changed and not status_changed:
            if task.progress >= 100 and task.status != "done":
                old_status = task.status
                task.status = "done"
                task.completed_at = datetime.utcnow()
                history = TaskHistory(
                    task_id=task.id,
                    user_id=user_id,
                    field_changed="status",
                    old_value=old_status,
                    new_value="done",
                )
                db.add(history)
            elif task.progress < 100 and task.status == "done":
                old_status = task.status
                task.status = "in_progress"
                task.completed_at = None
                history = TaskHistory(
                    task_id=task.id,
                    user_id=user_id,
                    field_changed="status",
                    old_value=old_status,
                    new_value="in_progress",
                )
                db.add(history)

        task.updated_at = datetime.utcnow()
        db.flush()

        if parent_changed or progress_changed:
            if old_parent_id:
                _recompute_parent_progress(db, old_parent_id)
            if task.parent_id:
                _recompute_parent_progress(db, task.parent_id)
        elif progress_changed and task.parent_id:
            _recompute_parent_progress(db, task.parent_id)

        db.commit()
        db.refresh(task)
        return task

    def update_children(
        self, db: SessionLocal, goal_id: int, child_ids: list[int], user_id: int
    ) -> Task | None:
        goal = self.get(db, goal_id, user_id)
        if not goal:
            return None
        if goal.type != "goal":
            raise ValueError(f"Task {goal_id} is not a goal")

        existing_ids = {c.id for c in goal.children}
        new_ids = set(child_ids)

        # Validate all new children exist, are tasks, belong to user, and aren't done
        if new_ids:
            tasks = (
                db.execute(
                    select(Task).where(Task.id.in_(new_ids), Task.user_id == user_id)
                )
                .scalars()
                .all()
            )
            found_ids = {t.id for t in tasks}
            missing = new_ids - found_ids
            if missing:
                raise ValueError(f"Tasks not found: {missing}")

            for t in tasks:
                if t.type != "task":
                    raise ValueError(f"Task {t.id} is not a task (type={t.type})")
                if t.status == "done":
                    raise ValueError(f"Task {t.id} is done and cannot be reassigned")

        # Add new children
        to_add = new_ids - existing_ids
        if to_add:
            db.execute(
                Task.__table__.update()
                .where(Task.id.in_(to_add))
                .values(parent_id=goal_id)
            )

        # Remove deselected children
        to_remove = existing_ids - new_ids
        if to_remove:
            db.execute(
                Task.__table__.update()
                .where(Task.id.in_(to_remove))
                .values(parent_id=None)
            )

        if to_add or to_remove:
            _recompute_parent_progress(db, goal_id)
            goal.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(goal)

        return goal

    def set_parent(
        self, db: SessionLocal, task_id: int, parent_id: int | None, user_id: int
    ) -> Task | None:
        task = self.get(db, task_id, user_id)
        if not task:
            return None
        if task.type != "task":
            raise ValueError("Only tasks can have a parent goal")
        if task.status == "done":
            raise ValueError("Cannot change parent of a done task")

        old_parent_id = task.parent_id

        if parent_id is not None:
            parent = self.get(db, parent_id, user_id)
            if not parent:
                raise ValueError(f"Goal {parent_id} not found")
            if parent.type != "goal":
                raise ValueError(f"Task {parent_id} is not a goal")

        task.parent_id = parent_id
        task.updated_at = datetime.utcnow()
        db.flush()

        if old_parent_id:
            _recompute_parent_progress(db, old_parent_id)
        if parent_id:
            _recompute_parent_progress(db, parent_id)

        db.commit()
        db.refresh(task)
        return task

    def delete(self, db: SessionLocal, task_id: int, user_id: int) -> bool:
        stmt = select(Task).where(Task.id == task_id, Task.user_id == user_id)
        task = db.execute(stmt).scalars().first()
        if not task:
            return False
        db.delete(task)
        db.commit()
        return True

    def get_dashboard_stats(self, db: SessionLocal, user_id: int, date_from: str | None = None, date_to: str | None = None) -> dict:
        base_conditions = [Task.user_id == user_id]
        if date_from:
            base_conditions.append(Task.updated_at >= datetime.fromisoformat(date_from))
        if date_to:
            base_conditions.append(Task.updated_at < datetime.fromisoformat(date_to) + timedelta(days=1))
        def count_with(extra_conditions=None):
            conditions = base_conditions + (extra_conditions or [])
            return db.execute(select(func.count(Task.id)).where(and_(*conditions))).scalar() or 0

        total = count_with()
        not_started = count_with([Task.status == "not_started"])
        in_progress = count_with([Task.status == "in_progress"])
        done = count_with([Task.status == "done"])
        wont_do = count_with([Task.status == "wont_do"])
        high_priority = count_with([Task.priority == "high"])
        urgent = count_with([Task.priority == "urgent", Task.status.not_in(["done", "wont_do"])])
        urgent_all = count_with([Task.priority == "urgent"])
        high_priority_all = count_with([Task.priority == "high"])

        avg_progress = (
            db.execute(select(func.avg(Task.progress)).where(and_(*base_conditions))).scalar() or 0
        )
        return {
            "total": total,
            "not_started": not_started,
            "in_progress": in_progress,
            "done": done,
            "wont_do": wont_do,
            "high_priority": high_priority,
            "urgent": urgent,
            "urgent_all": urgent_all,
            "high_priority_all": high_priority_all,
            "avg_progress": round(float(avg_progress), 1),
        }


task_crud = CRUDTask()
