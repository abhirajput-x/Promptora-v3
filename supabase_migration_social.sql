-- ============================================================
-- Promptora — Social Features Migration
-- Adds: comments RLS policies, follows, notifications,
--       auto-maintained counters, and notification triggers.
--
-- SAFE TO RUN on an existing database — every statement is
-- idempotent (uses IF NOT EXISTS / DROP ... IF EXISTS guards),
-- so it will not error or duplicate data if run more than once.
--
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- ---------- Extra columns ----------
alter table prompts add column if not exists comments_count integer default 0;
alter table users add column if not exists full_name text;

-- ---------- FOLLOWS ----------
create table if not exists follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references users(id) on delete cascade not null,
  following_id uuid references users(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

-- ---------- NOTIFICATIONS ----------
create table if not exists notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade not null,   -- recipient
  actor_id uuid references users(id) on delete cascade not null,  -- who triggered it
  type text not null check (type in ('like','comment','follow')),
  prompt_id uuid references prompts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- ---------- INDEXES ----------
create index if not exists idx_follows_follower on follows(follower_id);
create index if not exists idx_follows_following on follows(following_id);
create index if not exists idx_notifications_user on notifications(user_id, created_at desc);
create index if not exists idx_notifications_unread on notifications(user_id) where is_read = false;
create index if not exists idx_comments_prompt on comments(prompt_id);
create index if not exists idx_likes_prompt on likes(prompt_id);
create index if not exists idx_likes_user on likes(user_id);
create index if not exists idx_saves_user on saves(user_id);
create index if not exists idx_prompts_user on prompts(user_id);
create index if not exists idx_prompts_status on prompts(status);

-- ---------- ROW LEVEL SECURITY ----------
alter table follows enable row level security;
alter table notifications enable row level security;
alter table comments enable row level security;

-- Follows policies
drop policy if exists "Follows viewable by all" on follows;
create policy "Follows viewable by all" on follows for select using (true);

drop policy if exists "Users can manage own follows" on follows;
create policy "Users can manage own follows" on follows
  for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Comments policies (readable by everyone, writable by owner only)
drop policy if exists "Comments viewable by all" on comments;
create policy "Comments viewable by all" on comments for select using (true);

drop policy if exists "Users can insert own comments" on comments;
create policy "Users can insert own comments" on comments
  for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own comments" on comments;
create policy "Users can update own comments" on comments
  for update using (auth.uid() = user_id);

drop policy if exists "Users can delete own comments" on comments;
create policy "Users can delete own comments" on comments
  for delete using (auth.uid() = user_id);

-- Notifications policies (recipient can view/mark their own; inserts happen via triggers)
drop policy if exists "Users can view own notifications" on notifications;
create policy "Users can view own notifications" on notifications
  for select using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on notifications;
create policy "Users can update own notifications" on notifications
  for update using (auth.uid() = user_id);

-- ============================================================
-- TRIGGER FUNCTIONS — keep counters + notifications in sync
-- ============================================================

-- Likes count
create or replace function sync_likes_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update prompts set likes_count = likes_count + 1 where id = new.prompt_id;
  elsif TG_OP = 'DELETE' then
    update prompts set likes_count = greatest(likes_count - 1, 0) where id = old.prompt_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_likes_count on likes;
create trigger trg_likes_count
  after insert or delete on likes
  for each row execute function sync_likes_count();

-- Saves count
create or replace function sync_saves_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update prompts set saves_count = saves_count + 1 where id = new.prompt_id;
  elsif TG_OP = 'DELETE' then
    update prompts set saves_count = greatest(saves_count - 1, 0) where id = old.prompt_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_saves_count on saves;
create trigger trg_saves_count
  after insert or delete on saves
  for each row execute function sync_saves_count();

-- Comments count
create or replace function sync_comments_count() returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update prompts set comments_count = comments_count + 1 where id = new.prompt_id;
  elsif TG_OP = 'DELETE' then
    update prompts set comments_count = greatest(comments_count - 1, 0) where id = old.prompt_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_comments_count on comments;
create trigger trg_comments_count
  after insert or delete on comments
  for each row execute function sync_comments_count();

-- Notify prompt owner on like (skip self-likes)
create or replace function notify_on_like() returns trigger as $$
declare
  owner uuid;
begin
  select user_id into owner from prompts where id = new.prompt_id;
  if owner is not null and owner <> new.user_id then
    insert into notifications (user_id, actor_id, type, prompt_id)
    values (owner, new.user_id, 'like', new.prompt_id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_like on likes;
create trigger trg_notify_like
  after insert on likes
  for each row execute function notify_on_like();

-- Notify prompt owner on comment (skip self-comments)
create or replace function notify_on_comment() returns trigger as $$
declare
  owner uuid;
begin
  select user_id into owner from prompts where id = new.prompt_id;
  if owner is not null and owner <> new.user_id then
    insert into notifications (user_id, actor_id, type, prompt_id, comment_id)
    values (owner, new.user_id, 'comment', new.prompt_id, new.id);
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_comment on comments;
create trigger trg_notify_comment
  after insert on comments
  for each row execute function notify_on_comment();

-- Notify user on new follower
create or replace function notify_on_follow() returns trigger as $$
begin
  insert into notifications (user_id, actor_id, type)
  values (new.following_id, new.follower_id, 'follow');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_notify_follow on follows;
create trigger trg_notify_follow
  after insert on follows
  for each row execute function notify_on_follow();

-- ============================================================
-- Done. Existing data, tables, and policies are untouched.
-- ============================================================
