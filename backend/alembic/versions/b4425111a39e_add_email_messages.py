"""Add email_messages table

Revision ID: b4425111a39e
Revises: c6d08792d048
Create Date: 2026-05-08 10:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'b4425111a39e'
down_revision: Union[str, None] = 'c6d08792d048'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('email_messages',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('lead_id', sa.UUID(), nullable=False),
    sa.Column('message_id', sa.String(), nullable=False),
    sa.Column('subject', sa.String(), nullable=True),
    sa.Column('sender_email', sa.String(), nullable=True),
    sa.Column('sender_name', sa.String(), nullable=True),
    sa.Column('recipients', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('body_html', sa.Text(), nullable=True),
    sa.Column('body_preview', sa.String(), nullable=True),
    sa.Column('received_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('has_attachments', sa.Boolean(), nullable=True),
    sa.Column('is_outgoing', sa.Boolean(), nullable=True),
    sa.Column('raw_metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_messages_lead_id'), 'email_messages', ['lead_id'], unique=False)
    op.create_index(op.f('ix_email_messages_message_id'), 'email_messages', ['message_id'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_email_messages_message_id'), table_name='email_messages')
    op.drop_index(op.f('ix_email_messages_lead_id'), table_name='email_messages')
    op.drop_table('email_messages')
