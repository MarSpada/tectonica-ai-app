-- 009_admin_roles.sql
-- Simplify roles to 4: super_admin, group_admin, member, supporter
-- Add admin helper functions, RLS policies, and RPCs
-- Run in Supabase SQL Editor as a single script

-- ============================================================
-- 1. DROP OLD CONSTRAINT FIRST (so new values are allowed)
-- ============================================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- ============================================================
-- 2. DATA MIGRATION — map old roles to new roles
-- ============================================================
UPDATE public.profiles SET role = 'super_admin' WHERE role = 'admin';
UPDATE public.profiles SET role = 'group_admin' WHERE role IN ('organizer', 'leader');
-- 'member' and 'supporter' stay as-is

-- ============================================================
-- 3. ADD NEW CONSTRAINT
-- ============================================================
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'group_admin', 'member', 'supporter'));

-- ============================================================
-- 3. HELPER FUNCTIONS
-- ============================================================

-- Check if current user is any admin (super_admin or group_admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'group_admin')
  );
$$;

-- Check if current user is a super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

-- Get org_id for the current user
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 4. UPDATE SIGNUP ASSIGNMENT RLS — replace old role list
-- ============================================================
DROP POLICY IF EXISTS "Leaders can create signup assignments" ON public.signup_assignments;
DROP POLICY IF EXISTS "Leaders can update signup assignments" ON public.signup_assignments;

CREATE POLICY "Admins can create signup assignments"
  ON public.signup_assignments FOR INSERT
  WITH CHECK (
    group_id = public.get_my_group_id()
    AND public.is_admin()
  );

CREATE POLICY "Admins can update signup assignments"
  ON public.signup_assignments FOR UPDATE
  USING (
    group_id = public.get_my_group_id()
    AND public.is_admin()
  );

-- ============================================================
-- 5. ADMIN RLS POLICIES — super_admin org-wide access
-- ============================================================

-- Super admins can view all profiles in their org
CREATE POLICY "Super admins can view all org profiles"
  ON public.profiles FOR SELECT
  USING (
    org_id = public.get_my_org_id()
    AND public.is_super_admin()
  );

-- Super admins can update any profile in their org (role changes, group reassignment)
CREATE POLICY "Super admins can update org profiles"
  ON public.profiles FOR UPDATE
  USING (
    org_id = public.get_my_org_id()
    AND public.is_super_admin()
  );

-- Super admins can update their org
CREATE POLICY "Super admins can update their org"
  ON public.organizations FOR UPDATE
  USING (
    id = public.get_my_org_id()
    AND public.is_super_admin()
  );

-- Super admins can manage groups in their org
CREATE POLICY "Super admins can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (
    org_id = public.get_my_org_id()
    AND public.is_super_admin()
  );

CREATE POLICY "Super admins can update groups"
  ON public.groups FOR UPDATE
  USING (
    org_id = public.get_my_org_id()
    AND public.is_super_admin()
  );

CREATE POLICY "Super admins can delete groups"
  ON public.groups FOR DELETE
  USING (
    org_id = public.get_my_org_id()
    AND public.is_super_admin()
  );

-- Super admins can manage bots for their org
CREATE POLICY "Super admins can create bots"
  ON public.bots FOR INSERT
  WITH CHECK (
    org_id = public.get_my_org_id()
    AND public.is_super_admin()
  );

CREATE POLICY "Super admins can update bots"
  ON public.bots FOR UPDATE
  USING (
    (org_id = public.get_my_org_id() OR org_id IS NULL)
    AND public.is_super_admin()
  );

CREATE POLICY "Super admins can delete bots"
  ON public.bots FOR DELETE
  USING (
    org_id = public.get_my_org_id()
    AND public.is_super_admin()
  );

-- ============================================================
-- 6. ADMIN RPCs
-- ============================================================

-- Get all org members (super_admin only) with group info
CREATE OR REPLACE FUNCTION public.get_org_members()
RETURNS TABLE (
  id uuid,
  full_name text,
  avatar_url text,
  role text,
  email text,
  group_id uuid,
  group_name text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_org_id uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super_admin required';
  END IF;

  SELECT p.org_id INTO caller_org_id
  FROM public.profiles p WHERE p.id = auth.uid();

  RETURN QUERY
  SELECT
    p.id, p.full_name, p.avatar_url, p.role,
    COALESCE(u.email::text, ''),
    p.group_id,
    g.name AS group_name,
    p.created_at
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.groups g ON g.id = p.group_id
  WHERE p.org_id = caller_org_id
  ORDER BY p.full_name ASC NULLS LAST;
END;
$$;

-- Update a member's role (with hierarchy enforcement)
CREATE OR REPLACE FUNCTION public.update_member_role(
  p_member_id uuid,
  p_new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
  caller_org uuid;
  caller_group uuid;
  target_org uuid;
  target_group uuid;
BEGIN
  -- Validate new role
  IF p_new_role NOT IN ('super_admin', 'group_admin', 'member', 'supporter') THEN
    RAISE EXCEPTION 'Invalid role: %', p_new_role;
  END IF;

  SELECT p.role, p.org_id, p.group_id INTO caller_role, caller_org, caller_group
  FROM public.profiles p WHERE p.id = auth.uid();

  SELECT p.org_id, p.group_id INTO target_org, target_group
  FROM public.profiles p WHERE p.id = p_member_id;

  -- Cannot change own role
  IF p_member_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own role';
  END IF;

  -- Must be in same org
  IF caller_org IS DISTINCT FROM target_org THEN
    RAISE EXCEPTION 'Cannot modify users in other organizations';
  END IF;

  -- super_admin can set any role
  IF caller_role = 'super_admin' THEN
    UPDATE public.profiles SET role = p_new_role WHERE id = p_member_id;
    RETURN;
  END IF;

  -- group_admin can only change member<->supporter in their own group
  IF caller_role = 'group_admin' THEN
    IF target_group IS DISTINCT FROM caller_group THEN
      RAISE EXCEPTION 'Group admins can only manage their own group';
    END IF;
    IF p_new_role NOT IN ('member', 'supporter') THEN
      RAISE EXCEPTION 'Group admins can only set member or supporter roles';
    END IF;
    UPDATE public.profiles SET role = p_new_role WHERE id = p_member_id;
    RETURN;
  END IF;

  RAISE EXCEPTION 'Insufficient permissions to change roles';
END;
$$;

-- Reassign member to a different group (super_admin only)
CREATE OR REPLACE FUNCTION public.reassign_member_group(
  p_member_id uuid,
  p_new_group_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_org uuid;
  target_org uuid;
  group_org uuid;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Access denied: super_admin required';
  END IF;

  SELECT org_id INTO caller_org FROM public.profiles WHERE id = auth.uid();
  SELECT org_id INTO target_org FROM public.profiles WHERE id = p_member_id;
  SELECT org_id INTO group_org FROM public.groups WHERE id = p_new_group_id;

  IF caller_org IS DISTINCT FROM target_org OR caller_org IS DISTINCT FROM group_org THEN
    RAISE EXCEPTION 'All entities must be in the same organization';
  END IF;

  UPDATE public.profiles SET group_id = p_new_group_id WHERE id = p_member_id;
END;
$$;

-- ============================================================
-- 7. SEED BOTS TABLE (from hardcoded bots.ts)
-- system_prompt is NULL — code falls back to bots-prompts.ts
-- ============================================================
DO $$
DECLARE
  default_org uuid;
BEGIN
  SELECT id INTO default_org FROM public.organizations LIMIT 1;

  INSERT INTO public.bots (slug, name, icon, category, description, system_prompt, org_id) VALUES
    ('welcome', 'Welcome Helper', 'waving_hand', 'advisors', 'Your personal guide to Movement Intelligence. Ask me anything about what you can do here.', NULL, default_org),
    ('getting-started', 'Getting Started + Help', 'help_outline', 'advisors', 'Get help getting started with organizing tools and strategy.', NULL, default_org),
    ('local-strategy', 'Local Strategy Planning', 'map', 'advisors', 'Plan and develop local organizing strategies.', NULL, default_org),
    ('recruitment-planning', 'Recruitment Planning', 'person_add', 'advisors', 'Build a plan for recruiting new members and volunteers.', NULL, default_org),
    ('action-planning', 'Action Planning', 'flag', 'advisors', 'Plan direct actions, rallies, and mobilizations.', NULL, default_org),
    ('events-planning', 'Events Planning + Management', 'event', 'advisors', 'Plan and manage events from start to finish.', NULL, default_org),
    ('relationship-management', 'Relationship/Contact Mng', 'contacts', 'advisors', 'Manage contacts and build stronger relationships.', NULL, default_org),
    ('group-leadership', 'Group Leadership Coach', 'groups', 'advisors', 'Get coaching on leading your organizing group.', NULL, default_org),
    ('group-fundraising', 'Group Fundraising', 'paid', 'advisors', 'Plan and execute fundraising campaigns.', NULL, default_org),
    ('canvassing-planner', 'Canvassing Planner', 'directions_walk', 'advisors', 'Plan door-to-door canvassing routes and scripts.', NULL, default_org),
    ('graphics-creation', 'Graphics Creation', 'palette', 'create', 'Create graphics, flyers, and visual content.', NULL, default_org),
    ('written-content', 'Written Content', 'description', 'create', 'Write press releases, blog posts, and copy.', NULL, default_org),
    ('distributed-email', 'Distributed Email', 'email', 'create', 'Create and manage email campaigns.', NULL, default_org),
    ('group-webpage', 'Set-Up/Manage Group Webpage', 'web', 'create', 'Build and manage your group''s web presence.', NULL, default_org),
    ('video-creation', 'Video Creation', 'videocam', 'create', 'Create video content for campaigns.', NULL, default_org),
    ('ad-placement', 'Ad Placement', 'ads_click', 'tools', 'Place and manage digital advertising campaigns.', NULL, default_org),
    ('social-media', 'Social Media', 'share', 'tools', 'Manage social media presence and campaigns.', NULL, default_org),
    ('tech-tools', 'Tech Tools How-To', 'build', 'tools', 'Learn how to use organizing tech tools.', NULL, default_org),
    ('targeted-advocacy', 'Targeted Advocacy', 'campaign', 'tools', 'Run targeted advocacy and lobbying campaigns.', NULL, default_org),
    ('creating-people-power', 'Creating People Power', 'volunteer_activism', 'analyze', 'Analyze and grow grassroots people power.', NULL, default_org),
    ('recruitment-progress', 'Recruitment Progress', 'trending_up', 'analyze', 'Track and analyze recruitment metrics.', NULL, default_org),
    ('email-performance', 'Email Performance', 'mark_email_read', 'analyze', 'Analyze email campaign performance.', NULL, default_org),
    ('networks-resources', 'Networks/Resources/Orgs', 'hub', 'analyze', 'Map networks, resources, and allied organizations.', NULL, default_org),
    ('group-decision-making', 'Group Decision Making', 'how_to_vote', 'analyze', 'Facilitate and analyze group decision processes.', NULL, default_org)
  ON CONFLICT (slug) DO NOTHING;
END;
$$;
