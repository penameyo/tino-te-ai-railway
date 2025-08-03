-- Pre-Beta 테스터 관리를 위한 테이블 생성
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 users 테이블에 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'general';
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_start_date TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS beta_end_date TIMESTAMP;

-- 2. Pre-Beta 테스터 간단 정보 테이블 (이름, 학번, 크레딧만)
-- 실제로는 users 테이블의 user_type으로 구분하므로 별도 테이블은 선택사항

-- 3. 피드백 추적 테이블
CREATE TABLE IF NOT EXISTS feedback_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    submission_date TIMESTAMP DEFAULT NOW(),
    page_context VARCHAR(255),
    session_id VARCHAR(255),
    day_of_week VARCHAR(10),
    week_number INTEGER,
    metadata JSONB
);

-- 4. 사용량 분석 테이블
CREATE TABLE IF NOT EXISTS usage_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100),
    usage_duration INTEGER, -- in seconds
    session_id VARCHAR(255),
    timestamp TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

-- 5. 주간 피드백 스케줄 테이블
CREATE TABLE IF NOT EXISTS weekly_feedback_schedule (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_start_date DATE,
    target_feedback_count INTEGER DEFAULT 3,
    actual_feedback_count INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_pre_beta_testers_user_id ON pre_beta_testers(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_user_id ON feedback_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_submissions_date ON feedback_submissions(submission_date DESC);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_timestamp ON usage_analytics(timestamp DESC);

-- 7. 실제 Pre-Beta 테스터 정보 입력 (수동으로 입력 필요)
-- 아래는 예시이며, 실제 모집한 3명의 정보로 교체해야 합니다

-- 예시: 실제 Pre-Beta 테스터 계정 생성
-- INSERT INTO users (student_id, name, api_key, credits, user_type, beta_start_date, beta_end_date) VALUES
-- ('실제학번1', '실제이름1', 'pre-beta-api-key-1', 10, 'pre-beta', NOW(), NOW() + INTERVAL '2 months'),
-- ('실제학번2', '실제이름2', 'pre-beta-api-key-2', 10, 'pre-beta', NOW(), NOW() + INTERVAL '2 months'),
-- ('실제학번3', '실제이름3', 'pre-beta-api-key-3', 10, 'pre-beta', NOW(), NOW() + INTERVAL '2 months');

-- 예시: Pre-Beta 테스터 상세 정보 추가
-- INSERT INTO pre_beta_testers (user_id, department, student_type, recruitment_source, notes) VALUES
-- ((SELECT id FROM users WHERE student_id = '실제학번1'), '전자공학부', '편입학생', '네이버 폼 모집', '실제 모집 정보'),
-- ((SELECT id FROM users WHERE student_id = '실제학번2'), '전자공학부', '편입학생', '네이버 폼 모집', '실제 모집 정보'),
-- ((SELECT id FROM users WHERE student_id = '실제학번3'), '전자공학부', '편입학생', '네이버 폼 모집', '실제 모집 정보');

-- 9. 테이블 생성 확인
SELECT 
    'users' as table_name, 
    COUNT(*) as total_records,
    COUNT(CASE WHEN user_type = 'pre-beta' THEN 1 END) as pre_beta_count
FROM users
UNION ALL
SELECT 
    'pre_beta_testers' as table_name,
    COUNT(*) as total_records,
    0 as pre_beta_count
FROM pre_beta_testers
UNION ALL
SELECT 
    'feedback_submissions' as table_name,
    COUNT(*) as total_records,
    0 as pre_beta_count
FROM feedback_submissions
UNION ALL
SELECT 
    'usage_analytics' as table_name,
    COUNT(*) as total_records,
    0 as pre_beta_count
FROM usage_analytics;