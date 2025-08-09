-- Créer seulement les nouvelles tables pour le système d'import

-- Table des imports de produits
CREATE TABLE public.product_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  import_type TEXT NOT NULL CHECK (import_type IN ('csv', 'url', 'api', 'xml', 'image', 'extension')),
  source_name TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  products_imported INTEGER DEFAULT 0,
  products_failed INTEGER DEFAULT 0,
  total_products INTEGER DEFAULT 0,
  import_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des produits importés
CREATE TABLE public.imported_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES public.product_imports(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  sku TEXT,
  category TEXT,
  supplier_name TEXT,
  supplier_url TEXT,
  image_urls TEXT[],
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'rejected')),
  ai_optimized BOOLEAN DEFAULT false,
  optimization_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.product_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_products ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour product_imports
CREATE POLICY "Users can view their own imports" 
ON public.product_imports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imports" 
ON public.product_imports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imports" 
ON public.product_imports 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Politiques RLS pour imported_products
CREATE POLICY "Users can view their own imported products" 
ON public.imported_products 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own imported products" 
ON public.imported_products 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own imported products" 
ON public.imported_products 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own imported products" 
ON public.imported_products 
FOR DELETE 
USING (auth.uid() = user_id);

-- Triggers pour les timestamps
CREATE TRIGGER update_product_imports_updated_at
  BEFORE UPDATE ON public.product_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_imported_products_updated_at
  BEFORE UPDATE ON public.imported_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour les performances
CREATE INDEX idx_product_imports_user_id ON public.product_imports(user_id);
CREATE INDEX idx_product_imports_status ON public.product_imports(status);
CREATE INDEX idx_imported_products_user_id ON public.imported_products(user_id);
CREATE INDEX idx_imported_products_import_id ON public.imported_products(import_id);