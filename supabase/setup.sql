-- =========================================================
-- Team KW 팀 허브 — Supabase 설정 (SQL Editor에 통째로 붙여넣고 Run)
-- 여러 번 실행해도 괜찮아요 (이미 있으면 건너뜀)
--
-- 만드는 것
--   members   팀원 (이름·직급)
--   meetings  회의 일정
--   activity  최근 활동
--   notices   공지사항
--   messages  팀원끼리 쪽지
--   app_settings  입장 비밀번호 (브라우저에서 못 읽음 — 함수 안에서만 확인)
--   join_team / check_password / reset_demo  비밀번호를 확인하는 함수
-- 접속 상태(온라인·자리 비움 등)는 표에 저장하지 않고 Realtime Presence로 주고받아요.
-- =========================================================

-- 1) 표 -----------------------------------------------------
create table if not exists public.members (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique check (char_length(name) between 1 and 12),
  role       text not null check (char_length(role) between 1 and 20),
  joined_at  timestamptz not null default now()
);

create table if not exists public.meetings (
  id          uuid primary key default gen_random_uuid(),
  title       text not null check (char_length(title) between 1 and 40),
  date        date not null,
  start_time  text not null check (start_time ~ '^\d{2}:\d{2}$'),
  end_time    text not null check (end_time ~ '^\d{2}:\d{2}$' and end_time > start_time),
  place       text not null default '' check (char_length(place) <= 30),
  attendees   uuid[] not null default '{}',
  created_by  uuid references public.members(id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.activity (
  id     bigint generated always as identity primary key,
  who    uuid references public.members(id) on delete cascade,
  what   text not null check (char_length(what) <= 40),
  place  text not null default '' check (char_length(place) <= 80),
  at     timestamptz not null default now()
);

create table if not exists public.notices (
  id          uuid primary key default gen_random_uuid(),
  tag         text not null default '공지' check (tag in ('공지', '자료', '일정')),
  title       text not null check (char_length(title) between 1 and 60),
  body        text not null default '' check (char_length(body) <= 1000),
  author      uuid not null references public.members(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  sender      uuid not null references public.members(id) on delete cascade,
  recipient   uuid not null references public.members(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  read_at     timestamptz,
  check (sender <> recipient)
);
create index if not exists messages_pair_idx on public.messages (sender, recipient, created_at);

create table if not exists public.app_settings (
  key    text primary key,
  value  text not null
);

-- 2) 입장 비밀번호 (처음 한 번만 들어가고, 다시 실행해도 바뀌지 않음) -------------
--    바꾸려면 아래 한 줄만 따로 실행:  update public.app_settings set value = '새비밀번호' where key = 'password';
insert into public.app_settings (key, value) values ('password', 'teamkw')
on conflict (key) do nothing;

-- 3) 행 단위 보안(RLS) ----------------------------------------
--   members  : 읽기만 (추가는 비밀번호 확인 함수로만)
--   meetings : 읽기·추가·삭제
--   activity : 읽기·추가
--   notices  : 읽기·추가·삭제
--   messages : 읽기·추가·읽음 표시(read_at만 수정)
--   app_settings : 정책 없음 → 브라우저에서 절대 못 읽음
--   ※ 로그인(Auth) 없이 공개 키로 쓰는 데모라, '내 쪽지만 읽기'까지는 DB가 막지 못해요(화면에서만 걸러 보여줌).
alter table public.members      enable row level security;
alter table public.meetings     enable row level security;
alter table public.activity     enable row level security;
alter table public.notices      enable row level security;
alter table public.messages     enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "members read"    on public.members;
drop policy if exists "meetings read"   on public.meetings;
drop policy if exists "meetings insert" on public.meetings;
drop policy if exists "meetings delete" on public.meetings;
drop policy if exists "activity read"   on public.activity;
drop policy if exists "activity insert" on public.activity;
drop policy if exists "notices read"    on public.notices;
drop policy if exists "notices insert"  on public.notices;
drop policy if exists "notices delete"  on public.notices;
drop policy if exists "messages read"   on public.messages;
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages update" on public.messages;

create policy "members read"    on public.members  for select to anon, authenticated using (true);
create policy "meetings read"   on public.meetings for select to anon, authenticated using (true);
create policy "meetings insert" on public.meetings for insert to anon, authenticated with check (created_by is not null);
create policy "meetings delete" on public.meetings for delete to anon, authenticated using (true);
create policy "activity read"   on public.activity for select to anon, authenticated using (true);
create policy "activity insert" on public.activity for insert to anon, authenticated with check (who is not null);
create policy "notices read"    on public.notices  for select to anon, authenticated using (true);
create policy "notices insert"  on public.notices  for insert to anon, authenticated with check (author is not null);
create policy "notices delete"  on public.notices  for delete to anon, authenticated using (true);
create policy "messages read"   on public.messages for select to anon, authenticated using (true);
create policy "messages insert" on public.messages for insert to anon, authenticated with check (read_at is null);
create policy "messages update" on public.messages for update to anon, authenticated using (true) with check (true);

grant select on public.members to anon, authenticated;
grant select, insert, delete on public.meetings to anon, authenticated;
grant select, insert on public.activity to anon, authenticated;
grant select, insert, delete on public.notices to anon, authenticated;
grant select, insert on public.messages to anon, authenticated;
revoke update on public.messages from anon, authenticated;
grant update (read_at) on public.messages to anon, authenticated;   -- 읽음 표시만 바꿀 수 있음
revoke all on public.app_settings from anon, authenticated;

-- 4) 함수 (비밀번호는 서버 안에서만 비교) -------------------------
create or replace function public.check_password(p_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(p_password = (select value from public.app_settings where key = 'password'), false);
$$;

-- 입장: 비밀번호가 맞으면 팀원을 만들거나(같은 이름이면 그 팀원으로 이어서) 돌려줌
create or replace function public.join_team(p_password text, p_name text, p_role text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_role text := btrim(coalesce(p_role, ''));
  v_old  public.members;
  v_m    public.members;
begin
  if not public.check_password(p_password) then
    raise exception 'wrong_password' using errcode = '28P01';
  end if;
  if v_name = '' or v_role = '' then
    raise exception 'missing_fields' using errcode = '22023';
  end if;

  select * into v_old from public.members where name = v_name;
  if found then
    update public.members set role = v_role where id = v_old.id returning * into v_m;
    return json_build_object('member', row_to_json(v_m), 'is_new', false);
  end if;

  insert into public.members (name, role) values (v_name, v_role) returning * into v_m;
  insert into public.activity (who, what, place) values (v_m.id, '팀에 들어왔어요', 'Team KW');
  return json_build_object('member', row_to_json(v_m), 'is_new', true);
end;
$$;

-- 데모 전체 초기화: 비밀번호가 맞으면 팀원·회의·활동 전부 삭제
create or replace function public.reset_demo(p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_password(p_password) then
    raise exception 'wrong_password' using errcode = '28P01';
  end if;
  delete from public.messages where true;
  delete from public.notices  where true;
  delete from public.activity where true;
  delete from public.meetings where true;
  delete from public.members  where true;
end;
$$;

revoke all on function public.check_password(text)          from public;
revoke all on function public.join_team(text, text, text)   from public;
revoke all on function public.reset_demo(text)              from public;
grant execute on function public.check_password(text)        to anon, authenticated;
grant execute on function public.join_team(text, text, text) to anon, authenticated;
grant execute on function public.reset_demo(text)            to anon, authenticated;

-- 5) 실시간: 표가 바뀌면 열려 있는 모든 화면에 알림 -----------------
do $$
declare t text;
begin
  foreach t in array array['members', 'meetings', 'activity', 'notices', 'messages'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
