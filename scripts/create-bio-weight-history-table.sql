-- bio_weight_history 테이블 생성
CREATE TABLE IF NOT EXISTS bio_weight_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    plant VARCHAR(10) NOT NULL,
    chemical VARCHAR(20) NOT NULL,
    io_gb VARCHAR(10) NOT NULL,
    paper_no VARCHAR(50),
    company VARCHAR(100),
    chemical_name VARCHAR(50),
    chemical_id VARCHAR(20),
    car_no VARCHAR(20),
    first_time TIMESTAMP,
    first_weight DECIMAL(10,2),
    second_time TIMESTAMP,
    second_weight DECIMAL(10,2),
    real_weight DECIMAL(10,2),
    seq_no INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bio_weight_history_plant_chemical ON bio_weight_history(plant, chemical);
CREATE INDEX IF NOT EXISTS idx_bio_weight_history_first_time ON bio_weight_history(first_time);
CREATE INDEX IF NOT EXISTS idx_bio_weight_history_company ON bio_weight_history(company);

-- 샘플 데이터 삽입
INSERT INTO bio_weight_history (
    plant, chemical, io_gb, paper_no, company, chemical_name, chemical_id, car_no, 
    first_time, first_weight, second_time, second_weight, real_weight, seq_no
) VALUES 
('bio1', 'SAND', 'IN', 'P2024120301', '한국산업', '유동사', 'C001', '12가3456', 
 '2024-12-03 09:20:00', 58.5, '2024-12-03 09:30:00', 30.0, 28.5, 1),
('bio1', 'KAOLIN', 'IN', 'P2024120302', '대한화학', '고령토', 'C002', '34나5678', 
 '2024-12-03 14:05:00', 54.8, '2024-12-03 14:15:00', 30.0, 24.8, 2),
('bio1', 'SAND', 'IN', 'P2024120201', '한국산업', '유동사', 'C001', '56다7890', 
 '2024-12-02 11:35:00', 59.2, '2024-12-02 11:45:00', 30.0, 29.2, 3),
('bio1', 'KAOLIN', 'IN', 'P2024113001', '태명화학', '고령토', 'C003', '78라9012', 
 '2024-11-30 16:10:00', 56.3, '2024-11-30 16:20:00', 30.0, 26.3, 4),
('bio1', 'SAND', 'IN', 'P2024112901', '대한화학', '유동사', 'C002', '90마1234', 
 '2024-11-29 08:40:00', 57.8, '2024-11-29 08:50:00', 30.0, 27.8, 5),
('bio2', 'UREA', 'IN', 'P2024120303', '한국화학', '요소수', 'C004', '11바2345', 
 '2024-12-03 10:15:00', 55.2, '2024-12-03 10:25:00', 30.0, 25.2, 6),
('bio2', 'SULFATE', 'IN', 'P2024120202', '대성화학', '황산암모늄', 'C005', '22사3456', 
 '2024-12-02 13:20:00', 58.7, '2024-12-02 13:30:00', 30.0, 28.7, 7),
('bio1', 'HYDRATED', 'IN', 'P2024112801', '동양화학', '소석회', 'C006', '33아4567', 
 '2024-11-28 15:45:00', 52.1, '2024-11-28 15:55:00', 30.0, 22.1, 8),
('bio2', 'SODIUM', 'IN', 'P2024112701', '서울화학', '중탄산나트륨', 'C007', '44자5678', 
 '2024-11-27 09:10:00', 56.8, '2024-11-27 09:20:00', 30.0, 26.8, 9),
('bio1', 'SAND', 'IN', 'P2024112601', '한국산업', '유동사', 'C001', '55차6789', 
 '2024-11-26 14:30:00', 59.5, '2024-11-26 14:40:00', 30.0, 29.5, 10);

-- 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_bio_weight_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bio_weight_history_updated_at
    BEFORE UPDATE ON bio_weight_history
    FOR EACH ROW
    EXECUTE FUNCTION update_bio_weight_history_updated_at();
