# /TINO-TE.ai-BETA-backend/app/database.py

import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from pydantic_settings import BaseSettings

# --- 코드 설명 ---
# 이 파일은 데이터베이스 연결을 설정하고 관리하는 역할을 합니다.

# 환경 변수에서 데이터베이스 URL을 가져오거나 기본값 사용
# Railway/Supabase 환경에서 DATABASE_URL을 가져옵니다
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://user:password@localhost:5432/database"
)

# 1. 데이터베이스 접속 주소 설정
# PostgreSQL 데이터베이스 연결 문자열 사용
SQLALCHEMY_DATABASE_URL = DATABASE_URL

# 2. 데이터베이스 엔진 생성
# create_engine은 데이터베이스와 통신하는 핵심 인터페이스입니다.
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 3. 데이터베이스 세션 생성
# SessionLocal은 데이터베이스와 대화하기 위한 '세션'을 만드는 공장입니다.
# 앞으로 DB와 관련된 작업이 필요할 때마다 이 SessionLocal을 통해
# 세션을 하나씩 만들어서 사용하게 됩니다.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. 데이터베이스 모델의 기본 클래스 생성
# Base는 앞으로 우리가 만들 모든 데이터베이스 모델(테이블)들이
# 상속받아야 할 기본 클래스입니다. 이 클래스를 상속받는 모든 클래스는
# SQLAlchemy에 의해 자동으로 테이블과 매핑됩니다.
Base = declarative_base()

# --- [추가] 데이터베이스 세션 의존성 함수 ---
# API가 호출될 때마다 독립적인 데이터베이스 세션을 생성하고,
# API 처리가 끝나면 세션을 자동으로 닫아주는 역할을 합니다.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
