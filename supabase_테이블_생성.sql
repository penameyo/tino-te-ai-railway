-- Supabase 데이터베이스 테이블 생성 스크립트
-- SQL Editor에서 이 쿼리를 복사해서 실행하세요

-- 1. 사용자 테이블
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL,
    credits INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 노트 테이블
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

-- 3. 인덱스 생성 (성능 최적화)
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_api_key ON users(api_key);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_created_at ON notes(created_at DESC);

-- 4. 테스트 사용자 데이터 삽입 (선택사항)
INSERT INTO users (student_id, name, api_key, credits) VALUES
('20240001', '김철수', 'test-api-key-1', 10),
('20240002', '이영희', 'test-api-key-2', 10),
('20240003', '박민수', 'test-api-key-3', 10);

-- 5. 테이블 생성 확인
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'notes')
ORDER BY table_name, ordinal_position;