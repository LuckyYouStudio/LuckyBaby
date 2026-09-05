-- 幸运宝贝 M1：云同步数据模型（Supabase / Postgres）
-- 核心思想：每条记录带 family_id + visibility，用 RLS 按成员角色过滤。

create type member_role as enum ('mom', 'dad', 'family');
create type visibility as enum ('self', 'partner', 'family');

create table families (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  due_date date not null,
  lmp date,
  mom_name text not null,
  baby_nickname text,
  created_at timestamptz default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  role member_role not null,
  relation text,
  joined_at timestamptz default now(),
  unique (family_id, user_id)
);

create table checkups (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  title text not null,
  week_from int not null,
  week_to int not null,
  date date,
  hospital text,
  items text[] default '{}',
  notes text,
  companion_id uuid references members(id),
  done boolean default false,
  metrics jsonb default '[]',
  result text,
  visibility visibility default 'partner',
  updated_at timestamptz default now()
);

create table supplements (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  name text not null,
  dose text,
  time_of_day text,
  week_from int,
  week_to int,
  note text,
  active boolean default true,
  visibility visibility default 'partner'
);

create table supplement_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  supplement_id uuid references supplements(id) on delete cascade,
  date date not null,
  by_id uuid references members(id),
  at timestamptz default now(),
  unique (supplement_id, date)
);

create table daily_logs (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  kind text not null check (kind in ('weight','symptom','mood','kick','note')),
  date date not null,
  value numeric,
  text text,
  by_id uuid references members(id),
  at timestamptz default now(),
  visibility visibility default 'partner'
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  by_id uuid references members(id),
  kind text not null,
  text text not null,
  ref_id uuid,
  visibility visibility default 'family',
  likes uuid[] default '{}',
  at timestamptz default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid references activities(id) on delete cascade,
  by_id uuid references members(id),
  text text not null,
  at timestamptz default now()
);

-- 当前用户在某家庭的角色
-- SECURITY DEFINER：绕过 members 表自身的 RLS，否则策略会无限递归
create or replace function my_role(fid uuid) returns member_role language sql stable security definer set search_path = public as $$
  select role from members where family_id = fid and user_id = auth.uid() limit 1
$$;

-- 可见性判断：mom 全可见；dad 看 partner/family；family 只看 family
create or replace function can_see(fid uuid, v visibility) returns boolean language sql stable security definer set search_path = public as $$
  select case my_role(fid)
    when 'mom' then true
    when 'dad' then v <> 'self'
    when 'family' then v = 'family'
    else false end
$$;

alter table families enable row level security;
alter table members enable row level security;
alter table checkups enable row level security;
alter table supplements enable row level security;
alter table supplement_logs enable row level security;
alter table daily_logs enable row level security;
alter table activities enable row level security;
alter table comments enable row level security;

create policy "member reads family" on families for select using (my_role(id) is not null);
create policy "member reads members" on members for select using (my_role(family_id) is not null);
create policy "mom manages members" on members for all using (my_role(family_id) = 'mom');

-- 产检：家人可见日程（title/date），数值由客户端按角色裁剪；更严格可拆视图
create policy "read checkups" on checkups for select using (my_role(family_id) is not null);
create policy "write checkups" on checkups for all using (my_role(family_id) in ('mom','dad'));

create policy "read supplements" on supplements for select using (can_see(family_id, visibility));
create policy "write supplements" on supplements for all using (my_role(family_id) in ('mom','dad'));
create policy "read supplement_logs" on supplement_logs for select using (my_role(family_id) in ('mom','dad'));
create policy "write supplement_logs" on supplement_logs for all using (my_role(family_id) in ('mom','dad'));

create policy "read daily_logs" on daily_logs for select using (can_see(family_id, visibility));
create policy "write daily_logs" on daily_logs for all using (my_role(family_id) in ('mom','dad'));

create policy "read activities" on activities for select using (can_see(family_id, visibility));
create policy "write activities" on activities for insert with check (my_role(family_id) is not null);
create policy "like activities" on activities for update using (my_role(family_id) is not null);
create policy "read comments" on comments for select using (exists (select 1 from activities a where a.id = activity_id and can_see(a.family_id, a.visibility)));
create policy "write comments" on comments for insert with check (exists (select 1 from activities a where a.id = activity_id and can_see(a.family_id, a.visibility)));

-- ---------------------------------------------------------------------------
-- M1 补充：建家庭 / 邀请码加入 / 取回我的家庭，以及 Realtime
-- ---------------------------------------------------------------------------

alter table families add column if not exists created_by uuid references auth.users(id);
alter table activities alter column ref_id type text;

-- 6 位邀请码，去掉易混淆字符（0/O、1/I/L）
create or replace function gen_invite_code() returns text language plpgsql volatile as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code text := '';
begin
  for i in 1..6 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end $$;

-- 准妈妈创建家庭（SECURITY DEFINER：此时她还不是任何家庭成员，走不了 RLS）
create or replace function create_family(
  p_due_date date, p_lmp date, p_mom_name text, p_baby_nickname text, p_member_id uuid default gen_random_uuid()
) returns json language plpgsql security definer set search_path = public as $$
declare
  fid uuid; code text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  loop
    code := gen_invite_code();
    exit when not exists (select 1 from families where invite_code = code);
  end loop;
  insert into families (invite_code, due_date, lmp, mom_name, baby_nickname, created_by)
    values (code, p_due_date, p_lmp, p_mom_name, p_baby_nickname, auth.uid()) returning id into fid;
  insert into members (id, family_id, user_id, name, role) values (p_member_id, fid, auth.uid(), p_mom_name, 'mom');
  return json_build_object('family_id', fid, 'invite_code', code, 'member_id', p_member_id);
end $$;

-- 用邀请码加入。一个家庭只能有一个准爸爸；同一账号不能重复加入
create or replace function join_family(
  p_code text, p_name text, p_role member_role, p_relation text default null, p_member_id uuid default gen_random_uuid()
) returns json language plpgsql security definer set search_path = public as $$
declare
  f families%rowtype;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_role = 'mom' then raise exception 'invalid role'; end if;
  select * into f from families where invite_code = upper(trim(p_code));
  if not found then raise exception 'invite code not found'; end if;
  if exists (select 1 from members where family_id = f.id and user_id = auth.uid()) then
    raise exception 'already a member';
  end if;
  if p_role = 'dad' and exists (select 1 from members where family_id = f.id and role = 'dad') then
    raise exception 'dad already exists';
  end if;
  insert into members (id, family_id, user_id, name, role, relation)
    values (p_member_id, f.id, auth.uid(), p_name, p_role, p_relation);
  insert into activities (family_id, by_id, kind, text, visibility)
    values (f.id, p_member_id, 'family', p_name || ' 加入了家庭', 'family');
  return json_build_object('family_id', f.id, 'member_id', p_member_id, 'family', row_to_json(f));
end $$;

-- 重新登录/换设备时取回我的家庭
create or replace function my_family() returns json language sql stable security definer set search_path = public as $$
  select json_build_object('family', row_to_json(f), 'member_id', m.id)
  from members m join families f on f.id = m.family_id
  where m.user_id = auth.uid() limit 1
$$;

grant execute on function create_family(date, date, text, text, uuid) to authenticated;
grant execute on function join_family(text, text, member_role, text, uuid) to authenticated;
grant execute on function my_family() to authenticated;

-- 成员可以更新自己的称呼；准妈妈可移除成员（已有 "mom manages members"）
create policy "member updates self" on members for update using (user_id = auth.uid());

-- Realtime：家庭内任一成员改动，其他人实时收到
alter publication supabase_realtime add table members, checkups, supplements, supplement_logs, daily_logs, activities, comments;

-- ---------------------------------------------------------------------------
-- 体验优化：产检“带什么”清单（照片暂存本机，不同步）
-- ---------------------------------------------------------------------------
alter table checkups add column if not exists bring_items jsonb default '[]';
-- ---------------------------------------------------------------------------
-- M2：报告照片云存储、伴侣提醒（推送 token 与去重表）
-- ---------------------------------------------------------------------------
alter table checkups add column if not exists photos text[] default '{}';

-- 私有桶 reports，路径 <family_id>/<checkup_id>/<uuid>.jpg
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('reports', 'reports', false, 10485760, array['image/jpeg', 'image/png', 'image/heic', 'image/webp'])
  on conflict (id) do nothing;

create policy "family reads reports" on storage.objects for select
  using (bucket_id = 'reports' and my_role(((storage.foldername(name))[1])::uuid) is not null);
create policy "parents write reports" on storage.objects for insert
  with check (bucket_id = 'reports' and my_role(((storage.foldername(name))[1])::uuid) in ('mom', 'dad'));
create policy "parents delete reports" on storage.objects for delete
  using (bucket_id = 'reports' and my_role(((storage.foldername(name))[1])::uuid) in ('mom', 'dad'));

-- 推送 token：每个成员一台设备（简化）
create table if not exists push_tokens (
  member_id uuid primary key references members(id) on delete cascade,
  family_id uuid references families(id) on delete cascade,
  token text not null,
  platform text,
  updated_at timestamptz default now()
);
alter table push_tokens enable row level security;
create policy "member manages own token" on push_tokens for all
  using (exists (select 1 from members m where m.id = member_id and m.user_id = auth.uid()))
  with check (exists (select 1 from members m where m.id = member_id and m.user_id = auth.uid()));

-- 伴侣提醒去重：同一补充剂同一天只提醒一次
create table if not exists nudges (
  id uuid primary key default gen_random_uuid(),
  family_id uuid references families(id) on delete cascade,
  supplement_id uuid references supplements(id) on delete cascade,
  date date not null,
  sent_at timestamptz default now(),
  unique (supplement_id, date)
);
alter table nudges enable row level security;

-- 伴侣提醒定时任务（每 30 分钟调用 Edge Function nudge-partner；secret 由 supabase secrets 管理）
-- create extension if not exists pg_cron; create extension if not exists pg_net;
-- select cron.schedule('nudge-partner', '*/30 * * * *', $$ select net.http_post(url := 'https://<ref>.supabase.co/functions/v1/nudge-partner', headers := '{"Content-Type":"application/json","x-cron-secret":"<CRON_SECRET>"}'::jsonb, body := '{}'::jsonb); $$);
-- 家庭时区：伴侣提醒按家庭所在时区算“到点 2 小时”
alter table families add column if not exists tz text default 'Asia/Shanghai';
create or replace function create_family(
  p_due_date date, p_lmp date, p_mom_name text, p_baby_nickname text, p_member_id uuid default gen_random_uuid(), p_tz text default 'Asia/Shanghai'
) returns json language plpgsql security definer set search_path = public as $$
declare
  fid uuid; code text;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  loop
    code := gen_invite_code();
    exit when not exists (select 1 from families where invite_code = code);
  end loop;
  insert into families (invite_code, due_date, lmp, mom_name, baby_nickname, created_by, tz)
    values (code, p_due_date, p_lmp, p_mom_name, p_baby_nickname, auth.uid(), coalesce(p_tz, 'Asia/Shanghai')) returning id into fid;
  insert into members (id, family_id, user_id, name, role) values (p_member_id, fid, auth.uid(), p_mom_name, 'mom');
  return json_build_object('family_id', fid, 'invite_code', code, 'member_id', p_member_id);
end $$;
grant execute on function create_family(date, date, text, text, uuid, text) to authenticated;
