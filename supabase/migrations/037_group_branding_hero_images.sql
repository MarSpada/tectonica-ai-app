-- Migration 037: Add hero_images array to group branding
-- Stores up to 5 hero images as { url, label } objects for the landing page bot gallery.
-- Existing hero_image_url column is kept as the default/fallback for non-interactive contexts.

ALTER TABLE group_branding
ADD COLUMN IF NOT EXISTS hero_images jsonb DEFAULT '[]'::jsonb;
