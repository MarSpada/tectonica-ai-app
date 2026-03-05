-- 004_member_directory.sql
-- Expand profile roles, add group-level RLS, and create get_group_members RPC

-- 1. Expand role check constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

UPDATE public.profiles SET role = 'member' WHERE role = 'volunteer';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'organizer', 'leader', 'member', 'supporter'));

-- 2. Helper function to get caller's group_id (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.get_my_group_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Allow users to view all profiles in their group (uses helper to avoid recursion)
CREATE POLICY "Users can view profiles in same group"
  ON public.profiles FOR SELECT
  USING (
    group_id IS NOT NULL
    AND group_id = public.get_my_group_id()
  );

-- 3. RPC function to get group members with email from auth.users
CREATE OR REPLACE FUNCTION public.get_group_members()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  role text,
  email text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_group_id uuid;
BEGIN
  SELECT p.group_id INTO caller_group_id
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF caller_group_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.full_name,
    p.avatar_url,
    p.role,
    COALESCE(u.email::text, 'no-email@example.com'),
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  WHERE p.group_id = caller_group_id
  ORDER BY p.full_name ASC NULLS LAST;
END;
$$;
