-- Migration 019: Group Goals (admin-editable targets)
-- Centralizes goal values that feed dashboard widgets.
-- One row per group (open-ended, no date scoping).

CREATE TABLE public.group_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  money_goal integer NOT NULL DEFAULT 0,
  money_budget integer NOT NULL DEFAULT 0,
  money_raised_offline integer NOT NULL DEFAULT 0,
  members_goal integer NOT NULL DEFAULT 0,
  supporters_goal integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id),
  UNIQUE(group_id)
);

-- RLS
ALTER TABLE public.group_goals ENABLE ROW LEVEL SECURITY;

-- Members can view their group's goals
CREATE POLICY "Members can view group goals"
  ON public.group_goals FOR SELECT
  USING (group_id = get_my_group_id());

-- Admins can insert their group's goals
CREATE POLICY "Admins can insert group goals"
  ON public.group_goals FOR INSERT
  WITH CHECK (
    group_id = get_my_group_id()
    AND is_admin()
  );

-- Admins can update their group's goals
CREATE POLICY "Admins can update group goals"
  ON public.group_goals FOR UPDATE
  USING (
    group_id = get_my_group_id()
    AND is_admin()
  );
