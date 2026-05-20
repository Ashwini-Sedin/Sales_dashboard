"""
Integration tracking model for external service synchronizations.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.core.database import Base


class IntegrationSync(Base):
    """
    Tracks synchronization history for external integrations.
    Useful for auditing, debugging, and incremental sync coordination.
    """

    __tablename__ = "integration_syncs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    integration_type = Column(String(50), nullable=False, index=True)  # 'google_ads', etc.
    sync_type = Column(String(50), nullable=False)  # 'webhook' or 'periodic'
    status = Column(String(20), nullable=False, index=True)  # 'success', 'failed', 'pending'
    
    # Sync statistics
    total_processed = Column(Integer, default=0)
    successful = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    skipped = Column(Integer, default=0)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Result tracking
    result_metadata = Column(JSONB, default=dict)  # Additional result data
    error_message = Column(Text, nullable=True)
    
    # For incrementally tracking syncs
    last_cursor = Column(String, nullable=True)  # Pagination cursor from API
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    def __repr__(self) -> str:
        return (
            f"<IntegrationSync {self.integration_type} "
            f"{self.sync_type} {self.status} "
            f"at {self.started_at}>"
        )
