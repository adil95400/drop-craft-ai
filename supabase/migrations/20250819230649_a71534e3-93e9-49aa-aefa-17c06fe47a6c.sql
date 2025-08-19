-- Initialize missing quotas for the admin user
INSERT INTO public.user_quotas (user_id, quota_key, current_count, reset_date)
SELECT 
  '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8' as user_id,
  pl.limit_key as quota_key,
  0 as current_count,
  date_trunc('day', now()) + interval '1 day' as reset_date
FROM public.plans_limits pl
WHERE pl.plan = 'free'::plan_type
  AND NOT EXISTS (
    SELECT 1 FROM public.user_quotas uq 
    WHERE uq.user_id = '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8' 
    AND uq.quota_key = pl.limit_key
  );