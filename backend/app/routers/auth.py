from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token, verify_token
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.schemas.user import UserCreate, UserPublic
from app.schemas.auth import Token
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserPublic)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = auth_service.get_user_by_email(db, user_in.email)
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )
    return auth_service.create_user(db, user_in)

@router.post("/login", response_model=Token)
def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = auth_service.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": str(user.id)})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,  # In production use True
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    try:
        payload = verify_token(refresh_token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    access_token = create_access_token(data={"sub": user_id})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("refresh_token")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserPublic)
def get_me(current_user=Depends(get_current_user)):
    return current_user
