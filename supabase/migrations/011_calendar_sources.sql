-- Migration 011: Calendar Sources (system-agnostic event feeds)
-- Stores connected calendar sources (iCal/ICS, Google Calendar, Mobilize, etc.)
-- per organization. Events are fetched at read-time from the feed URL.

-- 1. Calendar sources table
CREATE TABLE public.calendar_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,                          -- e.g. "Team Google Calendar", "Mobilize Events"
  provider text NOT NULL DEFAULT 'ical',       -- 'ical', 'google', 'mobilize', etc.
  feed_url text NOT NULL,                      -- ICS/iCal feed URL
  color text DEFAULT '#7C3AED',                -- Display color for events from this source
  enabled boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_calendar_sources_org ON public.calendar_sources(org_id);

-- 2. RLS
ALTER TABLE public.calendar_sources ENABLE ROW LEVEL SECURITY;

-- Members can view their org's calendar sources
CREATE POLICY "Members can view org calendar sources"
  ON public.calendar_sources FOR SELECT
  USING (
    org_id = (SELECT org_id FROM public.profiles WHERE id = auth.uid())
  );

-- Only super_admins can manage calendar sources
CREATE POLICY "Super admins can insert calendar sources"
  ON public.calendar_sources FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
        AND org_id = calendar_sources.org_id
    )
  );

CREATE POLICY "Super admins can update calendar sources"
  ON public.calendar_sources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
        AND org_id = calendar_sources.org_id
    )
  );

CREATE POLICY "Super admins can delete calendar sources"
  ON public.calendar_sources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
        AND org_id = calendar_sources.org_id
    )
  );
