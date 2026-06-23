"""make task_id nullable in attachments

Revision ID: 0012
Revises: 0011
Create Date: 2026-06-23 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("attachments", "task_id", nullable=True)


def downgrade() -> None:
    op.alter_column("attachments", "task_id", nullable=False)
