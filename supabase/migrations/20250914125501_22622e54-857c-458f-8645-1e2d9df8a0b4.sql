-- Corriger le compte admin destockal@gmail.com
UPDATE public.profiles 
SET 
  is_admin = true,
  admin_mode = 'bypass'
WHERE id = '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8';

-- Vérifier la mise à jour
SELECT id, full_name, role, is_admin, admin_mode 
FROM public.profiles 
WHERE id = '5c6a3f8f-240a-4eae-ad29-05cfe1e34db8';