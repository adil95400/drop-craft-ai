-- Donner accès Ultra Pro à l'utilisateur pour le développement
UPDATE public.profiles 
SET plan = 'ultra_pro', updated_at = now()
WHERE id = 'aa0d2147-1d2e-47a8-afb9-8f60341a9617';

-- Optionnel: Créer quelques utilisateurs de test avec différents plans
INSERT INTO public.profiles (id, full_name, plan, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'Utilisateur Free', 'free', now(), now()),
  (gen_random_uuid(), 'Utilisateur Pro', 'pro', now(), now()),
  (gen_random_uuid(), 'Utilisateur Ultra Pro', 'ultra_pro', now(), now())
ON CONFLICT (id) DO NOTHING;