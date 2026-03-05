-- Per-user favorite bots
-- Each user can star/unstar bots to customize their "Your Bots" section

create table public.user_favorite_bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  bot_slug text not null,
  position int not null default 0,
  created_at timestamptz default now(),
  unique(user_id, bot_slug)
);

-- Index for fast lookups
create index idx_user_favorite_bots_user on public.user_favorite_bots(user_id, position);

-- RLS
alter table public.user_favorite_bots enable row level security;

create policy "Users can view own favorites"
  on public.user_favorite_bots for select
  using (auth.uid() = user_id);

create policy "Users can add favorites"
  on public.user_favorite_bots for insert
  with check (auth.uid() = user_id);

create policy "Users can remove favorites"
  on public.user_favorite_bots for delete
  using (auth.uid() = user_id);

create policy "Users can update own favorites"
  on public.user_favorite_bots for update
  using (auth.uid() = user_id);
