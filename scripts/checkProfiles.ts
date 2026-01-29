import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://yfrrlsfvnhycprcexeot.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmcnJsc2Z2bmh5Y3ByY2V4ZW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzA2ODksImV4cCI6MjA4NTI0NjY4OX0._bPyAlV03WIwQH03c9v3eaaPb1UTzICc2TNPmDRn7Z4',
);

async function main() {
  // 전체 컬럼 확인을 위해 * 조회
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .limit(1);

  if (error) {
    console.log('에러:', error.message);
  } else if (data && data.length > 0) {
    console.log('profiles 테이블 컬럼 목록:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\n첫 번째 행:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('데이터 없음');
  }
}

main();
