-- 1단계: 기존 테이블 구조 확인
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'notes')
ORDER BY table_name, ordinal_position;

-- 2단계: 기존 테이블이 있다면 구조 확인 후 필요한 컬럼만 추가
-- (아래 쿼리들은 필요에 따라 개별적으로 실행하세요)

-- users 테이블에 필요한 컬럼이 없다면 추가
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR(50);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(100);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS api_key VARCHAR(255);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 10;

-- notes 테이블이 없다면 생성
CREATE TABLE IF NOT EXISTS notes (
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

-- 3단계: 인덱스 생성 (이미 있어도 오류 안남)
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);

-- 4단계: 최종 테이블 구조 확인
SELECT 
    table_name,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'notes')
GROUP BY table_name;