import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FulfillmentOrder {
  id: string;
  user_id: string;
  store_order_id: string;
  store_platform: string;
  store_integration_id?: string;
  supplier_id?: string;
  supplier_name?: string;
  supplier_order_id?: string;
  customer_name?: string;
  customer_email?: string;
  shipping_address?: Record<string, unknown>;
  order_items: Array<{
    product_id: string;
    sku: string;
    title: string;
    quantity: number;
    price: number;
    supplier_id?: string;
    supplier_sku?: string;
    cost_price?: number;
  }>;
  total_amount?: number;
  currency: string;
  cost_price?: number;
  profit_margin?: number;
  status: string;
  fulfillment_status?: string;
  tracking_number?: string;
  tracking_url?: string;
  carrier?: string;
  shipped_at?: string;
  delivered_at?: string;
  error_message?: string;
  retry_count: number;
  last_retry_at?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  rule_id?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface FulfillmentEvent {
  id: string;
  user_id: string;
  fulfillment_order_id: string;
  event_type: string;
  event_status: string;
  event_data?: Record<string, unknown>;
  error_details?: string;
  source?: string;
  duration_ms?: number;
  created_at: string;
}

export interface FulfillmentStats {
  total: number;
  pending: number;
  processing: number;
  confirmed: number;
  shipped: number;
  delivered: number;
  failed: number;
  cancelled: number;
  todayOrders: number;
  successRate: number;
  totalRevenue: number;
  totalProfit: number;
}

export function useFulfillmentOrders(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
}) {
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error, refetch } = useQuery({
    queryKey: ["fulfillment-orders", filters],
    queryFn: async () => {
      let query = supabase
        .from("auto_fulfillment_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters?.dateFrom) {
        query = query.gte("created_at", filters.dateFrom);
      }

      if (filters?.dateTo) {
        query = query.lte("created_at", filters.dateTo);
      }

      if (filters?.search) {
        query = query.or(
          `store_order_id.ilike.%${filters.search}%,customer_name.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%,tracking_number.ilike.%${filters.search}%`
        );
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FulfillmentOrder[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["fulfillment-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auto_fulfillment_orders")
        .select("status, total_amount, profit_margin, created_at");

      if (error) throw error;

      const today = new Date().toISOString().split("T")[0];
      const todayOrders = data?.filter(
        (o) => o.created_at?.startsWith(today)
      ).length || 0;

      const statusCounts = (data || []).reduce(
        (acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      const completed = (statusCounts.delivered || 0) + (statusCounts.shipped || 0);
      const total = data?.length || 0;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const totalRevenue = data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
      const totalProfit = data?.reduce((sum, o) => sum + (o.profit_margin || 0), 0) || 0;

      return {
        total,
        pending: statusCounts.pending || 0,
        processing: statusCounts.processing || 0,
        confirmed: statusCounts.confirmed || 0,
        shipped: statusCounts.shipped || 0,
        delivered: statusCounts.delivered || 0,
        failed: statusCounts.failed || 0,
        cancelled: statusCounts.cancelled || 0,
        todayOrders,
        successRate,
        totalRevenue,
        totalProfit,
      } as FulfillmentStats;
    },
  });

  const processOrder = useMutation({
    mutationFn: async (order: Partial<FulfillmentOrder>) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("auto-fulfillment-processor", {
        body: { action: "process_order", order },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      queryClient.invalidateQueries({ queryKey: ["fulfillment-stats"] });
      toast.success("Order processed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to process order: ${error.message}`);
    },
  });

  const retryOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("auto-fulfillment-processor", {
        body: { action: "retry_order", orderId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      toast.success("Order retry initiated");
    },
    onError: (error) => {
      toast.error(`Failed to retry order: ${error.message}`);
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("auto-fulfillment-processor", {
        body: { action: "cancel_order", orderId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      queryClient.invalidateQueries({ queryKey: ["fulfillment-stats"] });
      toast.success("Order cancelled");
    },
    onError: (error) => {
      toast.error(`Failed to cancel order: ${error.message}`);
    },
  });

  const syncTracking = useMutation({
    mutationFn: async (orderId?: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("tracking-sync", {
        body: { action: orderId ? "sync_order" : "sync_all", orderId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      toast.success(`Tracking synced: ${data.synced || 0} orders updated`);
    },
    onError: (error) => {
      toast.error(`Failed to sync tracking: ${error.message}`);
    },
  });

  const injectTracking = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("tracking-sync", {
        body: { action: "inject_to_store", orderId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-orders"] });
      toast.success("Tracking injected to store");
    },
    onError: (error) => {
      toast.error(`Failed to inject tracking: ${error.message}`);
    },
  });

  return {
    orders: orders || [],
    stats: stats || {
      total: 0,
      pending: 0,
      processing: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      failed: 0,
      cancelled: 0,
      todayOrders: 0,
      successRate: 0,
      totalRevenue: 0,
      totalProfit: 0,
    },
    isLoading,
    error,
    refetch,
    processOrder,
    retryOrder,
    cancelOrder,
    syncTracking,
    injectTracking,
  };
}

export function useFulfillmentEvents(orderId: string) {
  return useQuery({
    queryKey: ["fulfillment-events", orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillment_events")
        .select("*")
        .eq("fulfillment_order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FulfillmentEvent[];
    },
    enabled: !!orderId,
  });
}
