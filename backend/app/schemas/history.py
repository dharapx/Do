from datetime import datetime
from app.schemas.base import AppBaseModel


class HistoryResponse(AppBaseModel):
    id: int
    task_id: int
    field_changed: str
    old_value: str | None
    new_value: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
