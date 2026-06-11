"""Add users table and user_id associations

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-08 15:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(120), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.execute("INSERT INTO users (username, email, hashed_password, display_name) VALUES ('admin', 'admin@example.com', 'placeholder', 'Admin')")

    op.add_column("tasks", sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, server_default="1"))
    op.alter_column("tasks", "user_id", server_default=None)
    op.create_index(op.f("ix_tasks_user_id"), "tasks", ["user_id"], unique=False)

    op.add_column("task_comments", sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, server_default="1"))
    op.alter_column("task_comments", "user_id", server_default=None)

    op.add_column("task_history", sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, server_default="1"))
    op.alter_column("task_history", "user_id", server_default=None)

    op.add_column("time_entries", sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, server_default="1"))
    op.alter_column("time_entries", "user_id", server_default=None)


def downgrade() -> None:
    op.drop_column("time_entries", "user_id")
    op.drop_column("task_history", "user_id")
    op.drop_column("task_comments", "user_id")
    op.drop_index(op.f("ix_tasks_user_id"), table_name="tasks")
    op.drop_column("tasks", "user_id")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
