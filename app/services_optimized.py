# 최적화된 서비스 - 비동기 처리 및 스트리밍 응답

import asyncio
import httpx
import os
import tempfile
from fastapi import HTTPException, UploadFile
from typing import AsyncGenerator
import json

async def transcribe_media_with_whisper_optimized(file: UploadFile) -> str:
    """최적화된 Whisper API 호출"""
    
    try:
        async with httpx.AsyncClient(timeout=300) as client:  # 타임아웃 증가
            file_content = await file.read()
            
            # 파일 크기 체크 및 압축
            if len(file_content) > 25 * 1024 * 1024:  # 25MB 초과시
                raise HTTPException(
                    status_code=413,
                    detail="파일 크기가 너무 큽니다. 25MB 이하의 파일을 업로드해주세요."
                )
            
            files = {'file': (file.filename, file_content, file.content_type)}
            headers = {'Authorization': f'Bearer {settings.OPENAI_API_KEY}'}
            
            # 최적화된 설정
            data = {
                'model': 'whisper-1',
                'language': 'ko',
                'temperature': 0.0,
                'response_format': 'text',
                # 간단한 프롬프트로 처리 시간 단축
                'prompt': '한국어 교육 콘텐츠. 전문용어와 숫자를 정확히 전사해주세요.'
            }

            response = await client.post(
                WHISPER_API_URL, 
                headers=headers, 
                files=files, 
                data=data,
                timeout=300  # 5분 타임아웃
            )

            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"음성 전사 실패: {response.text}"
                )

            return response.text
            
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=408,
            detail="음성 전사 시간이 초과되었습니다. 더 짧은 파일을 시도해주세요."
        )

async def summarize_text_with_deepseek_streaming(text: str) -> AsyncGenerator[str, None]:
    """스트리밍 방식으로 요약 생성"""
    
    try:
        async with httpx.AsyncClient(timeout=300) as client:
            headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {settings.DEEPSEEK_API_KEY}'
            }
            
            # 간소화된 프롬프트로 처리 시간 단축
            system_prompt = """학습 노트 작성 전문가입니다. 
주어진 텍스트를 다음 형식으로 변환하세요:

### [제목]

#### 핵심 내용
- 주요 개념 3-5개
- 중요 포인트
- 기억할 점

간결하고 실용적으로 작성해주세요."""

            payload = {
                "model": "deepseek-reasoner",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"다음을 학습 노트로 변환: {text[:2000]}"}  # 텍스트 길이 제한
                ],
                "temperature": 0.1,  # 더 일관된 결과
                "max_tokens": 1500,  # 토큰 수 감소
                "stream": True  # 스트리밍 활성화
            }

            async with client.stream(
                'POST', 
                DEEPSEEK_API_URL, 
                headers=headers, 
                json=payload,
                timeout=300
            ) as response:
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"요약 생성 실패: {await response.aread()}"
                    )
                
                async for chunk in response.aiter_text():
                    if chunk.strip():
                        yield chunk
                        
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=408,
            detail="요약 생성 시간이 초과되었습니다."
        )

# 백그라운드 작업을 위한 큐 시스템 (Railway에서는 비활성화)
# import redis
# from celery import Celery

# Railway 환경에서는 Redis/Celery 대신 간단한 백그라운드 처리 사용
# redis_client = redis.Redis(host='localhost', port=6379, db=0)
# celery_app = Celery('tino_te', broker='redis://localhost:6379')

# @celery_app.task
async def process_note_background(file_path: str, user_id: int):
    """백그라운드에서 노트 처리 (Railway용 간소화 버전)"""
    # Railway에서는 간단한 비동기 처리로 대체
    # 파일 처리 로직
    # 완료 후 사용자에게 알림 또는 이메일 발송
    pass