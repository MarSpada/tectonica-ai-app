-- ============================================================
-- 018: Media Items — functional media library
-- ============================================================
-- Replaces the minimal `media` table from 001 with a full-featured
-- media_items table. The old table is dropped (it was never populated
-- with real data — only mock data in the component).
-- ============================================================

-- Drop the old stub table
drop table if exists public.media;

-- ============================================================
-- 1. media_items table
-- ============================================================
create table public.media_items (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid references public.groups(id) on delete cascade not null,
  uploaded_by   uuid references public.profiles(id) on delete set null not null,
  category      text not null check (category in ('image', 'video', 'document', 'link')),
  file_name     text not null,
  storage_path  text,              -- UUID-based key in Supabase Storage; null for links
  url           text,              -- external URL; null for uploaded files
  title         text,
  description   text,
  mime_type     text,
  file_size     bigint,            -- bytes; null for links
  thumbnail_path text,             -- future: generated thumbnails
  status        text not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  visibility    text not null default 'group' check (visibility in ('group', 'admins_only', 'specific_members')),
  tags          text[] default '{}',
  download_count integer not null default 0,
  deleted_at    timestamptz,       -- soft delete
  created_at    timestamptz not null default now(),

  -- Links must have a url, files must have a storage_path
  constraint media_file_or_link check (
    (category = 'link' and url is not null and storage_path is null)
    or
    (category <> 'link' and storage_path is not null and url is null)
  )
);

-- Full-text search vector (auto-maintained)
alter table public.media_items
  add column search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(description, '') || ' ' ||
      coalesce(file_name, '')
    )
  ) stored;

create index media_items_search_idx on public.media_items using gin (search_vector);
create index media_items_group_id_idx on public.media_items (group_id);
create index media_items_category_idx on public.media_items (category);
create index media_items_created_at_idx on public.media_items (created_at desc);
create index media_items_deleted_at_idx on public.media_items (deleted_at) where deleted_at is null;

-- ============================================================
-- 2. Add storage_used_bytes to groups
-- ============================================================
alter table public.groups
  add column if not exists storage_used_bytes bigint not null default 0;

-- ============================================================
-- 3. Row Level Security
-- ============================================================
alter table public.media_items enable row level security;

-- Members of the group can view non-deleted media
create policy "Group members can view media"
  on public.media_items for select
  using (
    deleted_at is null
    and group_id = get_my_group_id()
  );

-- Members (not supporters) can insert media
create policy "Members can upload media"
  on public.media_items for insert
  with check (
    group_id = get_my_group_id()
    and uploaded_by = auth.uid()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('member', 'group_admin', 'super_admin')
    )
  );

-- Uploaders can update their own non-deleted media; admins can update any in their group.
-- Soft delete (setting deleted_at) is handled by the soft_delete_media_item() RPC
-- with SECURITY DEFINER to bypass the SELECT policy's deleted_at is null filter.
create policy "Owners and admins can update media"
  on public.media_items for update
  using (
    group_id = get_my_group_id()
    and deleted_at is null
    and (
      uploaded_by = auth.uid()
      or exists (
        select 1 from public.profiles
        where id = auth.uid()
        and role in ('group_admin', 'super_admin')
      )
    )
  );

-- SECURITY DEFINER RPC for soft delete — bypasses RLS
create or replace function soft_delete_media_item(p_media_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_item record;
  v_role text;
begin
  select id, uploaded_by, group_id, storage_path, file_size
    into v_item
    from public.media_items
    where id = p_media_id and deleted_at is null;

  if v_item is null then
    raise exception 'Media item not found';
  end if;

  select role into v_role
    from public.profiles
    where id = auth.uid();

  if v_item.uploaded_by != auth.uid()
     and v_role not in ('group_admin', 'super_admin') then
    raise exception 'Permission denied';
  end if;

  update public.media_items
    set deleted_at = now()
    where id = p_media_id;

  if v_item.file_size is not null then
    update public.groups
      set storage_used_bytes = greatest(0, storage_used_bytes - v_item.file_size)
      where id = v_item.group_id;
  end if;
end;
$$;

-- Atomic increment of group storage counter
create or replace function increment_storage_used(p_group_id uuid, p_bytes bigint)
returns void
language plpgsql
security definer
as $$
begin
  update public.groups
    set storage_used_bytes = storage_used_bytes + p_bytes
    where id = p_group_id;
end;
$$;

-- Only admins can hard-delete (soft delete is an update)
create policy "Admins can delete media"
  on public.media_items for delete
  using (
    group_id = get_my_group_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid()
      and role in ('group_admin', 'super_admin')
    )
  );
