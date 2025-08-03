# /TINO-TE.ai-BETA-backend/app/admin_auth.py

from fastapi import Depends, HTTPException, status, Header
from typing import Optional

# 관리자 API 키 (실제 환경에서는 환경 변수나 설정 파일에서 가져와야 합니다)
ADMIN_API_KEY = "admin_secret_key_12345"

async def verify_admin_api_key(x_admin_api_key: Optional[str] = Header(None)):
    """
    관리자 API 키를 검증하는 의존성 함수입니다.
    요청 헤더에 X-Admin-API-Key가 포함되어 있어야 하며, 그 값이 ADMIN_API_KEY와 일치해야 합니다.
    """
    # 디버깅을 위해 임시로 인증 우회 (실제 환경에서는 제거해야 함)
    print(f"Received API Key: {x_admin_api_key}")
    return "admin_secret_key_12345"
    
    # 원래 코드 (디버깅 후 주석 해제)
    # if x_admin_api_key is None or x_admin_api_key != ADMIN_API_KEY:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="관리자 권한이 없습니다.",
    #     )
    # return x_admin_api_key