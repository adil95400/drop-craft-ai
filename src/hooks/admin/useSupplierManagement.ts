/**
 * useSupplierManagement - Admin hooks for supplier management center
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SupplierOverview {
  id: string;
  name: string;
  status: string;
  country: string | null;
  rating: number;
  tier: string;
  total_orders: number;
  avg_delivery_days: number | null;
  return_rate: number;
  last_sync_at: string | null;
  logo_url: string | null;
  description: string | null;
  products_count: number;
  score: SupplierScore | null;
  connection: SupplierConnectionInfo | null;
}

export interface SupplierScore {
  overall_score: number;
  price_score: number;
  delivery_score: number;
  reliability_score: number;
  quality_score: number;
  recommendation: string;
}

export interface SupplierConnectionInfo {
  id: string;
  connector_id: string;
  status: string;
  last_sync_at: string | null;
  sync_stats: Record<string, any>;
}

export interface ProductSourcingMap {
  product_id: string;
  product_title: string;
  product_price: number;
  product_stock: number;
  suppliers: ProductSupplierLink[];
}

export interface ProductSupplierLink {
  mapping_id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_sku: string | null;
  supplier_price: number;
  supplier_stock: number;
  is_primary: boolean;
  priority: number;
  lead_time_days: number | null;
  auto_switch_enabled: boolean;
  margin: number;
}

export interface SyncJobEntry {
  id: string;
  supplier_name: string;
  supplier_type: string;
  job_type: string;
  status: string;
  products_processed: number;
  products_created: number;
  products_updated: number;
  products_failed: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
}

// Hook: Supplier overview list with scores and connections
export function useSupplierOverview() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin-supplier-overview', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const [suppRes, scoreRes, connRes, mapRes] = await Promise.all([
        supabase.from('suppliers').select('*').eq('user_id', user.id).order('name'),
        supabase.from('supplier_scores').select('*').eq('user_id', user.id),
        supabase.from('supplier_connections').select('*').eq('user_id', user.id),
        supabase.from('product_supplier_mapping').select('supplier_id').eq('user_id', user.id),
      ]);
      
      const suppliers = suppRes.data || [];
      const productCounts: Record<string, number> = {};
      mapRes.data?.forEach((m: any) => {
        productCounts[m.supplier_id] = (productCounts[m.supplier_id] || 0) + 1;
      });
      
      const scoreMap = new Map((scoreRes.data || []).map(s => [s.supplier_id, s]));
      const connMap = new Map((connRes.data || []).map((c: any) => [c.connector_id, c]));
      
      return suppliers.map(s => {
        const score = scoreMap.get(s.id);
        const conn = connMap.get(s.code || s.name?.toLowerCase());
        return {
          id: s.id,
          name: s.name,
          status: s.status || 'active',
          country: s.country,
          rating: Number(s.rating) || 0,
          tier: s.tier || 'standard',
          total_orders: s.total_orders || 0,
          avg_delivery_days: s.avg_delivery_days,
          return_rate: Number(s.return_rate) || 0,
          last_sync_at: s.last_sync_at,
          logo_url: s.logo_url,
          description: s.description,
          products_count: productCounts[s.id] || 0,
          score: score ? {
            overall_score: Number(score.overall_score),
            price_score: Number(score.price_score),
            delivery_score: Number(score.delivery_score),
            reliability_score: Number(score.reliability_score),
            quality_score: Number(score.quality_score),
            recommendation: score.recommendation || 'neutral',
          } : null,
          connection: conn ? {
            id: conn.id,
            connector_id: conn.connector_id,
            status: conn.status,
            last_sync_at: conn.last_sync_at,
            sync_stats: conn.sync_stats || {},
          } : null,
        } as SupplierOverview;
      });
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

// Hook: Product sourcing map (multi-supplier per product)
export function useProductSourcingMap() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin-product-sourcing', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: products } = await supabase
        .from('products')
        .select('id, title, price, stock_quantity')
        .eq('user_id', user.id)
        .order('title')
        .limit(100);
      
      if (!products?.length) return [];
      
      const productIds = products.map(p => p.id);
      
      const [mapRes, suppRes] = await Promise.all([
        supabase.from('product_supplier_mapping').select('*').eq('user_id', user.id).in('product_id', productIds),
        supabase.from('suppliers').select('id, name').eq('user_id', user.id),
      ]);
      
      const supplierNames = new Map((suppRes.data || []).map(s => [s.id, s.name]));
      const mappingsByProduct = new Map<string, any[]>();
      (mapRes.data || []).forEach((m: any) => {
        if (!mappingsByProduct.has(m.product_id)) mappingsByProduct.set(m.product_id, []);
        mappingsByProduct.get(m.product_id)!.push(m);
      });
      
      return products
        .filter(p => mappingsByProduct.has(p.id))
        .map(p => ({
          product_id: p.id,
          product_title: p.title || 'Sans titre',
          product_price: Number(p.price) || 0,
          product_stock: p.stock_quantity || 0,
          suppliers: (mappingsByProduct.get(p.id) || [])
            .sort((a: any, b: any) => (a.priority || 0) - (b.priority || 0))
            .map((m: any) => ({
              mapping_id: m.id,
              supplier_id: m.supplier_id,
              supplier_name: supplierNames.get(m.supplier_id) || 'Inconnu',
              supplier_sku: m.supplier_sku,
              supplier_price: Number(m.supplier_price) || 0,
              supplier_stock: m.supplier_stock || 0,
              is_primary: m.is_primary || false,
              priority: m.priority || 0,
              lead_time_days: m.lead_time_days,
              auto_switch_enabled: m.auto_switch_enabled ?? true,
              margin: p.price && m.supplier_price 
                ? Math.round(((Number(p.price) - Number(m.supplier_price)) / Number(p.price)) * 100) 
                : 0,
            })),
        })) as ProductSourcingMap[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}

// Hook: Sync jobs for monitoring
export function useSupplierSyncJobs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin-supplier-sync-jobs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: jobs } = await supabase
        .from('supplier_sync_jobs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      // Get supplier names
      const supplierIds = [...new Set((jobs || []).map(j => j.supplier_id).filter(Boolean))];
      const { data: suppliers } = supplierIds.length
        ? await supabase.from('suppliers').select('id, name').in('id', supplierIds as string[])
        : { data: [] };
      
      const nameMap = new Map((suppliers || []).map(s => [s.id, s.name]));
      
      return (jobs || []).map(j => {
        const started = j.started_at ? new Date(j.started_at).getTime() : 0;
        const completed = j.completed_at ? new Date(j.completed_at).getTime() : 0;
        return {
          id: j.id,
          supplier_name: nameMap.get(j.supplier_id || '') || j.supplier_type || 'Inconnu',
          supplier_type: j.supplier_type,
          job_type: j.job_type,
          status: j.status,
          products_processed: j.products_processed || 0,
          products_created: j.products_created || 0,
          products_updated: j.products_updated || 0,
          products_failed: j.products_failed || 0,
          error_message: j.error_message,
          started_at: j.started_at,
          completed_at: j.completed_at,
          duration_seconds: started && completed ? Math.round((completed - started) / 1000) : null,
        } as SyncJobEntry;
      });
    },
    enabled: !!user,
    staleTime: 15_000,
  });
}

// Hook: Supplier KPIs
export function useSupplierAnalyticsKPIs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin-supplier-kpis', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [suppRes, mapRes, jobsRes, scoreRes, connRes] = await Promise.all([
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('product_supplier_mapping').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('supplier_sync_jobs').select('status').eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('supplier_scores').select('overall_score').eq('user_id', user.id),
        supabase.from('supplier_connections').select('status').eq('user_id', user.id),
      ]);
      
      const syncTotal = jobsRes.data?.length || 0;
      const syncFailed = jobsRes.data?.filter(l => l.status === 'failed').length || 0;
      const avgScore = scoreRes.data?.length 
        ? scoreRes.data.reduce((a, s) => a + Number(s.overall_score), 0) / scoreRes.data.length 
        : 0;
      const activeConns = connRes.data?.filter((c: any) => c.status === 'active').length || 0;
      const errorConns = connRes.data?.filter((c: any) => c.status === 'error').length || 0;
      
      return {
        totalSuppliers: suppRes.count || 0,
        totalMappings: mapRes.count || 0,
        syncSuccessRate: syncTotal > 0 ? Math.round(((syncTotal - syncFailed) / syncTotal) * 100) : 100,
        syncsLast24h: syncTotal,
        syncsFailed: syncFailed,
        avgSupplierScore: Math.round(avgScore * 100) / 100,
        activeConnections: activeConns,
        errorConnections: errorConns,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
