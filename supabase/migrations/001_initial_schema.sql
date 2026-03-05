-- Tectonica.AI — Initial Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================================
-- 1. Organizations
-- ============================================================
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 2. Groups (belong to an org)
-- ============================================================
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. Profiles (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'organizer' check (role in ('admin', 'organizer', 'volunteer')),
  org_id uuid references public.organizations(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  created_at timestamptz default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 4. Bots (configurable per org)
-- ============================================================
create table public.bots (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  icon text not null,
  category text not null check (category in ('advisors', 'create', 'tools', 'analyze')),
  description text,
  system_prompt text,
  org_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz default now()
);

-- ============================================================
-- 5. Conversations
-- ============================================================
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  bot_id uuid references public.bots(id) on delete cascade not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 6. Messages
-- ============================================================
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now()
);

-- Index for fast message lookups
create index idx_messages_conversation on public.messages(conversation_id, created_at);

-- ============================================================
-- 7. Media (Group Media gallery)
-- ============================================================
create table public.media (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups(id) on delete cascade not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_name text not null,
  file_type text not null,
  file_url text not null,
  file_size bigint,
  created_at timestamptz default now()
);

-- ============================================================
-- 8. Row Level Security
-- ============================================================
alter table public.organizations enable row level security;
alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.bots enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.media enable row level security;

-- Profiles: users can read all profiles in their org, update own
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Conversations: users can CRUD their own
create policy "Users can view own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Messages: users can read/write messages in their conversations
create policy "Users can view messages in own conversations"
  on public.messages for select
  using (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

create policy "Users can create messages in own conversations"
  on public.messages for insert
  with check (
    conversation_id in (
      select id from public.conversations where user_id = auth.uid()
    )
  );

-- Bots: readable by all authenticated users
create policy "Authenticated users can view bots"
  on public.bots for select
  using (auth.role() = 'authenticated');

-- Orgs: readable by members
create policy "Org members can view their org"
  on public.organizations for select
  using (
    id in (select org_id from public.profiles where id = auth.uid())
  );

-- Groups: readable by org members
create policy "Org members can view groups"
  on public.groups for select
  using (
    org_id in (select org_id from public.profiles where id = auth.uid())
  );

-- Media: readable by group members
create policy "Group members can view media"
  on public.media for select
  using (
    group_id in (select group_id from public.profiles where id = auth.uid())
  );

create policy "Group members can upload media"
  on public.media for insert
  with check (
    group_id in (select group_id from public.profiles where id = auth.uid())
  );
