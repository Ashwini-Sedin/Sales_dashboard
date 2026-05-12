from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.generated_document import GeneratedDocument
from app.models.document_approval import DocumentApproval
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.schemas.document import (
    GeneratedDocumentResponse, 
    GeneratedDocumentListResponse, 
    DocumentApprovalResponse
)
from app.services.s3_service import s3_service

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("/", response_model=GeneratedDocumentListResponse)
async def list_documents(
    lead_id: UUID = Query(...),
    doc_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch all GeneratedDocument records for lead_id.
    Division access check: non-admins can only see documents for leads in their division.
    """
    # Fetch lead for division access check
    stmt_lead = select(Lead).where(Lead.id == lead_id)
    result_lead = await db.execute(stmt_lead)
    lead = result_lead.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    # Division access check
    if current_user.role != UserRole.super_admin and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch documents
    stmt = select(GeneratedDocument).where(GeneratedDocument.lead_id == lead_id)
    if doc_type:
        stmt = stmt.where(GeneratedDocument.doc_type == doc_type)
    
    stmt = stmt.order_by(GeneratedDocument.version_number.desc())
    
    result = await db.execute(stmt)
    documents = result.scalars().all()
    
    # Total count
    count_stmt = select(func.count()).select_from(GeneratedDocument).where(GeneratedDocument.lead_id == lead_id)
    if doc_type:
        count_stmt = count_stmt.where(GeneratedDocument.doc_type == doc_type)
    result_count = await db.execute(count_stmt)
    total = result_count.scalar()

    return {"documents": documents, "total": total}

@router.get("/{document_id}", response_model=GeneratedDocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch single GeneratedDocument by id. Division access check.
    """
    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Division access check
    if current_user.role != UserRole.super_admin and document.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    return document

@router.get("/{document_id}/download")
async def download_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch GeneratedDocument by id. Generate S3 presigned URL.
    """
    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Division access check
    if current_user.role != UserRole.super_admin and document.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    # Generate S3 presigned URL
    # s3_service.get_presigned_url is synchronous in this project
    url = s3_service.get_presigned_url(
        s3_key=document.s3_key,
        expiry_seconds=3600
    )
    
    return {"download_url": url, "expires_in": 3600, "filename": document.title}

@router.get("/{document_id}/approvals", response_model=List[DocumentApprovalResponse])
async def get_document_approvals(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch all DocumentApproval records for document_id.
    """
    # Fetch document first for access check
    stmt_doc = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result_doc = await db.execute(stmt_doc)
    document = result_doc.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if current_user.role != UserRole.super_admin and document.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    stmt = select(DocumentApproval).where(DocumentApproval.document_id == document_id)
    result = await db.execute(stmt)
    approvals = result.scalars().all()
    
    return approvals
