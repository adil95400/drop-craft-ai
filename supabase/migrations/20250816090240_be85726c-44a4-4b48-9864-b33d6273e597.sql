-- Fix the policy conflict and continue security fixes

-- 5. Secure the API cache table - fix existing policies
DROP POLICY IF EXISTS "Service role can manage API cache" ON public.api_cache;
DROP POLICY IF EXISTS "API cache is publicly readable" ON public.api_cache;

CREATE POLICY "Authenticated users can read API cache"
ON public.api_cache
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can manage API cache"
ON public.api_cache
FOR ALL
TO service_role
USING (true);

-- 6. Add rate limiting to newsletter table (check if columns exist first)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='newsletters' AND column_name='ip_address') THEN
        ALTER TABLE public.newsletters ADD COLUMN ip_address text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='newsletters' AND column_name='created_at_date') THEN
        ALTER TABLE public.newsletters ADD COLUMN created_at_date date DEFAULT CURRENT_DATE;
    END IF;
END
$$;

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_newsletters_ip_date 
ON public.newsletters(ip_address, created_at_date);

-- 7. Add newsletter rate limiting policy
CREATE POLICY "Rate limited newsletter signup"
ON public.newsletters
FOR INSERT
TO anon
WITH CHECK (
  -- Allow max 3 signups per IP per day
  (SELECT COUNT(*) FROM public.newsletters 
   WHERE ip_address = NEW.ip_address 
   AND created_at_date = CURRENT_DATE) < 3
);