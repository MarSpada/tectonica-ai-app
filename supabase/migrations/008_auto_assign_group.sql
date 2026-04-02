-- Auto-assign all new users to the default group
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================================
-- 1. Fix existing users who have no group/org assigned
--    Assigns them to the first group (People's Movement)
-- ============================================================
UPDATE public.profiles
SET
  group_id = (SELECT id FROM public.groups ORDER BY created_at LIMIT 1),
  org_id   = (SELECT org_id FROM public.groups ORDER BY created_at LIMIT 1)
WHERE group_id IS NULL;

-- ============================================================
-- 2. Update the auto-profile trigger to assign new users
--    to the default group automatically on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_group_id uuid;
  default_org_id uuid;
BEGIN
  -- Get the default group (first created group)
  SELECT id, org_id INTO default_group_id, default_org_id
  FROM public.groups
  ORDER BY created_at
  LIMIT 1;

  INSERT INTO public.profiles (id, full_name, avatar_url, group_id, org_id, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    default_group_id,
    default_org_id,
    'member'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
