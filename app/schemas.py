# /TINO-TE.ai-BETA-backend/app/schemas.py

from pydantic import BaseModel
import uuid
from datetime import datetime


# --- 기존 코드 ---
class NoteBase(BaseModel):
    title: str
    original_transcription: str
    summary: str
    media_duration_seconds: float
    note_type: str = "audio"  # "audio" 또는 "document"


class Note(NoteBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


# --- [추가] 로그인 및 사용자 생성을 위한 모델 ---


class UserBase(BaseModel):
    """사용자 데이터의 기본 필드"""

    name: str
    student_id: str


class UserCreate(UserBase):
    """
    새로운 사용자를 생성할 때 사용할 모델.
    (우리가 직접 테스터를 추가할 때 사용합니다.)
    """

    pass


class UserLogin(UserBase):
    """사용자가 로그인을 위해 이름과 학번을 보낼 때 사용할 모델"""

    pass


class Token(BaseModel):
    """로그인 성공 시 사용자에게 반환될 API 키(토큰) 모델"""

    api_key: str
    token_type: str = "bearer"


class User(UserBase):
    """데이터베이스에서 읽어온 사용자 정보를 나타내는 모델"""

    id: uuid.UUID
    api_key: str
    daily_credits: int  # 데이터베이스 필드명과 일치
    notes: list[Note] = []  # 사용자가 작성한 노트 목록

    class Config:
        from_attributes = True
