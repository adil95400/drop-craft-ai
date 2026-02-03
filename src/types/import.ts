/**
 * Types centralisés pour le module d'import
 * Remplace les types de useImportUltraPro (deprecated)
 */

export interface ImportedProduct {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  cost_price?: number | null;
  compare_at_price?: number | null;
  sku?: string | null;
  category?: string | null;
  brand?: string | null;
  image_url?: string | null;
  image_urls?: string[] | null;
  stock_quantity?: number | null;
  status: 'draft' | 'published' | 'archived';
  review_status?: 'pending' | 'approved' | 'rejected' | null;
  ai_optimized?: boolean | null;
  import_quality_score?: number | null;
  source_url?: string | null;
  source_platform?: string | null;
  user_id?: string | null;
  created_at: string;
  updated_at?: string | null;
  supplier_name?: string | null;
  supplier_sku?: string | null;
  supplier_price?: number | null;
  supplier_url?: string | null;
  weight?: number | null;
  weight_unit?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  tags?: string[] | null;
  currency?: string | null;
}

export interface ScheduledImport {
  id: string;
  name: string;
  source_type: string;
  schedule: string;
  is_active: boolean;
  last_run_at?: string | null;
  next_run_at?: string | null;
  created_at: string;
}

export interface AIJob {
  id: string;
  job_type: string;
  status: string;
  target_id?: string | null;
  created_at: string;
  completed_at?: string | null;
}
