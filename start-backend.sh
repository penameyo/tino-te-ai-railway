#!/bin/bash

# 가상 환경 활성화 (가상 환경이 있는 경우)
cd backend
source .venv/bin/activate

# 백엔드 서버 실행
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000