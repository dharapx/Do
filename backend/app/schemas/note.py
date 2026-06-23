from datetime import datetime

from app.schemas.base import AppBaseModel


class NoteCreate(AppBaseModel):
    title: str
    content: str = ""


class NoteUpdate(AppBaseModel):
    title: str | None = None
    content: str | None = None


class NoteResponse(AppBaseModel):
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class NoteListResponse(AppBaseModel):
    items: list[NoteResponse]
    total: int


class NoteAttachmentResponse(AppBaseModel):
    id: int
    filename: str
    mime_type: str
    size: int
    url: str
    created_at: datetime
