-- Migration 041: bot_briefs table
-- DB-driven creative briefs per bot. Replaces the hardcoded SAVED_BRIEFS array
-- in CreativeBrief.tsx with admin-managed briefs per bot per org.
-- Briefs are keyed by bot slug (bot_id text), not UUID FK, matching the
-- existing pattern where bots are referenced by slug throughout the app.

CREATE TABLE bot_briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id text NOT NULL,                -- matches bots.slug, not a UUID FK
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  thumbnail_url text,
  fields jsonb NOT NULL DEFAULT '[]',  -- array of {key: string, value: string}
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for the common query: fetch briefs for a specific bot within an org
CREATE INDEX idx_bot_briefs_bot_org ON bot_briefs (bot_id, org_id);

ALTER TABLE bot_briefs ENABLE ROW LEVEL SECURITY;

-- All authenticated group members can see enabled briefs for their org
CREATE POLICY "Members can view enabled briefs"
  ON bot_briefs FOR SELECT
  USING (
    org_id = get_my_org_id()
    AND enabled = true
  );

-- Super admins can see ALL briefs (including disabled) for their org
CREATE POLICY "Super admins can view all briefs"
  ON bot_briefs FOR SELECT
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Super admins can create briefs
CREATE POLICY "Super admins can insert briefs"
  ON bot_briefs FOR INSERT
  WITH CHECK (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Super admins can update briefs
CREATE POLICY "Super admins can update briefs"
  ON bot_briefs FOR UPDATE
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  )
  WITH CHECK (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Super admins can delete briefs
CREATE POLICY "Super admins can delete briefs"
  ON bot_briefs FOR DELETE
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  );
