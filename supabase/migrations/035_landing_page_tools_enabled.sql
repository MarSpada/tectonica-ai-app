-- Migration 035: Landing Page Tools Flag
-- Adds a per-bot flag to enable native landing page generation tool calling,
-- following the same pattern as image_tools_enabled (migration 023).

ALTER TABLE bots
ADD COLUMN IF NOT EXISTS landing_page_tools_enabled boolean NOT NULL DEFAULT false;

-- Enable for the landing page creator bot only
UPDATE bots SET landing_page_tools_enabled = true WHERE slug = 'landing-page-creator';
