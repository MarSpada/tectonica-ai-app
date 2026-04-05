-- Fundraising goals per group per month
-- LEGACY — fundraising_goal and print_budget columns are superseded by
-- money_goal and money_budget in group_goals (migration 019). This table
-- still tracks amount_raised per month.
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE TABLE public.fundraising_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  month date NOT NULL,  -- first of month, e.g. '2026-04-01'
  fundraising_goal numeric(10,2) DEFAULT 0,
  amount_raised numeric(10,2) DEFAULT 0,
  print_budget numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id, month)
);

CREATE INDEX idx_fundraising_goals_group_month
  ON public.fundraising_goals (group_id, month DESC);

-- RLS
ALTER TABLE public.fundraising_goals ENABLE ROW LEVEL SECURITY;

-- Group members can view their group's goals
CREATE POLICY "Group members can view fundraising goals"
  ON public.fundraising_goals FOR SELECT
  USING (group_id = get_my_group_id());

-- Admins can insert/update goals for their group
CREATE POLICY "Admins can manage fundraising goals"
  ON public.fundraising_goals FOR ALL
  USING (
    group_id = get_my_group_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'group_admin')
    )
  );
