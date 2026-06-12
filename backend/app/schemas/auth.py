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


class AuthStatusResponse(AppBaseModel):
    status: str = "ok"


class UserResponse(AppBaseModel):
    id: int
    username: str
    email: str
    display_name: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthConfigResponse(AppBaseModel):
    github: bool = False
    google: bool = False


class OAuthUrlResponse(AppBaseModel):
    url: str


class ForgotPasswordRequest(AppBaseModel):
    username: str


class ForgotPasswordResponse(AppBaseModel):
    has_oauth_providers: bool = False
    oauth_providers: list[str] = []
    reset_code: str | None = None
    message: str


class PasswordResetRequest(AppBaseModel):
    code: str
    new_password: str


class SetPasswordRequest(AppBaseModel):
    current_password: str | None = None
    new_password: str
