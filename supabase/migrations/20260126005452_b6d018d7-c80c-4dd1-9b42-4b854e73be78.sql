-- ============================================
-- FIX: Extension Auth Schema & Relations
-- Adds foreign key and refreshes PostgREST schema cache
-- ============================================

-- Add foreign key to profiles table (user_id must exist in profiles)
ALTER TABLE public.extension_auth_tokens
DROP CONSTRAINT IF EXISTS extension_auth_tokens_user_id_fkey;

ALTER TABLE public.extension_auth_tokens
ADD CONSTRAINT extension_auth_tokens_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_extension_auth_tokens_user_id 
ON public.extension_auth_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_extension_auth_tokens_token 
ON public.extension_auth_tokens(token) 
WHERE is_active = true;

-- Ensure RLS is enabled
ALTER TABLE public.extension_auth_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own tokens
DROP POLICY IF EXISTS "Users can view own tokens" ON public.extension_auth_tokens;
CREATE POLICY "Users can view own tokens" 
ON public.extension_auth_tokens 
FOR SELECT 
USING (auth.uid() = user_id);

-- RLS Policy: Service role can manage all tokens
DROP POLICY IF EXISTS "Service role full access" ON public.extension_auth_tokens;
CREATE POLICY "Service role full access" 
ON public.extension_auth_tokens 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';