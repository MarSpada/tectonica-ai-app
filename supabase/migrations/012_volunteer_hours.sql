CREATE TABLE public.volunteer_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  hours numeric(6,2) NOT NULL CHECK (hours > 0),
  description text,
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_volunteer_hours_group ON public.volunteer_hours(group_id, activity_date DESC);
CREATE INDEX idx_volunteer_hours_user ON public.volunteer_hours(user_id);

ALTER TABLE public.volunteer_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view group volunteer hours"
  ON public.volunteer_hours FOR SELECT
  USING (
    group_id = (SELECT group_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can log their own hours"
  ON public.volunteer_hours FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND group_id = (SELECT group_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete their own hours"
  ON public.volunteer_hours FOR DELETE
  USING (user_id = auth.uid());
