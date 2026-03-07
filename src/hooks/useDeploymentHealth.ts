import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

async function invoke(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("deployment-health", { body });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Unknown error");
  return data.data;
}

export function useDeploymentStatus() {
  return useQuery({
    queryKey: ["deployment", "status"],
    queryFn: () => invoke({ action: "deployment_status" }),
    refetchInterval: 120_000,
  });
}

export function useDatabaseHealth() {
  return useQuery({
    queryKey: ["deployment", "db-health"],
    queryFn: () => invoke({ action: "database_health" }),
    refetchInterval: 300_000,
  });
}

export function useBackupVerification() {
  return useQuery({
    queryKey: ["deployment", "backups"],
    queryFn: () => invoke({ action: "backup_verification" }),
    staleTime: 600_000,
  });
}

export function useEnvironmentAudit() {
  return useQuery({
    queryKey: ["deployment", "env-audit"],
    queryFn: () => invoke({ action: "environment_audit" }),
    staleTime: 300_000,
  });
}

export function useRollbackCheck() {
  return useQuery({
    queryKey: ["deployment", "rollback"],
    queryFn: () => invoke({ action: "rollback_check" }),
  });
}
