-- =========================================================
-- Team KW 팀 허브 — Supabase 설정 (SQL Editor에 통째로 붙여넣고 Run)
-- 여러 번 실행해도 괜찮아요 (이미 있으면 건너뜀, 기존 팀원·회의·공지·쪽지·비밀번호는 그대로)
--
-- 먼저 할 일(v9~): Authentication → Sign In / Providers → "Allow anonymous sign-ins" 켜기
--
-- 보안 구조 (v9~)
--   - 브라우저는 '익명 로그인'으로 기기마다 auth 사용자 하나를 받아요(세션은 그 브라우저에 유지).
--   - 비밀번호를 맞혀 입장(join_team)하면 그 기기가 팀원과 연결돼요(member_devices).
--     → 다음부터 그 기기는 비밀번호·이름 없이 바로 들어가요(whoami).
--   - 모든 표는 '입장한 기기'만 읽고 쓸 수 있고, 쪽지는 보낸 사람·받은 사람만 읽어요.
--   - 비밀번호(app_settings)와 기기 연결(member_devices)은 브라우저에서 절대 못 읽어요. 함수 안에서만 써요.
--
-- 만드는 것
--   members   팀원 (이름·직급)
--   meetings  회의 일정
--   activity  최근 활동
--   notices   공지사항
--   messages  팀원끼리 쪽지
--   member_devices  기기(익명 로그인) → 팀원 연결 (v9)
--   app_settings  입장 비밀번호 (브라우저에서 못 읽음 — 함수 안에서만 확인)
--   check_password / member_names / join_team / whoami / leave_device / reset_demo  함수
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

-- v9: 이 기기(익명 로그인 사용자)가 어떤 팀원인지. 한 팀원이 여러 기기(노트북·휴대폰)를 가질 수 있음
create table if not exists public.member_devices (
  auth_uid   uuid primary key,                                              -- auth.users(id) (익명 로그인)
  member     uuid not null references public.members(id) on delete cascade,
  linked_at  timestamptz not null default now()
);
create index if not exists member_devices_member_idx on public.member_devices (member);

create table if not exists public.app_settings (
  key    text primary key,
  value  text not null
);

-- 2) 입장 비밀번호 (처음 한 번만 들어가고, 다시 실행해도 바뀌지 않음) -------------
--    바꾸려면 아래 한 줄만 따로 실행:  update public.app_settings set value = '새비밀번호' where key = 'password';
insert into public.app_settings (key, value) values ('password', 'teamkw')
on conflict (key) do nothing;

-- 3) 지금 이 기기(익명 로그인)가 어떤 팀원인지 --------------------
create or replace function public.my_member_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select member from public.member_devices where auth_uid = auth.uid();
$$;

-- 4) 행 단위 보안(RLS) — 입장한 기기만 (v9) --------------------------
--   members  : 읽기만 (추가·수정은 join_team 함수로만)
--   meetings : 읽기 / 추가(만든 사람 = 나) / 삭제(내가 만들었거나 참석자인 회의)
--   activity : 읽기 / 추가(나로만)
--   notices  : 읽기 / 추가(나로만) / 삭제(내 공지만)
--   messages : 읽기(내가 보냈거나 받은 쪽지만) / 추가(보낸 사람 = 나) / 읽음 표시(받은 사람만, read_at만)
--   member_devices, app_settings : 정책 없음 → 브라우저에서 직접 못 읽고 못 씀 (함수로만)
--   로그인 안 한 상태(anon)는 아무 표도 못 봐요. 익명 로그인을 했어도 입장 전 기기는 빈 결과만 받아요.
alter table public.members        enable row level security;
alter table public.member_devices enable row level security;
alter table public.meetings       enable row level security;
alter table public.activity       enable row level security;
alter table public.notices        enable row level security;
alter table public.messages       enable row level security;
alter table public.app_settings   enable row level security;

-- 예전 정책(v3~v8: anon 허용)을 이름과 상관없이 전부 지우고 새로 만듦 → 여러 번 실행해도 같은 결과
do $$
declare r record;
begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public'
    and tablename in ('members', 'member_devices', 'meetings', 'activity', 'notices', 'messages', 'app_settings')
  loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "members read"     on public.members  for select to authenticated using (public.my_member_id() is not null);
create policy "meetings read"    on public.meetings for select to authenticated using (public.my_member_id() is not null);
create policy "meetings insert"  on public.meetings for insert to authenticated with check (created_by = public.my_member_id());
create policy "meetings delete"  on public.meetings for delete to authenticated using (
  created_by = public.my_member_id() or public.my_member_id() = any(attendees));
create policy "activity read"    on public.activity for select to authenticated using (public.my_member_id() is not null);
create policy "activity insert"  on public.activity for insert to authenticated with check (who = public.my_member_id());
create policy "notices read"     on public.notices  for select to authenticated using (public.my_member_id() is not null);
create policy "notices insert"   on public.notices  for insert to authenticated with check (author = public.my_member_id());
create policy "notices delete"   on public.notices  for delete to authenticated using (author = public.my_member_id());
create policy "messages read"    on public.messages for select to authenticated using (
  sender = public.my_member_id() or recipient = public.my_member_id());
create policy "messages insert"  on public.messages for insert to authenticated with check (
  sender = public.my_member_id() and read_at is null);
create policy "messages read-mark" on public.messages for update to authenticated
  using (recipient = public.my_member_id()) with check (recipient = public.my_member_id());

-- 권한: anon(로그인 전)은 표에 손대지 못함, 입장한 기기도 필요한 것만
revoke all on public.members, public.member_devices, public.meetings, public.activity,
  public.notices, public.messages, public.app_settings from anon, authenticated;
grant select on public.members to authenticated;
grant select, insert, delete on public.meetings to authenticated;
grant select, insert on public.activity to authenticated;
grant select, insert, delete on public.notices to authenticated;
grant select, insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;   -- 읽음 표시만 바꿀 수 있음

-- 5) 함수 (비밀번호는 서버 안에서만 비교) -------------------------
create or replace function public.check_password(p_password text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(p_password = (select value from public.app_settings where key = 'password'), false);
$$;

-- 비밀번호가 맞으면 지금 팀원 이름·직급 목록 (입장 화면의 '이미 있는 팀원' 안내용)
create or replace function public.member_names(p_password text)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.check_password(p_password) then
    raise exception 'wrong_password' using errcode = '28P01';
  end if;
  return coalesce((select json_agg(json_build_object('name', name, 'role', role) order by joined_at) from public.members), '[]'::json);
end;
$$;

-- 지금 이 기기의 팀원 (입장 안 한 기기면 null) → 페이지 열 때 이걸로 자동 입장
create or replace function public.whoami()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select row_to_json(m) from public.members m where m.id = public.my_member_id();
$$;

-- 입장: 비밀번호가 맞으면 팀원을 만들거나(같은 이름이면 그 팀원으로 이어서) 이 기기를 그 팀원에 연결
create or replace function public.join_team(p_password text, p_name text, p_role text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid  uuid := auth.uid();
  v_name text := btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_role text := btrim(coalesce(p_role, ''));
  v_m    public.members;
  v_new  boolean := false;
begin
  if v_uid is null then
    raise exception 'no_session' using errcode = '28000';
  end if;
  if not public.check_password(p_password) then
    raise exception 'wrong_password' using errcode = '28P01';
  end if;
  if v_name = '' or v_role = '' then
    raise exception 'missing_fields' using errcode = '22023';
  end if;

  select * into v_m from public.members where name = v_name;
  if found then
    if v_role <> v_m.role then
      update public.members set role = v_role where id = v_m.id returning * into v_m;
    end if;
  else
    insert into public.members (name, role) values (v_name, v_role) returning * into v_m;
    v_new := true;
    insert into public.activity (who, what, place) values (v_m.id, '팀에 들어왔어요', 'Team KW');
  end if;

  insert into public.member_devices (auth_uid, member) values (v_uid, v_m.id)
  on conflict (auth_uid) do update set member = excluded.member, linked_at = now();

  return json_build_object('member', row_to_json(v_m), 'is_new', v_new);
end;
$$;

-- '이 기기에서 나가기': 이 기기 연결만 끊음 (팀원·쪽지 등 기록은 그대로)
create or replace function public.leave_device()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.member_devices where auth_uid = auth.uid();
$$;

-- 데모 전체 초기화: 비밀번호가 맞으면 팀원·회의·공지·쪽지·활동·기기 연결 전부 삭제
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
  delete from public.messages       where true;
  delete from public.notices        where true;
  delete from public.activity       where true;
  delete from public.meetings       where true;
  delete from public.member_devices where true;
  delete from public.members        where true;
end;
$$;

-- 함수 실행 권한: 비밀번호 확인·이름 목록만 로그인 전에도, 나머지는 익명 로그인한 기기만
revoke all on function public.my_member_id()                from public, anon, authenticated;
revoke all on function public.check_password(text)          from public, anon, authenticated;
revoke all on function public.member_names(text)            from public, anon, authenticated;
revoke all on function public.whoami()                      from public, anon, authenticated;
revoke all on function public.join_team(text, text, text)   from public, anon, authenticated;
revoke all on function public.leave_device()                from public, anon, authenticated;
revoke all on function public.reset_demo(text)              from public, anon, authenticated;
grant execute on function public.my_member_id()              to authenticated;
grant execute on function public.check_password(text)        to anon, authenticated;
grant execute on function public.member_names(text)          to anon, authenticated;
grant execute on function public.whoami()                    to authenticated;
grant execute on function public.join_team(text, text, text) to authenticated;
grant execute on function public.leave_device()              to authenticated;
grant execute on function public.reset_demo(text)            to authenticated;

-- 6) 실시간: 표가 바뀌면 열려 있는 모든 화면에 알림 (RLS가 적용돼서 볼 수 있는 변경만 받음) -----
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
