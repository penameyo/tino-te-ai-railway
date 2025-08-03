# /TINO-TE.ai-BETA-backend/seed.py

# --- [수정] ---
# 데이터베이스 engine과 모델의 Base를 추가로 가져옵니다.
from app.database import SessionLocal, engine
from app.models import Base

# ---------------
from app.crud import create_user, get_user_by_student_id
from app.schemas import UserCreate

# --- 코드 설명 ---
# 이 스크립트는 데이터베이스에 초기 데이터를 설정하기 위해 사용됩니다.
# 터미널에서 'python seed.py' 명령으로 직접 실행합니다.


def seed_data():
    """테스트를 위한 초기 사용자 데이터를 생성합니다."""

    # --- [추가] ---
    # 데이터를 추가하기 전에, models.py에 정의된 모든 테이블이
    # 데이터베이스에 존재하는지 확인하고 없으면 생성합니다.
    print("Creating database tables if they don't exist...")
    Base.metadata.create_all(bind=engine)
    print("Tables created.")
    # ---------------

    # 데이터베이스 세션을 엽니다.
    db = SessionLocal()

    print("Seeding initial data...")

    try:
        # 베타테스터 목록 정의
        beta_testers = [
            UserCreate(name="박종호", student_id="2023148039"),
            UserCreate(name="김민수", student_id="2023101001"),
            UserCreate(name="이지은", student_id="2023101002"),
            UserCreate(name="최영호", student_id="2023101003"),
            UserCreate(name="정수민", student_id="2023101004"),
            UserCreate(name="한지원", student_id="2023101005"),
            UserCreate(name="송태양", student_id="2023101006"),
            UserCreate(name="윤서연", student_id="2023101007"),
            UserCreate(name="강민지", student_id="2023101008"),
            UserCreate(name="조현우", student_id="2023101009"),
        ]

        # 각 베타테스터에 대해 처리
        for tester in beta_testers:
            # 해당 학번의 사용자가 이미 존재하는지 확인
            db_user = get_user_by_student_id(db, student_id=tester.student_id)

            if db_user:
                print(f"User with student ID {tester.student_id} already exists.")
            else:
                # 존재하지 않으면 새로운 사용자 생성
                create_user(db=db, user=tester)
                print(f"Successfully created user: {tester.name} ({tester.student_id})")

    finally:
        # 4. 작업이 끝나면 데이터베이스 세션을 닫습니다.
        print("Seeding finished.")
        db.close()


if __name__ == "__main__":
    seed_data()
