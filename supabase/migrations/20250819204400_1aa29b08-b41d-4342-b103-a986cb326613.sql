-- Mise à jour du rôle admin pour lookandstyle59@gmail.com
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'lookandstyle59@gmail.com'
);

-- Log de l'opération
INSERT INTO public.security_events (
  event_type,
  severity,
  description,
  metadata
) VALUES (
  'manual_role_assignment',
  'info',
  'Manual admin role assignment via migration',
  jsonb_build_object(
    'email', 'lookandstyle59@gmail.com',
    'new_role', 'admin',
    'timestamp', now()
  )
);