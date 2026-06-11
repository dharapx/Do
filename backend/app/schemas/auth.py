from datetime import datetime
from app.schemas.base import AppBaseModel


class SignupRequest(AppBaseModel):
    username: str
    email: str
    password: str
    display_name: str | None = None


class LoginRequest(AppBaseModel):
    username: str
    password: str


class TokenResponse(AppBaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(AppBaseModel):
    id: int
    username: str
    email: str
    display_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
