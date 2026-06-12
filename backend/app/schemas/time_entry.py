from datetime import datetime
from pydantic import field_validator

from app.schemas.base import AppBaseModel


MAX_DURATION_SECONDS = 86400  # 1440 minutes


class TimeEntryCreate(AppBaseModel):
    duration: int
    description: str | None = None

    @field_validator("duration")
    @classmethod
    def validate_duration(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Duration must be positive")
        if v > MAX_DURATION_SECONDS:
            raise ValueError(f"Duration cannot exceed 1440 minutes ({MAX_DURATION_SECONDS} seconds)")
        return v


class TimeEntryUpdate(AppBaseModel):
    duration: int | None = None
    description: str | None = None

    @field_validator("duration")
    @classmethod
    def validate_duration(cls, v: int | None) -> int | None:
        if v is not None:
            if v <= 0:
                raise ValueError("Duration must be positive")
            if v > MAX_DURATION_SECONDS:
                raise ValueError(f"Duration cannot exceed 1440 minutes ({MAX_DURATION_SECONDS} seconds)")
        return v


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
