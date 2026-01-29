-- profiles 테이블에 is_approved 컬럼 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;

-- handler, admin 역할은 기본 승인
UPDATE profiles SET is_approved = true WHERE role IN ('super_admin', 'sub_admin', 'handler');
