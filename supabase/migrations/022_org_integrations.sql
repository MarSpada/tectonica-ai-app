-- Migration 022: org_integrations table + bots.model_id
-- Stores per-org integration credentials (RunPod endpoint + encrypted bearer token).
-- Bearer token is AES-256-GCM encrypted server-side before storage.
-- Token is decrypted only inside API routes — never returned to client.

-- org_integrations: one row per org
CREATE TABLE org_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  runpod_endpoint_url TEXT,
  runpod_bearer_token TEXT,
  runpod_status TEXT NOT NULL DEFAULT 'not_configured'
    CHECK (runpod_status IN ('connected', 'error', 'not_configured')),
  runpod_last_checked_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES profiles(id),
  UNIQUE(org_id)
);

COMMENT ON COLUMN org_integrations.runpod_bearer_token
  IS 'AES-256-GCM encrypted. Decrypted only server-side in API routes. Never returned to client.';

-- RLS: super_admin only
ALTER TABLE org_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read org integrations"
  ON org_integrations FOR SELECT
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

CREATE POLICY "Super admins can insert org integrations"
  ON org_integrations FOR INSERT
  WITH CHECK (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

CREATE POLICY "Super admins can update org integrations"
  ON org_integrations FOR UPDATE
  USING (
    org_id = get_my_org_id()
    AND is_super_admin()
  );

-- Add model_id to bots table
ALTER TABLE bots ADD COLUMN model_id TEXT;

COMMENT ON COLUMN bots.model_id
  IS 'Model identifier from RunPod endpoint. Null = bot not yet configured for RunPod.';
