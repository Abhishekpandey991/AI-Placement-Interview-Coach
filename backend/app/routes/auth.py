from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.schemas.auth import RegisterRequest, LoginRequest
from app.services.auth_service import (
    register_user,
    authenticate_user
)
from app.core.security import create_access_token
from fastapi.security import OAuth2PasswordRequestForm

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

@router.post("/register")
def register(data:RegisterRequest,db:Session=Depends(get_db)):
  try:
    user=register_user(
      db,
      data.name,
      data.email,
      data.password
    )
    return {
            "message": "Registration successful",
            "user_id": user.id
        }
  except ValueError as error:
    raise HTTPException(
      status_code=400,
      detail=str(error)
    )


  
@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    user = authenticate_user(
        db,
        form_data.username,
        form_data.password
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(user.id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }