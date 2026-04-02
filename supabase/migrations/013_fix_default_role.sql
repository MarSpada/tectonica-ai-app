-- Fix default role for new signups: supporter (not member)
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  default_group_id uuid;
  default_org_id uuid;
BEGIN
  SELECT id, org_id INTO default_group_id, default_org_id
  FROM public.groups ORDER BY created_at LIMIT 1;

  INSERT INTO public.profiles (id, full_name, avatar_url, group_id, org_id, role)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', ''),
    default_group_id,
    default_org_id,
    'supporter'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
