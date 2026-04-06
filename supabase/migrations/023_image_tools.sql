-- ============================================================
-- 023: Image Tools — Graphics Creation bot image generation
-- ============================================================
-- Extends org_integrations with image API credentials and credits.
-- Adds 'generated' category and 'private' visibility to media_items.
-- Updates RLS to allow users to see their own private media items.
-- Adds image_tools_enabled flag to bots table for DB-driven capability check.
-- ============================================================

-- ============================================================
-- 1. Extend org_integrations with image API columns
-- ============================================================
ALTER TABLE public.org_integrations
  ADD COLUMN IF NOT EXISTS image_api_endpoint text,
  ADD COLUMN IF NOT EXISTS image_api_bearer_token text,
  ADD COLUMN IF NOT EXISTS image_api_credits_allocated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS image_api_credits_used integer NOT NULL DEFAULT 0;

-- ============================================================
-- 2. Add image_tools_enabled flag to bots table
-- ============================================================
-- DB-driven capability check — no hardcoded slug comparisons.
-- Any bot can be configured to use image tools via this flag.
ALTER TABLE public.bots
  ADD COLUMN IF NOT EXISTS image_tools_enabled boolean NOT NULL DEFAULT false;

-- Enable image tools for the Graphics Creation bot
UPDATE public.bots
  SET image_tools_enabled = true
  WHERE slug = 'graphics-creation';

-- ============================================================
-- 3. Update media_items category CHECK
-- ============================================================
-- Add 'generated' for AI-generated images from Railway API
ALTER TABLE public.media_items DROP CONSTRAINT IF EXISTS media_items_category_check;
ALTER TABLE public.media_items
  ADD CONSTRAINT media_items_category_check
  CHECK (category IN ('image', 'video', 'document', 'link', 'generated'));

-- ============================================================
-- 4. Update media_items visibility CHECK
-- ============================================================
-- Add 'private' — visible only to the creator
ALTER TABLE public.media_items DROP CONSTRAINT IF EXISTS media_items_visibility_check;
ALTER TABLE public.media_items
  ADD CONSTRAINT media_items_visibility_check
  CHECK (visibility IN ('group', 'admins_only', 'specific_members', 'private'));

-- ============================================================
-- 5. Update file_or_link constraint
-- ============================================================
-- Generated images have a Railway URL but no storage_path.
-- They are not 'link' category — they are 'generated'.
ALTER TABLE public.media_items DROP CONSTRAINT IF EXISTS media_file_or_link;
ALTER TABLE public.media_items
  ADD CONSTRAINT media_file_or_link CHECK (
    (category = 'link' AND url IS NOT NULL AND storage_path IS NULL)
    OR (category = 'generated' AND url IS NOT NULL AND storage_path IS NULL)
    OR (category NOT IN ('link', 'generated') AND storage_path IS NOT NULL AND url IS NULL)
  );

-- ============================================================
-- 6. Update RLS SELECT policy
-- ============================================================
-- Allow users to see their own private items in addition to
-- all non-private items in their group.
DROP POLICY IF EXISTS "Group members can view media" ON public.media_items;
CREATE POLICY "Group members can view media"
  ON public.media_items FOR SELECT
  USING (
    deleted_at IS NULL
    AND group_id = get_my_group_id()
    AND (
      visibility <> 'private'
      OR uploaded_by = auth.uid()
    )
  );

-- ============================================================
-- 7. Credit increment RPC
-- ============================================================
-- Atomic credit increment — SECURITY DEFINER to bypass RLS.
-- Called server-side after each successful image generation.
CREATE OR REPLACE FUNCTION increment_image_credits(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.org_integrations
    SET image_api_credits_used = image_api_credits_used + 1
    WHERE org_id = p_org_id;
END;
$$;
