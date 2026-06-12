from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="not_started")
    priority: Mapped[str] = mapped_column(String(10), default="medium")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.utcnow(), onupdate=lambda: datetime.utcnow())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    total_time_spent: Mapped[int] = mapped_column(Integer, default=0)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    type: Mapped[str] = mapped_column(String(10), default="task")
    parent_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("tasks.id"), nullable=True, index=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    reference_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("tasks.id"), nullable=True)

    user = relationship("User")
    parent = relationship("Task", remote_side="Task.id", foreign_keys=[parent_id], back_populates="children")
    children = relationship("Task", back_populates="parent", foreign_keys=[parent_id], cascade="all, delete-orphan")
    reference = relationship("Task", remote_side="Task.id", foreign_keys=[reference_id], post_update=True)
    comments = relationship("TaskComment", back_populates="task", cascade="all, delete-orphan")
    tags = relationship("TaskTag", back_populates="task", cascade="all, delete-orphan")
    history = relationship("TaskHistory", back_populates="task", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="task", cascade="all, delete-orphan")
    attachments = relationship("Attachment", back_populates="task", cascade="all, delete-orphan")
