import enum
from sqlalchemy import Column, String, Boolean, Enum, Integer

from app.core.database import Base

class TechCategory(str, enum.Enum):
    frontend = "frontend"
    backend = "backend"
    cloud = "cloud"
    database = "database"
    devops = "devops"
    other = "other"

class TechLibrary(Base):
    __tablename__ = "tech_library"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(100))
    category = Column(Enum(TechCategory))
    is_active = Column(Boolean)
