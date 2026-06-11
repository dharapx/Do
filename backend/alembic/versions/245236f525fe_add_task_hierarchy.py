"""add task hierarchy

Revision ID: 245236f525fe
Revises: 0004
Create Date: 2026-06-11 09:05:03.220029

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '245236f525fe'
down_revision: Union[str, None] = '0004'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('parent_id', sa.Integer(), nullable=True))
    op.add_column('tasks', sa.Column('sort_order', sa.Integer(), nullable=False, server_default=sa.text('0')))
    op.create_index(op.f('ix_tasks_parent_id'), 'tasks', ['parent_id'], unique=False)
    op.create_foreign_key(None, 'tasks', 'tasks', ['parent_id'], ['id'])


def downgrade() -> None:
    op.drop_constraint(None, 'tasks', type_='foreignkey')
    op.drop_index(op.f('ix_tasks_parent_id'), table_name='tasks')
    op.drop_column('tasks', 'sort_order')
    op.drop_column('tasks', 'parent_id')
