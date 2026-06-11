"""add composite indexes for query performance

Revision ID: 0005
Revises: 2e2e714bb15c
Create Date: 2026-06-11 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "0005"
down_revision: Union[str, None] = "2e2e714bb15c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tasks: composite indexes for filtered/sorted queries
    op.create_index("ix_tasks_user_status", "tasks", ["user_id", "status"])
    op.create_index("ix_tasks_user_priority", "tasks", ["user_id", "priority"])
    op.create_index("ix_tasks_user_created", "tasks", ["user_id", "created_at"])
    op.create_index("ix_tasks_user_updated", "tasks", ["user_id", "updated_at"])

    # Task history: chronological queries per task
    op.create_index("ix_history_task_created", "task_history", ["task_id", "created_at"])

    # Time entries: chronological queries per task
    op.create_index("ix_time_task_created", "time_entries", ["task_id", "created_at"])

    # Notes: list sorting per user
    op.create_index("ix_notes_user_updated", "notes", ["user_id", "updated_at"])

    # Notes: full-text search via trigram GIN (for RAG knowledge base)
    op.execute(
        "CREATE INDEX ix_notes_content_trgm ON notes USING GIN (content gin_trgm_ops)"
    )


def downgrade() -> None:
    op.drop_index("ix_tasks_user_status")
    op.drop_index("ix_tasks_user_priority")
    op.drop_index("ix_tasks_user_created")
    op.drop_index("ix_tasks_user_updated")
    op.drop_index("ix_history_task_created")
    op.drop_index("ix_time_task_created")
    op.drop_index("ix_notes_user_updated")
    op.drop_index("ix_notes_content_trgm")
