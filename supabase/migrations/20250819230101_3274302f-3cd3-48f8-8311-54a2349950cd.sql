-- Promote destockal@gmail.com (Adil LAMRABET) to admin role
-- User ID: 5c6a3f8f-240a-4eae-ad29-05cfe1e34db8

-- 1. Update the user's role in profiles table to admin
UPDATE public.profiles 
SET 
  role = 'admin',
  updated_at = now()
WHERE id = '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8';

-- 2. Add admin role entry in user_roles table
INSERT INTO public.user_roles (user_id, role)
VALUES ('5c6a3f8f-240a-4eae-ad29-05cfe1e34db8', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Fix the plan type issue - change from 'standard' to 'free' for consistency
UPDATE public.profiles 
SET 
  plan = 'free'::plan_type,
  updated_at = now()
WHERE id = '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8' AND plan = 'standard'::plan_type;

-- 4. Initialize missing user quotas ONLY for users that exist in auth.users
-- First, get plan limits and create quota entries only for valid users
INSERT INTO public.user_quotas (user_id, quota_key, current_count, reset_date)
SELECT 
  p.id as user_id,
  pl.limit_key as quota_key,
  0 as current_count,
  date_trunc('day', now()) + interval '1 day' as reset_date
FROM public.profiles p
CROSS JOIN public.plans_limits pl
WHERE pl.plan = p.plan
  -- Only include users that actually exist in auth.users
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.user_quotas uq 
    WHERE uq.user_id = p.id AND uq.quota_key = pl.limit_key
  );

-- 5. Log the admin promotion for security
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'admin_promotion',
  'info',
  'User promoted to admin role via migration',
  jsonb_build_object(
    'user_id', '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8',
    'email', 'destockal@gmail.com',
    'promoted_by', 'system_migration',
    'timestamp', now()
  )
);