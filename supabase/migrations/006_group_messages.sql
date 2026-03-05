-- 006_group_messages.sql
-- Group conversation: messages table, RLS, RPC, Realtime, seed data

-- 1. Create group_messages table
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL CHECK (char_length(content) > 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_group_messages_group_time
  ON public.group_messages(group_id, created_at DESC);

-- 2. Enable RLS
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Same-group members can read messages
CREATE POLICY "Group members can view messages"
  ON public.group_messages FOR SELECT
  USING (group_id = public.get_my_group_id());

-- Members can insert messages as themselves
CREATE POLICY "Group members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    group_id = public.get_my_group_id()
    AND sender_id = auth.uid()
  );

-- 3. Enable Supabase Realtime on this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;

-- 4. RPC to fetch recent messages with sender profile info
CREATE OR REPLACE FUNCTION public.get_group_messages(
  msg_limit int DEFAULT 50,
  before_ts timestamptz DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  sender_name text,
  sender_avatar text,
  content text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_group uuid;
BEGIN
  SELECT p.group_id INTO caller_group
  FROM public.profiles p
  WHERE p.id = auth.uid();

  IF caller_group IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    sub.id,
    sub.sender_id,
    sub.sender_name,
    sub.sender_avatar,
    sub.content,
    sub.created_at
  FROM (
    SELECT
      m.id,
      m.sender_id,
      p.full_name AS sender_name,
      p.avatar_url AS sender_avatar,
      m.content,
      m.created_at
    FROM public.group_messages m
    JOIN public.profiles p ON p.id = m.sender_id
    WHERE m.group_id = caller_group
      AND (before_ts IS NULL OR m.created_at < before_ts)
    ORDER BY m.created_at DESC
    LIMIT msg_limit
  ) sub
  ORDER BY sub.created_at ASC;
END;
$$;

-- 5. Seed messages
-- Uses a DO block to look up real profile IDs by name in the caller's group.
-- Adjust names if your seed data differs.
DO $$
DECLARE
  grp uuid;
  sara_id uuid;
  marcus_id uuid;
  ned_id uuid;
  jasmine_id uuid;
  david_id uuid;
  lucia_id uuid;
BEGIN
  -- Get the first group (demo group)
  SELECT id INTO grp FROM public.groups LIMIT 1;

  -- Look up profile IDs by name within that group
  SELECT id INTO sara_id    FROM public.profiles WHERE full_name = 'Sara Chen'       AND group_id = grp LIMIT 1;
  SELECT id INTO marcus_id  FROM public.profiles WHERE full_name = 'Marcus Rivera'   AND group_id = grp LIMIT 1;
  SELECT id INTO ned_id     FROM public.profiles WHERE full_name = 'Ned Howey'       AND group_id = grp LIMIT 1;
  SELECT id INTO jasmine_id FROM public.profiles WHERE full_name = 'Jasmine Okafor'  AND group_id = grp LIMIT 1;
  SELECT id INTO david_id   FROM public.profiles WHERE full_name = 'David Park'      AND group_id = grp LIMIT 1;
  SELECT id INTO lucia_id   FROM public.profiles WHERE full_name = 'Lucia Torres'    AND group_id = grp LIMIT 1;

  -- Insert seed messages (timestamps spread over last few hours)
  IF sara_id IS NOT NULL THEN
    INSERT INTO public.group_messages (group_id, sender_id, content, created_at) VALUES
      (grp, sara_id, 'Hey everyone! Just finished the outreach plan for next week. I''ll share it in the doc later today.', now() - interval '3 hours');
  END IF;

  IF marcus_id IS NOT NULL THEN
    INSERT INTO public.group_messages (group_id, sender_id, content, created_at) VALUES
      (grp, marcus_id, 'Great work Sara! Can we also discuss the volunteer schedule for the weekend event?', now() - interval '2 hours 45 minutes');
  END IF;

  IF jasmine_id IS NOT NULL THEN
    INSERT INTO public.group_messages (group_id, sender_id, content, created_at) VALUES
      (grp, jasmine_id, 'I have 12 confirmed volunteers so far. Will check in with a few more today.', now() - interval '2 hours 30 minutes');
  END IF;

  IF sara_id IS NOT NULL THEN
    INSERT INTO public.group_messages (group_id, sender_id, content, created_at) VALUES
      (grp, sara_id, 'Perfect. Let''s sync tomorrow morning to finalize everything.', now() - interval '2 hours');
  END IF;

  IF ned_id IS NOT NULL THEN
    INSERT INTO public.group_messages (group_id, sender_id, content, created_at) VALUES
      (grp, ned_id, 'Just confirmed the venue for Saturday. We''re all set!', now() - interval '1 hour 30 minutes');
  END IF;

  IF david_id IS NOT NULL THEN
    INSERT INTO public.group_messages (group_id, sender_id, content, created_at) VALUES
      (grp, david_id, 'I''ll handle printing the flyers tonight. How many do we need?', now() - interval '1 hour');
  END IF;

  IF lucia_id IS NOT NULL THEN
    INSERT INTO public.group_messages (group_id, sender_id, content, created_at) VALUES
      (grp, lucia_id, 'Let''s aim for 200 flyers. I can help distribute them at the campus tomorrow.', now() - interval '45 minutes');
  END IF;

  IF marcus_id IS NOT NULL THEN
    INSERT INTO public.group_messages (group_id, sender_id, content, created_at) VALUES
      (grp, marcus_id, 'Sounds great! I''ll bring the sign-up sheets too. See everyone Saturday!', now() - interval '20 minutes');
  END IF;
END;
$$;
