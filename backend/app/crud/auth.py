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

    def get_by_username(self, db: SessionLocal, username: str) -> User | None:
        return db.execute(select(User).where(User.username == username)).scalars().first()

    def get_by_email(self, db: SessionLocal, email: str) -> User | None:
        return db.execute(select(User).where(User.email == email)).scalars().first()

    def get_by_id(self, db: SessionLocal, user_id: int) -> User | None:
        return db.get(User, user_id)

    def authenticate(self, db: SessionLocal, username: str, password: str) -> User | None:
        user = self.get_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user


auth_crud = CRUDAuth()
