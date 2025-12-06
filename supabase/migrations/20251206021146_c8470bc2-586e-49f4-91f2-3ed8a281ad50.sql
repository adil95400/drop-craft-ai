-- Mettre à jour les credentials BTS Wholesaler avec les paramètres du feed API
UPDATE supplier_credentials_vault 
SET oauth_data = jsonb_set(
  COALESCE(oauth_data, '{}'::jsonb),
  '{user_id_bts}',
  '"908383"'
) || 
  jsonb_build_object(
    'password', 'Adil1979@@',
    'language', 'fr-FR',
    'format', 'csv',
    'feed_url', 'https://www.btswholesaler.com/generatefeedbts'
  ),
  updated_at = now()
WHERE supplier_id = '34997271-66ee-492a-ac16-f5bf8eb0c37a';