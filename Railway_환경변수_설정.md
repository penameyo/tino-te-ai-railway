# Railway 환경 변수 설정

Railway 대시보드 → Variables 탭에서 다음 환경 변수들을 추가하세요:

## 🔑 필수 환경 변수

### OpenAI API 키
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### DeepSeek API 키
```
DEEPSEEK_API_KEY=sk-your-deepseek-api-key-here
```

### Supabase 설정
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

### 데이터베이스 URL
```
DATABASE_URL=postgresql://postgres:your_password@db.your-project-id.supabase.co:5432/postgres
```

### JWT 시크릿 키
```
SECRET_KEY=your-random-secret-key-for-jwt-make-it-long-and-secure
```

---

## 📋 설정 방법

1. **Railway 대시보드**에서 프로젝트 선택
2. **Variables** 탭 클릭
3. **"New Variable"** 클릭
4. **Name**과 **Value** 입력
5. **"Add"** 클릭
6. 모든 변수 추가 완료까지 반복

---

## ⚠️ 중요 사항

### Supabase 정보 가져오기
1. **Supabase 대시보드** → **Settings** → **API**
2. **Project URL** 복사 → `SUPABASE_URL`에 입력
3. **anon public** 키 복사 → `SUPABASE_KEY`에 입력
4. **service_role** 키 복사 → `SUPABASE_SERVICE_KEY`에 입력

### DATABASE_URL 형식
```
postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_ID].supabase.co:5432/postgres
```
- `[YOUR_PASSWORD]`: Supabase 프로젝트 생성 시 설정한 비밀번호
- `[YOUR_PROJECT_ID]`: Supabase 프로젝트 ID (URL에서 확인 가능)

### SECRET_KEY 생성
```bash
# 터미널에서 실행 (랜덤 키 생성)
openssl rand -hex 32
```
또는 온라인 생성기 사용: https://generate-secret.vercel.app/32

---

## 🚀 배포 완료 후 확인

환경 변수 설정 완료 후:
1. **Deploy** 버튼 클릭
2. **Logs** 탭에서 배포 진행 상황 확인
3. **성공 시 URL 생성됨** (예: `https://your-app.railway.app`)
4. **해당 URL로 접속해서 API 테스트**

---

## 🔧 트러블슈팅

### 배포 실패 시
- **Logs** 탭에서 오류 메시지 확인
- **환경 변수** 오타 확인
- **Root Directory** 설정 확인 (`backend`)

### 데이터베이스 연결 실패 시
- **DATABASE_URL** 형식 확인
- **Supabase 비밀번호** 확인
- **Supabase 프로젝트 ID** 확인