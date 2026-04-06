-- Migration 024: Energy consumption tracking for generated images
--
-- Adds image dimensions and pre-computed energy cost (Wh) to media_items.
-- Energy is calculated at generation time from actual pixel dimensions
-- using reference data from "Energy Scaling Laws for Diffusion Models"
-- (Stanford University & AXA, 2025).
--
-- All three columns are nullable — existing rows and non-generated items
-- are unaffected.

ALTER TABLE public.media_items
  ADD COLUMN image_width  integer,
  ADD COLUMN image_height integer,
  ADD COLUMN energy_wh    double precision;

-- Partial index for efficient group-level SUM(energy_wh) aggregation.
-- Only indexes generated images that have energy data.
CREATE INDEX idx_media_items_energy
  ON public.media_items (group_id)
  WHERE category = 'generated' AND energy_wh IS NOT NULL;
