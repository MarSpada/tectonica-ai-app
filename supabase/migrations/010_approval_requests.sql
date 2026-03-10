-- 010_approval_requests.sql
-- Approval request workflow: submit → review → approve/changes_requested → resubmit
-- Run in Supabase SQL Editor as a single script

-- ============================================================
-- 1. EXPAND NOTIFICATION TYPE CONSTRAINT
-- ============================================================
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('signup_assignment', 'general', 'approval_request'));

-- ============================================================
-- 2. APPROVAL REQUESTS TABLE
-- ============================================================
CREATE TABLE public.approval_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  submitter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
  attachments jsonb DEFAULT '[]',
  -- Future: link to bot conversation
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  bot_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_approval_requests_submitter ON public.approval_requests(submitter_id, status);
CREATE INDEX idx_approval_requests_reviewer ON public.approval_requests(reviewer_id, status);
CREATE INDEX idx_approval_requests_group ON public.approval_requests(group_id);

-- ============================================================
-- 3. APPROVAL COMMENTS TABLE
-- ============================================================
CREATE TABLE public.approval_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.approval_requests(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_approval_comments_request ON public.approval_comments(request_id, created_at);

-- ============================================================
-- 4. STORAGE BUCKET FOR APPROVAL ATTACHMENTS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'approvals',
  'approvals',
  true,
  5242880,  -- 5MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users upload to their own folder
CREATE POLICY "Users can upload approval files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'approvals'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own approval files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'approvals'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own approval files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'approvals'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Public approval file read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'approvals');

-- ============================================================
-- 5. RLS POLICIES FOR APPROVAL TABLES
-- ============================================================
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_comments ENABLE ROW LEVEL SECURITY;

-- Requests: submitter, reviewer, or super_admin can view
CREATE POLICY "Users can view relevant approval requests"
  ON public.approval_requests FOR SELECT
  USING (
    submitter_id = auth.uid()
    OR reviewer_id = auth.uid()
    OR public.is_super_admin()
  );

-- Requests: non-supporters can create in their own group
CREATE POLICY "Non-supporters can create approval requests"
  ON public.approval_requests FOR INSERT
  WITH CHECK (
    group_id = public.get_my_group_id()
    AND submitter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'group_admin', 'member')
    )
  );

-- Requests: submitter or reviewer can update
CREATE POLICY "Participants can update approval requests"
  ON public.approval_requests FOR UPDATE
  USING (
    submitter_id = auth.uid()
    OR reviewer_id = auth.uid()
  );

-- Comments: participants can view
CREATE POLICY "Participants can view approval comments"
  ON public.approval_comments FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM public.approval_requests
      WHERE submitter_id = auth.uid()
        OR reviewer_id = auth.uid()
        OR public.is_super_admin()
    )
  );

-- Comments: participants can create
CREATE POLICY "Participants can create approval comments"
  ON public.approval_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid()
    AND request_id IN (
      SELECT id FROM public.approval_requests
      WHERE submitter_id = auth.uid()
        OR reviewer_id = auth.uid()
    )
  );

-- ============================================================
-- 6. RPC: CREATE APPROVAL REQUEST (atomic + notification)
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_approval_request(
  p_title text,
  p_description text,
  p_reviewer_id uuid,
  p_attachments jsonb DEFAULT '[]',
  p_conversation_id uuid DEFAULT NULL,
  p_bot_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_group uuid;
  caller_role text;
  request_id uuid;
  submitter_name text;
BEGIN
  SELECT p.group_id, p.role, p.full_name
  INTO caller_group, caller_role, submitter_name
  FROM public.profiles p WHERE p.id = auth.uid();

  IF caller_group IS NULL THEN
    RAISE EXCEPTION 'No group found for current user';
  END IF;

  IF caller_role = 'supporter' THEN
    RAISE EXCEPTION 'Supporters cannot create approval requests';
  END IF;

  -- Verify reviewer is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = p_reviewer_id
    AND role IN ('super_admin', 'group_admin')
  ) THEN
    RAISE EXCEPTION 'Reviewer must be an admin';
  END IF;

  INSERT INTO public.approval_requests (
    group_id, submitter_id, reviewer_id, title, description,
    attachments, conversation_id, bot_id
  )
  VALUES (
    caller_group, auth.uid(), p_reviewer_id, p_title, p_description,
    p_attachments, p_conversation_id, p_bot_id
  )
  RETURNING id INTO request_id;

  -- Notify the reviewer
  INSERT INTO public.notifications (user_id, group_id, type, title, body, metadata)
  VALUES (
    p_reviewer_id,
    caller_group,
    'approval_request',
    'New approval request',
    format('%s submitted "%s" for your approval.', COALESCE(submitter_name, 'Someone'), p_title),
    jsonb_build_object(
      'approval_request_id', request_id,
      'submitter_id', auth.uid(),
      'submitter_name', submitter_name,
      'request_title', p_title
    )
  );

  RETURN request_id;
END;
$$;

-- ============================================================
-- 7. RPC: UPDATE APPROVAL STATUS (approve / request changes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_approval_status(
  p_request_id uuid,
  p_new_status text,
  p_comment text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req record;
  reviewer_name text;
BEGIN
  IF p_new_status NOT IN ('approved', 'changes_requested') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  SELECT * INTO req FROM public.approval_requests WHERE id = p_request_id;

  IF req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF req.reviewer_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the assigned reviewer can change status';
  END IF;

  -- Update status
  UPDATE public.approval_requests
  SET status = p_new_status, updated_at = now()
  WHERE id = p_request_id;

  -- Optionally add a comment
  IF p_comment IS NOT NULL AND p_comment != '' THEN
    INSERT INTO public.approval_comments (request_id, author_id, content)
    VALUES (p_request_id, auth.uid(), p_comment);
  END IF;

  SELECT p.full_name INTO reviewer_name
  FROM public.profiles p WHERE p.id = auth.uid();

  -- Notify submitter
  INSERT INTO public.notifications (user_id, group_id, type, title, body, metadata)
  VALUES (
    req.submitter_id,
    req.group_id,
    'approval_request',
    CASE p_new_status
      WHEN 'approved' THEN 'Request approved'
      WHEN 'changes_requested' THEN 'Changes requested'
    END,
    format('%s %s your request "%s".',
      COALESCE(reviewer_name, 'A reviewer'),
      CASE p_new_status
        WHEN 'approved' THEN 'approved'
        WHEN 'changes_requested' THEN 'requested changes on'
      END,
      req.title
    ),
    jsonb_build_object(
      'approval_request_id', p_request_id,
      'new_status', p_new_status,
      'reviewer_name', reviewer_name
    )
  );
END;
$$;

-- ============================================================
-- 8. RPC: RESUBMIT APPROVAL REQUEST
-- ============================================================
CREATE OR REPLACE FUNCTION public.resubmit_approval_request(
  p_request_id uuid,
  p_description text DEFAULT NULL,
  p_attachments jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req record;
  submitter_name text;
BEGIN
  SELECT * INTO req FROM public.approval_requests WHERE id = p_request_id;

  IF req IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF req.submitter_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the submitter can resubmit';
  END IF;

  IF req.status != 'changes_requested' THEN
    RAISE EXCEPTION 'Can only resubmit when changes were requested';
  END IF;

  UPDATE public.approval_requests
  SET
    status = 'pending',
    description = COALESCE(p_description, req.description),
    attachments = COALESCE(p_attachments, req.attachments),
    updated_at = now()
  WHERE id = p_request_id;

  SELECT p.full_name INTO submitter_name
  FROM public.profiles p WHERE p.id = auth.uid();

  -- Notify reviewer
  INSERT INTO public.notifications (user_id, group_id, type, title, body, metadata)
  VALUES (
    req.reviewer_id,
    req.group_id,
    'approval_request',
    'Request resubmitted',
    format('%s resubmitted "%s" for your review.', COALESCE(submitter_name, 'Someone'), req.title),
    jsonb_build_object(
      'approval_request_id', p_request_id,
      'submitter_name', submitter_name
    )
  );
END;
$$;
