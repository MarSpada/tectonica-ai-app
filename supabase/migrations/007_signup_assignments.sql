-- 007_signup_assignments.sql
-- NB signup assignments, notifications, RLS, and RPC functions

-- 1. Create signup_assignments table
CREATE TABLE public.signup_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nb_signup_id text NOT NULL,
  nb_signup_name text NOT NULL,
  nb_signup_email text,
  nb_signup_phone text,
  nb_signup_created_at timestamptz,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nb_signup_id, group_id)
);

CREATE INDEX idx_signup_assignments_assignee ON public.signup_assignments(assigned_to, status);
CREATE INDEX idx_signup_assignments_group ON public.signup_assignments(group_id);

-- 2. Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('signup_assignment', 'general')),
  title text NOT NULL,
  body text,
  metadata jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, read, created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.signup_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- signup_assignments: group members can view
CREATE POLICY "Group members can view signup assignments"
  ON public.signup_assignments FOR SELECT
  USING (group_id = public.get_my_group_id());

-- admins/organizers/leaders can create assignments
CREATE POLICY "Leaders can create signup assignments"
  ON public.signup_assignments FOR INSERT
  WITH CHECK (
    group_id = public.get_my_group_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'organizer', 'leader')
    )
  );

-- admins/organizers/leaders can update assignments
CREATE POLICY "Leaders can update signup assignments"
  ON public.signup_assignments FOR UPDATE
  USING (
    group_id = public.get_my_group_id()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'organizer', 'leader')
    )
  );

-- notifications: users can only see their own
CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- System can insert notifications (via SECURITY DEFINER functions)
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- 4. RPC: create_signup_assignment (atomic assignment + notification)
CREATE OR REPLACE FUNCTION public.create_signup_assignment(
  p_nb_signup_id text,
  p_nb_signup_name text,
  p_nb_signup_email text,
  p_nb_signup_phone text,
  p_nb_signup_created_at timestamptz,
  p_assigned_to uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_group uuid;
  assignment_id uuid;
  assigner_name text;
BEGIN
  SELECT p.group_id INTO caller_group
  FROM public.profiles p WHERE p.id = auth.uid();

  IF caller_group IS NULL THEN
    RAISE EXCEPTION 'No group found for current user';
  END IF;

  SELECT p.full_name INTO assigner_name
  FROM public.profiles p WHERE p.id = auth.uid();

  INSERT INTO public.signup_assignments (
    nb_signup_id, nb_signup_name, nb_signup_email, nb_signup_phone,
    nb_signup_created_at, assigned_to, assigned_by, group_id
  )
  VALUES (
    p_nb_signup_id, p_nb_signup_name, p_nb_signup_email, p_nb_signup_phone,
    p_nb_signup_created_at, p_assigned_to, auth.uid(), caller_group
  )
  ON CONFLICT (nb_signup_id, group_id)
  DO UPDATE SET
    assigned_to = p_assigned_to,
    assigned_by = auth.uid(),
    status = 'pending',
    updated_at = now()
  RETURNING id INTO assignment_id;

  -- Create notification for the assignee
  INSERT INTO public.notifications (user_id, group_id, type, title, body, metadata)
  VALUES (
    p_assigned_to,
    caller_group,
    'signup_assignment',
    'New signup assigned to you',
    format('%s assigned %s to you. Contact them within 24 hours for best results.', assigner_name, p_nb_signup_name),
    jsonb_build_object(
      'signup_assignment_id', assignment_id,
      'nb_signup_name', p_nb_signup_name,
      'nb_signup_email', p_nb_signup_email,
      'assigned_by', auth.uid()
    )
  );

  RETURN assignment_id;
END;
$$;
