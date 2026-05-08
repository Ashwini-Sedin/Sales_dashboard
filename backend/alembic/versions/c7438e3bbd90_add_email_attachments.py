"""Add email_attachments table

Revision ID: c7438e3bbd90
Revises: b4425111a39e
Create Date: 2026-05-08 11:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'c7438e3bbd90'
down_revision: Union[str, None] = 'b4425111a39e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create enum type for StorageType if not exists
    storage_type_enum = sa.Enum('s3', 'inline', name='storagetype')
    storage_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table('email_attachments',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('email_message_id', sa.UUID(), nullable=False),
    sa.Column('lead_id', sa.UUID(), nullable=False),
    sa.Column('attachment_id', sa.String(), nullable=False),
    sa.Column('filename', sa.String(), nullable=False),
    sa.Column('content_type', sa.String(), nullable=True),
    sa.Column('size_bytes', sa.Integer(), nullable=False, server_default='0'),
    sa.Column('storage_type', sa.Enum('s3', 'inline', name='storagetype'), nullable=False, server_default='inline'),
    sa.Column('storage_key', sa.String(), nullable=True),
    sa.Column('downloaded_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['email_message_id'], ['email_messages.id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['lead_id'], ['leads.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_email_attachments_attachment_id'), 'email_attachments', ['attachment_id'], unique=False)
    op.create_index(op.f('ix_email_attachments_email_message_id'), 'email_attachments', ['email_message_id'], unique=False)
    op.create_index(op.f('ix_email_attachments_lead_id'), 'email_attachments', ['lead_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_email_attachments_lead_id'), table_name='email_attachments')
    op.drop_index(op.f('ix_email_attachments_email_message_id'), table_name='email_attachments')
    op.drop_index(op.f('ix_email_attachments_attachment_id'), table_name='email_attachments')
    op.drop_table('email_attachments')
    
    storage_type_enum = sa.Enum('s3', 'inline', name='storagetype')
    storage_type_enum.drop(op.get_bind(), checkfirst=True)
