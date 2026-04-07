-- Migration 033: Group Branding
-- Stores per-group branding configuration: logo, hero image, colors, CTA URL, social links.
-- Used by landing page generation and any future public-facing group content.

CREATE TABLE group_branding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  logo_url text DEFAULT NULL,
  hero_image_url text DEFAULT NULL,
  primary_color text DEFAULT NULL,
  secondary_color text DEFAULT NULL,
  default_cta_url text DEFAULT NULL,
  social_facebook text DEFAULT NULL,
  social_instagram text DEFAULT NULL,
  social_twitter text DEFAULT NULL,
  social_bluesky text DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id)
);

ALTER TABLE group_branding ENABLE ROW LEVEL SECURITY;

-- Super admins can fully manage branding for their org
CREATE POLICY "Super admins can manage group branding"
ON group_branding
FOR ALL
USING (is_super_admin() AND org_id = get_my_org_id())
WITH CHECK (is_super_admin() AND org_id = get_my_org_id());

-- All group members can view their group's branding (needed for display purposes)
CREATE POLICY "Group members can view group branding"
ON group_branding
FOR SELECT
USING (group_id = get_my_group_id());
