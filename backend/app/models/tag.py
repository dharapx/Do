from sqlalchemy import Integer, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TaskTag(Base):
    __tablename__ = "task_tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(Integer, ForeignKey("tasks.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    task = relationship("Task", back_populates="tags")
