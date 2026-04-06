-- 025: Move calendar_sources from org-level to group-level scope
-- Backfills existing rows to the single existing group.
-- org_id column kept intentionally for future org-level calendar management.

-- 1. Add group_id column (nullable initially for backfill)
ALTER TABLE calendar_sources
  ADD COLUMN group_id uuid REFERENCES groups(id);

-- 2. Backfill all existing rows to the single existing group
UPDATE calendar_sources
SET group_id = (SELECT id FROM groups LIMIT 1)
WHERE group_id IS NULL;

-- 3. Add NOT NULL constraint after backfill
ALTER TABLE calendar_sources
  ALTER COLUMN group_id SET NOT NULL;

-- 4. Add index for group-scoped queries
CREATE INDEX idx_calendar_sources_group_id ON calendar_sources(group_id);

-- 5. Drop existing org-scoped RLS policies
DROP POLICY IF EXISTS "Members can view their org calendar sources" ON calendar_sources;
DROP POLICY IF EXISTS "Super admins can insert calendar sources" ON calendar_sources;
DROP POLICY IF EXISTS "Super admins can update calendar sources" ON calendar_sources;
DROP POLICY IF EXISTS "Super admins can delete calendar sources" ON calendar_sources;

-- 6. Create new group-scoped RLS policies
-- Note: RLS uses is_admin() (super_admin + group_admin) for future flexibility,
-- while API routes currently restrict to isSuperAdmin only. This mismatch is
-- intentional — see CLAUDE.md conventions for documentation.
CREATE POLICY "Members can view their group calendar sources"
  ON calendar_sources FOR SELECT
  USING (group_id = get_my_group_id());

CREATE POLICY "Admins can insert group calendar sources"
  ON calendar_sources FOR INSERT
  WITH CHECK (group_id = get_my_group_id() AND is_admin());

CREATE POLICY "Admins can update group calendar sources"
  ON calendar_sources FOR UPDATE
  USING (group_id = get_my_group_id() AND is_admin());

CREATE POLICY "Admins can delete group calendar sources"
  ON calendar_sources FOR DELETE
  USING (group_id = get_my_group_id() AND is_admin());
