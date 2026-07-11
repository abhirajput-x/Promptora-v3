-- ============================================================
-- Promptora — Creator System Migration
-- Adds: verified badges, auto creator levels, prompt view
-- tracking, trending creators, and featured-creator support.
--
-- SAFE TO RUN on an existing database — every statement is
-- idempotent. Run this AFTER supabase_migration_social.sql,
-- in the Supabase SQL Editor.
--
-- ⚠️ Update ADMIN_EMAIL below (search & replace) if your admin
-- account differs from the one already hardcoded in
-- src/pages/AdminDashboard.js.
-- ============================================================

-- ---------- Extra columns on users ----------
alter table users add column if not exists is_verified boolean default false;
alter table users add column if not exists is_featured_override boolean default false;
alter table users add column if not exists creator_level text default 'bronze'
  check (creator_level in ('bronze', 'silver', 'gold'));

-- ---------- Extra column on prompts ----------
alter table prompts add column if not exists views_count integer default 0;

-- Make sure the real admin account is flagged as admin too
-- (AdminDashboard.js currently gates by email; this keeps the
-- is_admin column consistent for RLS/trigger checks below).
update users set is_admin = true
  where id in (select id from auth.users where email = 'contact.abhayrajput@gmail.com');

-- ---------- PROMPT VIEWS ----------
-- One row per (prompt, viewer, day) — inserts that violate the
-- unique constraint are silently ignored, which is what gives us
-- "one counted view per viewer per day" de-duplication.
create table if not exists prompt_views (
  id uuid default uuid_generate_v4() primary key,
  prompt_id uuid references prompts(id) on delete cascade not null,
  viewer_key text not null, -- auth user id, or a per-browser guest id
  view_day date default current_date,
  created_at timestamp with time zone default now(),
  unique(prompt_id, viewer_key, view_day)
);

-- ---------- INDEXES ----------
create index if not exists idx_prompt_views_prompt on prompt_views(prompt_id);
create index if not exists idx_prompt_views_viewer on prompt_views(viewer_key);
create index if not exists idx_users_creator_level on users(creator_level);
create index if not exists idx_users_is_verified on users(is_verified) where is_verified = true;
create index if not exists idx_users_featured on users(is_featured_override) where is_featured_override = true;
create index if not exists idx_prompts_views_count on prompts(views_count);

-- ---------- ROW LEVEL SECURITY ----------
alter table prompt_views enable row level security;

drop policy if exists "Prompt views insertable by anyone" on prompt_views;
create policy "Prompt views insertable by anyone" on prompt_views for insert with check (true);

drop policy if exists "Prompt views readable by all" on prompt_views;
create policy "Prompt views readable by all" on prompt_views for select using (true);

-- ============================================================
-- VIEW TRACKING
-- ============================================================

-- Called from the client whenever a prompt's detail view opens.
-- Uses ON CONFLICT DO NOTHING so repeat views the same day are free.
create or replace function log_prompt_view(p_prompt_id uuid, p_viewer_key text)
returns void as $$
begin
  insert into prompt_views (prompt_id, viewer_key)
  values (p_prompt_id, p_viewer_key)
  on conflict (prompt_id, viewer_key, view_day) do nothing;
end;
$$ language plpgsql security definer;

create or replace function sync_views_count() returns trigger as $$
begin
  update prompts set views_count = views_count + 1 where id = new.prompt_id;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_views_count on prompt_views;
create trigger trg_views_count
  after insert on prompt_views
  for each row execute function sync_views_count();

-- ============================================================
-- AUTOMATIC CREATOR LEVELS
-- 🥉 Bronze (default) → 🥈 Silver → 🥇 Gold
-- Recalculated automatically whenever a creator's prompts,
-- likes, copies, views, or followers change.
-- ============================================================

create or replace function recalc_creator_level(target_user uuid)
returns void as $$
declare
  v_prompts int;
  v_likes int;
  v_copies int;
  v_views int;
  v_followers int;
  v_level text;
begin
  if target_user is null then return; end if;

  select count(*), coalesce(sum(likes_count), 0), coalesce(sum(copies_count), 0), coalesce(sum(views_count), 0)
    into v_prompts, v_likes, v_copies, v_views
    from prompts where user_id = target_user and status = 'approved';

  select count(*) into v_followers from follows where following_id = target_user;

  if v_prompts >= 20 and v_likes >= 500 and v_followers >= 100 then
    v_level := 'gold';
  elsif v_prompts >= 5 and v_likes >= 100 and v_followers >= 20 then
    v_level := 'silver';
  else
    v_level := 'bronze';
  end if;

  update users set creator_level = v_level where id = target_user and creator_level is distinct from v_level;
end;
$$ language plpgsql security definer;

-- Recalculate whenever a creator's own prompt rows change. This also
-- fires automatically when trg_likes_count / trg_saves_count /
-- trg_comments_count / trg_views_count update likes_count / copies_count /
-- views_count, since those are plain UPDATEs on this same table.
create or replace function trg_recalc_level_from_prompt() returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform recalc_creator_level(old.user_id);
  else
    perform recalc_creator_level(new.user_id);
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prompts_recalc_level on prompts;
create trigger trg_prompts_recalc_level
  after insert or delete or update of likes_count, copies_count, views_count, status on prompts
  for each row execute function trg_recalc_level_from_prompt();

-- Recalculate whenever someone follows/unfollows a creator.
create or replace function trg_recalc_level_from_follow() returns trigger as $$
begin
  if TG_OP = 'DELETE' then
    perform recalc_creator_level(old.following_id);
  else
    perform recalc_creator_level(new.following_id);
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_follows_recalc_level on follows;
create trigger trg_follows_recalc_level
  after insert or delete on follows
  for each row execute function trg_recalc_level_from_follow();

-- Backfill levels for all existing creators right now.
do $$
declare r record;
begin
  for r in select id from users where is_creator = true or id in (select distinct user_id from prompts) loop
    perform recalc_creator_level(r.id);
  end loop;
end $$;

-- ============================================================
-- PROTECT PRIVILEGED COLUMNS
-- Verification, admin flag, featured-override, and creator level
-- must never be settable by a user updating their own profile —
-- only by an admin (checked server-side, not just in the UI).
-- ============================================================

create or replace function protect_privileged_columns() returns trigger as $$
declare
  is_caller_admin boolean;
begin
  select (auth.jwt() ->> 'email' = 'contact.abhayrajput@gmail.com')
      or coalesce((select is_admin from users where id = auth.uid()), false)
    into is_caller_admin;

  if not coalesce(is_caller_admin, false) then
    new.is_verified := old.is_verified;
    new.is_admin := old.is_admin;
    new.is_featured_override := old.is_featured_override;
    new.creator_level := old.creator_level;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_protect_privileged_columns on users;
create trigger trg_protect_privileged_columns
  before update on users
  for each row execute function protect_privileged_columns();

-- Explicit admin update policy (in addition to "own profile").
-- The trigger above is the real safety net; this just lets an
-- admin's UPDATE statement target rows that aren't their own.
drop policy if exists "Admins can update any user" on users;
create policy "Admins can update any user" on users
  for update using (
    auth.jwt() ->> 'email' = 'contact.abhayrajput@gmail.com'
    or coalesce((select is_admin from users where id = auth.uid()), false)
  );

-- Atomically set (or clear) the single manually-featured creator.
-- Admin-only — enforced inside the function itself.
create or replace function set_featured_creator(target_id uuid)
returns void as $$
declare
  is_caller_admin boolean;
begin
  select (auth.jwt() ->> 'email' = 'contact.abhayrajput@gmail.com')
      or coalesce((select is_admin from users where id = auth.uid()), false)
    into is_caller_admin;

  if not coalesce(is_caller_admin, false) then
    raise exception 'Only admins can set the featured creator';
  end if;

  update users set is_featured_override = false where is_featured_override = true;
  if target_id is not null then
    update users set is_featured_override = true where id = target_id;
  end if;
end;
$$ language plpgsql security definer;

-- ============================================================
-- CREATOR STATS VIEW
-- One-stop source for analytics, creator lists, trending, and
-- the featured-creator pick. Always live — recomputed on every
-- query, so it "updates automatically" with zero extra triggers.
-- ============================================================

create or replace view creator_stats as
select
  u.id,
  u.username,
  u.full_name,
  u.avatar_url,
  u.bio,
  u.is_verified,
  u.is_admin,
  u.is_featured_override,
  u.creator_level,
  u.created_at,
  coalesce(p.prompt_count, 0) as prompt_count,
  coalesce(p.total_likes, 0) as total_likes,
  coalesce(p.total_views, 0) as total_views,
  coalesce(p.total_copies, 0) as total_copies,
  coalesce(p.recent_prompts, 0) as recent_prompts,
  coalesce(f.followers_count, 0) as followers_count,
  coalesce(fg.following_count, 0) as following_count,
  (
    coalesce(f.followers_count, 0) * 3 +
    coalesce(p.total_likes, 0) * 2 +
    coalesce(p.total_views, 0) * 0.1 +
    coalesce(p.total_copies, 0) * 1.5 +
    coalesce(p.recent_prompts, 0) * 5 +
    coalesce(p.prompt_count, 0) * 1
  )::numeric as trending_score
from users u
left join (
  select
    user_id,
    count(*) as prompt_count,
    coalesce(sum(likes_count), 0) as total_likes,
    coalesce(sum(views_count), 0) as total_views,
    coalesce(sum(copies_count), 0) as total_copies,
    count(*) filter (where created_at > now() - interval '30 days') as recent_prompts
  from prompts
  where status = 'approved'
  group by user_id
) p on p.user_id = u.id
left join (
  select following_id, count(*) as followers_count from follows group by following_id
) f on f.following_id = u.id
left join (
  select follower_id, count(*) as following_count from follows group by follower_id
) fg on fg.follower_id = u.id
where u.is_creator = true or p.prompt_count > 0;

grant select on creator_stats to anon, authenticated;

-- ============================================================
-- Done. Existing data, tables, and policies are untouched.
-- ============================================================
