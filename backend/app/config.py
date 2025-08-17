# /TINO-TE.ai-BETA-backend/app/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """애플리케이션 설정을 관리하는 클래스"""
    OPENAI_API_KEY: str
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/database"
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # Railway/Supabase 환경 변수
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    model_config = SettingsConfigDict(env_file=".env")

# 설정 객체 인스턴스 생성
settings = Settings()

