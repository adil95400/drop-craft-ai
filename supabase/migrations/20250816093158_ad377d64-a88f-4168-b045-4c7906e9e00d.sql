-- Donner accès Ultra Pro à l'utilisateur pour le développement
UPDATE public.profiles 
SET plan = 'ultra_pro', updated_at = now()
WHERE id = 'aa0d2147-1d2e-47a8-afb9-8f60341a9617';