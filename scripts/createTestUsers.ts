import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yfrrlsfvnhycprcexeot.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmcnJsc2Z2bmh5Y3ByY2V4ZW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzA2ODksImV4cCI6MjA4NTI0NjY4OX0._bPyAlV03WIwQH03c9v3eaaPb1UTzICc2TNPmDRn7Z4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_USERS = [
  { email: 'admin1@test.com', password: 'test1234', name: '관리자1', role: 'super_admin' },
  { email: 'admin2@test.com', password: 'test1234', name: '관리자2', role: 'sub_admin' },
  { email: 'admin3@test.com', password: 'test1234', name: '관리자3', role: 'sub_admin' },
  { email: 'admin4@test.com', password: 'test1234', name: '관리자4', role: 'sub_admin' },
  { email: 'payn@test.com', password: 'test1234', name: '페이앤직원', role: 'payn_staff' },
  { email: 'geotech@test.com', password: 'test1234', name: '지오테크직원', role: 'geotech_staff' },
];

async function main() {
  for (const user of TEST_USERS) {
    console.log(`\n[회원가입] ${user.email} (${user.name}, ${user.role})`);

    // 1) signUp
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: { data: { name: user.name } },
    });

    if (error) {
      console.error(`  ❌ signUp 실패: ${error.message}`);
      continue;
    }

    const uid = data.user?.id;
    if (!uid) {
      console.error('  ❌ user id 없음');
      continue;
    }
    console.log(`  ✅ signUp 성공 (uid: ${uid})`);

    // 2) profiles 테이블 역할 업데이트
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ id: uid, email: user.email, name: user.name, role: user.role }, { onConflict: 'id' });

    if (updateError) {
      console.error(`  ❌ profile 업데이트 실패: ${updateError.message}`);
    } else {
      console.log(`  ✅ profile 역할 → ${user.role}`);
    }
  }

  console.log('\n🎉 완료!');
}

main();
