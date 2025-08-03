import asyncio
import aioschedule
import time
from datetime import datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import crud
from app.logging_config import logger


async def reset_credits_job():
    """매일 자정에 모든 사용자의 크레딧을 초기화하는 작업"""
    try:
        db = SessionLocal()
        try:
            result = crud.reset_all_user_credits(db)
            logger.info(f"크레딧 초기화 완료: {result['message']}")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"크레딧 초기화 중 오류 발생: {str(e)}")


async def start_scheduler():
    """스케줄러 시작"""
    # 매일 자정에 크레딧 초기화 작업 예약
    aioschedule.every().day.at("00:00").do(reset_credits_job)
    logger.info("스케줄러가 시작되었습니다. 매일 자정에 크레딧이 초기화됩니다.")

    while True:
        await aioschedule.run_pending()
        await asyncio.sleep(1)
