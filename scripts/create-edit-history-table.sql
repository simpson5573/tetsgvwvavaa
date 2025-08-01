-- 편집 히스토리 테이블 생성
CREATE TABLE IF NOT EXISTS edit_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_name VARCHAR(100) NOT NULL,
    plant VARCHAR(10) NOT NULL,
    chemical VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    edit_type VARCHAR(20) NOT NULL CHECK (edit_type IN ('time_change', 'quantity_change', 'status_change', 'cancel_request', 'emergency_cancel', 'calibration')),
    old_value JSONB,
    new_value JSONB,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_edit_history_plant_chemical ON edit_history(plant, chemical);
CREATE INDEX IF NOT EXISTS idx_edit_history_user_name ON edit_history(user_name);
CREATE INDEX IF NOT EXISTS idx_edit_history_created_at ON edit_history(created_at);
CREATE INDEX IF NOT EXISTS idx_edit_history_edit_type ON edit_history(edit_type);

-- RLS 정책 설정 (필요한 경우)
ALTER TABLE edit_history ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능하도록 설정
CREATE POLICY "Enable read access for all users" ON edit_history
    FOR SELECT USING (true);

-- 모든 사용자가 삽입 가능하도록 설정
CREATE POLICY "Enable insert access for all users" ON edit_history
    FOR INSERT WITH CHECK (true);
