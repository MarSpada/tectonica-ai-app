-- Migration 042: Simplify bot_briefs — replace fields jsonb with content text
-- The structured {key, value} fields approach was overengineered.
-- Briefs are just saved text blobs (the output of the bot's questioning process).
-- "Use in chat" injects the content directly.

-- Add new content column
ALTER TABLE bot_briefs ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';

-- Drop the old fields column
ALTER TABLE bot_briefs DROP COLUMN IF EXISTS fields;
