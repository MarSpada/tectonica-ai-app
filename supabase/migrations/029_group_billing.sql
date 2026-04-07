-- Migration 029: group_billing table
-- Per-group credit pool for image generation billing.
-- Each group has its own isolated credit balance in USD.
-- Credits are topped up manually by super_admin (Stripe integration deferred).
-- Forward-compatible with future payments architecture.

CREATE TABLE group_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credit_balance_usd decimal(10,4) NOT NULL DEFAULT 0,
  platform_fee_percentage decimal(5,4) DEFAULT NULL,
  cost_per_mp_base decimal(6,4) NOT NULL DEFAULT 0.03,
  cost_per_mp_extra decimal(6,4) NOT NULL DEFAULT 0.015,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(group_id)
);

ALTER TABLE group_billing ENABLE ROW LEVEL SECURITY;

-- Super admins can view billing for their org's groups
CREATE POLICY "Super admins can view group billing"
  ON group_billing FOR SELECT
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Super admins can create billing rows
CREATE POLICY "Super admins can insert group billing"
  ON group_billing FOR INSERT
  WITH CHECK (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Super admins can update billing
CREATE POLICY "Super admins can update group billing"
  ON group_billing FOR UPDATE
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  )
  WITH CHECK (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- All authenticated group members can read their group's balance (for topbar display)
CREATE POLICY "Group members can view own group billing"
  ON group_billing FOR SELECT
  USING (
    group_id = get_my_group_id()
  );
