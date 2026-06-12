"""add github_id and google_id columns to users

Revision ID: 0007
Revises: 0006
Create Date: 2026-06-12 08:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0007"
down_revision: Union[str, None] = "0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("github_id", sa.String(100), nullable=True, unique=True))
    op.create_index("ix_users_github_id", "users", ["github_id"])
    op.add_column("users", sa.Column("google_id", sa.String(100), nullable=True, unique=True))
    op.create_index("ix_users_google_id", "users", ["google_id"])


def downgrade() -> None:
    op.drop_index("ix_users_google_id")
    op.drop_column("users", "google_id")
    op.drop_index("ix_users_github_id")
    op.drop_column("users", "github_id")
