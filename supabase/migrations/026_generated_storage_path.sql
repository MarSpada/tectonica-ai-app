-- Migration 026: Allow generated images to use storage_path
--
-- Previously the media_file_or_link constraint required generated items
-- to have url IS NOT NULL AND storage_path IS NULL. This migration relaxes
-- the constraint so generated images can use Supabase Storage (storage_path)
-- in addition to or instead of external FAL URLs (url).
--
-- This supports the storage migration from FAL/Railway URLs to Supabase Storage.

ALTER TABLE public.media_items DROP CONSTRAINT IF EXISTS media_file_or_link;
ALTER TABLE public.media_items
  ADD CONSTRAINT media_file_or_link CHECK (
    (category = 'link' AND url IS NOT NULL AND storage_path IS NULL)
    OR (category = 'generated' AND (url IS NOT NULL OR storage_path IS NOT NULL))
    OR (category NOT IN ('link', 'generated') AND storage_path IS NOT NULL AND url IS NULL)
  );
