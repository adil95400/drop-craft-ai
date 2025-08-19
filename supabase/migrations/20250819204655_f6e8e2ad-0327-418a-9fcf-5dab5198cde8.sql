-- Assurer que tous les utilisateurs existants ont des entrées dans user_roles basées sur leur profile.role

-- Insérer les rôles pour tous les utilisateurs existants qui n'ont pas d'entrée dans user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, p.role::app_role
FROM public.profiles p
WHERE p.role IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id 
  AND ur.role = p.role::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Vérifier et corriger le rôle de lookandstyle59@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'admin'::app_role
FROM auth.users au
WHERE au.email = 'lookandstyle59@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = au.id 
  AND ur.role = 'admin'::app_role
)
ON CONFLICT (user_id, role) DO NOTHING;