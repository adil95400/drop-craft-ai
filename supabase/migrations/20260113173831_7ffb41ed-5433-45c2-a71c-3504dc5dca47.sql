-- =============================================================================
-- SECURITY FIX: Profiles Table RLS Policies + API Keys Hashing
-- =============================================================================

-- PART 1: Fix Profiles Table RLS Policies
-- =========================================

-- Drop existing overly permissive SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to view all profiles" ON public.profiles;

-- Create restrictive policy: Users can only view their OWN profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create admin policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'));


-- PART 2: Secure API Keys with One-Way Hashing
-- =============================================

-- Ensure pgcrypto extension is available for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add key_hash column if it doesn't exist
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS key_hash TEXT;

-- Create unique index on key_hash for efficient lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_api_keys_hash ON public.api_keys(key_hash);

-- Create trigger function to hash API keys on insert
CREATE OR REPLACE FUNCTION public.hash_api_key_on_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Store the SHA256 hash of the full key
  NEW.key_hash := encode(digest(NEW.key, 'sha256'), 'hex');
  -- Truncate the stored key to just the prefix (first 12 chars) + masked suffix
  NEW.key := substring(NEW.key, 1, 12) || '...';
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS api_key_hash_trigger ON public.api_keys;

-- Create trigger to hash keys on insert
CREATE TRIGGER api_key_hash_trigger
BEFORE INSERT ON public.api_keys
FOR EACH ROW
EXECUTE FUNCTION public.hash_api_key_on_insert();

-- Migrate existing plain text keys (hash them and truncate)
UPDATE public.api_keys
SET 
  key_hash = encode(digest(key, 'sha256'), 'hex'),
  key = substring(key, 1, 12) || '...'
WHERE key_hash IS NULL 
  AND key NOT LIKE '%...';

-- Create validation function to check API keys by hash
CREATE OR REPLACE FUNCTION public.validate_api_key(input_key TEXT)
RETURNS TABLE(
  user_id UUID, 
  key_name TEXT,
  scopes TEXT[],
  is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  key_record RECORD;
BEGIN
  -- Find the key by its hash
  SELECT 
    ak.user_id,
    ak.name,
    ak.scopes,
    ak.is_active,
    ak.id
  INTO key_record
  FROM public.api_keys ak
  WHERE ak.key_hash = encode(digest(input_key, 'sha256'), 'hex')
    AND ak.is_active = true
    AND (ak.expires_at IS NULL OR ak.expires_at > now());
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Update last used timestamp
  UPDATE public.api_keys 
  SET last_used_at = now() 
  WHERE id = key_record.id;
  
  -- Return the key details
  RETURN QUERY SELECT 
    key_record.user_id, 
    key_record.name,
    key_record.scopes,
    key_record.is_active;
END;
$$;

-- Update generate_api_key function to return full key before hashing
-- The trigger will hash it on insert, but we return the full key to the user once
CREATE OR REPLACE FUNCTION public.generate_api_key(key_name text, key_scopes text[] DEFAULT '{}'::text[])
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_key TEXT;
  key_prefix TEXT;
  full_key TEXT;
BEGIN
  -- Generate a secure random key
  key_prefix := 'sk_' || substr(md5(random()::text), 1, 8);
  full_key := key_prefix || '_' || encode(gen_random_bytes(24), 'hex');
  
  -- Insert the key (trigger will hash it and truncate)
  INSERT INTO public.api_keys (user_id, name, key, key_prefix, scopes)
  VALUES (auth.uid(), key_name, full_key, key_prefix, key_scopes);
  
  -- Return the full key to the user (this is the only time they'll see it)
  RETURN full_key;
END;
$$;