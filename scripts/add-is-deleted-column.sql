-- bio_company 테이블에 is_deleted 컬럼 추가
ALTER TABLE bio_company ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

-- 기존 데이터에 is_deleted = false 설정
UPDATE bio_company SET is_deleted = false WHERE is_deleted IS NULL;

-- is_deleted 컬럼에 NOT NULL 제약 조건 추가
ALTER TABLE bio_company ALTER COLUMN is_deleted SET NOT NULL;

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_bio_company_is_deleted ON bio_company(is_deleted);

-- 로그 메시지
DO $$
BEGIN
    RAISE NOTICE 'is_deleted 컬럼이 성공적으로 추가되었습니다.';
END $$;
