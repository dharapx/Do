from datetime import datetime
from app.schemas.base import AppBaseModel


class CommentCreate(AppBaseModel):
    content: str


class CommentUpdate(AppBaseModel):
    content: str


class CommentResponse(AppBaseModel):
    id: int
    task_id: int
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
