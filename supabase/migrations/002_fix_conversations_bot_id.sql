-- Fix conversations.bot_id: change from UUID FK to text slug
-- This lets us store bot slugs directly (e.g. "canvassing-planner")
-- without needing to populate the bots table first.

-- Drop the FK constraint
alter table public.conversations
  drop constraint if exists conversations_bot_id_fkey;

-- Change column type from uuid to text
alter table public.conversations
  alter column bot_id type text using bot_id::text;

-- Add index for faster lookups by bot_id
create index if not exists idx_conversations_bot_id
  on public.conversations(bot_id);
