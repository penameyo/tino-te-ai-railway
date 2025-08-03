# /TINO-TE.ai-BETA-backend/app/admin.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from . import crud, models, schemas
from .database import get_db
from .admin_auth import verify_admin_api_key

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

@router.get("/users", response_model=List[schemas.User])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_admin_api_key)
):
    """
    모든 사용자 목록을 조회합니다.
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.post("/users", response_model=schemas.User)
def create_user(
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_admin_api_key)
):
    """
    새로운 사용자를 생성합니다.
    """
    db_user = crud.get_user_by_student_id(db, student_id=user.student_id)
    if db_user:
        raise HTTPException(status_code=400, detail="이미 존재하는 학번입니다.")
    return crud.create_user(db=db, user=user)

@router.delete("/users/{student_id}")
def delete_user(
    student_id: str, 
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_admin_api_key)
):
    """
    특정 학번의 사용자를 삭제합니다.
    """
    db_user = crud.get_user_by_student_id(db, student_id=student_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    db.delete(db_user)
    db.commit()
    return {"detail": f"학번 {student_id}의 사용자가 삭제되었습니다."}

@router.put("/users/{student_id}", response_model=schemas.User)
def update_user(
    student_id: str, 
    user: schemas.UserCreate, 
    db: Session = Depends(get_db),
    api_key: str = Depends(verify_admin_api_key)
):
    """
    특정 학번의 사용자 정보를 수정합니다.
    """
    db_user = crud.get_user_by_student_id(db, student_id=student_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다.")
    
    # 사용자 정보 업데이트
    db_user.name = user.name
    db_user.student_id = user.student_id
    
    db.commit()
    db.refresh(db_user)
    return db_user