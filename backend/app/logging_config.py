import logging
import sys
from pathlib import Path

# 로그 파일 경로 설정
log_file_path = Path(__file__).parent.parent / "backend.log"

# 로깅 설정
def setup_logging():
    # 로거 생성
    logger = logging.getLogger("tino-te.ai")
    logger.setLevel(logging.INFO)
    
    # 포맷터 생성
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    )
    
    # 파일 핸들러 생성
    file_handler = logging.FileHandler(log_file_path)
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    
    # 콘솔 핸들러 생성
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    
    # 로거에 핸들러 추가
    logger.addHandler(file_handler)
    logger.addHandler(console_handler)
    
    return logger

# 로거 인스턴스 생성
logger = setup_logging()