-- Mettre à jour le type enum plan_type pour utiliser 'free' au lieu de 'standard'

-- D'abord, ajouter la nouvelle valeur 'free'
ALTER TYPE plan_type ADD VALUE 'free';

-- Mettre à jour toutes les entrées existantes de 'standard' vers 'free'
UPDATE profiles SET plan = 'free' WHERE plan = 'standard';

-- Supprimer l'ancienne valeur 'standard' du type
-- Note: PostgreSQL ne permet pas de supprimer une valeur d'un enum directement
-- Il faut recréer le type

-- Créer un nouveau type temporaire
CREATE TYPE plan_type_new AS ENUM ('free', 'pro', 'ultra_pro');

-- Mettre à jour la table pour utiliser le nouveau type
ALTER TABLE profiles 
  ALTER COLUMN plan TYPE plan_type_new 
  USING plan::text::plan_type_new;

-- Supprimer l'ancien type
DROP TYPE plan_type;

-- Renommer le nouveau type
ALTER TYPE plan_type_new RENAME TO plan_type;