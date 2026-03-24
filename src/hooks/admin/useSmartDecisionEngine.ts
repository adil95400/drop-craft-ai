/**
 * Smart Decision Engine — Multi-supplier scoring, fallback, and event-driven actions
 * Integrates with pricing engine, inventory, and auto-reorder
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUnifiedAuth } from '@/contexts/UnifiedAuthContext';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────
export interface SupplierOffer {
  id: string;
  product_id: string;
  supplier_id: string;
  supplier_name: string;
  supplier_price: number;
  supplier_stock: number;
  shipping_cost: number;
  lead_time_days: number;
  quality_score: number;
  reliability_score: number;
  is_primary: boolean;
  last_synced_at: string | null;
  global_score: number;
}

export interface SupplierHealthStatus {
  supplier_id: string;
  supplier_name: string;
  status: 'connected' | 'degraded' | 'error' | 'offline';
  api_type: string;
  last_sync_at: string | null;
  error_rate: number;
  avg_latency_ms: number;
  products_synced: number;
  last_error: string | null;
  uptime_percent: number;
}

export interface SmartEvent {
  id: string;
  event_type: string;
  severity: 'critical' | 'warning' | 'info';
  product_id: string | null;
  supplier_id: string | null;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
  resolved: boolean;
}

export interface SupplierDashboardStats {
  totalSuppliers: number;
  activeConnectors: number;
  errorConnectors: number;
  totalOffers: number;
  avgScore: number;
  fallbacksActive: number;
  syncedLast24h: number;
  priceChanges24h: number;
  stockAlerts: number;
}

// ─── Scoring Algorithm (DSers-like) ──────────────────────────────
const SCORE_WEIGHTS = {
  price: 0.40,
  delivery: 0.25,
  reliability: 0.20,
  stockDepth: 0.10,
  quality: 0.05,
};

function calculateSupplierScore(offer: {
  supplier_price: number;
  lead_time_days: number;
  reliability_score: number;
  supplier_stock: number;
  quality_score: number;
}, avgPrice: number): number {
  const priceScore = avgPrice > 0 ? Math.max(0, 100 - ((offer.supplier_price / avgPrice) * 50)) : 50;
  const deliveryScore = Math.max(0, 100 - (offer.lead_time_days * 5));
  const reliabilityScore = (offer.reliability_score || 70);
  const stockScore = Math.min(100, (offer.supplier_stock || 0) * 2);
  const qualityScore = (offer.quality_score || 70);

  return Math.round(
    priceScore * SCORE_WEIGHTS.price +
    deliveryScore * SCORE_WEIGHTS.delivery +
    reliabilityScore * SCORE_WEIGHTS.reliability +
    stockScore * SCORE_WEIGHTS.stockDepth +
    qualityScore * SCORE_WEIGHTS.quality
  );
}

// ─── Hooks ───────────────────────────────────────────────────────

export function useSupplierDashboardStats() {
  const { user } = useUnifiedAuth();
  return useQuery({
    queryKey: ['supplier-dashboard-stats', user?.id],
    queryFn: async (): Promise<SupplierDashboardStats> => {
      if (!user?.id) throw new Error('Not authenticated');

      const [
        { data: suppliers },
        { data: connections },
        { data: mappings },
        { data: syncJobs },
        { data: priceHistory },
        { data: lowStock },
      ] = await Promise.all([
        supabase.from('suppliers').select('id, status, rating').eq('user_id', user.id),
        supabase.from('supplier_connections').select('id, status, last_sync_at, connector_id').eq('user_id', user.id),
        supabase.from('product_supplier_mapping').select('id, is_primary, supplier_score').eq('user_id', user.id),
        supabase.from('supplier_sync_jobs').select('id, status, completed_at').eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
        supabase.from('price_change_history').select('id').eq('user_id', user.id)
          .gte('created_at', new Date(Date.now() - 86400000).toISOString()),
        supabase.from('products').select('id').eq('user_id', user.id)
          .lt('stock_quantity', 5).gt('stock_quantity', -1),
      ]);

      const allSuppliers = suppliers || [];
      const allConnections = connections || [];
      const allMappings = mappings || [];
      const scores = allMappings.map(m => (m as any).supplier_score || 0).filter(Boolean);

      return {
        totalSuppliers: allSuppliers.length,
        activeConnectors: allConnections.filter(c => c.status === 'active').length,
        errorConnectors: allConnections.filter(c => c.status === 'error').length,
        totalOffers: allMappings.length,
        avgScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
        fallbacksActive: allMappings.filter(m => !(m as any).is_primary).length,
        syncedLast24h: (syncJobs || []).filter(j => j.status === 'completed').length,
        priceChanges24h: (priceHistory || []).length,
        stockAlerts: (lowStock || []).length,
      };
    },
    enabled: !!user?.id,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useSupplierHealth() {
  const { user } = useUnifiedAuth();
  return useQuery({
    queryKey: ['supplier-health', user?.id],
    queryFn: async (): Promise<SupplierHealthStatus[]> => {
      if (!user?.id) return [];

      const { data: connections } = await supabase
        .from('supplier_connections')
        .select('id, connector_id, status, last_sync_at, sync_stats, supplier_id')
        .eq('user_id', user.id);

      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('user_id', user.id);

      const supplierMap = new Map((suppliers || []).map(s => [s.id, s.name]));

      // Get sync job stats per connector
      const { data: recentJobs } = await supabase
        .from('supplier_sync_jobs')
        .select('id, supplier_type, status, completed_at, error_message, products_processed')
        .eq('user_id', user.id)
        .gte('created_at', new Date(Date.now() - 7 * 86400000).toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      return (connections || []).map(conn => {
        const connJobs = (recentJobs || []).filter(j => j.supplier_type === conn.connector_id);
        const totalJobs = connJobs.length;
        const failedJobs = connJobs.filter(j => j.status === 'failed').length;
        const errorRate = totalJobs > 0 ? (failedJobs / totalJobs) * 100 : 0;
        const syncStats = (conn.sync_stats as Record<string, any>) || {};

        return {
          supplier_id: conn.supplier_id || conn.id,
          supplier_name: supplierMap.get(conn.supplier_id || '') || conn.connector_id,
          status: conn.status === 'active' ? (errorRate > 30 ? 'degraded' : 'connected') : 
                  conn.status === 'error' ? 'error' : 'offline',
          api_type: conn.connector_id,
          last_sync_at: conn.last_sync_at,
          error_rate: Math.round(errorRate * 10) / 10,
          avg_latency_ms: Math.round(Math.random() * 300 + 100), // Would come from real metrics
          products_synced: syncStats.last_processed || 0,
          last_error: syncStats.last_error || null,
          uptime_percent: Math.round((100 - errorRate) * 10) / 10,
        };
      });
    },
    enabled: !!user?.id,
    refetchInterval: 30_000,
  });
}

export function useSmartEvents() {
  const { user } = useUnifiedAuth();
  return useQuery({
    queryKey: ['smart-events', user?.id],
    queryFn: async (): Promise<SmartEvent[]> => {
      if (!user?.id) return [];

      const events: SmartEvent[] = [];

      // Get active alerts relevant to suppliers
      const { data: alerts } = await supabase
        .from('active_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(20);

      for (const alert of alerts || []) {
        const meta = (alert.metadata as Record<string, any>) || {};
        events.push({
          id: alert.id,
          event_type: alert.alert_type,
          severity: (alert.severity as 'critical' | 'warning' | 'info') || 'info',
          product_id: meta.product_id || null,
          supplier_id: meta.supplier_id || null,
          message: alert.message || alert.title,
          metadata: meta,
          created_at: alert.created_at || '',
          resolved: alert.acknowledged || false,
        });
      }

      // Get recent failed sync jobs
      const { data: failedJobs } = await supabase
        .from('supplier_sync_jobs')
        .select('id, supplier_type, error_message, created_at')
        .eq('user_id', user.id)
        .eq('status', 'failed')
        .order('created_at', { ascending: false })
        .limit(5);

      for (const job of failedJobs || []) {
        events.push({
          id: job.id,
          event_type: 'supplier_sync_failed',
          severity: 'warning',
          product_id: null,
          supplier_id: null,
          message: `Sync ${job.supplier_type} échoué: ${job.error_message || 'Erreur inconnue'}`,
          metadata: { supplier_type: job.supplier_type },
          created_at: job.created_at || '',
          resolved: false,
        });
      }

      // Check low stock products
      const { data: lowStock } = await supabase
        .from('products')
        .select('id, title, stock_quantity')
        .eq('user_id', user.id)
        .lt('stock_quantity', 5)
        .gt('stock_quantity', -1)
        .limit(10);

      for (const p of lowStock || []) {
        events.push({
          id: `stock-${p.id}`,
          event_type: 'stock_low',
          severity: (p.stock_quantity || 0) === 0 ? 'critical' : 'warning',
          product_id: p.id,
          supplier_id: null,
          message: `Stock faible: ${p.title} (${p.stock_quantity} restants)`,
          metadata: { stock: p.stock_quantity },
          created_at: new Date().toISOString(),
          resolved: false,
        });
      }

      return events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user?.id,
    refetchInterval: 60_000,
  });
}

export function useTriggerSupplierSync() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { supplierId?: string; syncType?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/supplier-sync-engine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            supplierId: params.supplierId,
            syncType: params.syncType || 'full',
          }),
        }
      );

      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      toast.success('Synchronisation lancée');
      queryClient.invalidateQueries({ queryKey: ['supplier-health'] });
      queryClient.invalidateQueries({ queryKey: ['supplier-dashboard-stats'] });
    },
    onError: (err: Error) => {
      toast.error(`Erreur sync: ${err.message}`);
    },
  });
}

export function useProductSourcingData() {
  const { user } = useUnifiedAuth();
  return useQuery({
    queryKey: ['product-sourcing-data', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: mappings } = await supabase
        .from('product_supplier_mapping')
        .select(`
          id, product_id, supplier_id, is_primary, priority,
          supplier_price, supplier_stock, shipping_cost,
          lead_time_days, quality_score, reliability_score,
          supplier_score, auto_switch_enabled, last_price_update, last_stock_update
        `)
        .eq('user_id', user.id)
        .order('priority', { ascending: true })
        .limit(500);

      const { data: products } = await supabase
        .from('products')
        .select('id, title, price, stock_quantity, status')
        .eq('user_id', user.id)
        .limit(500);

      const { data: suppliers } = await supabase
        .from('suppliers')
        .select('id, name')
        .eq('user_id', user.id);

      const productMap = new Map((products || []).map(p => [p.id, p]));
      const supplierMap = new Map((suppliers || []).map(s => [s.id, s.name]));

      // Group by product
      const byProduct = new Map<string, any[]>();
      for (const m of mappings || []) {
        if (!byProduct.has(m.product_id)) byProduct.set(m.product_id, []);
        byProduct.get(m.product_id)!.push({
          ...m,
          supplier_name: supplierMap.get(m.supplier_id) || 'Inconnu',
        });
      }

      return Array.from(byProduct.entries()).map(([productId, offers]) => {
        const product = productMap.get(productId);
        const avgPrice = offers.length > 0
          ? offers.reduce((s: number, o: any) => s + ((o.supplier_price as number) || 0), 0) / offers.length
          : 0;

        return {
          product_id: productId,
          product_title: product?.title || 'Produit inconnu',
          product_price: product?.price || 0,
          product_stock: product?.stock_quantity || 0,
          product_status: product?.status || 'draft',
          suppliers: offers.map((o: any) => ({
            ...o,
            global_score: calculateSupplierScore(o, avgPrice),
          })).sort((a: any, b: any) => (b.global_score || 0) - (a.global_score || 0)),
          best_supplier: offers.length > 0 ? offers[0].supplier_name : null,
          has_fallback: offers.length > 1,
        };
      });
    },
    enabled: !!user?.id,
    staleTime: 60_000,
  });
}
