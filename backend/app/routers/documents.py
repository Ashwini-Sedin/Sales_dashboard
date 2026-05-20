from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List

from app.core.database import get_async_db
from app.core.dependencies import get_current_active_user
from app.models.generated_document import GeneratedDocument
from app.models.document_approval import DocumentApproval
from app.services.notification_service import create_in_app_notification
from app.models.user import User, UserRole
from app.models.lead import Lead
from app.models.division import Division
from app.schemas.document import (
    GeneratedDocumentResponse, 
    GeneratedDocumentListResponse, 
    DocumentApprovalResponse,
    QuickSalesGenerateRequest,
    DocumentGenerationResponse,
    DetailedProposalGenerateRequest,
    DocumentVersionGroupResponse,
    RestoreDocumentResponse,
    PresalesGenerateRequest,
    ApprovalRequest,
    NdaGenerateRequest,
    LegalReviewRequest,
    SowGenerateRequest,
    ManagerApprovalRequest,
    FinalApprovalRequest,
    DraftWithLlmRequest,
    GenerateWithLlmRequest,
    QuickSalesInput
)
from app.tasks.document_tasks import (
    generate_quick_sales_docx_task, 
    generate_quick_sales_pptx_task,
    generate_detailed_proposal_docx_task,
    generate_detailed_proposal_pptx_task,
    generate_presales_docx_task,
    generate_nda_docx_task,
    generate_sow_docx_task
)
from app.services.documents.base_document_service import BaseDocumentService
from app.services.s3_service import s3_service
from app.core.socket_manager import socket_manager
from app.models.activity_timeline import ActivityTimeline, ActivityEventType
from app.services.llm_service import generate_document_inputs
from app.services.documents.quick_sales_docx import QuickSalesDocxService

router = APIRouter(prefix="/api/documents", tags=["documents"])

@router.get("/lead/{lead_id}/versions", response_model=DocumentVersionGroupResponse)
async def get_lead_document_versions(
    lead_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch all versions of documents for a lead, grouped by doc_type.
    """
    # Access check
    stmt_lead = select(Lead).where(Lead.id == lead_id)
    result_lead = await db.execute(stmt_lead)
    lead = result_lead.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.legal, UserRole.viewer] and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    stmt = select(GeneratedDocument).where(GeneratedDocument.lead_id == lead_id).order_by(GeneratedDocument.created_at.desc())
    result = await db.execute(stmt)
    documents = result.scalars().all()

    grouped = {}
    for doc in documents:
        if doc.doc_type not in grouped:
            grouped[doc.doc_type] = []
        grouped[doc.doc_type].append(doc)

    groups = []
    for doc_type, docs in grouped.items():
        # Sort by version number DESC
        sorted_docs = sorted(docs, key=lambda x: x.version_number, reverse=True)
        groups.append({
            "doc_type": doc_type,
            "versions": sorted_docs,
            "latest_version": sorted_docs[0].version_number,
            "latest_status": sorted_docs[0].status
        })

    return {
        "groups": groups,
        "total_documents": len(documents)
    }

@router.post("/draft-with-llm")
async def draft_document_with_llm(
    req: DraftWithLlmRequest,
    current_user: User = Depends(get_current_active_user)
):
    """
    Call GateLLM to generate dynamic, professional note sections based on user inputs.
    """
    try:
        data = await generate_document_inputs(
            doc_type=req.doc_type,
            client_name=req.client_name,
            client_company=req.client_company,
            proposed_solution=req.proposed_solution,
            price_from=req.price_from,
            price_to=req.price_to,
            start_date=req.start_date,
            delivery_date=req.delivery_date
        )
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GateLLM generation failed: {str(e)}")

@router.post("/generate-with-llm")
async def generate_document_with_llm(
    req: GenerateWithLlmRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Assemble and compile the final Word note directly into Neon, S3, and SharePoint!
    """
    try:
        # 1. Obtain AI-generated content (either from frontend or re-generate via GateLLM)
        if req.drafted_content:
            data = req.drafted_content
        else:
            data = await generate_document_inputs(
                doc_type=req.doc_type,
                client_name=req.client_name,
                client_company=req.client_company,
                proposed_solution=req.proposed_solution,
                price_from=req.price_from,
                price_to=req.price_to,
                start_date=req.start_date,
                delivery_date=req.delivery_date
            )

        # 2. Build QuickSalesInput structure
        inputs = QuickSalesInput(
            proposed_solution_name=data.get("proposed_solution_name", req.proposed_solution),
            pricing_range=data.get("pricing_range", f"${req.price_from} - ${req.price_to}"),
            start_date=req.start_date,
            end_date=req.delivery_date,
            key_benefits=data.get("key_benefits", []),
            client_challenges=data.get("client_challenges", []),
            introduction=data.get("introduction"),
            objective=data.get("objective"),
            content_structure=data.get("content_structure"),
            notes=None
        )

        # 3. Instantiate and run compilation service synchronously
        service = QuickSalesDocxService()
        document = await service.generate(
            db=db,
            lead_id=req.lead_id,
            user_id=current_user.id,
            inputs=inputs
        )

        return {
            "document_id": str(document.id),
            "status": "success",
            "message": "Professional note compiled successfully!"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Compilation failed: {str(e)}")

@router.post("/{document_id}/restore", response_model=RestoreDocumentResponse)
async def restore_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Restore a previous version by creating a new version based on it.
    """
    if current_user.role not in [UserRole.super_admin, UserRole.division_head, UserRole.sales_manager]:
        raise HTTPException(status_code=403, detail="Insufficient permissions to restore documents")

    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Original document not found")

    # Fetch lead and division for names
    lead_stmt = select(Lead).where(Lead.id == doc.lead_id)
    lead = (await db.execute(lead_stmt)).scalar_one()
    
    division_stmt = select(Division).where(Division.id == doc.division_id)
    division = (await db.execute(division_stmt)).scalar_one()

    # 1. Download file bytes from S3
    try:
        # Assuming s3_service.stream_file works
        file_bytes = b""
        async for chunk in s3_service.stream_file(doc.s3_key):
            file_bytes += chunk
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download original document: {str(e)}")

    base_service = BaseDocumentService()
    
    # 2. Get next version
    version = await base_service.get_next_version(db, doc.lead_id, doc.doc_type)
    
    # 3. Build new title and filename
    title = base_service.build_document_title(doc.doc_type, version, lead.company_name)
    filename = f"{title}.{doc.format}"
    content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if doc.format == 'docx' else "application/vnd.openxmlformats-officedocument.presentationml.presentation"

    # 4. Upload to S3
    new_s3_key = await base_service.upload_to_s3(
        file_bytes, str(doc.lead_id), str(doc.division_id),
        doc.doc_type, filename, content_type
    )

    # 5. Upload to SharePoint
    folder = await base_service.create_sharepoint_folder(
        str(doc.lead_id), division.name, lead.company_name, doc.doc_type
    )
    sharepoint_url = await base_service.upload_to_sharepoint(file_bytes, folder, filename)

    # 6. Archive current versions
    await base_service.archive_previous_versions(db, doc.lead_id, doc.doc_type)

    # 7. Save new document record
    new_doc = await base_service.save_document_record(
        db=db,
        lead_id=doc.lead_id,
        division_id=doc.division_id,
        template_id=doc.template_id,
        doc_type=doc.doc_type,
        format=doc.format,
        version_number=version,
        title=title,
        s3_key=new_s3_key,
        sharepoint_url=sharepoint_url,
        created_by=current_user.id,
        status='draft'
    )

    # 8. Log activity
    activity = ActivityTimeline(
        lead_id=doc.lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.document_generated,
        description=f"🔄 Document restored from v{doc.version_number} → new v{version}",
        metadata_={
            "doc_type": doc.doc_type,
            "restored_from_version": doc.version_number,
            "new_version": version,
            "document_id": str(new_doc.id)
        }
    )
    db.add(activity)
    await db.commit()

    # 9. Emit socket event
    await socket_manager.emit_to_lead_room(
        lead_id=str(doc.lead_id),
        event="document_generated",
        data={
            "document_id": str(new_doc.id),
            "doc_type": doc.doc_type,
            "format": doc.format,
            "version": version,
            "title": title,
            "restored": True
        }
    )

    return {
        "new_document": new_doc,
        "restored_from_version": doc.version_number,
        "message": f"Document restored as v{version}"
    }

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
        if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.legal, UserRole.viewer] and lead.division_id != current_user.division_id:
            raise HTTPException(status_code=403, detail="Access denied")
            
        stmt = stmt.where(GeneratedDocument.lead_id == lead_id)
    else:
        # Global view: filter by division if not super_admin, admin, legal, or viewer
        if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.legal, UserRole.viewer]:
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
    if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.legal, UserRole.viewer] and document.division_id != current_user.division_id:
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
    if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.legal, UserRole.viewer] and document.division_id != current_user.division_id:
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
        
    if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.legal, UserRole.viewer] and document.division_id != current_user.division_id:
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

@router.post("/presales/generate", response_model=DocumentGenerationResponse)
async def generate_presales_document(
    request: PresalesGenerateRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Enqueue a Celery task to generate a Presales document.
    """
    lead_stmt = select(Lead).where(Lead.id == request.lead_id)
    result = await db.execute(lead_stmt)
    lead = result.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role != UserRole.super_admin and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    task = generate_presales_docx_task.delay(
        lead_id=str(request.lead_id),
        user_id=str(current_user.id),
        inputs=request.dynamic_inputs.model_dump()
    )

    base_service = BaseDocumentService()
    version = await base_service.get_next_version(db, request.lead_id, 'presales')
    
    document = GeneratedDocument(
        lead_id=request.lead_id,
        division_id=lead.division_id,
        doc_type='presales',
        format='docx',
        version_number=version,
        title="Generating...",
        status='pending_approval',
        created_by=current_user.id,
        s3_key=""
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    return {
        "document_id": document.id,
        "task_id": task.id,
        "status": "queued",
        "message": "Presales Document generation started"
    }

@router.put("/{document_id}/approve", response_model=GeneratedDocumentResponse)
async def approve_document(
    document_id: UUID,
    body: ApprovalRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Approve a document (Division Head or Super Admin).
    """
    if current_user.role not in [UserRole.division_head, UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Document is not pending approval")
    
    if current_user.role != UserRole.super_admin and doc.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    doc.status = "approved"
    
    approval = DocumentApproval(
        document_id=document_id,
        approver_id=current_user.id,
        approval_stage="division_head",
        action="approved",
        comments=body.comments,
        actioned_at=datetime.utcnow()
    )
    db.add(approval)
    
    activity = ActivityTimeline(
        lead_id=doc.lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.document_generated,
        description=f"✅ Presales Document v{doc.version_number} approved by {current_user.first_name} {current_user.last_name}"
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(doc)

    await create_in_app_notification(
        db=db,
        user_id=doc.created_by,
        lead_id=doc.lead_id,
        type='doc_generated',
        message=f"Your Presales Document v{doc.version_number} has been approved."
    )

    await socket_manager.emit_to_lead_room(
        lead_id=str(doc.lead_id),
        event="document_status_changed",
        data={
            "document_id": str(document_id),
            "new_status": "approved",
            "doc_type": doc.doc_type
        }
    )

    return doc

@router.put("/{document_id}/reject", response_model=GeneratedDocumentResponse)
async def reject_document(
    document_id: UUID,
    body: ApprovalRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Reject a document (Division Head or Super Admin).
    """
    if current_user.role not in [UserRole.division_head, UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if not body.comments:
        raise HTTPException(status_code=400, detail="Rejection comments are required")

    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "pending_approval":
        raise HTTPException(status_code=400, detail="Document is not pending approval")

    doc.status = "draft"
    
    approval = DocumentApproval(
        document_id=document_id,
        approver_id=current_user.id,
        approval_stage="division_head",
        action="rejected",
        comments=body.comments,
        actioned_at=datetime.utcnow()
    )
    db.add(approval)
    
    activity = ActivityTimeline(
        lead_id=doc.lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.document_generated,
        description=f"❌ Presales Document v{doc.version_number} rejected by {current_user.first_name} {current_user.last_name}",
        metadata_={"rejection_comments": body.comments}
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(doc)

    await create_in_app_notification(
        db=db,
        user_id=doc.created_by,
        lead_id=doc.lead_id,
        type='doc_generated',
        message=f"Your Presales Document v{doc.version_number} was rejected. Comments: {body.comments}"
    )

    await socket_manager.emit_to_lead_room(
        lead_id=str(doc.lead_id),
        event="document_status_changed",
        data={
            "document_id": str(document_id),
            "new_status": "draft",
            "rejected": True,
            "comments": body.comments
        }
    )

    return doc

@router.post("/nda/generate", response_model=DocumentGenerationResponse)
async def generate_nda_document(
    request: NdaGenerateRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Enqueue a Celery task to generate an NDA document.
    """
    lead_stmt = select(Lead).where(Lead.id == request.lead_id)
    result = await db.execute(lead_stmt)
    lead = result.scalar_one_or_none()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if current_user.role != UserRole.super_admin and lead.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    task = generate_nda_docx_task.delay(
        lead_id=str(request.lead_id),
        user_id=str(current_user.id),
        inputs=request.dynamic_inputs.model_dump()
    )

    base_service = BaseDocumentService()
    version = await base_service.get_next_version(db, request.lead_id, 'nda')
    
    document = GeneratedDocument(
        lead_id=request.lead_id,
        division_id=lead.division_id,
        doc_type='nda',
        format='docx',
        version_number=version,
        title="Generating...",
        status='pending_legal_review',
        created_by=current_user.id,
        s3_key=""
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    return {
        "document_id": document.id,
        "task_id": task.id,
        "status": "queued",
        "message": "NDA Document generation started"
    }

@router.put("/{document_id}/legal-approve", response_model=GeneratedDocumentResponse)
async def legal_approve_document(
    document_id: UUID,
    body: LegalReviewRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Legal approval for an NDA document.
    """
    if current_user.role not in [UserRole.legal, UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "pending_legal_review":
        raise HTTPException(status_code=400, detail="Document is not pending legal review")
    
    if current_user.role not in [UserRole.super_admin, UserRole.admin, UserRole.legal] and doc.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    doc.status = "approved"
    
    approval = DocumentApproval(
        document_id=document_id,
        approver_id=current_user.id,
        approval_stage="legal",
        action="approved",
        comments=body.comments,
        actioned_at=datetime.utcnow()
    )
    db.add(approval)
    
    activity = ActivityTimeline(
        lead_id=doc.lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.document_generated,
        description=f"⚖️ NDA v{doc.version_number} approved by Legal: {current_user.first_name} {current_user.last_name}"
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(doc)

    await create_in_app_notification(
        db=db,
        user_id=doc.created_by,
        lead_id=doc.lead_id,
        type='doc_generated',
        message=f"Your NDA v{doc.version_number} has been approved by Legal."
    )

    await socket_manager.emit_to_lead_room(
        lead_id=str(doc.lead_id),
        event="document_status_changed",
        data={
            "document_id": str(document_id),
            "new_status": "approved",
            "doc_type": "nda"
        }
    )

    return doc

@router.put("/{document_id}/legal-reject", response_model=GeneratedDocumentResponse)
async def legal_reject_document(
    document_id: UUID,
    body: LegalReviewRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Legal rejection for an NDA document.
    """
    if current_user.role not in [UserRole.legal, UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if not body.comments:
        raise HTTPException(status_code=400, detail="Rejection comments are required")

    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "pending_legal_review":
        raise HTTPException(status_code=400, detail="Document is not pending legal review")

    doc.status = "draft"
    
    approval = DocumentApproval(
        document_id=document_id,
        approver_id=current_user.id,
        approval_stage="legal",
        action="rejected",
        comments=body.comments,
        actioned_at=datetime.utcnow()
    )
    db.add(approval)
    
    activity = ActivityTimeline(
        lead_id=doc.lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.document_generated,
        description=f"❌ NDA v{doc.version_number} rejected by Legal. Reason: {body.comments}"
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(doc)

    await create_in_app_notification(
        db=db,
        user_id=doc.created_by,
        lead_id=doc.lead_id,
        type='doc_generated',
        message=f"Your NDA v{doc.version_number} was rejected by Legal. Comments: {body.comments}"
    )

    await socket_manager.emit_to_lead_room(
        lead_id=str(doc.lead_id),
        event="document_status_changed",
        data={
            "document_id": str(document_id),
            "new_status": "draft",
            "rejected": True,
            "doc_type": "nda",
            "comments": body.comments
        }
    )

    return doc

@router.post("/sow/generate", response_model=DocumentGenerationResponse)
async def generate_sow_document(
    request: SowGenerateRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Enqueue a Celery task to generate an SOW document.
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
    task = generate_sow_docx_task.delay(
        lead_id=str(request.lead_id),
        user_id=str(current_user.id),
        inputs=request.dynamic_inputs.model_dump()
    )

    # Create a placeholder record
    base_service = BaseDocumentService()
    version = await base_service.get_next_version(db, request.lead_id, 'sow')
    
    document = GeneratedDocument(
        lead_id=request.lead_id,
        division_id=lead.division_id,
        doc_type='sow',
        format='docx',
        version_number=version,
        title="Generating...",
        status='pending_manager_review',
        created_by=current_user.id,
        s3_key=""
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    return {
        "document_id": document.id,
        "task_id": task.id,
        "status": "pending_manager_review",
        "message": "SOW Document generation started"
    }

@router.put("/{document_id}/manager-approve", response_model=GeneratedDocumentResponse)
async def manager_approve_sow(
    document_id: UUID,
    body: ManagerApprovalRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Manager approval for SOW.
    """
    if current_user.role not in [UserRole.sales_manager, UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "pending_manager_review":
        raise HTTPException(status_code=400, detail="Document is not pending manager review")
    
    if current_user.role != UserRole.super_admin and doc.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    doc.status = "pending_legal_review"
    
    approval = DocumentApproval(
        document_id=document_id,
        approver_id=current_user.id,
        approval_stage="manager",
        action="approved",
        comments=body.comments,
        actioned_at=datetime.utcnow()
    )
    db.add(approval)
    
    # Fetch all legal users in division
    legal_stmt = select(User).where(
        User.role == UserRole.legal,
        User.division_id == doc.division_id
    )
    result = await db.execute(legal_stmt)
    legal_users = result.scalars().all()
    
    # Fetch lead for name
    lead_stmt = select(Lead).where(Lead.id == doc.lead_id)
    lead_res = await db.execute(lead_stmt)
    lead = lead_res.scalar_one()

    for legal_user in legal_users:
        await create_in_app_notification(
            db=db,
            user_id=legal_user.id,
            lead_id=doc.lead_id,
            type='doc_generated',
            message=f"SOW v{doc.version_number} for {lead.company_name} requires legal review."
        )

    activity = ActivityTimeline(
        lead_id=doc.lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.document_generated,
        description=f"✅ SOW v{doc.version_number} approved by Manager: {current_user.first_name} {current_user.last_name} → Pending Legal Review"
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(doc)

    await socket_manager.emit_to_lead_room(
        lead_id=str(doc.lead_id),
        event="document_status_changed",
        data={
            "document_id": str(document_id),
            "new_status": "pending_legal_review",
            "doc_type": "sow"
        }
    )

    return doc

@router.put("/{document_id}/legal-approve-sow", response_model=GeneratedDocumentResponse)
async def legal_approve_sow(
    document_id: UUID,
    body: LegalReviewRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Legal approval for SOW.
    """
    if current_user.role not in [UserRole.legal, UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "pending_legal_review" or doc.doc_type != "sow":
        raise HTTPException(status_code=400, detail="Invalid document status or type")
    
    if current_user.role != UserRole.super_admin and doc.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    doc.status = "pending_final_approval"
    
    approval = DocumentApproval(
        document_id=document_id,
        approver_id=current_user.id,
        approval_stage="legal",
        action="approved",
        comments=body.comments,
        actioned_at=datetime.utcnow()
    )
    db.add(approval)
    
    # Fetch division head user
    division_stmt = select(Division).where(Division.id == doc.division_id)
    div_res = await db.execute(division_stmt)
    division = div_res.scalar_one()
    
    # Fetch lead for name
    lead_stmt = select(Lead).where(Lead.id == doc.lead_id)
    lead_res = await db.execute(lead_stmt)
    lead = lead_res.scalar_one()

    if division.head_user_id:
        await create_in_app_notification(
            db=db,
            user_id=division.head_user_id,
            lead_id=doc.lead_id,
            type='doc_generated',
            message=f"SOW v{doc.version_number} for {lead.company_name} requires your final approval."
        )

    activity = ActivityTimeline(
        lead_id=doc.lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.document_generated,
        description=f"⚖️ SOW v{doc.version_number} approved by Legal → Pending Final Approval"
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(doc)

    await socket_manager.emit_to_lead_room(
        lead_id=str(doc.lead_id),
        event="document_status_changed",
        data={
            "document_id": str(document_id),
            "new_status": "pending_final_approval",
            "doc_type": "sow"
        }
    )

    return doc

@router.put("/{document_id}/final-approve", response_model=GeneratedDocumentResponse)
async def final_approve_sow(
    document_id: UUID,
    body: FinalApprovalRequest,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Final approval for SOW.
    """
    if current_user.role not in [UserRole.division_head, UserRole.super_admin]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = select(GeneratedDocument).where(GeneratedDocument.id == document_id)
    result = await db.execute(stmt)
    doc = result.scalar_one_or_none()
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc.status != "pending_final_approval":
        raise HTTPException(status_code=400, detail="Document is not pending final approval")
    
    if current_user.role != UserRole.super_admin and doc.division_id != current_user.division_id:
        raise HTTPException(status_code=403, detail="Access denied")

    doc.status = "approved"
    
    approval = DocumentApproval(
        document_id=document_id,
        approver_id=current_user.id,
        approval_stage="final",
        action="approved",
        comments=body.comments,
        actioned_at=datetime.utcnow()
    )
    db.add(approval)
    
    await create_in_app_notification(
        db=db,
        user_id=doc.created_by,
        lead_id=doc.lead_id,
        type='doc_generated',
        message=f"SOW v{doc.version_number} has received final approval and is ready to send for signature."
    )

    activity = ActivityTimeline(
        lead_id=doc.lead_id,
        actor_id=current_user.id,
        event_type=ActivityEventType.document_generated,
        description=f"🎉 SOW v{doc.version_number} received final approval from Division Head — Ready for Signature"
    )
    db.add(activity)
    
    await db.commit()
    await db.refresh(doc)

    await socket_manager.emit_to_lead_room(
        lead_id=str(doc.lead_id),
        event="document_status_changed",
        data={
            "document_id": str(document_id),
            "new_status": "approved",
            "doc_type": "sow",
            "ready_for_signature": True
        }
    )

    return doc
