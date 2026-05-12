from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.core.database import get_async_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.case_study import CaseStudy
from app.models.user import UserRole
from app.schemas.document import CaseStudyResponse, CaseStudyCreate, CaseStudyUpdate
from app.services.s3_service import s3_service

router = APIRouter(prefix="/api/case-studies", tags=["case-studies"])

@router.get("/", response_model=List[CaseStudyResponse])
async def list_case_studies(
    division_id: Optional[UUID] = None,
    industry: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_active_user)
):
    """
    Fetch all active CaseStudy records (is_active = True).
    Optional filters: division_id, industry.
    Ordered by title ASC.
    """
    stmt = select(CaseStudy).where(CaseStudy.is_active == True)
    if division_id:
        stmt = stmt.where(CaseStudy.division_id == division_id)
    if industry:
        stmt = stmt.where(CaseStudy.industry == industry)
    
    stmt = stmt.order_by(CaseStudy.title.asc())
    
    result = await db.execute(stmt)
    case_studies = result.scalars().all()
    
    # Generate presigned URLs
    for cs in case_studies:
        if cs.s3_image_key:
            cs.image_url = s3_service.get_presigned_url(cs.s3_image_key)
        else:
            cs.image_url = None
            
    return case_studies

@router.get("/{case_study_id}", response_model=CaseStudyResponse)
async def get_case_study(
    case_study_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(get_current_active_user)
):
    """Fetch single CaseStudy by id."""
    stmt = select(CaseStudy).where(CaseStudy.id == case_study_id)
    result = await db.execute(stmt)
    case_study = result.scalar_one_or_none()
    
    if not case_study:
        raise HTTPException(status_code=404, detail="Case study not found")
    
    if case_study.s3_image_key:
        case_study.image_url = s3_service.get_presigned_url(case_study.s3_image_key)
    else:
        case_study.image_url = None
        
    return case_study

@router.post("/", response_model=CaseStudyResponse, status_code=status.HTTP_201_CREATED)
async def create_case_study(
    case_study_in: CaseStudyCreate,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(require_roles([UserRole.super_admin, UserRole.division_head]))
):
    """Save new CaseStudy with is_active = True."""
    case_study = CaseStudy(**case_study_in.model_dump(), is_active=True)
    db.add(case_study)
    await db.commit()
    await db.refresh(case_study)
    return case_study

@router.put("/{case_study_id}", response_model=CaseStudyResponse)
async def update_case_study(
    case_study_id: int,
    case_study_in: CaseStudyUpdate,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(require_roles([UserRole.super_admin, UserRole.division_head]))
):
    """Update fields provided only."""
    update_data = case_study_in.model_dump(exclude_unset=True)
    if not update_data:
        # Fetch and return existing if no updates provided
        stmt = select(CaseStudy).where(CaseStudy.id == case_study_id)
        result = await db.execute(stmt)
        case_study = result.scalar_one_or_none()
        if not case_study:
            raise HTTPException(status_code=404, detail="Case study not found")
        return case_study

    stmt = (
        update(CaseStudy)
        .where(CaseStudy.id == case_study_id)
        .values(**update_data)
        .returning(CaseStudy)
    )
    result = await db.execute(stmt)
    case_study = result.scalar_one_or_none()
    
    if not case_study:
        raise HTTPException(status_code=404, detail="Case study not found")
    
    await db.commit()
    return case_study

@router.delete("/{case_study_id}")
async def delete_case_study(
    case_study_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user = Depends(require_roles([UserRole.super_admin]))
):
    """Set is_active = False (soft delete)."""
    stmt = (
        update(CaseStudy)
        .where(CaseStudy.id == case_study_id)
        .values(is_active=False)
    )
    result = await db.execute(stmt)
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    
    await db.commit()
    return {"message": "Case study deactivated"}
