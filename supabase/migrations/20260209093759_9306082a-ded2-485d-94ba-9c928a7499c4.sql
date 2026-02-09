
-- Table import_job_items: résultats par ligne/produit pour chaque job d'import
CREATE TABLE public.import_job_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.background_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  row_number INT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'skipped')),
  raw_data JSONB,
  mapped_data JSONB,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_import_job_items_job_id ON public.import_job_items(job_id);
CREATE INDEX idx_import_job_items_user_id ON public.import_job_items(user_id);
CREATE INDEX idx_import_job_items_status ON public.import_job_items(status);
CREATE INDEX idx_import_job_items_job_status ON public.import_job_items(job_id, status);

-- Table import_uploads: sessions d'upload CSV
CREATE TABLE public.import_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT,
  file_size_bytes BIGINT,
  mime_type TEXT,
  has_header BOOLEAN DEFAULT true,
  delimiter TEXT DEFAULT ',',
  encoding TEXT DEFAULT 'utf-8',
  columns TEXT[],
  sample_rows JSONB,
  columns_signature TEXT,
  suggested_mapping JSONB,
  matching_presets JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploaded', 'analyzed', 'expired')),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '1 hour'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_uploads_user_id ON public.import_uploads(user_id);

-- RLS pour import_job_items
ALTER TABLE public.import_job_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own job items"
  ON public.import_job_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job items"
  ON public.import_job_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job items"
  ON public.import_job_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job items"
  ON public.import_job_items FOR DELETE
  USING (auth.uid() = user_id);

-- RLS pour import_uploads
ALTER TABLE public.import_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uploads"
  ON public.import_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own uploads"
  ON public.import_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads"
  ON public.import_uploads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
  ON public.import_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger updated_at
CREATE TRIGGER update_import_job_items_updated_at
  BEFORE UPDATE ON public.import_job_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_import_uploads_updated_at
  BEFORE UPDATE ON public.import_uploads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime pour le suivi en temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_job_items;
