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
create or replace function my_role(fid uuid) returns member_role language sql stable as $$
  select role from members where family_id = fid and user_id = auth.uid() limit 1
$$;

-- 可见性判断：mom 全可见；dad 看 partner/family；family 只看 family
create or replace function can_see(fid uuid, v visibility) returns boolean language sql stable as $$
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
