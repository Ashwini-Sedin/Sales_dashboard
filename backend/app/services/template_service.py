import logging
from uuid import UUID
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.models.document_template import DocumentTemplate
from app.services.s3_service import s3_service

logger = logging.getLogger(__name__)

async def get_active_template(
    db: AsyncSession,
    division_id: UUID,
    doc_type: str,
    format: str
) -> Optional[bytes]:
    """
    Fetch the active template bytes from S3 for a given division + doc_type + format combination.
    """
    # 1. Query for division-specific template
    stmt = select(DocumentTemplate).where(
        DocumentTemplate.division_id == division_id,
        DocumentTemplate.doc_type == doc_type,
        DocumentTemplate.format == format,
        DocumentTemplate.is_active == True
    )
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()

    # 2. Fallback to global template
    if not template:
        stmt_global = select(DocumentTemplate).where(
            DocumentTemplate.division_id == None,
            DocumentTemplate.doc_type == doc_type,
            DocumentTemplate.format == format,
            DocumentTemplate.is_active == True
        )
        result_global = await db.execute(stmt_global)
        template = result_global.scalar_one_or_none()

    if template:
        logger.info(f"Active template found: {template.template_name}")
        content = b""
        try:
            async for chunk in s3_service.stream_file(template.s3_key):
                content += chunk
            return content
        except Exception as e:
            logger.error(f"Error downloading template from S3: {e}")
            return None
    
    logger.info("No active template found, generating from scratch")
    return None

async def deactivate_previous_templates(
    db: AsyncSession,
    division_id: Optional[UUID],
    doc_type: str,
    format: str
) -> None:
    """
    Set is_active = False for all existing active templates with same criteria.
    """
    stmt = (
        update(DocumentTemplate)
        .where(
            DocumentTemplate.division_id == division_id,
            DocumentTemplate.doc_type == doc_type,
            DocumentTemplate.format == format,
            DocumentTemplate.is_active == True
        )
        .values(is_active=False)
    )
    await db.execute(stmt)
    await db.commit()
