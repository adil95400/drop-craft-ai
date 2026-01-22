-- Create auto_order_queue table for server-side order processing with retry
CREATE TABLE IF NOT EXISTS public.auto_order_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  supplier_type TEXT NOT NULL DEFAULT 'generic',
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  error_message TEXT,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auto_order_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own queue items"
  ON public.auto_order_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queue items"
  ON public.auto_order_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queue items"
  ON public.auto_order_queue FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all queue items"
  ON public.auto_order_queue FOR ALL
  USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_auto_order_queue_user_id ON public.auto_order_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_order_queue_status ON public.auto_order_queue(status);
CREATE INDEX IF NOT EXISTS idx_auto_order_queue_next_retry ON public.auto_order_queue(next_retry_at) WHERE status = 'retry';
CREATE INDEX IF NOT EXISTS idx_auto_order_queue_created_at ON public.auto_order_queue(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_auto_order_queue_updated_at
  BEFORE UPDATE ON public.auto_order_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();