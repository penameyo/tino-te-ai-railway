# GitHub 코드 업로드 가이드

## 1️⃣ Git 초기화 및 커밋

프로젝트 루트 폴더에서 터미널 실행:

```bash
# Git 초기화 (이미 되어있다면 생략)
git init

# 모든 파일 추가
git add .

# 커밋 생성
git commit -m "Railway 배포를 위한 코드 수정 완료

- railway.json 추가
- requirements.txt 버전 고정
- CORS 설정 수정 (Vercel 호환)
- Supabase 환경 변수 설정
- PDF 생성 Railway 호환
- Redis/Celery 의존성 제거"
```

## 2️⃣ GitHub 레포지토리 생성

### 방법 1: GitHub 웹사이트에서
1. **github.com** 접속
2. **"New repository"** 클릭
3. **Repository name**: `tino-te-ai-railway`
4. **Public** 선택 (또는 Private)
5. **"Create repository"** 클릭

### 방법 2: GitHub CLI 사용 (설치되어 있다면)
```bash
gh repo create tino-te-ai-railway --public
```

## 3️⃣ 원격 저장소 연결 및 푸시

```bash
# 원격 저장소 추가
git remote add origin https://github.com/YOUR_USERNAME/tino-te-ai-railway.git

# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

## 4️⃣ 업로드 확인

GitHub 레포지토리 페이지에서 다음 파일들이 있는지 확인:

### 백엔드 필수 파일들
- ✅ `backend/railway.json`
- ✅ `backend/requirements.txt`
- ✅ `backend/app/main.py`
- ✅ `backend/.env.example`

### 프론트엔드 필수 파일들
- ✅ `frontend/package.json`
- ✅ `frontend/next.config.js`
- ✅ `frontend/src/`

---

## ⚠️ 주의사항

### .env 파일 제외
실제 API 키가 들어있는 `.env` 파일은 GitHub에 올리면 안됩니다!

`.gitignore` 파일에 다음 내용이 있는지 확인:
```
# 환경 변수 파일
.env
.env.local
.env.production

# 데이터베이스 파일
*.db
*.sqlite

# 로그 파일
*.log
```

### 민감한 정보 확인
- ✅ API 키가 코드에 하드코딩되어 있지 않은지 확인
- ✅ 비밀번호나 토큰이 노출되지 않았는지 확인
- ✅ `.env.example` 파일만 올라가고 실제 `.env`는 제외되었는지 확인

---

## 🚀 다음 단계

GitHub 업로드 완료 후:
1. **Railway 프로젝트 생성**
2. **GitHub 레포지토리 연결**
3. **환경 변수 설정**
4. **배포 실행**

---

## 🤔 현재 상황 확인

1. **Git이 초기화되어 있나요?** (`git status` 명령어로 확인)
2. **GitHub 계정이 있나요?**
3. **레포지토리를 생성할 준비가 되었나요?**

준비되시면 위의 명령어들을 순서대로 실행해보세요!