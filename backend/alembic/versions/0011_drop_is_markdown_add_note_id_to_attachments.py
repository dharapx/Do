"""drop is_markdown, add note_id to attachments

Revision ID: 0011
Revises: 0010_add_is_markdown_to_notes
Create Date: 2026-06-23 10:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0011"
down_revision: Union[str, None] = "0010_add_is_markdown_to_notes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("notes", "is_markdown")
    op.add_column("attachments", sa.Column("note_id", sa.Integer(), sa.ForeignKey("notes.id", ondelete="CASCADE"), nullable=True, index=True))


def downgrade() -> None:
    op.add_column("notes", sa.Column("is_markdown", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.drop_column("attachments", "note_id")
