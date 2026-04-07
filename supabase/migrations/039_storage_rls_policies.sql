-- Migration 039: Storage bucket creation for branding and landing pages
-- Uses upsert (ON CONFLICT DO NOTHING) so it's safe to run in environments
-- where buckets already exist from manual dashboard setup.
--
-- NOTE: Storage bucket RLS policies (INSERT for authenticated, SELECT for public)
-- must still be configured manually in the Supabase dashboard under Storage > Policies.
-- SQL migrations cannot create storage.objects policies reliably across all environments.

INSERT INTO storage.buckets (id, name, public)
VALUES ('branding', 'branding', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('landing-pages', 'landing-pages', true)
ON CONFLICT (id) DO NOTHING;
