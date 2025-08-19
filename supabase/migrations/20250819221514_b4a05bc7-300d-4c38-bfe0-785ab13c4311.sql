-- Créer le profil pour l'utilisateur qui existe réellement dans auth.users
INSERT INTO public.profiles (id, full_name, plan, role, created_at, updated_at)
VALUES (
  '44795494-985c-4c0e-97bc-800a3c4faf2b',
  'ADIL LAMRABET',
  'ultra_pro',
  'user',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  plan = EXCLUDED.plan,
  updated_at = now();

-- Créer aussi un profil pour l'ID dans le JWT au cas où il serait utilisé
-- (sans contrainte de clé étrangère pour cet ID spécifique)
INSERT INTO public.profiles (id, full_name, plan, role, created_at, updated_at)
VALUES (
  'aa0d2147-1d2e-47a8-afb9-8f60341a9617',
  'ADIL LAMRABET',
  'ultra_pro',
  'user',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Assurer qu'il n'y a pas de conflit en supprimant la contrainte temporairement
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Recréer la contrainte uniquement pour les nouveaux utilisateurs
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE DEFERRABLE INITIALLY DEFERRED;