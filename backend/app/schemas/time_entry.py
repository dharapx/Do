from datetime import datetime
from app.schemas.base import AppBaseModel


class TimeEntryCreate(AppBaseModel):
    duration: int
    description: str | None = None


class TimeEntryResponse(AppBaseModel):
    id: int
    task_id: int
    duration: int
    description: str | None
    started_at: datetime | None
    stopped_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TimeTrackingResponse(AppBaseModel):
    task_id: int
    total_time: int
