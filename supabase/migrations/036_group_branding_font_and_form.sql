-- Migration 036: Add font selection and form embed HTML to group branding
-- Font: applied to generated landing pages via Google Fonts CDN
-- Form embed: optional HubSpot/Typeform/etc. embed that replaces the CTA button

ALTER TABLE group_branding
ADD COLUMN IF NOT EXISTS font_family text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS form_embed_html text DEFAULT NULL;
