# /TINO-TE.ai-BETA-backend/app/auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from sqlalchemy.orm import Session

from . import crud
from .database import get_db
from .models import User

# --- 코드 설명 ---
# 이 파일은 API 요청의 인증 및 권한 부여를 처리합니다.

# "Authorization" 헤더에서 API 키를 추출하는 객체를 생성합니다.
api_key_header = APIKeyHeader(name="Authorization", auto_error=False)

async def get_current_user(
    api_key: str = Depends(api_key_header), db: Session = Depends(get_db)
) -> User:
    """
    API 키를 검증하고, 유효한 경우 해당 사용자 정보를 반환하는 의존성 함수.
    크레딧 체크는 하지 않으므로 로그인, 사용자 정보 조회 등에 사용 가능합니다.
    """
    if not api_key or not api_key.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="유효한 인증 자격 증명이 제공되지 않았습니다.",
        )

    # "Bearer " 접두사를 제거하여 순수한 API 키만 추출합니다.
    token = api_key.split(" ")[1]
    
    # DB에서 해당 API 키를 가진 사용자를 찾습니다.
    user = crud.get_user_by_api_key(db, api_key=token)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API 키가 올바르지 않습니다.",
        )
        
    # 모든 검증을 통과하면 사용자 객체를 반환합니다.
    return user

async def get_current_user_with_credits(
    api_key: str = Depends(api_key_header), db: Session = Depends(get_db)
) -> User:
    """
    API 키를 검증하고 크레딧도 체크하는 의존성 함수.
    노트 생성 등 크레딧이 필요한 작업에만 사용합니다.
    """
    # 먼저 기본 사용자 인증을 수행
    user = await get_current_user(api_key, db)
    
    # 크레딧 체크
    if user.daily_credits <= 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="일일 사용량 한도를 초과했습니다. 내일 다시 시도해주세요.",
        )
        
    return user

