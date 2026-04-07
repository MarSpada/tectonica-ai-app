-- Migration 028: Add hours_goal column to group_goals
-- NOTE: This column was added manually via ALTER TABLE in production.
-- This migration exists to keep the migration history in sync.
-- It uses IF NOT EXISTS to be safe if run against a DB that already has the column.

ALTER TABLE group_goals
ADD COLUMN IF NOT EXISTS hours_goal integer DEFAULT 0;
