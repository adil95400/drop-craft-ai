-- Tables pour le système de synchronisation et queue

-- Table pour les jobs de synchronisation
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('products', 'stock', 'orders')),
  supplier_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  last_sync TIMESTAMP WITH TIME ZONE,
  next_sync TIMESTAMP WITH TIME ZONE NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  auto_enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour la queue de tâches
CREATE TABLE IF NOT EXISTS queue_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('sync', 'import', 'export', 'webhook', 'email')),
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'retry')),
  priority INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table pour les logs de déduplication
CREATE TABLE IF NOT EXISTS deduplication_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reason TEXT NOT NULL CHECK (reason IN ('sku', 'ean', 'title_fuzzy', 'image_hash')),
  confidence DECIMAL(3,2) NOT NULL,
  selected_sku TEXT NOT NULL,
  discarded_skus TEXT[] NOT NULL,
  duplicate_count INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_sync_jobs_next_sync ON sync_jobs(next_sync) WHERE auto_enabled = true;
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_status_priority ON queue_jobs(status, priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_queue_jobs_scheduled ON queue_jobs(scheduled_for) WHERE status IN ('pending', 'retry');
CREATE INDEX IF NOT EXISTS idx_deduplication_logs_created_at ON deduplication_logs(created_at);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_jobs_updated_at BEFORE UPDATE ON sync_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_jobs_updated_at BEFORE UPDATE ON queue_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deduplication_logs ENABLE ROW LEVEL SECURITY;

-- Policy pour sync_jobs
CREATE POLICY "Users can manage their own sync jobs" ON sync_jobs
  FOR ALL USING (auth.uid() = user_id);

-- Policy pour queue_jobs (accessible par tous les utilisateurs authentifiés pour le moment)
CREATE POLICY "Authenticated users can access queue jobs" ON queue_jobs
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Policy pour deduplication_logs (lecture seule pour les utilisateurs)
CREATE POLICY "Users can view deduplication logs" ON deduplication_logs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Fonction pour nettoyer les anciens jobs
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS void AS $$
BEGIN
  -- Supprimer les jobs de queue terminés depuis plus de 7 jours
  DELETE FROM queue_jobs 
  WHERE status IN ('completed', 'failed') 
  AND completed_at < now() - INTERVAL '7 days';
  
  -- Supprimer les logs de déduplication anciens (plus de 30 jours)
  DELETE FROM deduplication_logs 
  WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;