import os
try:
    import magic
except ImportError:
    magic = None
import mimetypes
from datetime import datetime
from uuid import UUID, uuid4
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_async_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.document_template import DocumentTemplate
from app.models.user import User, UserRole
from app.schemas.document import DocumentTemplateResponse, TemplateUploadResponse
from app.services.s3_service import s3_service
from app.services.template_service import deactivate_previous_templates
from app.tasks.template_tasks import generate_template_thumbnail_task

router = APIRouter(prefix="/api/templates", tags=["templates"])

ALLOWED_MIME_TYPES = {
    "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

@router.post("/upload", response_model=TemplateUploadResponse)
async def upload_template(
    template_name: str = Form(...),
    doc_type: str = Form(...),
    format: str = Form(...),
    division_id: Optional[UUID] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.division_head]))
):
    # 1. Validate File Size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum 50MB.")

    # 2. Validate MIME type
    if magic:
        mime = magic.from_buffer(file_bytes, mime=True)
    else:
        mime, _ = mimetypes.guess_type(file.filename)
    expected_mime = ALLOWED_MIME_TYPES.get(format)
    
    if mime != expected_mime:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid file type. Only .{format} files are allowed for this format."
        )

    # 3. Upload to S3
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    s3_path = f"templates/{division_id or 'global'}/{doc_type}/{format}/{timestamp}_{file.filename}"
    
    s3_key = s3_service.upload_file(
        key=s3_path,
        content_bytes=file_bytes,
        content_type=file.content_type
    )

    # 4. Save to DB
    new_template = DocumentTemplate(
        id=uuid4(),
        division_id=division_id,
        doc_type=doc_type,
        format=format,
        template_name=template_name,
        s3_key=s3_key,
        thumbnail_s3_key=None,
        is_active=False,
        created_by=current_user.id,
        created_at=datetime.utcnow()
    )
    
    db.add(new_template)
    await db.commit()
    await db.refresh(new_template)

    # 5. Enqueue thumbnail task
    generate_template_thumbnail_task.delay(str(new_template.id))

    return {
        "id": new_template.id,
        "template_name": new_template.template_name,
        "doc_type": new_template.doc_type,
        "format": new_template.format,
        "is_active": new_template.is_active,
        "thumbnail_status": "pending",
        "message": "Template uploaded! Thumbnail is being generated."
    }

@router.get("/", response_model=List[DocumentTemplateResponse])
async def list_templates(
    division_id: Optional[UUID] = Query(None),
    doc_type: Optional[str] = Query(None),
    format: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = select(DocumentTemplate)
    if division_id:
        stmt = stmt.where(DocumentTemplate.division_id == division_id)
    if doc_type:
        stmt = stmt.where(DocumentTemplate.doc_type == doc_type)
    if format:
        stmt = stmt.where(DocumentTemplate.format == format)
    
    stmt = stmt.order_by(DocumentTemplate.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{template_id}", response_model=DocumentTemplateResponse)
async def get_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template

@router.put("/{template_id}/activate", response_model=DocumentTemplateResponse)
async def activate_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_roles([UserRole.admin, UserRole.division_head]))
):
    stmt = select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    # Deactivate previous ones
    await deactivate_previous_templates(db, template.division_id, template.doc_type, template.format)
    
    template.is_active = True
    await db.commit()
    await db.refresh(template)
    
    return template

@router.get("/{template_id}/preview")
async def get_template_preview(
    template_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    if template.thumbnail_s3_key:
        content = b""
        async for chunk in s3_service.stream_file(template.thumbnail_s3_key):
            content += chunk
        return Response(content=content, media_type="image/png")
    
    # Return placeholder
    placeholder_path = os.path.join(os.path.dirname(__file__), "..", "static", "placeholder_template.png")
    if os.path.exists(placeholder_path):
        with open(placeholder_path, "rb") as f:
            placeholder_bytes = f.read()
    else:
        # Emergency pixel if file missing
        placeholder_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"

    return Response(
        content=placeholder_bytes,
        media_type="image/png",
        headers={"X-Thumbnail-Status": "pending"}
    )

@router.delete("/{template_id}")
async def delete_template(
    template_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_roles([UserRole.admin]))
):
    stmt = select(DocumentTemplate).where(DocumentTemplate.id == template_id)
    result = await db.execute(stmt)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
        
    await db.delete(template)
    await db.commit()
    
    return {"message": "Template deleted"}
