
-- Extend mapping_presets to match API v1 contract
ALTER TABLE public.mapping_presets
  ADD COLUMN IF NOT EXISTS platform text NOT NULL DEFAULT 'generic',
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS store_id uuid NULL,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS columns_signature text NULL,
  ADD COLUMN IF NOT EXISTS columns text[] NULL,
  ADD COLUMN IF NOT EXISTS delimiter text NOT NULL DEFAULT ',',
  ADD COLUMN IF NOT EXISTS encoding text NOT NULL DEFAULT 'utf-8',
  ADD COLUMN IF NOT EXISTS has_header boolean NOT NULL DEFAULT true;

-- Index for fast preset lookup by platform + store
CREATE INDEX IF NOT EXISTS idx_mapping_presets_platform ON public.mapping_presets(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_mapping_presets_store ON public.mapping_presets(user_id, store_id) WHERE store_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mapping_presets_signature ON public.mapping_presets(columns_signature) WHERE columns_signature IS NOT NULL;
