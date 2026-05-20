from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_async_db
from app.core.dependencies import get_current_active_user, require_roles
from app.models.tech_library import TechLibrary
from app.models.user import User, UserRole
from app.schemas.document import TechLibraryResponse

router = APIRouter(prefix="/api/tech-library", tags=["tech-library"])

@router.get("/", response_model=List[TechLibraryResponse])
async def list_tech_library(
    category: Optional[str] = None,
    is_active: bool = Query(True),
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Fetch TechLibrary records with optional filtering.
    """
    stmt = select(TechLibrary)
    filters = []
    
    if category:
        filters.append(TechLibrary.category == category)
    
    if is_active is not None:
        filters.append(TechLibrary.is_active == is_active)
        
    if filters:
        stmt = stmt.where(and_(*filters))
        
    stmt = stmt.order_by(TechLibrary.category.asc(), TechLibrary.name.asc())
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/", response_model=TechLibraryResponse)
async def create_tech_item(
    name: str,
    category: str,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_roles([UserRole.admin]))
):
    """
    Create a new technical library item (Super Admin only).
    """
    tech_item = TechLibrary(
        name=name,
        category=category,
        is_active=True
    )
    db.add(tech_item)
    await db.commit()
    await db.refresh(tech_item)
    return tech_item

@router.put("/{tech_id}", response_model=TechLibraryResponse)
async def update_tech_item(
    tech_id: int,
    name: Optional[str] = None,
    category: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: AsyncSession = Depends(get_async_db),
    current_user: User = Depends(require_roles(UserRole.admin))
):
    """
    Update an existing technical library item (Super Admin only).
    """
    stmt = select(TechLibrary).where(TechLibrary.id == tech_id)
    result = await db.execute(stmt)
    tech_item = result.scalar_one_or_none()
    
    if not tech_item:
        raise HTTPException(status_code=404, detail="Tech item not found")
        
    if name is not None:
        tech_item.name = name
    if category is not None:
        tech_item.category = category
    if is_active is not None:
        tech_item.is_active = is_active
        
    await db.commit()
    await db.refresh(tech_item)
    return tech_item
