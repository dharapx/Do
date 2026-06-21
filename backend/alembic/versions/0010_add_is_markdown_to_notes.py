"""add is_markdown to notes

Revision ID: 0010_add_is_markdown_to_notes
Revises: 2e2e714bb15c
Create Date: 2026-06-21 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0010_add_is_markdown_to_notes"
down_revision: Union[str, None] = "0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("notes", sa.Column("is_markdown", sa.Boolean(), nullable=False, server_default=sa.text("false")))


def downgrade() -> None:
    op.drop_column("notes", "is_markdown")
