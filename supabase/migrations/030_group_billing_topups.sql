-- Migration 030: group_billing_topups table
-- Audit trail for credit top-ups added by super_admin.
-- Each row records a single credit addition with amount, note, and who added it.
-- Forward-compatible with future Stripe payment integration.

CREATE TABLE group_billing_topups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  added_by_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_usd decimal(10,4) NOT NULL,
  note text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE group_billing_topups ENABLE ROW LEVEL SECURITY;

-- Super admins can view top-up history for their org
CREATE POLICY "Super admins can view billing topups"
  ON group_billing_topups FOR SELECT
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Super admins can insert top-ups
CREATE POLICY "Super admins can insert billing topups"
  ON group_billing_topups FOR INSERT
  WITH CHECK (
    org_id = get_my_org_id()
    AND is_super_admin()
  );
