# /TINO-TE.ai-BETA-backend/app/models.py

import uuid
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID # UUID 타입을 위해 추가

# 우리가 만든 database.py 파일에서 Base를 가져옵니다.
# 모든 모델은 이 Base 클래스를 상속받아야 합니다.
from .database import Base

# --- 코드 설명 ---
# 이 파일은 데이터베이스에 생성될 테이블의 구조를 파이썬 클래스로 정의합니다.
# SQLAlchemy ORM이 이 클래스들을 실제 데이터베이스 테이블로 변환해줍니다.

class User(Base):
    """사용자 정보를 저장하는 테이블"""
    __tablename__ = "users" # 데이터베이스에 생성될 테이블의 이름

    id = Column(Integer, primary_key=True, index=True) # 고유 식별자 (자동 증가)
    name = Column(String, index=True) # 사용자 이름
    student_id = Column(String, unique=True, index=True) # 학번 (고유해야 함)
    api_key = Column(String, unique=True, index=True) # 인증을 위한 API 키 (고유해야 함)
    daily_credits = Column(Integer, default=10) # 일일 사용량 크레딧 (매일 초기화)

    # User 모델에서 자신과 연결된 Note들을 쉽게 가져오기 위한 설정
    notes = relationship("Note", back_populates="owner")


class Note(Base):
    """생성된 노트 정보를 저장하는 테이블"""
    __tablename__ = "notes"

    # id를 UUID로 설정하여 전역적으로 고유한 ID를 갖도록 합니다.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, index=True)
    original_transcription = Column(String)
    summary = Column(String)
    media_duration_seconds = Column(Float)
    note_type = Column(String, default="audio")  # "audio" 또는 "document"

    # --- [추가] ---
    # 노트 생성 시간을 자동으로 기록하는 필드
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 이 노트가 어떤 사용자에 의해 생성되었는지 연결하는 외래 키(Foreign Key)
    owner_id = Column(Integer, ForeignKey("users.id"))

    # Note 모델에서 자신을 생성한 User 정보를 쉽게 가져오기 위한 설정
    owner = relationship("User", back_populates="notes")

