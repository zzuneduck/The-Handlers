-- profiles 테이블
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  name text not null,
  role text not null check (role in ('super_admin', 'sub_admin', 'payn_staff', 'geotech_staff', 'handler')),
  handler_level integer check (handler_level >= 1 and handler_level <= 7),
  phone text,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table public.profiles enable row level security;

-- 본인 프로필 조회
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- 관리자 전체 프로필 조회
create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('super_admin', 'sub_admin')
    )
  );

-- 본인 프로필 수정
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 프로필 생성 (회원가입 시)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 슈퍼관리자 전체 수정 권한
create policy "Super admin can update all profiles"
  on public.profiles for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'super_admin'
    )
  );
