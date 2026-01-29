import { createClient } from '@supabase/supabase-js';
const s = createClient(
  'https://yfrrlsfvnhycprcexeot.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmcnJsc2Z2bmh5Y3ByY2V4ZW90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk2NzA2ODksImV4cCI6MjA4NTI0NjY4OX0._bPyAlV03WIwQH03c9v3eaaPb1UTzICc2TNPmDRn7Z4',
);
async function main() {
  const { data, error } = await s.from('sales_records').select('*').limit(1);
  console.log(error ? '❌ sales_records 에러: ' + error.message : '✅ sales_records 테이블 확인됨');
}
main();
