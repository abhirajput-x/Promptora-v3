-- Promptora V2 - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends Supabase auth.users)
create table users (
  id uuid references auth.users primary key,
  username text unique,
  full_name text,
  avatar_url text,
  bio text,
  is_creator boolean default false,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

-- Categories
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text unique not null,
  icon text,
  color text,
  created_at timestamp with time zone default now()
);

-- Prompts
create table prompts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  title text not null,
  prompt_text text not null,
  image_url text,
  model text, -- Midjourney, DALL·E, Flux, ChatGPT, etc.
  category_id uuid references categories(id),
  status text default 'pending', -- pending, approved, rejected
  featured boolean default false,
  likes_count integer default 0,
  saves_count integer default 0,
  copies_count integer default 0,
  comments_count integer default 0,
  created_at timestamp with time zone default now()
);

-- Likes
create table likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, prompt_id)
);

-- Saves
create table saves (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  unique(user_id, prompt_id)
);

-- Comments
create table comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id) on delete cascade,
  prompt_id uuid references prompts(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Reports
create table reports (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references users(id),
  prompt_id uuid references prompts(id),
  reason text not null,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

-- Function to increment copy count
create or replace function increment_copies(prompt_id uuid)
returns void as $$
  update prompts set copies_count = copies_count + 1 where id = prompt_id;
$$ language sql;

-- Auto-create user profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into users (id, username, avatar_url)
  values (
    new.id,
    split_part(new.email, '@', 1),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row Level Security
alter table users enable row level security;
alter table prompts enable row level security;
alter table likes enable row level security;
alter table saves enable row level security;
alter table comments enable row level security;

-- Policies
create policy "Users are viewable by everyone" on users for select using (true);
create policy "Users can update own profile" on users for update using (auth.uid() = id);

create policy "Approved prompts viewable by all" on prompts for select using (status = 'approved' or auth.uid() = user_id);
create policy "Users can insert own prompts" on prompts for insert with check (auth.uid() = user_id);
create policy "Users can update own prompts" on prompts for update using (auth.uid() = user_id);

create policy "Likes viewable by all" on likes for select using (true);
create policy "Users can manage own likes" on likes for all using (auth.uid() = user_id);

create policy "Saves viewable by owner" on saves for select using (auth.uid() = user_id);
create policy "Users can manage own saves" on saves for all using (auth.uid() = user_id);

-- Sample data
insert into categories (name, icon) values
  ('Photography', '📷'),
  ('Digital Art', '🎨'),
  ('3D Render', '🔷'),
  ('Anime', '⛩️'),
  ('Realistic', '🌄'),
  ('Abstract', '🌀'),
  ('Architecture', '🏛️'),
  ('Portrait', '👤');

-- ============================================================
-- NOTE: Social features (likes/saves/comments RLS, follows,
-- notifications, and auto-maintained counters) live in
-- supabase_migration_social.sql — run that file next in the
-- Supabase SQL Editor (safe on fresh installs too).
-- ============================================================
