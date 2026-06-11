from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.api.deps import get_db, get_current_user
from app.crud.auth import auth_crud
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, UserResponse
from app.core.auth import create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer(auto_error=False)


@router.post("/signup", response_model=TokenResponse, status_code=201)
def signup(data: SignupRequest, db=Depends(get_db)):
    if auth_crud.get_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if auth_crud.get_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = auth_crud.create_user(db, data)
    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db=Depends(get_db)):
    user = auth_crud.authenticate(db, data.username, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": str(user.id), "username": user.username})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user=Depends(get_current_user)):
    return current_user
