from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional

from app.models.document_template import DocumentTemplate
from app.services.s3_service import s3_service

async def get_active_template(
    db: AsyncSession, 
    division_id: UUID, 
    doc_type: str, 
    format: str
) -> Optional[bytes]:
    """
    Fetch the active template for a given division, type, and format.
    Downloads the file from S3 if found.
    """
    # 1. Try to find division-specific template
    stmt = select(DocumentTemplate).where(
        DocumentTemplate.division_id == division_id,
        DocumentTemplate.doc_type == doc_type,
        DocumentTemplate.format == format,
        DocumentTemplate.is_active == True
    )
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    # 2. Fallback to global template if not found
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
        # 3. Fetch template file from S3
        content = b""
        try:
            async for chunk in s3_service.stream_file(template.s3_key):
                content += chunk
            return content
        except Exception:
            return None
        
    return None
