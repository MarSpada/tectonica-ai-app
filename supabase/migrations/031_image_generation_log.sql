-- Migration 031: image_generation_log table
-- Records every image generation with cost breakdown.
-- Used for billing transparency, usage analytics, and audit trail.
-- Cost is calculated at generation time using the group's current rates.

CREATE TABLE image_generation_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fal_request_id text DEFAULT NULL,
  endpoint text DEFAULT NULL,
  output_width integer NOT NULL,
  output_height integer NOT NULL,
  input_image_count integer NOT NULL DEFAULT 0,
  mp_total decimal(8,4) NOT NULL,
  cost_usd decimal(8,4) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE image_generation_log ENABLE ROW LEVEL SECURITY;

-- Super admins can view generation log for their org
CREATE POLICY "Super admins can view generation log"
  ON image_generation_log FOR SELECT
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Generation log rows are inserted server-side via service role or SECURITY DEFINER RPC.
-- No INSERT policy needed for regular users — inserts bypass RLS via the API route's
-- server-side Supabase client or a future RPC.
-- Adding INSERT for super_admin for manual corrections if needed.
CREATE POLICY "Super admins can insert generation log"
  ON image_generation_log FOR INSERT
  WITH CHECK (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Index for monthly spend aggregation (billing tab)
CREATE INDEX idx_generation_log_group_month
  ON image_generation_log (group_id, created_at);
