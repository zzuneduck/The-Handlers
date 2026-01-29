import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yfrrlsfvnhycprcexeot.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmcnJsc2Z2bmh5Y3ByY2V4ZW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzA2ODksImV4cCI6MjA4NTI0NjY4OX0._bPyAlV03WIwQH03c9v3eaaPb1UTzICc2TNPmDRn7Z4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function main() {
  // is_approved 컬럼이 이미 있는지 확인 (한 행 조회 시도)
  const { data: testRow, error: testError } = await supabase
    .from('profiles')
    .select('is_approved')
    .limit(1);

  if (testError && testError.message.includes('is_approved')) {
    console.log('❌ is_approved 컬럼이 아직 없습니다.');
    console.log('Supabase 대시보드 SQL Editor에서 아래 SQL을 실행해주세요:\n');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false;');
    console.log("UPDATE profiles SET is_approved = true WHERE role IN ('super_admin', 'sub_admin', 'handler');");
    return;
  }

  console.log('✅ is_approved 컬럼 확인됨');

  // handler, admin 역할은 기본 승인
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_approved: true })
    .in('role', ['super_admin', 'sub_admin', 'handler']);

  if (updateError) {
    console.error('❌ 업데이트 실패:', updateError.message);
  } else {
    console.log('✅ handler, admin 역할 기본 승인 처리 완료');
  }

  // payn_staff, geotech_staff 현재 상태 확인
  const { data: staffUsers } = await supabase
    .from('profiles')
    .select('name, email, role, is_approved')
    .in('role', ['payn_staff', 'geotech_staff']);

  if (staffUsers && staffUsers.length > 0) {
    console.log('\n📋 PayN/지오테크넷 직원 승인 상태:');
    staffUsers.forEach((u) => {
      console.log(`  ${u.name} (${u.email}) - ${u.role} - ${u.is_approved ? '승인' : '미승인'}`);
    });
  }
}

main();
