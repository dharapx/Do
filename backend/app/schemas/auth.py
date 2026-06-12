import re
from datetime import datetime
from pydantic import field_validator
from app.schemas.base import AppBaseModel


PASSWORD_RULES = [
    (r".{8,}", "At least 8 characters"),
    (r"[A-Z]", "One uppercase letter"),
    (r"[a-z]", "One lowercase letter"),
    (r"\d", "One number"),
]


def validate_password_complexity(password: str) -> str:
    errors = [msg for pattern, msg in PASSWORD_RULES if not re.search(pattern, password)]
    if errors:
        raise ValueError("Password must contain: " + "; ".join(errors))
    return password


class SignupRequest(AppBaseModel):
    username: str
    email: str
    password: str
    display_name: str | None = None

    _validate_password = field_validator("password")(validate_password_complexity)


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

    _validate_password = field_validator("new_password")(validate_password_complexity)


class SetPasswordRequest(AppBaseModel):
    current_password: str | None = None
    new_password: str

    _validate_password = field_validator("new_password")(validate_password_complexity)
