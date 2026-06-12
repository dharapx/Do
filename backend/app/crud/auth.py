import secrets

from sqlalchemy import select

from app.database import SessionLocal
from app.models.user import User
from app.core.auth import hash_password, verify_password
from app.schemas.auth import SignupRequest


class CRUDAuth:
    def create_user(self, db: SessionLocal, data: SignupRequest) -> User:
        user = User(
            username=data.username,
            email=data.email,
            hashed_password=hash_password(data.password),
            display_name=data.display_name or data.username,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def create_user_with_random_password(
        self, db: SessionLocal, username: str, email: str, display_name: str | None = None,
    ) -> User:
        random_pw = secrets.token_urlsafe(24)
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(random_pw),
            display_name=display_name or username,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def get_by_username(self, db: SessionLocal, username: str) -> User | None:
        return db.execute(select(User).where(User.username == username)).scalars().first()

    def get_by_email(self, db: SessionLocal, email: str) -> User | None:
        return db.execute(select(User).where(User.email == email)).scalars().first()

    def get_by_id(self, db: SessionLocal, user_id: int) -> User | None:
        return db.get(User, user_id)

    def get_by_github_id(self, db: SessionLocal, github_id: str) -> User | None:
        return db.execute(select(User).where(User.github_id == github_id)).scalars().first()

    def get_by_google_id(self, db: SessionLocal, google_id: str) -> User | None:
        return db.execute(select(User).where(User.google_id == google_id)).scalars().first()

    def authenticate(self, db: SessionLocal, username: str, password: str) -> User | None:
        user = self.get_by_username(db, username)
        if user and verify_password(password, user.hashed_password):
            return user
        return None

    def set_password(self, db: SessionLocal, user_id: int, new_password: str) -> None:
        user = db.get(User, user_id)
        if user:
            user.hashed_password = hash_password(new_password)
            db.commit()

    def link_github(self, db: SessionLocal, user_id: int, github_id: str) -> None:
        user = db.get(User, user_id)
        if user:
            user.github_id = github_id
            db.commit()

    def link_google(self, db: SessionLocal, user_id: int, google_id: str) -> None:
        user = db.get(User, user_id)
        if user:
            user.google_id = google_id
            db.commit()


auth_crud = CRUDAuth()
