-- Add missing profile/settings fields to support Profile + Settings pages
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS twitter text,
  ADD COLUMN IF NOT EXISTS linkedin text,
  ADD COLUMN IF NOT EXISTS github text,
  ADD COLUMN IF NOT EXISTS marketing_notifications boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS activity_visible boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS analytics_enabled boolean NOT NULL DEFAULT true;

-- Backfill settings JSON from existing columns where relevant
UPDATE public.profiles
SET settings = jsonb_strip_nulls(
  COALESCE(settings, '{}'::jsonb) ||
  jsonb_build_object(
    'notifications', jsonb_build_object(
      'email', COALESCE(email_notifications, true),
      'push', COALESCE(push_notifications, false),
      'marketing', COALESCE(marketing_notifications, false),
      'security', true
    ),
    'privacy', jsonb_build_object(
      'profileVisible', COALESCE(profile_visible, true),
      'activityVisible', COALESCE(activity_visible, false),
      'analyticsEnabled', COALESCE(analytics_enabled, true)
    ),
    'language', COALESCE(language, 'fr')
  )
),
updated_at = now()
WHERE settings = '{}'::jsonb OR settings IS NULL;