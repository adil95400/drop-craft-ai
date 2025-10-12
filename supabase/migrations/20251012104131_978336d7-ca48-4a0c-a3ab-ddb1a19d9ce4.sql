-- Only create tenant_users if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_users') THEN
    CREATE TABLE public.tenant_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
      permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
      invited_by UUID REFERENCES auth.users(id),
      joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE(tenant_id, user_id)
    );
    
    ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view tenant members" ON public.tenant_users;
DROP POLICY IF EXISTS "Tenant owners can manage members" ON public.tenant_users;

CREATE POLICY "Users can view tenant members"
  ON public.tenant_users FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = tenant_users.tenant_id AND owner_id = auth.uid()
    )
  );

CREATE POLICY "Tenant owners can manage members"
  ON public.tenant_users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.tenants
      WHERE id = tenant_users.tenant_id AND owner_id = auth.uid()
    )
  );

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenant_users_tenant') THEN
    CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tenant_users_user') THEN
    CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);
  END IF;
END $$;