-- Créer le profil manquant pour l'utilisateur existant
INSERT INTO public.profiles (id, full_name, plan, role, created_at, updated_at)
VALUES (
  'aa0d2147-1d2e-47a8-afb9-8f60341a9617',
  'ADIL LAMRABET',
  'ultra_pro',
  'user',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Ajouter un trigger pour créer automatiquement un profil lors de l'inscription
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

-- Créer le trigger s'il n'existe pas déjà
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();