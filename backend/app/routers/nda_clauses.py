from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import List, Optional

from app.core.database import get_async_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.nda_clause import NdaClause
from app.models.user import User, UserRole
from app.schemas.document import NdaClauseResponse

router = APIRouter(prefix="/api/nda-clauses", tags=["nda-clauses"])

@router.get("/", response_model=List[NdaClauseResponse])
async def list_nda_clauses(
    division_id: Optional[UUID] = None,
    clause_type: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch NDA clauses. If division_id is provided, returns division-specific + global clauses.
    Otherwise returns all default clauses.
    """
    stmt = select(NdaClause)
    
    if division_id:
        # Return division-specific OR global (division_id IS NULL)
        stmt = stmt.where(or_(NdaClause.division_id == division_id, NdaClause.division_id.is_(None)))
    else:
        # Default view: return all marked as is_default
        stmt = stmt.where(NdaClause.is_default == True)
        
    if clause_type:
        stmt = stmt.where(NdaClause.clause_type == clause_type)
        
    stmt = stmt.order_by(NdaClause.clause_type.asc())
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{clause_id}", response_model=NdaClauseResponse)
async def get_nda_clause(
    clause_id: int,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    stmt = select(NdaClause).where(NdaClause.id == clause_id)
    result = await db.execute(stmt)
    clause = result.scalar_one_or_none()
    if not clause:
        raise HTTPException(status_code=404, detail="NDA Clause not found")
    return clause

@router.post("/", response_model=NdaClauseResponse)
async def create_nda_clause(
    clause_type: str,
    clause_text: str,
    is_default: bool,
    division_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_roles([UserRole.super_admin, UserRole.legal]))
):
    clause = NdaClause(
        clause_type=clause_type,
        clause_text=clause_text,
        is_default=is_default,
        division_id=division_id
    )
    db.add(clause)
    await db.commit()
    await db.refresh(clause)
    return clause

@router.put("/{clause_id}", response_model=NdaClauseResponse)
async def update_nda_clause(
    clause_id: int,
    clause_text: Optional[str] = None,
    is_default: Optional[bool] = None,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_roles([UserRole.super_admin, UserRole.legal]))
):
    stmt = select(NdaClause).where(NdaClause.id == clause_id)
    result = await db.execute(stmt)
    clause = result.scalar_one_or_none()
    
    if not clause:
        raise HTTPException(status_code=404, detail="NDA Clause not found")
        
    if clause_text is not None:
        clause.clause_text = clause_text
    if is_default is not None:
        clause.is_default = is_default
        
    await db.commit()
    await db.refresh(clause)
    return clause
