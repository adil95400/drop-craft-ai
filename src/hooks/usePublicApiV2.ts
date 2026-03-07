import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function invokePublicApi(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("public-api-gateway", { body });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Unknown error");
  return data.data;
}

export function useOpenApiSpec() {
  return useQuery({
    queryKey: ["public-api-v2", "spec"],
    queryFn: () => invokePublicApi({ action: "openapi_spec" }),
    staleTime: Infinity,
  });
}

export function useApiUsageV2() {
  return useQuery({
    queryKey: ["public-api-v2", "usage"],
    queryFn: () => invokePublicApi({ action: "api_usage" }),
    refetchInterval: 30_000,
  });
}

export function useRateLimitsV2() {
  return useQuery({
    queryKey: ["public-api-v2", "rate-limits"],
    queryFn: () => invokePublicApi({ action: "rate_limits" }),
    staleTime: 300_000,
  });
}

export function usePublicApiProductsV2(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: ["public-api-v2", "products", params],
    queryFn: () => invokePublicApi({ action: "list_products", ...params }),
  });
}

export function usePublicApiOrdersV2(params?: { limit?: number; offset?: number; status?: string }) {
  return useQuery({
    queryKey: ["public-api-v2", "orders", params],
    queryFn: () => invokePublicApi({ action: "list_orders", ...params }),
  });
}

export function usePublicApiCustomersV2(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ["public-api-v2", "customers", params],
    queryFn: () => invokePublicApi({ action: "list_customers", ...params }),
  });
}
