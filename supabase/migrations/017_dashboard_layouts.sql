-- Migration 017: Dashboard layout persistence
-- Run manually in Supabase SQL Editor

-- ═══ Org-level default layout ═══
CREATE TABLE dashboard_layouts_default (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id)
    ON DELETE CASCADE,
  layout jsonb NOT NULL,
  created_by uuid REFERENCES profiles(id)
    ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(org_id)
);

ALTER TABLE dashboard_layouts_default
  ENABLE ROW LEVEL SECURITY;

-- Members can read their org default
CREATE POLICY "members can read org default"
  ON dashboard_layouts_default FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Only super_admin can write org default
CREATE POLICY "super_admin can manage org default"
  ON dashboard_layouts_default FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
      AND org_id = dashboard_layouts_default.org_id
    )
  );

-- ═══ Per-user layout overrides ═══
CREATE TABLE dashboard_layouts_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id)
    ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id)
    ON DELETE CASCADE,
  layout jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, org_id)
);

ALTER TABLE dashboard_layouts_user
  ENABLE ROW LEVEL SECURITY;

-- Users can only read and write their own layout
CREATE POLICY "users manage own layout"
  ON dashboard_layouts_user FOR ALL
  USING (user_id = auth.uid());
