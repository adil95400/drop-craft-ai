-- Supprimer temporairement la contrainte de clé étrangère si elle existe
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Créer le profil manquant pour l'utilisateur existant
INSERT INTO public.profiles (id, full_name, plan, role, created_at, updated_at)
VALUES (
  'aa0d2147-1d2e-47a8-afb9-8f60341a9617',
  'ADIL LAMRABET',
  'ultra_pro',
  'user',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  plan = EXCLUDED.plan,
  updated_at = now();

-- Recréer la contrainte de clé étrangère pour les futurs utilisateurs
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;