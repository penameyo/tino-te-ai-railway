# 🚀 Railway 스택 배포 가이드

## 📋 배포 스택 구성
- **프론트엔드**: Vercel (무료)
- **백엔드**: Railway ($7/월)
- **데이터베이스**: Supabase (무료)
- **총 비용**: $7/월 (AI API 제외)

---

## 1️⃣ Supabase 데이터베이스 설정

### 1.1 Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New project" 클릭
5. 프로젝트 정보 입력:
   - Name: `tino-te-ai`
   - Database Password: 강력한 비밀번호 생성
   - Region: Northeast Asia (Seoul)

### 1.2 데이터베이스 테이블 생성
SQL Editor에서 다음 쿼리 실행:

```sql
-- 사용자 테이블
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- PDF 문서 테이블
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    upload_date TIMESTAMP DEFAULT NOW(),
    file_size INTEGER,
    status VARCHAR(50) DEFAULT 'uploaded'
);

-- 노트 테이블
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 스케줄 테이블
CREATE TABLE schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 1.3 환경 변수 수집
Settings → API에서 다음 정보 복사:
- `Project URL`
- `anon public key`
- `service_role key`

---

## 2️⃣ Railway 백엔드 배포

### 2.1 Railway 계정 생성
1. [railway.app](https://railway.app) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭

### 2.2 백엔드 배포 준비
프로젝트 루트에 다음 파일들 생성:

#### `railway.json`
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### `requirements.txt` (백엔드 폴더에)
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
supabase==2.0.0
openai==1.3.0
PyPDF2==3.0.1
python-dotenv==1.0.0
requests==2.31.0
```

### 2.3 Railway에 배포
1. Railway에서 "Deploy from GitHub repo" 선택
2. 백엔드 폴더가 있는 레포지토리 선택
3. Root Directory를 `backend`로 설정
4. 환경 변수 설정:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   OPENAI_API_KEY=your_openai_api_key
   SECRET_KEY=your_jwt_secret_key
   ```

---

## 3️⃣ Vercel 프론트엔드 배포

### 3.1 Vercel 계정 생성
1. [vercel.com](https://vercel.com) 접속
2. GitHub 계정으로 로그인

### 3.2 프론트엔드 배포
1. "New Project" 클릭
2. GitHub 레포지토리 선택
3. Framework Preset: Next.js
4. Root Directory: `frontend`
5. 환경 변수 설정:
   ```
   NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
   ```

---

## 4️⃣ 환경 변수 설정 가이드

### Railway (백엔드) 환경 변수
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
OPENAI_API_KEY=sk-your_openai_key
SECRET_KEY=your_random_secret_key_for_jwt
```

### Vercel (프론트엔드) 환경 변수
```env
NEXT_PUBLIC_API_URL=https://your-app-name.railway.app
```

---

## 5️⃣ 배포 후 확인사항

### ✅ 체크리스트
- [ ] Supabase 데이터베이스 테이블 생성 완료
- [ ] Railway 백엔드 배포 성공
- [ ] Vercel 프론트엔드 배포 성공
- [ ] API 연결 테스트 완료
- [ ] 회원가입/로그인 테스트 완료
- [ ] PDF 업로드 테스트 완료

### 🔧 트러블슈팅
**Railway 배포 실패 시:**
- 로그 확인: Railway Dashboard → Deployments → View Logs
- requirements.txt 경로 확인
- 환경 변수 설정 확인

**Vercel 배포 실패 시:**
- Build 로그 확인
- package.json 경로 확인
- 환경 변수 설정 확인

**API 연결 안 될 시:**
- CORS 설정 확인
- Railway URL 확인
- 환경 변수 확인

---

## 💰 예상 비용
- **Railway**: $7/월 (백엔드 호스팅)
- **Vercel**: 무료 (프론트엔드 호스팅)
- **Supabase**: 무료 (데이터베이스)
- **OpenAI API**: 사용량에 따라 (~$47/월)

**총 예상 비용: $54/월**

---

## 🚀 다음 단계
1. Supabase 프로젝트 생성부터 시작
2. 환경 변수 정리
3. Railway 배포
4. Vercel 배포
5. 테스트 및 최적화

준비되시면 단계별로 진행해보시죠!