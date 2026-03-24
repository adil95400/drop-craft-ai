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

export interface SyncLogEntry {
  id: string;
  supplier_name: string;
  sync_type: string;
  status: string;
  items_processed: number;
  items_failed: number;
  error_message: string | null;
  started_at: string;
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
      
      // Fetch suppliers
      const { data: suppliers, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error || !suppliers) return [];
      
      // Fetch scores
      const { data: scores } = await supabase
        .from('supplier_scores')
        .select('*')
        .eq('user_id', user.id);
      
      // Fetch connections
      const { data: connections } = await supabase
        .from('supplier_connections')
        .select('*')
        .eq('user_id', user.id);
      
      // Fetch product counts per supplier
      const { data: mappings } = await supabase
        .from('product_supplier_mapping')
        .select('supplier_id')
        .eq('user_id', user.id);
      
      const productCounts: Record<string, number> = {};
      mappings?.forEach(m => {
        const sid = (m as any).supplier_id;
        productCounts[sid] = (productCounts[sid] || 0) + 1;
      });
      
      const scoreMap = new Map(scores?.map(s => [s.supplier_id, s]) || []);
      const connMap = new Map(connections?.map(c => [(c as any).connector_id, c]) || []);
      
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
            id: (conn as any).id,
            connector_id: (conn as any).connector_id,
            status: (conn as any).status,
            last_sync_at: (conn as any).last_sync_at,
            sync_stats: (conn as any).sync_stats || {},
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
      
      // Get products with their supplier mappings
      const { data: products } = await supabase
        .from('products')
        .select('id, title, price, stock_quantity')
        .eq('user_id', user.id)
        .order('title')
        .limit(100);
      
      if (!products?.length) return [];
      
      const productIds = products.map(p => p.id);
      
      const { data: mappings } = await supabase
        .from('product_supplier_mapping')
        .select('*')
        .eq('user_id', user.id)
        .in('product_id', productIds);
      
      // Get supplier names
      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('user_id', user.id);
      
      const supplierNames = new Map(suppliers?.map(s => [s.id, s.name]) || []);
      
      const mappingsByProduct = new Map<string, any[]>();
      mappings?.forEach(m => {
        const pid = (m as any).product_id;
        if (!mappingsByProduct.has(pid)) mappingsByProduct.set(pid, []);
        mappingsByProduct.get(pid)!.push(m);
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

// Hook: Sync logs for monitoring
export function useSupplierSyncLogs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin-supplier-sync-logs', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data: logs } = await supabase
        .from('supplier_sync_logs')
        .select('*, suppliers(name)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(50);
      
      return (logs || []).map((l: any) => {
        const started = l.started_at ? new Date(l.started_at).getTime() : 0;
        const completed = l.completed_at ? new Date(l.completed_at).getTime() : 0;
        return {
          id: l.id,
          supplier_name: l.suppliers?.name || 'Inconnu',
          sync_type: l.sync_type || 'products',
          status: l.status || 'pending',
          items_processed: l.items_processed || 0,
          items_failed: l.items_failed || 0,
          error_message: l.error_message,
          started_at: l.started_at,
          completed_at: l.completed_at,
          duration_seconds: started && completed ? Math.round((completed - started) / 1000) : null,
        } as SyncLogEntry;
      });
    },
    enabled: !!user,
    staleTime: 15_000,
  });
}

// Hook: Supplier analytics (aggregated KPIs)
export function useSupplierAnalyticsKPIs() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['admin-supplier-kpis', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const [
        { count: totalSuppliers },
        { count: totalMappings },
        { data: syncLogs },
        { data: scores },
        { data: connections },
      ] = await Promise.all([
        supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('product_supplier_mapping').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('supplier_sync_logs').select('status').eq('user_id', user.id).gte('started_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('supplier_scores').select('overall_score').eq('user_id', user.id),
        supabase.from('supplier_connections').select('status').eq('user_id', user.id),
      ]);
      
      const syncTotal = syncLogs?.length || 0;
      const syncFailed = syncLogs?.filter(l => l.status === 'failed').length || 0;
      const avgScore = scores?.length ? scores.reduce((a, s) => a + Number(s.overall_score), 0) / scores.length : 0;
      const activeConnections = connections?.filter(c => (c as any).status === 'active').length || 0;
      const errorConnections = connections?.filter(c => (c as any).status === 'error').length || 0;
      
      return {
        totalSuppliers: totalSuppliers || 0,
        totalMappings: totalMappings || 0,
        syncSuccessRate: syncTotal > 0 ? Math.round(((syncTotal - syncFailed) / syncTotal) * 100) : 100,
        syncsLast24h: syncTotal,
        syncsFailed: syncFailed,
        avgSupplierScore: Math.round(avgScore * 100) / 100,
        activeConnections,
        errorConnections,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
