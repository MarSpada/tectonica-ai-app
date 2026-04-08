-- Migration 040: NationBuilder integration columns on org_integrations
-- Moves NB credentials from environment variables to DB-stored encrypted values.
-- Adds enable/disable toggle so super admins can control visibility in dashboard.
-- Bearer token is AES-256-GCM encrypted server-side (same as RunPod token).
-- Token is decrypted only inside API routes — never returned to client.

-- Add NB columns to existing org_integrations table
ALTER TABLE org_integrations
  ADD COLUMN IF NOT EXISTS nb_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nb_api_token TEXT,
  ADD COLUMN IF NOT EXISTS nb_slug TEXT,
  ADD COLUMN IF NOT EXISTS nb_status TEXT NOT NULL DEFAULT 'not_configured'
    CHECK (nb_status IN ('connected', 'error', 'not_configured')),
  ADD COLUMN IF NOT EXISTS nb_last_checked_at TIMESTAMPTZ;

COMMENT ON COLUMN org_integrations.nb_api_token
  IS 'AES-256-GCM encrypted. Decrypted only server-side in API routes. Never returned to client.';

COMMENT ON COLUMN org_integrations.nb_enabled
  IS 'When false, NB integration is hidden from dashboard widgets and signup ingestion is skipped.';

-- SECURITY DEFINER RPC: allows the signups route (runs as regular authenticated user)
-- to read NB credentials without super_admin RLS access.
-- Returns only NB-specific fields for the given org. Token stays encrypted —
-- decryption happens in the Node.js API route, not in SQL.
CREATE OR REPLACE FUNCTION get_nb_config(p_org_id UUID)
RETURNS TABLE (
  nb_enabled BOOLEAN,
  nb_api_token TEXT,
  nb_slug TEXT,
  nb_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    nb_enabled,
    nb_api_token,
    nb_slug,
    nb_status
  FROM org_integrations
  WHERE org_id = p_org_id
  LIMIT 1;
$$;

-- Grant execute to authenticated users (the RPC itself is the access boundary)
GRANT EXECUTE ON FUNCTION get_nb_config(UUID) TO authenticated;
