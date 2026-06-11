"""add task type and reference_id

Revision ID: 2e2e714bb15c
Revises: 245236f525fe
Create Date: 2026-06-11 10:11:00.050413

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "2e2e714bb15c"
down_revision: Union[str, None] = "245236f525fe"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("type", sa.String(10), server_default="task", nullable=False))
    op.add_column("tasks", sa.Column("reference_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_tasks_reference_id", "tasks", "tasks", ["reference_id"], ["id"])


def downgrade() -> None:
    op.drop_constraint("fk_tasks_reference_id", "tasks", type_="foreignkey")
    op.drop_column("tasks", "reference_id")
    op.drop_column("tasks", "type")
