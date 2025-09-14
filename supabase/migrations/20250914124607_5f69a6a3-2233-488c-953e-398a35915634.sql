-- Donner les droits admin à votre compte
UPDATE public.profiles 
SET 
  role = 'admin',
  is_admin = true,
  admin_mode = 'bypass'
WHERE id = '44795494-985c-4c0e-97bc-800a3c4faf2b';

-- Vérifier que la mise à jour a fonctionné
SELECT id, full_name, role, is_admin, admin_mode 
FROM public.profiles 
WHERE id = '44795494-985c-4c0e-97bc-800a3c4faf2b';