"""add offsets to tasks

Revision ID: 96d4c624491a
Revises: 9bd82d4f717c
Create Date: 2026-05-25 01:37:05.823972

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '96d4c624491a'
down_revision: Union[str, Sequence[str], None] = '9bd82d4f717c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('tasks', sa.Column('offsets', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('tasks', 'offsets')
