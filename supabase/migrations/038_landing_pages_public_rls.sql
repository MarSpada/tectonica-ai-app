-- Migration 038: Public anon SELECT policy for live landing pages
-- Allows generated landing page URLs to be viewable without authentication.
-- Landing pages are public content — the whole point is shareable URLs.

CREATE POLICY "Public can view live landing pages"
ON group_landing_pages
FOR SELECT
TO anon
USING (status = 'live');
