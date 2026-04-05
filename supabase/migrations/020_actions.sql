-- ============================================================
-- 020: Actions System
-- ============================================================
-- Full actions system: actions, assignments, completions, and
-- points ledger. Designed for internal actions now, with columns
-- and enums ready for future external source ingestion
-- (NationBuilder, Action Network, ActBlue, Sosha).
--
-- NOTE: Archiving an action (status = 'archived') does NOT
-- cascade-delete assignments, completions, or ledger entries.
-- These are historical records. The only cascade path is
-- action hard-delete (which should never happen in production).
--
-- FUTURE: When leaderboards are built, add a materialized view
-- or denormalized column for member_points_total. For now,
-- totals are derived via SUM on member_points_ledger.
-- ============================================================

-- ============================================================
-- 1. actions table
-- ============================================================
create table public.actions (
  id                uuid primary key default gen_random_uuid(),
  group_id          uuid references public.groups(id) on delete cascade not null,
  source            text not null default 'internal'
                      check (source in ('internal','nationbuilder','action_network','actblue','sosha','events')),
  source_id         text,                -- external system ID; null for internal actions
  source_data       jsonb,               -- raw external payload; never modified after ingestion
  type              text not null default 'custom'
                      check (type in ('petition','donation','event_rsvp','letter','phone_bank','canvass','social_share','custom')),
  title             text not null,
  description       text,
  call_to_action    text,                -- button label text
  url               text,                -- external completion URL; null for internal actions
  suggested_bot_slug text,               -- FK-like to bots slug for AI assistance surfacing
  points_value      integer not null default 0,
  priority          integer not null default 0,
  assignment_scope  text not null default 'all'
                      check (assignment_scope in ('all','targeted','self_assign')),
  starts_at         timestamptz,
  ends_at           timestamptz,
  status            text not null default 'active'
                      check (status in ('active','completed','expired','archived')),
  visibility        text not null default 'group'
                      check (visibility in ('group','admins_only')),
  created_by        uuid references public.profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index actions_group_id_idx on public.actions (group_id);
create index actions_status_idx on public.actions (status);
create index actions_group_status_idx on public.actions (group_id, status);
create index actions_created_at_idx on public.actions (created_at desc);
create index actions_priority_idx on public.actions (priority desc);

-- ============================================================
-- 2. action_assignments table
-- ============================================================
create table public.action_assignments (
  id                    uuid primary key default gen_random_uuid(),
  action_id             uuid references public.actions(id) on delete cascade not null,
  assigned_to_member_id uuid references public.profiles(id) on delete cascade,  -- null = whole group
  assigned_to_group_id  uuid references public.groups(id) on delete cascade,    -- reserved for future subgroup targeting
  assigned_by           uuid references public.profiles(id) on delete set null not null,
  assigned_at           timestamptz not null default now()
);

create index action_assignments_action_id_idx on public.action_assignments (action_id);
create index action_assignments_member_id_idx on public.action_assignments (assigned_to_member_id);

-- ============================================================
-- 3. action_completions table
-- ============================================================
create table public.action_completions (
  id                        uuid primary key default gen_random_uuid(),
  action_id                 uuid references public.actions(id) on delete cascade not null,
  member_id                 uuid references public.profiles(id) on delete cascade not null,
  completed_at              timestamptz not null default now(),
  completion_method         text not null default 'self_reported'
                              check (completion_method in ('self_reported','api_verified','admin_confirmed')),
  points_earned             integer not null,    -- snapshot of points_value at completion time
  source_confirmation_data  jsonb,               -- reserved for future API verification payloads
  notes                     text,                -- member can add context

  constraint action_completions_unique unique (action_id, member_id)
);

create index action_completions_member_id_idx on public.action_completions (member_id);
create index action_completions_action_id_idx on public.action_completions (action_id);

-- ============================================================
-- 4. member_points_ledger table
-- ============================================================
-- Every point entry must be tied to a completion.
-- One completion must never generate more than one ledger entry.
create table public.member_points_ledger (
  id                    uuid primary key default gen_random_uuid(),
  member_id             uuid references public.profiles(id) on delete cascade not null,
  group_id              uuid references public.groups(id) on delete cascade not null,
  action_completion_id  uuid references public.action_completions(id) on delete cascade not null,
  points                integer not null,
  earned_at             timestamptz not null default now(),

  constraint points_ledger_one_per_completion unique (action_completion_id)
);

create index member_points_ledger_member_group_idx on public.member_points_ledger (member_id, group_id);

-- ============================================================
-- 5. RLS Policies
-- ============================================================

-- actions
alter table public.actions enable row level security;

create policy "Group members can read visible actions"
  on public.actions for select
  using (
    group_id = get_my_group_id()
    and (visibility = 'group' or is_admin())
  );

create policy "Admins can insert actions"
  on public.actions for insert
  with check (
    group_id = get_my_group_id()
    and is_admin()
  );

create policy "Admins can update actions"
  on public.actions for update
  using (
    group_id = get_my_group_id()
    and is_admin()
  )
  with check (
    group_id = get_my_group_id()
    and is_admin()
  );

-- action_assignments
alter table public.action_assignments enable row level security;

create policy "Group members can read assignments for their actions"
  on public.action_assignments for select
  using (
    exists (
      select 1 from public.actions a
      where a.id = action_id
        and a.group_id = get_my_group_id()
    )
  );

create policy "Admins can insert assignments"
  on public.action_assignments for insert
  with check (
    exists (
      select 1 from public.actions a
      where a.id = action_id
        and a.group_id = get_my_group_id()
        and is_admin()
    )
  );

create policy "Members can self-assign"
  on public.action_assignments for insert
  with check (
    assigned_to_member_id = auth.uid()
    and assigned_by = auth.uid()
    and exists (
      select 1 from public.actions a
      where a.id = action_id
        and a.group_id = get_my_group_id()
        and a.assignment_scope = 'self_assign'
    )
  );

-- action_completions
alter table public.action_completions enable row level security;

create policy "Members can read own completions"
  on public.action_completions for select
  using (member_id = auth.uid());

create policy "Admins can read all group completions"
  on public.action_completions for select
  using (
    is_admin()
    and exists (
      select 1 from public.actions a
      where a.id = action_id
        and a.group_id = get_my_group_id()
    )
  );

-- No direct INSERT policy — completions are created via complete_action RPC only

-- member_points_ledger
alter table public.member_points_ledger enable row level security;

create policy "Members can read own ledger entries"
  on public.member_points_ledger for select
  using (
    member_id = auth.uid()
    and group_id = get_my_group_id()
  );

create policy "Admins can read group ledger entries"
  on public.member_points_ledger for select
  using (
    is_admin()
    and group_id = get_my_group_id()
  );

-- ============================================================
-- 6. complete_action RPC (SECURITY DEFINER)
-- ============================================================
-- Atomically:
--   1. Validates action exists, is active, and belongs to member's group
--   2. Checks member hasn't already completed it
--   3. Inserts action_completions row with snapshotted points_value
--   4. Inserts member_points_ledger row linked to the completion
--   5. Returns completion record as JSONB
--
-- ERROR CODE CONTRACT (keep in sync with /api/actions/[id]/complete/route.ts)
-- ──────────────────────────────────────────────────────────────────────────
--   errcode  | raise message                        | HTTP status
--   ---------|--------------------------------------|------------
--   P0002    | 'Action not found'                   | 404
--   P0003    | 'Action is not active'               | 400
--   P0004    | 'Member does not belong to action    | 403
--            |  group'                              |
--   P0005    | 'Action already completed'           | 409
--
-- WARNING: The API route maps these errors by matching substrings in the
-- exception message. If you change a message here, you MUST update the
-- corresponding string match in the API route, and vice versa.
-- ============================================================
create or replace function public.complete_action(
  p_action_id uuid,
  p_member_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_action      record;
  v_member_group uuid;
  v_completion_id uuid;
  v_points      integer;
begin
  -- Fetch action
  select id, group_id, status, points_value
    into v_action
    from public.actions
   where id = p_action_id;

  if not found then
    raise exception 'Action not found'
      using errcode = 'P0002';
  end if;

  if v_action.status <> 'active' then
    raise exception 'Action is not active'
      using errcode = 'P0003';
  end if;

  -- Validate member belongs to same group as action
  select group_id into v_member_group
    from public.profiles
   where id = p_member_id;

  if v_member_group is null or v_member_group <> v_action.group_id then
    raise exception 'Member does not belong to action group'
      using errcode = 'P0004';
  end if;

  -- Check for duplicate completion
  if exists (
    select 1 from public.action_completions
     where action_id = p_action_id
       and member_id = p_member_id
  ) then
    raise exception 'Action already completed'
      using errcode = 'P0005';
  end if;

  v_points := v_action.points_value;

  -- Insert completion
  insert into public.action_completions (action_id, member_id, points_earned)
  values (p_action_id, p_member_id, v_points)
  returning id into v_completion_id;

  -- Insert ledger entry
  insert into public.member_points_ledger (member_id, group_id, action_completion_id, points)
  values (p_member_id, v_action.group_id, v_completion_id, v_points);

  return jsonb_build_object(
    'completion_id', v_completion_id,
    'points_earned', v_points
  );
end;
$$;
