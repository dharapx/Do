from datetime import datetime

from app.schemas.base import AppBaseModel


class AttachmentResponse(AppBaseModel):
    id: int
    task_id: int
    filename: str
    mime_type: str
    size: int
    created_at: datetime

    model_config = {"from_attributes": True}
