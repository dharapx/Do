import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.api.deps import get_db, get_current_user
from app.crud.auth import auth_crud
from app.schemas.auth import (
    SignupRequest, LoginRequest, UserResponse,
    AuthConfigResponse, OAuthUrlResponse,
    ForgotPasswordRequest, ForgotPasswordResponse,
    PasswordResetRequest, SetPasswordRequest,
)
from app.core.auth import (
    create_access_token,
    generate_refresh_token,
    hash_refresh_token,
    verify_password,
    set_auth_cookies,
    clear_auth_cookies,
)
from app.core.oauth import oauth
from app.models.refresh_token import RefreshToken
from app.models.password_reset import PasswordReset
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer(auto_error=False)

FRONTEND_URLS = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]


def _get_frontend_url(request: Request) -> str:
    origin = request.headers.get("origin", "")
    if origin in FRONTEND_URLS:
        return origin
    return settings.FRONTEND_URL


# ── Email/Password Auth ──────────────────────────────────────────


@router.post("/signup", status_code=201)
def signup(data: SignupRequest, response: Response, db=Depends(get_db)):
    if auth_crud.get_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if auth_crud.get_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = auth_crud.create_user(db, data)
    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    refresh_token_str = _create_refresh_token(db, user.id)
    set_auth_cookies(response, access_token, refresh_token_str)
    return {"status": "ok"}


@router.post("/login")
def login(data: LoginRequest, response: Response, db=Depends(get_db)):
    user = auth_crud.authenticate(db, data.username, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id), "username": user.username})
    refresh_token_str = _create_refresh_token(db, user.id)
    set_auth_cookies(response, access_token, refresh_token_str)
    return {"status": "ok"}


# ── OAuth ────────────────────────────────────────────────────────


@router.get("/config", response_model=AuthConfigResponse)
def get_auth_config():
    return AuthConfigResponse(
        github=settings.ENABLE_GITHUB_OAUTH,
        google=settings.ENABLE_GOOGLE_OAUTH,
    )


@router.get("/oauth/{provider}", response_model=OAuthUrlResponse)
async def get_oauth_url(provider: str, request: Request):
    if provider not in ("github", "google"):
        raise HTTPException(status_code=400, detail="Unsupported provider")
    if provider == "github" and not settings.ENABLE_GITHUB_OAUTH:
        raise HTTPException(status_code=400, detail="GitHub OAuth is not configured")
    if provider == "google" and not settings.ENABLE_GOOGLE_OAUTH:
        raise HTTPException(status_code=400, detail="Google OAuth is not configured")

    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=400, detail=f"{provider} is not configured")

    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/api/v1/auth/oauth/{provider}/callback"
    resp = await client.create_authorization_url(redirect_uri)
    await client.save_authorize_data(request, redirect_uri=redirect_uri, **resp)
    return OAuthUrlResponse(url=resp["url"])


@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, request: Request, response: Response, db=Depends(get_db)):
    if provider not in ("github", "google"):
        raise HTTPException(status_code=400, detail="Unsupported provider")
    if provider == "github" and not settings.ENABLE_GITHUB_OAUTH:
        raise HTTPException(status_code=400, detail="GitHub OAuth is not configured")
    if provider == "google" and not settings.ENABLE_GOOGLE_OAUTH:
        raise HTTPException(status_code=400, detail="Google OAuth is not configured")

    client = oauth.create_client(provider)
    if not client:
        raise HTTPException(status_code=400, detail=f"{provider} is not configured")

    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE}/api/v1/auth/oauth/{provider}/callback"
    try:
        token = await client.authorize_access_token(request)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth callback failed: {str(e)}")
    if not token:
        raise HTTPException(status_code=401, detail="OAuth token exchange failed")

    user_info = await client.parse_id_token(request, token) if provider == "google" else token.get("userinfo")
    if provider == "github":
        import httpx
        async with httpx.AsyncClient() as client_http:
            gh_resp = await client_http.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token['access_token']}"},
            )
            gh_resp.raise_for_status()
            user_info = gh_resp.json()
            email_resp = await client_http.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {token['access_token']}"},
            )
            email_resp.raise_for_status()
            emails = email_resp.json()
            primary_email = next((e["email"] for e in emails if e.get("primary")), emails[0]["email"])
            user_info["email"] = primary_email

    oauth_id = str(user_info.get("id") or user_info.get("sub"))
    email = user_info.get("email", "")
    name = user_info.get("name") or user_info.get("login", email.split("@")[0])

    getter = auth_crud.get_by_github_id if provider == "github" else auth_crud.get_by_google_id
    linker = auth_crud.link_github if provider == "github" else auth_crud.link_google

    user = getter(db, oauth_id)
    if not user and email:
        user = auth_crud.get_by_email(db, email)
        if user:
            linker(db, user.id, oauth_id)

    if not user:
        username = email.split("@")[0] if email else f"{provider}_{oauth_id}"
        base_username = username
        suffix = 1
        while auth_crud.get_by_username(db, username):
            username = f"{base_username}{suffix}"
            suffix += 1
        user = auth_crud.create_user_with_random_password(db, username, email, name)
        linker(db, user.id, oauth_id)

    access_token_str = create_access_token({"sub": str(user.id), "username": user.username})
    refresh_token_str = _create_refresh_token(db, user.id)
    set_auth_cookies(response, access_token_str, refresh_token_str)

    frontend_url = _get_frontend_url(request)
    from fastapi.responses import RedirectResponse
    return RedirectResponse(
        url=f"{frontend_url}/dashboard#access_token={access_token_str}&refresh_token={refresh_token_str}",
        status_code=302,
    )


# ── Token Management ─────────────────────────────────────────────


@router.post("/refresh")
def refresh(request: Request, response: Response, db=Depends(get_db)):
    refresh_token_cookie = request.cookies.get("refresh_token")
    auth_header = request.headers.get("Authorization", "")
    refresh_token_str = refresh_token_cookie
    if not refresh_token_str and auth_header.startswith("Bearer "):
        refresh_token_str = auth_header[len("Bearer "):]
    if not refresh_token_str:
        raise HTTPException(status_code=401, detail="No refresh token")

    token_hash = hash_refresh_token(refresh_token_str)
    stored = db.query(RefreshToken).filter(
        RefreshToken.token_hash == token_hash,
        RefreshToken.revoked == False,
    ).first()

    if not stored:
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="Token revoked or reused")

    user_id = stored.user_id
    stored.revoked = True
    db.commit()

    user = auth_crud.get_by_id(db, user_id)
    if not user:
        clear_auth_cookies(response)
        raise HTTPException(status_code=401, detail="User not found")

    access_token_str = create_access_token({"sub": str(user.id), "username": user.username})
    new_refresh_token = _create_refresh_token(db, user_id)
    set_auth_cookies(response, access_token_str, new_refresh_token)
    return {"status": "ok"}


@router.post("/logout")
def logout(response: Response, db=Depends(get_db), current_user=Depends(get_current_user)):
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False,
    ).update({"revoked": True})
    db.commit()
    clear_auth_cookies(response)
    return {"status": "ok"}


# ── Password Management ──────────────────────────────────────────


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
def forgot_password(data: ForgotPasswordRequest, db=Depends(get_db)):
    user = auth_crud.get_by_username(db, data.username)
    if not user:
        return ForgotPasswordResponse(
            has_oauth_providers=False,
            oauth_providers=[],
            message="If that user exists, they will receive a reset code.",
        )

    oauth_providers = []
    if user.github_id and settings.ENABLE_GITHUB_OAUTH:
        oauth_providers.append("github")
    if user.google_id and settings.ENABLE_GOOGLE_OAUTH:
        oauth_providers.append("google")

    if oauth_providers:
        return ForgotPasswordResponse(
            has_oauth_providers=True,
            oauth_providers=oauth_providers,
            message=f"This account uses {', '.join(oauth_providers)}. Sign in with that provider instead.",
        )

    code = secrets.token_hex(4)
    db_code = PasswordReset(
        user_id=user.id,
        code=code,
        expires_at=datetime.utcnow() + timedelta(minutes=15),
    )
    db.add(db_code)
    db.commit()

    return ForgotPasswordResponse(
        reset_code=code,
        message="Use the code below to reset your password. It expires in 15 minutes.",
    )


@router.post("/reset-password")
def reset_password(data: PasswordResetRequest, db=Depends(get_db)):
    record = db.query(PasswordReset).filter(
        PasswordReset.code == data.code,
        PasswordReset.used == False,
        PasswordReset.expires_at > datetime.utcnow(),
    ).first()

    if not record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")

    record.used = True
    auth_crud.set_password(db, record.user_id, data.new_password)
    db.commit()

    db.query(RefreshToken).filter(
        RefreshToken.user_id == record.user_id,
        RefreshToken.revoked == False,
    ).update({"revoked": True})
    db.commit()

    return {"status": "ok"}


@router.post("/set-password")
def set_password(data: SetPasswordRequest, db=Depends(get_db), current_user=Depends(get_current_user)):
    has_oauth = bool(current_user.github_id or current_user.google_id)
    if not has_oauth and not data.current_password:
        raise HTTPException(status_code=400, detail="Current password is required")
    if data.current_password:
        if not verify_password(data.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
    auth_crud.set_password(db, current_user.id, data.new_password)

    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked == False,
    ).update({"revoked": True})
    db.commit()

    return {"status": "ok"}


# ── User Info ────────────────────────────────────────────────────


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user


# ── Helpers ──────────────────────────────────────────────────────


def _create_refresh_token(db, user_id: int) -> str:
    from datetime import datetime, timedelta
    token_str = generate_refresh_token()
    token_hash = hash_refresh_token(token_str)
    db_token = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(db_token)
    db.commit()
    return token_str
