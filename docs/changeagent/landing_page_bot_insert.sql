-- Insert Landing Page Creator bot into the bots table.
-- Run this in Supabase SQL Editor after migrations 033 and 034.
--
-- Replace {ORG_ID} with your organization's UUID from the organizations table.
-- model_id should match the ChangeAgent model name configured in Open WebUI.
-- system_prompt is "Configured in ChangeAgent" because the actual prompt lives
-- in the Open WebUI model configuration, not in this database field.

INSERT INTO bots (
  slug,
  name,
  icon,
  category,
  description,
  system_prompt,
  org_id,
  model_id,
  image_tools_enabled
) VALUES (
  'landing-page-creator',
  'Landing Page Creator',
  'bot-landing-page',
  'create',
  'Create professional campaign landing pages through a guided conversation. Just answer a few questions and get a ready-to-share page in minutes.',
  'Configured in ChangeAgent',
  '{ORG_ID}',
  'LandingPageCreator',
  false
);
