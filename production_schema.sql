-- ========================================================
-- QUOTABLE PRODUCTION SCHEMA
-- For use in Supabase SQL Editor
-- ========================================================

-- 1. ENABLE EXTENSIONS
create extension if not exists moddatetime schema extensions;

-- 2. CREATE TABLES

-- Profiles/Users table (Linked to Supabase Auth)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  email text unique,
  first_name text,
  last_name text,
  created_at timestamptz default now()
);

-- Personal Quotes (Synced)
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  text text not null,
  author text,
  category text,
  is_public boolean default false,
  synced boolean default true,
  local_only boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Public Community Board
create table public.public_quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  text text not null,
  author text,
  category text,
  created_at timestamptz default now()
);

-- Likes/Favorites (Unique per user/quote)
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  quote_id uuid references public.public_quotes(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, quote_id)
);

-- Safety Reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  quote_id uuid references public.public_quotes(id) on delete cascade not null,
  reason text not null,
  created_at timestamptz default now()
);

-- Scheduling Rules
create table public.quote_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  trigger_type text not null,
  trigger_config_json text,
  enabled boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- App Settings
create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  key text not null,
  value text,
  updated_at timestamptz default now(),
  unique(user_id, key)
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
alter table public.users enable row level security;
alter table public.quotes enable row level security;
alter table public.public_quotes enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;
alter table public.quote_rules enable row level security;
alter table public.settings enable row level security;

-- 4. DEFINE POLICIES

-- Users: Self access only
create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Quotes: Private data
create policy "Users can manage own quotes" on public.quotes for all using (auth.uid() = user_id);

-- Public Quotes: Global read, Auth insert, Owner delete
create policy "Anyone can view public quotes" on public.public_quotes for select using (true);
create policy "Auth users can share quotes" on public.public_quotes for insert with check (auth.role() = 'authenticated');
create policy "Owners can delete shared quotes" on public.public_quotes for delete using (auth.uid() = user_id);

-- Favorites: Global read count, Auth manage own
create policy "Anyone can view likes" on public.favorites for select using (true);
create policy "Users can manage own likes" on public.favorites for all using (auth.uid() = user_id);

-- Reports: Private submission
create policy "Auth users can report" on public.reports for insert with check (auth.role() = 'authenticated');

-- Rules & Settings: Private
create policy "Users can manage own rules" on public.quote_rules for all using (auth.uid() = user_id);
create policy "Users can manage own settings" on public.settings for all using (auth.uid() = user_id);

-- 5. AUTOMATIC TIMESTAMP TRIGGERS
create trigger handle_quotes_updated_at before update on public.quotes
  for each row execute procedure moddatetime (updated_at);

create trigger handle_rules_updated_at before update on public.quote_rules
  for each row execute procedure moddatetime (updated_at);

create trigger handle_settings_updated_at before update on public.settings
  for each row execute procedure moddatetime (updated_at);

-- 6. AUTH SYNC TRIGGER
-- Automatically creates a public.users row when a user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, username)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
