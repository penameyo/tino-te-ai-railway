# /TINO-TE.ai-BETA-backend/app/main.py

import uuid
from typing import List 
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncio
from datetime import datetime


# 우리가 직접 만든 모든 모듈들을 가져옵니다.
from app import services, schemas, models, crud, auth, admin
from app.logging_config import logger
from app.scheduler import start_scheduler
from app.admin_auth import verify_admin_api_key
# --- [수정] get_db를 database 모듈에서 가져옵니다.
from app.database import engine, get_db

# 데이터베이스 테이블 생성 (Supabase 연결 복구)
try:
    models.Base.metadata.create_all(bind=engine)
    print("✅ Database connection successful")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
    # 연결 실패해도 앱은 실행되도록 함

app = FastAPI(
    title="TINO-TE.ai BETA",
    description="미디어 파일을 AI 노트로 변환하는 API입니다.",
    version="0.1.0",
)

# 관리자 라우터 추가
app.include_router(admin.router)

# 애플리케이션 시작 이벤트
@app.on_event("startup")
async def startup_event():
    # 스케줄러 시작 (백그라운드 태스크로 실행)
    asyncio.create_task(start_scheduler())
    logger.info("애플리케이션이 시작되었습니다.")

# --- [삭제] ---
# 이 함수는 database.py 파일로 이동했으므로 여기서 삭제합니다.
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
# ----------------

# --- [추가] CORS 미들웨어 설정 ---
# 프론트엔드에서 오는 요청을 허용합니다.
origins = [
    "http://localhost:3000",  # 로컬 개발
    "https://*.vercel.app",   # Vercel 배포
    "https://vercel.app",     # Vercel 도메인
]

# 환경 변수에서 추가 허용 도메인 가져오기
import os
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 배포 시에는 모든 도메인 허용 (나중에 제한 가능)
    allow_credentials=True,
    allow_methods=["*"], # 모든 HTTP 메소드 허용
    allow_headers=["*"], # 모든 HTTP 헤더 허용
)

@app.post("/api/v1/login", response_model=schemas.Token)
def login_for_access_token(
    form_data: schemas.UserLogin, db: Session = Depends(get_db)
):
    user = crud.get_user_by_student_id(db, student_id=form_data.student_id)
    if not user or user.name != form_data.name:
        raise HTTPException(
            status_code=401,
            detail="이름 또는 학번이 올바르지 않습니다.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"api_key": user.api_key}

# --- [추가] '내 정보' 조회 API ---
@app.get("/api/v1/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    """
    (인증 필요) 현재 로그인된 사용자의 상세 정보를 반환합니다.
    (노트 목록은 제외하고 반환하도록 스키마 조정이 필요할 수 있으나, 우선은 전체 반환)
    크레딧 체크를 하지 않으므로 크레딧이 0이어도 로그인 가능합니다.
    """
    return current_user

@app.get("/")
def read_root():
    logger.info("루트 엔드포인트에 접속했습니다.")
    return {"message": "TINO-TE.ai BETA 서버에 오신 것을 환영합니다!"}


@app.post("/api/v1/notes/from-media", response_model=schemas.Note)
async def create_note_from_media(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_with_credits),
    file: UploadFile = File(...)
):
    if not file.content_type.startswith("audio/") and not file.content_type.startswith("video/"):
        raise HTTPException(
            status_code=400,
            detail="지원하지 않는 파일 형식입니다. 오디오 또는 비디오 파일을 업로드해주세요."
        )

    try:
        transcription = await services.transcribe_media_with_whisper(file)
        summarized_result = await services.summarize_text_with_deepseek(transcription)
    except HTTPException as e:
        raise e

    note_data = schemas.Note(
        id=uuid.uuid4(),
        title=summarized_result["title"],
        original_transcription=transcription,
        summary=summarized_result["summary"],
        media_duration_seconds=0,
        note_type="audio",
        created_at=datetime.now()
    )
    created_note = crud.create_note_for_user(db=db, note=note_data, user_id=current_user.id)
    crud.deduct_credits(db=db, user_id=current_user.id, amount=10)
    
    return created_note

# --- [추가] 노트 목록을 조회하는 API 엔드포인트 ---
@app.get("/api/v1/notes", response_model=List[schemas.Note])
def read_notes(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    (인증 필요) 현재 로그인된 사용자가 생성한 모든 노트 목록을 반환합니다.
    """
    notes = crud.get_notes_by_user(db, user_id=current_user.id)
    return notes



# --- [추가] 디버깅용 사용자 목록 조회 API 엔드포인트 ---
@app.get("/api/v1/debug/users")
def debug_read_users(db: Session = Depends(get_db)):
    """
    (디버깅용) 모든 사용자 목록을 반환합니다.
    """
    users = db.query(models.User).all()
    return users

# --- [추가] 모든 사용자의 크레딧을 초기화하는 API 엔드포인트 ---
@app.post("/api/v1/admin/reset-credits")
def reset_all_credits(
    db: Session = Depends(get_db),
    credits: int = 10,
    api_key: str = Depends(admin.verify_admin_api_key)
):
    """
    (관리자 전용) 모든 사용자의 크레딧을 초기화합니다.
    이 엔드포인트는 매일 자정에 자동으로 호출되어야 합니다.
    """
    return crud.reset_all_user_credits(db, credits)

# --- [추가] 노트 삭제 API ---
@app.delete("/api/v1/notes/{note_id}")
def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    (인증 필요) 특정 노트를 삭제합니다.
    """
    try:
        note_uuid = uuid.UUID(note_id)
        note = crud.get_note(db, note_id=note_uuid, user_id=current_user.id)
        
        if not note:
            raise HTTPException(
                status_code=404,
                detail="노트를 찾을 수 없습니다."
            )
        
        crud.delete_note(db, note_id=note_uuid, user_id=current_user.id)
        return {"message": "노트가 성공적으로 삭제되었습니다."}
        
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="올바르지 않은 노트 ID 형식입니다."
        )

@app.get("/api/v1/notes/{note_id}/pdf")
async def download_note_as_pdf(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    (인증 필요) 특정 노트를 PDF로 다운로드합니다.
    """
    try:
        from app.pdf_service import create_pdf_endpoint_handler
        
        note_uuid = uuid.UUID(note_id)
        note = crud.get_note(db, note_id=note_uuid, user_id=current_user.id)
        
        if not note:
            raise HTTPException(
                status_code=404,
                detail="노트를 찾을 수 없습니다."
            )
        
        # 노트 데이터를 딕셔너리로 변환
        note_data = {
            "title": note.title,
            "summary": note.summary,
            "original_transcription": note.original_transcription,
            "note_type": note.note_type,
            "created_at": note.created_at.strftime("%Y-%m-%d %H:%M:%S") if note.created_at else ""
        }
        
        # PDF 생성
        pdf_result = create_pdf_endpoint_handler(note_data)
        
        return {
            "pdf_data": pdf_result["pdf_data"],
            "filename": pdf_result["filename"],
            "content_type": pdf_result["content_type"]
        }
        
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="올바르지 않은 노트 ID 형식입니다."
        )
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="PDF 생성 라이브러리가 설치되지 않았습니다. pip install reportlab을 실행해주세요."
        )

@app.post("/api/v1/notes/from-document", response_model=schemas.Note)
async def create_note_from_document(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user_with_credits),
    file: UploadFile = File(...)
):
    """
    (인증 필요) 문서 파일(PDF, DOCX, TXT)을 업로드하여 노트를 생성합니다.
    """
    # 파일 확장자 확인
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in ['.pdf', '.docx', '.doc', '.txt']:
        raise HTTPException(
            status_code=400,
            detail="지원하지 않는 파일 형식입니다. PDF, DOCX, DOC, TXT 파일만 업로드해주세요."
        )

    try:
        # 문서에서 텍스트 추출
        text = await services.extract_text_from_document(file)
        
        # 텍스트가 너무 길면 일부만 사용
        if len(text) > 10000:
            text = text[:10000] + "...(생략됨)"
            
        # DeepSeek API로 요약
        summarized_result = await services.summarize_text_with_deepseek(text)
        
        # 노트 생성
        note_data = schemas.Note(
            id=uuid.uuid4(),
            title=summarized_result["title"],
            original_transcription=text,
            summary=summarized_result["summary"],
            media_duration_seconds=0,
            note_type="document",
            created_at=datetime.now()
        )
        
        created_note = crud.create_note_for_user(db=db, note=note_data, user_id=current_user.id)
        crud.deduct_credits(db=db, user_id=current_user.id, amount=5)
        
        return created_note
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"문서 처리 중 오류가 발생했습니다: {str(e)}"
        )

