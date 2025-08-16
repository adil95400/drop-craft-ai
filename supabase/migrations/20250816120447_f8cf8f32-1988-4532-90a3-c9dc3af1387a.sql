-- Étape 2: Mettre à jour toutes les entrées existantes de 'standard' vers 'free'
UPDATE profiles SET plan = 'free' WHERE plan = 'standard';