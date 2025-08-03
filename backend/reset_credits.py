#!/usr/bin/env python
# /TINO-TE.ai-BETA-backend/reset_credits.py

"""
이 스크립트는 모든 사용자의 크레딧을 초기화합니다.
매일 자정에 실행되도록 cron job으로 설정해야 합니다.
"""

import requests
import os
from dotenv import load_dotenv
from datetime import datetime

# 환경 변수 로드
load_dotenv()

# API 엔드포인트 URL
API_URL = "http://localhost:8000/api/v1/admin/reset-credits"

# 기본 크레딧 값
DEFAULT_CREDITS = 10

def reset_credits():
    """모든 사용자의 크레딧을 초기화합니다."""
    try:
        response = requests.post(API_URL, params={"credits": DEFAULT_CREDITS})
        if response.status_code == 200:
            message = response.json()["message"]
            print(message)
            with open("cron.log", "a") as log_file:
                log_file.write(f"{datetime.now().isoformat()}: {message}\n")
        else:
            error_message = f"크레딧 초기화 실패: {response.status_code} - {response.text}"
            print(error_message)
            with open("cron.log", "a") as log_file:
                log_file.write(f"{datetime.now().isoformat()}: {error_message}\n")
    except Exception as e:
        error_message = f"오류 발생: {str(e)}"
        print(error_message)
        with open("cron.log", "a") as log_file:
            log_file.write(f"{datetime.now().isoformat()}: {error_message}\n")

if __name__ == "__main__":
    reset_credits()