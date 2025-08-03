-- Supabase 테이블 완전 초기화 및 재생성
-- 기존 테이블들을 모두 삭제하고 새로 만듭니다

-- 1단계: 기존 테이블 삭제 (의존성 순서 고려)
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2단계: 사용자 테이블 생성
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    credits INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3단계: 노트 테이블 생성
CREATE TABLE notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    original_transcription TEXT,
    summary TEXT,
    media_duration_seconds INTEGER DEFAULT 0,
    note_type VARCHAR(50) DEFAULT 'audio',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4단계: 성능 최적화를 위한 인덱스 생성
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- 5단계: 테스트용 사용자 데이터 삽입
INSERT INTO users (student_id, name, api_key, credits) VALUES
('20240001', '김철수', 'test-api-key-1', 10),
('20240002', '이영희', 'test-api-key-2', 10),
('20240003', '박민수', 'test-api-key-3', 10);

-- 6단계: 생성 결과 확인
SELECT 'users 테이블' as table_info, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'notes 테이블' as table_info, COUNT(*) as record_count FROM notes;

-- 7단계: 테이블 구조 확인
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'notes')
ORDER BY table_name, ordinal_position;