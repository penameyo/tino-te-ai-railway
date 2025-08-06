# /TINO-TE.ai-BETA-backend/app/crud.py

from sqlalchemy.orm import Session
import secrets
import uuid
from datetime import datetime
from typing import Optional

# 우리가 만든 models.py와 schemas.py를 가져옵니다.
from . import models, schemas

# --- 기존 함수 (수정 없음) ---
def get_user_by_student_id(db: Session, student_id: str):
    """학번으로 사용자를 조회합니다."""
    return db.query(models.User).filter(models.User.student_id == student_id).first()

def create_user(db: Session, user: schemas.UserCreate):
    """새로운 사용자를 생성합니다."""
    api_key = secrets.token_hex(32)
    db_user = models.User(
        name=user.name,
        student_id=user.student_id,
        api_key=api_key
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- [추가] 새로운 함수들 ---

def get_user_by_api_key(db: Session, api_key: str):
    """API 키로 사용자를 조회합니다."""
    return db.query(models.User).filter(models.User.api_key == api_key).first()

def create_note_for_user(db: Session, note: schemas.Note, user_id: int):
    """특정 사용자를 위해 새로운 노트를 생성하고 저장합니다."""
    # 받은 note 스키마를 model 객체로 변환하여 저장합니다.
    # id는 schemas.Note에서 이미 생성되었으므로 그대로 사용합니다.
    db_note = models.Note(**note.model_dump(), owner_id=user_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def deduct_credits(db: Session, user_id: int, amount: int = 1):
    """사용자의 크레딧을 차감합니다."""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        db_user.daily_credits -= amount
        db.commit()
        db.refresh(db_user)
    return db_user

# --- [추가] 특정 사용자의 모든 노트를 조회하는 함수 ---
def get_notes_by_user(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    """특정 사용자가 생성한 노트 목록을 조회합니다."""
    return db.query(models.Note).filter(models.Note.owner_id == user_id).offset(skip).limit(limit).all()

# --- [추가] 특정 노트 하나를 ID로 조회하는 함수 ---
def get_note(db: Session, note_id: uuid.UUID, user_id: int):
    """
    사용자 ID와 노트 ID로 특정 노트를 조회합니다.
    (다른 사용자의 노트를 볼 수 없도록 user_id로 한 번 더 확인합니다.)
    """
    return db.query(models.Note).filter(models.Note.id == note_id, models.Note.owner_id == user_id).first()

# --- [추가] 모든 사용자의 크레딧을 초기화하는 함수 ---
def reset_all_user_credits(db: Session, credits: int = 10):
    """
    모든 사용자의 크레딧을 지정된 값으로 초기화합니다.
    이 함수는 매일 자정에 실행되어야 합니다.
    """
    db.query(models.User).update({models.User.daily_credits: credits})
    db.commit()
    return {"message": f"모든 사용자의 크레딧이 {credits}으로 초기화되었습니다."}

# --- [추가] 노트 삭제 함수 ---
def delete_note(db: Session, note_id: uuid.UUID, user_id: int):
    """
    특정 사용자의 노트를 삭제합니다.
    (다른 사용자의 노트를 삭제할 수 없도록 user_id로 한 번 더 확인합니다.)
    """
    note = db.query(models.Note).filter(
        models.Note.id == note_id, 
        models.Note.owner_id == user_id
    ).first()
    
    if note:
        db.delete(note)
        db.commit()
        return True
    return False