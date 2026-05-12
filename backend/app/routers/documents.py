from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.core.database import get_async_db
from app.core.dependencies import get_current_active_user
from app.models.generated_document import GeneratedDocument
from app.models.document_approval import DocumentApproval
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.schemas.document import (
    GeneratedDocumentResponse, 
    GeneratedDocumentListResponse, 
    DocumentApprovalResponse,
    QuickSalesGenerateRequest,
    DocumentGenerationResponse,
    DetailedProposalGenerateRequest
)
from app.tasks.document_tasks import (
    generate_quick_sales_docx_task, 
    generate_quick_sales_pptx_task,
    generate_detailed_proposal_docx_task,
    generate_detailed_proposal_pptx_task
)
from app.services.documents.base_document_service import BaseDocumentService
from app.services.s3_service import s3_service

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("/", response_model=GeneratedDocumentListResponse)
async def list_documents(
    lead_id: UUID | None = Query(None),
    doc_type: str | None = None,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch GeneratedDocument records.
    If lead_id provided: return documents for that lead (with access check).
    If lead_id not provided: return all documents for user's division (or all for super_admin).
    """
    stmt = select(GeneratedDocument, Lead.company_name.label("lead_company_name")).join(Lead, GeneratedDocument.lead_id == Lead.id)
    
    if lead_id:
        # Fetch lead for division access check
        stmt_lead = select(Lead).where(Lead.id == lead_id)
        result_lead = await db.execute(stmt_lead)
        lead = result_lead.scalar_one_or_none()
        
        if not lead:
            raise HTTPException(status_code=404, detail="Lead not found")
            
        # Division access check
        if current_user.role != UserRole.super_admin and lead.division_id != current_user.division_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        stmt = stmt.where(GeneratedDocument.lead_id == lead_id)
    else:
        # Global view: filter by division if not super_admin
        if current_user.role != UserRole.super_admin:
            stmt = stmt.where(GeneratedDocument.division_id == current_user.division_id)

    if doc_type:
        stmt = stmt.where(GeneratedDocument.doc_type == doc_type)
    
    stmt = stmt.order_by(GeneratedDocument.created_at.desc())
    
    result = await db.execute(stmt)
    rows = result.all()
    
    documents = []
    for doc, company_name in rows:
        doc.lead_company_name = company_name
        documents.append(doc)
    
    return {
        "documents": documents,
        "total": len(documents)
    }

@router.get("/{document_id}", response_model=GeneratedDocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_async_db),
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
    db: AsyncSession = Depends(get_async_db),
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
    db: AsyncSession = Depends(get_async_db),
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

@router.post("/quick-sales/generate", response_model=DocumentGenerationResponse)
async def generate_quick_sales_document(
    request: QuickSalesGenerateRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Enqueue a Celery task to generate a Quick Sales document.
    """
    # Validate user has access to the lead's division
    lead_stmt = select(Lead).where(Lead.id == request.lead_id)
    result = await db.execute(lead_stmt)
    lead = result.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role != UserRole.super_admin and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied to this lead's division")

    # Enqueue Celery task
    if request.format == "docx":
        task = generate_quick_sales_docx_task.delay(
            lead_id=str(request.lead_id),
            user_id=str(current_user.id),
            inputs=request.dynamic_inputs.model_dump()
        )
    elif request.format == "pptx":
        task = generate_quick_sales_pptx_task.delay(
            lead_id=str(request.lead_id),
            user_id=str(current_user.id),
            inputs=request.dynamic_inputs.model_dump()
        )
    else:
        raise HTTPException(status_code=400, detail="Format must be 'docx' or 'pptx'")

    # Create a placeholder GeneratedDocument record in DB immediately
    base_service = BaseDocumentService()
    version = await base_service.get_next_version(db, request.lead_id, 'quick_sales')
    
    document = GeneratedDocument(
        lead_id=request.lead_id,
        division_id=lead.division_id,
        doc_type='quick_sales',
        format=request.format,
        version_number=version,
        title="Generating...",
        status='draft',
        created_by=current_user.id,
        s3_key="" # Placeholder until task completes
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    return {
        "document_id": document.id,
        "task_id": task.id,
        "status": "queued",
        "message": f"Quick Sales {request.format.upper()} generation started"
    }

@router.post("/detailed-proposal/generate", response_model=DocumentGenerationResponse)
async def generate_detailed_proposal_document(
    request: DetailedProposalGenerateRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Enqueue a Celery task to generate a Detailed Proposal document.
    """
    # Validate user has access to the lead's division
    lead_stmt = select(Lead).where(Lead.id == request.lead_id)
    result = await db.execute(lead_stmt)
    lead = result.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role != UserRole.super_admin and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied to this lead's division")

    # Enqueue Celery task
    if request.format == "docx":
        task = generate_detailed_proposal_docx_task.delay(
            lead_id=str(request.lead_id),
            user_id=str(current_user.id),
            inputs=request.dynamic_inputs.model_dump()
        )
    elif request.format == "pptx":
        task = generate_detailed_proposal_pptx_task.delay(
            lead_id=str(request.lead_id),
            user_id=str(current_user.id),
            inputs=request.dynamic_inputs.model_dump()
        )
    else:
        raise HTTPException(status_code=400, detail="Format must be 'docx' or 'pptx'")

    # Create a placeholder GeneratedDocument record in DB immediately
    base_service = BaseDocumentService()
    version = await base_service.get_next_version(db, request.lead_id, 'detailed_proposal')
    
    document = GeneratedDocument(
        lead_id=request.lead_id,
        division_id=lead.division_id,
        doc_type='detailed_proposal',
        format=request.format,
        version_number=version,
        title="Generating...",
        status='draft',
        created_by=current_user.id,
        s3_key="" # Placeholder
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    return {
        "document_id": document.id,
        "task_id": task.id,
        "status": "queued",
        "message": f"Detailed Proposal {request.format.upper()} generation started"
    }
