-- 우리집 보드: 푸시 구독 저장 테이블
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  member     text not null,             -- 멤버 이름
  group_code text not null default 'default',  -- 어느 그룹(방)의 구독인지
  p256dh     text not null,
  auth       text not null,
  updated_at timestamptz not null default now()
);

-- ⚠️ 그룹 단위 범용 서비스로 쓰려면 supabase/migration-groups.sql 도 함께 실행하세요.

-- 이 앱은 로그인 없이 publishable(anon) 키로만 쓰므로,
-- anon 역할이 자기 구독을 등록/조회/삭제할 수 있도록 허용한다. (2인 전용 비공개 앱)
alter table public.push_subscriptions enable row level security;

drop policy if exists "anon manage subscriptions" on public.push_subscriptions;
create policy "anon manage subscriptions"
  on public.push_subscriptions
  for all
  to anon
  using (true)
  with check (true);
