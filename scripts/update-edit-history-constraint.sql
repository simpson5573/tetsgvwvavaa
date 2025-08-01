-- 기존 제약 조건 삭제
ALTER TABLE edit_history DROP CONSTRAINT IF EXISTS edit_history_edit_type_check;

-- 새로운 제약 조건 추가 (draft_create, draft_send 포함)
ALTER TABLE edit_history ADD CONSTRAINT edit_history_edit_type_check 
CHECK (edit_type IN (
  'time_change', 
  'quantity_change', 
  'status_change', 
  'cancel_request', 
  'emergency_cancel', 
  'calibration',
  'draft_create',
  'draft_send'
));
