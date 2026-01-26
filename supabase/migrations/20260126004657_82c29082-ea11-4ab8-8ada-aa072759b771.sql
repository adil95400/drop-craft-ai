-- Ajouter la colonne device_info manquante à extension_auth_tokens
ALTER TABLE public.extension_auth_tokens 
ADD COLUMN IF NOT EXISTS device_info JSONB DEFAULT '{}'::jsonb;