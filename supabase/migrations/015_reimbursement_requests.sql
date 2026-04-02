-- Reimbursement requests (follows approval_requests pattern)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================================
-- 1. Reimbursement requests table
-- ============================================================
CREATE TABLE public.reimbursement_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
  submitter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'changes_requested')),
  attachments jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_reimbursements_submitter ON public.reimbursement_requests (submitter_id, status);
CREATE INDEX idx_reimbursements_reviewer ON public.reimbursement_requests (reviewer_id, status);
CREATE INDEX idx_reimbursements_group ON public.reimbursement_requests (group_id);

-- ============================================================
-- 2. RLS policies
-- ============================================================
ALTER TABLE public.reimbursement_requests ENABLE ROW LEVEL SECURITY;

-- Submitter, reviewer, or super_admin can view
CREATE POLICY "Participants can view reimbursement requests"
  ON public.reimbursement_requests FOR SELECT
  USING (
    submitter_id = auth.uid()
    OR reviewer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
      AND org_id = (SELECT org_id FROM public.groups WHERE id = reimbursement_requests.group_id)
    )
  );

-- Any non-supporter can create in their group
CREATE POLICY "Members can create reimbursement requests"
  ON public.reimbursement_requests FOR INSERT
  WITH CHECK (
    group_id = get_my_group_id()
    AND submitter_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'group_admin', 'member')
    )
  );

-- Submitter or reviewer can update
CREATE POLICY "Participants can update reimbursement requests"
  ON public.reimbursement_requests FOR UPDATE
  USING (submitter_id = auth.uid() OR reviewer_id = auth.uid());

-- ============================================================
-- 3. Update notifications type constraint
-- ============================================================
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('signup_assignment', 'general', 'approval_request', 'reimbursement_request'));

-- ============================================================
-- 4. Storage bucket for reimbursement attachments
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reimbursements',
  'reimbursements',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can upload/manage their own files
CREATE POLICY "Users can upload reimbursement files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reimbursements' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update their reimbursement files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'reimbursements' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their reimbursement files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'reimbursements' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Public can read reimbursement files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'reimbursements');

-- ============================================================
-- 5. RPC: create_reimbursement_request
-- ============================================================
CREATE OR REPLACE FUNCTION public.create_reimbursement_request(
  p_amount numeric,
  p_description text,
  p_reviewer_id uuid,
  p_attachments jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid AS $$
DECLARE
  caller_group uuid;
  caller_role text;
  caller_name text;
  request_id uuid;
BEGIN
  -- Get caller info
  SELECT group_id, role, full_name INTO caller_group, caller_role, caller_name
  FROM public.profiles WHERE id = auth.uid();

  IF caller_role = 'supporter' THEN
    RAISE EXCEPTION 'Supporters cannot create reimbursement requests';
  END IF;

  -- Insert request
  INSERT INTO public.reimbursement_requests (group_id, submitter_id, reviewer_id, amount, description, attachments)
  VALUES (caller_group, auth.uid(), p_reviewer_id, p_amount, p_description, p_attachments)
  RETURNING id INTO request_id;

  -- Create notification for reviewer
  INSERT INTO public.notifications (user_id, group_id, type, title, body, metadata)
  VALUES (
    p_reviewer_id,
    caller_group,
    'reimbursement_request',
    'New reimbursement request',
    format('%s submitted a reimbursement request for $%s.', caller_name, p_amount),
    jsonb_build_object(
      'reimbursement_request_id', request_id,
      'submitter_id', auth.uid(),
      'submitter_name', caller_name,
      'amount', p_amount
    )
  );

  RETURN request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. RPC: update_reimbursement_status
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_reimbursement_status(
  p_request_id uuid,
  p_new_status text
)
RETURNS void AS $$
DECLARE
  req_submitter uuid;
  req_reviewer uuid;
  req_group uuid;
  req_amount numeric;
  reviewer_name text;
BEGIN
  IF p_new_status NOT IN ('approved', 'changes_requested') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;

  SELECT submitter_id, reviewer_id, group_id, amount
  INTO req_submitter, req_reviewer, req_group, req_amount
  FROM public.reimbursement_requests WHERE id = p_request_id;

  IF req_reviewer != auth.uid() THEN
    RAISE EXCEPTION 'Only the reviewer can update status';
  END IF;

  UPDATE public.reimbursement_requests
  SET status = p_new_status, updated_at = now()
  WHERE id = p_request_id;

  SELECT full_name INTO reviewer_name FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.notifications (user_id, group_id, type, title, body, metadata)
  VALUES (
    req_submitter,
    req_group,
    'reimbursement_request',
    CASE WHEN p_new_status = 'approved' THEN 'Reimbursement approved'
         ELSE 'Changes requested on reimbursement' END,
    format('%s %s your reimbursement request for $%s.',
      reviewer_name,
      CASE WHEN p_new_status = 'approved' THEN 'approved' ELSE 'requested changes on' END,
      req_amount
    ),
    jsonb_build_object(
      'reimbursement_request_id', p_request_id,
      'new_status', p_new_status,
      'reviewer_name', reviewer_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. RPC: resubmit_reimbursement
-- ============================================================
CREATE OR REPLACE FUNCTION public.resubmit_reimbursement(
  p_request_id uuid,
  p_description text DEFAULT NULL,
  p_attachments jsonb DEFAULT NULL
)
RETURNS void AS $$
DECLARE
  req_submitter uuid;
  req_reviewer uuid;
  req_group uuid;
  submitter_name text;
BEGIN
  SELECT submitter_id, reviewer_id, group_id
  INTO req_submitter, req_reviewer, req_group
  FROM public.reimbursement_requests WHERE id = p_request_id;

  IF req_submitter != auth.uid() THEN
    RAISE EXCEPTION 'Only the submitter can resubmit';
  END IF;

  UPDATE public.reimbursement_requests
  SET
    status = 'pending',
    description = COALESCE(p_description, description),
    attachments = COALESCE(p_attachments, attachments),
    updated_at = now()
  WHERE id = p_request_id AND status = 'changes_requested';

  SELECT full_name INTO submitter_name FROM public.profiles WHERE id = auth.uid();

  INSERT INTO public.notifications (user_id, group_id, type, title, body, metadata)
  VALUES (
    req_reviewer,
    req_group,
    'reimbursement_request',
    'Reimbursement request resubmitted',
    format('%s resubmitted their reimbursement request.', submitter_name),
    jsonb_build_object(
      'reimbursement_request_id', p_request_id,
      'submitter_name', submitter_name
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
