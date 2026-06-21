from datetime import datetime

from app.schemas.base import AppBaseModel


class NoteCreate(AppBaseModel):
    title: str
    content: str = ""
    is_markdown: bool = False


class NoteUpdate(AppBaseModel):
    title: str | None = None
    content: str | None = None
    is_markdown: bool | None = None


class NoteResponse(AppBaseModel):
    id: int
    title: str
    content: str
    is_markdown: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteListResponse(AppBaseModel):
    items: list[NoteResponse]
    total: int
