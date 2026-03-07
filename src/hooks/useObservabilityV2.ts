import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function invokeObservability(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("observability-metrics", { body });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Unknown error");
  return data.data;
}

export function useSystemHealthV2() {
  return useQuery({
    queryKey: ["observability-v2", "health"],
    queryFn: () => invokeObservability({ action: "system_health" }),
    refetchInterval: 60_000,
  });
}

export function useMetricsSnapshotV2(period = "24h") {
  return useQuery({
    queryKey: ["observability-v2", "metrics", period],
    queryFn: () => invokeObservability({ action: "metrics_snapshot", period }),
  });
}

export function useAlertRulesV2() {
  return useQuery({
    queryKey: ["observability-v2", "alerts"],
    queryFn: () => invokeObservability({ action: "alert_rules", sub_action: "list" }),
  });
}

export function useUpsertAlertRuleV2() {
  return useMutation({
    mutationFn: (rule: Record<string, unknown>) =>
      invokeObservability({ action: "alert_rules", sub_action: "upsert", rule }),
  });
}

export function useLogAggregationV2(logType = "activity", severity?: string) {
  return useQuery({
    queryKey: ["observability-v2", "logs", logType, severity],
    queryFn: () => invokeObservability({ action: "log_aggregation", log_type: logType, severity }),
  });
}

export function useUptimeReportV2(days = 30) {
  return useQuery({
    queryKey: ["observability-v2", "uptime", days],
    queryFn: () => invokeObservability({ action: "uptime_report", days }),
  });
}
