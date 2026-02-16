
-- Sprint 14: Team Management + Store-Team Access
-- (stores table already exists)

-- 1. Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id UUID NOT NULL,
  member_email TEXT NOT NULL,
  member_user_id UUID,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  store_ids UUID[] DEFAULT '{}',
  permissions JSONB DEFAULT '{"products": true, "orders": true, "analytics": false, "settings": false}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(owner_user_id, member_email)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage team members"
  ON public.team_members FOR ALL
  USING (auth.uid() = owner_user_id)
  WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Members can view their invitations"
  ON public.team_members FOR SELECT
  USING (member_user_id = auth.uid() OR member_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- 2. Store-team access mapping
CREATE TABLE IF NOT EXISTS public.store_team_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  team_member_id UUID NOT NULL REFERENCES public.team_members(id) ON DELETE CASCADE,
  can_edit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, team_member_id)
);

ALTER TABLE public.store_team_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Store owners can manage access"
  ON public.store_team_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.stores s 
      WHERE s.id = store_id AND s.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_owner ON public.team_members(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON public.team_members(member_user_id);
CREATE INDEX IF NOT EXISTS idx_store_team_access_store ON public.store_team_access(store_id);

-- Updated_at trigger
CREATE TRIGGER update_team_members_updated_at
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
