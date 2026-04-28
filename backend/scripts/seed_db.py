import sys
import os

# Add the project root to sys.path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import SessionLocal
from app.models import User, Division, UserRole
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Division).first():
            print("Database already contains data, skipping seed.")
            return

        # Create Divisions
        divisions = [
            Division(
                name="Enterprise Software", 
                description="Focuses on large-scale enterprise solutions.",
                branding_config={"primary_color": "#1a365d", "secondary_color": "#2b6cb0", "logo_url": "https://example.com/logo1.png"}
            ),
            Division(
                name="Cloud Services", 
                description="Cloud infrastructure and SaaS products.",
                branding_config={"primary_color": "#2c5282", "secondary_color": "#4299e1", "logo_url": "https://example.com/logo2.png"}
            ),
            Division(
                name="Cybersecurity", 
                description="Security tools and consulting services.",
                branding_config={"primary_color": "#2a4365", "secondary_color": "#3182ce", "logo_url": "https://example.com/logo3.png"}
            )
        ]
        db.add_all(divisions)
        db.commit()
        for d in divisions:
            db.refresh(d)

        # Create Users
        users = [
            User(
                email="admin@dealflow.com",
                hashed_password=get_password_hash("admin123"),
                first_name="Super",
                last_name="Admin",
                role=UserRole.super_admin,
                is_active=True
            ),
            User(
                email="head.enterprise@dealflow.com",
                hashed_password=get_password_hash("password123"),
                first_name="John",
                last_name="Doe",
                role=UserRole.division_head,
                division_id=divisions[0].id,
                is_active=True
            ),
            User(
                email="manager.cloud@dealflow.com",
                hashed_password=get_password_hash("password123"),
                first_name="Jane",
                last_name="Smith",
                role=UserRole.sales_manager,
                division_id=divisions[1].id,
                is_active=True
            ),
            User(
                email="sales.cyber@dealflow.com",
                hashed_password=get_password_hash("password123"),
                first_name="Mike",
                last_name="Johnson",
                role=UserRole.salesperson,
                division_id=divisions[2].id,
                is_active=True
            ),
            User(
                email="presales.enterprise@dealflow.com",
                hashed_password=get_password_hash("password123"),
                first_name="Sarah",
                last_name="Wilson",
                role=UserRole.presales_engineer,
                division_id=divisions[0].id,
                is_active=True
            ),
            User(
                email="legal.corp@dealflow.com",
                hashed_password=get_password_hash("password123"),
                first_name="Robert",
                last_name="Brown",
                role=UserRole.legal,
                is_active=True
            )
        ]
        db.add_all(users)
        db.commit()
        
        # Update Division Heads
        divisions[0].head_user_id = users[1].id
        db.commit()

        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
