from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.division import Division
from app.schemas.division import DivisionCreate, DivisionUpdate

def get_division(db: Session, division_id: UUID) -> Optional[Division]:
    return db.query(Division).filter(Division.id == division_id).first()

def list_divisions(db: Session) -> List[Division]:
    return db.query(Division).all()

def create_division(db: Session, division_in: DivisionCreate) -> Division:
    db_division = Division(**division_in.model_dump())
    db.add(db_division)
    db.commit()
    db.refresh(db_division)
    return db_division

def update_division(db: Session, division_id: UUID, division_in: DivisionUpdate) -> Optional[Division]:
    db_division = get_division(db, division_id)
    if not db_division:
        return None
    
    update_data = division_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_division, field, value)
    
    db.commit()
    db.refresh(db_division)
    return db_division
