-- Add description column to groups table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS description text;
