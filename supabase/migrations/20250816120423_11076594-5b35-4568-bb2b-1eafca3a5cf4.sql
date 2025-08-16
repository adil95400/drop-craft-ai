-- Approche en plusieurs étapes pour mettre à jour le type plan_type

-- Étape 1: Ajouter la nouvelle valeur 'free' à l'enum existant
ALTER TYPE plan_type ADD VALUE 'free';