from __future__ import annotations
from datetime import datetime
from pydantic import model_validator, Field
from app.schemas.base import AppBaseModel


class TaskBase(AppBaseModel):
    title: str
    description: str | None = None
    priority: str = "medium"
    tags: list[str] = []
    reference_id: int | None = None


class TaskCreate(TaskBase):
    type: str = "task"
    parent_id: int | None = None
    reference_id: int | None = None


class TaskUpdate(AppBaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    tags: list[str] | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    type: str | None = None
    parent_id: int | None = None
    reference_id: int | None = None


class TaskResponse(AppBaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str
    type: str = "task"
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    total_time_spent: int
    progress: int = 0
    parent_id: int | None = None
    tags: list[str] = []
    comments_count: int = 0
    children: list[TaskResponse] = []
    reference_id: int | None = None
    reference_title: str | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def populate_computed(cls, data):
        if isinstance(data, dict):
            return data
        ref_title = None
        if hasattr(data, "reference") and data.reference:
            ref_title = data.reference.title
        result = {
            "id": data.id,
            "title": data.title,
            "description": data.description,
            "status": data.status,
            "priority": data.priority,
            "type": getattr(data, "type", "task"),
            "created_at": data.created_at,
            "updated_at": data.updated_at,
            "completed_at": data.completed_at,
            "total_time_spent": data.total_time_spent,
            "progress": getattr(data, "progress", 0),
            "parent_id": getattr(data, "parent_id", None),
            "tags": [t.name for t in data.tags] if hasattr(data, "tags") else [],
            "comments_count": len(data.comments) if hasattr(data, "comments") else 0,
            "children": [TaskResponse.model_validate(c) for c in getattr(data, "children", [])],
            "reference_id": getattr(data, "reference_id", None),
            "reference_title": ref_title,
        }
        return result


class TaskListItem(AppBaseModel):
    id: int
    title: str
    description: str | None
    status: str
    priority: str
    type: str = "task"
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None
    total_time_spent: int
    progress: int = 0
    parent_id: int | None = None
    tags: list[str] = []
    comments_count: int = 0
    reference_id: int | None = None
    reference_title: str | None = None

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def populate_computed(cls, data):
        if isinstance(data, dict):
            return data
        ref_title = None
        if hasattr(data, "reference") and data.reference:
            ref_title = data.reference.title
        result = {
            "id": data.id,
            "title": data.title,
            "description": data.description,
            "status": data.status,
            "priority": data.priority,
            "type": getattr(data, "type", "task"),
            "created_at": data.created_at,
            "updated_at": data.updated_at,
            "completed_at": data.completed_at,
            "total_time_spent": data.total_time_spent,
            "progress": getattr(data, "progress", 0),
            "parent_id": getattr(data, "parent_id", None),
            "tags": [t.name for t in data.tags] if hasattr(data, "tags") else [],
            "comments_count": len(data.comments) if hasattr(data, "comments") else 0,
            "reference_id": getattr(data, "reference_id", None),
            "reference_title": ref_title,
        }
        return result


class TaskListResponse(AppBaseModel):
    items: list[TaskListItem]
    total: int
