-- Supprimer complètement la contrainte de clé étrangère
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Créer le profil manquant pour l'utilisateur dans le JWT 
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

-- Créer aussi le profil pour l'utilisateur réel dans auth.users
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

-- Créer un trigger pour les nouveaux utilisateurs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'standard',
    'user'
  );
  RETURN NEW;
END;
$$;

-- Créer le trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();