import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

export interface RuleAction {
  type: string;
  config: Record<string, unknown>;
}

export interface FulfillmentRule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  rule_type: string;
  is_active: boolean;
  priority: number;
  condition_logic: "AND" | "OR";
  conditions: RuleCondition[];
  actions: RuleAction[];
  supplier_preferences?: Array<{ id: string; name: string; priority: number }>;
  price_rules?: {
    margin_type?: "fixed" | "percentage";
    margin_value?: number;
    minimum_margin?: number;
    rounding?: "none" | "nearest" | "up" | "down";
  };
  stock_rules?: {
    min_stock_threshold?: number;
    auto_deactivate_oos?: boolean;
    buffer_quantity?: number;
  };
  execution_count: number;
  last_executed_at?: string;
  success_count: number;
  failure_count: number;
  created_at: string;
  updated_at: string;
}

export interface FulfillmentSettings {
  id: string;
  user_id: string;
  auto_fulfill_enabled: boolean;
  auto_tracking_sync: boolean;
  auto_stock_sync: boolean;
  auto_price_sync: boolean;
  default_margin_type: "fixed" | "percentage";
  default_margin_value: number;
  minimum_margin: number;
  price_rounding: "none" | "nearest" | "up" | "down";
  auto_deactivate_oos: boolean;
  retry_failed_orders: boolean;
  max_retries: number;
  retry_delay_minutes: number;
  notification_email: boolean;
  notification_webhook?: string;
  preferred_suppliers: Array<{ id: string; name: string; priority: number }>;
  created_at: string;
  updated_at: string;
}

export function useFulfillmentRules() {
  const queryClient = useQueryClient();

  const { data: rules, isLoading, error, refetch } = useQuery({
    queryKey: ["fulfillment-rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillment_rules")
        .select("*")
        .order("priority", { ascending: false });

      if (error) throw error;
      return (data || []).map((r: any) => ({
        ...r,
        conditions: Array.isArray(r.conditions) ? r.conditions : [],
        actions: Array.isArray(r.actions) ? r.actions : [],
        condition_logic: r.condition_logic || "AND",
      })) as FulfillmentRule[];
    },
  });

  const createRule = useMutation({
    mutationFn: async (rule: Partial<FulfillmentRule>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("fulfillment_rules")
        .insert({
          name: rule.name,
          description: rule.description,
          rule_type: rule.rule_type,
          is_active: rule.is_active,
          priority: rule.priority,
          condition_logic: rule.condition_logic,
          conditions: rule.conditions as any,
          actions: rule.actions as any,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-rules"] });
      toast.success("Rule created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FulfillmentRule> & { id: string }) => {
      const updateData: any = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.rule_type !== undefined) updateData.rule_type = updates.rule_type;
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active;
      if (updates.priority !== undefined) updateData.priority = updates.priority;
      if (updates.condition_logic !== undefined) updateData.condition_logic = updates.condition_logic;
      if (updates.conditions !== undefined) updateData.conditions = updates.conditions;
      if (updates.actions !== undefined) updateData.actions = updates.actions;

      const { data, error } = await supabase
        .from("fulfillment_rules")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-rules"] });
      toast.success("Rule updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("fulfillment_rules")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-rules"] });
      toast.success("Rule deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("fulfillment_rules")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-rules"] });
      toast.success(`Rule ${data.is_active ? "enabled" : "disabled"}`);
    },
    onError: (error) => {
      toast.error(`Failed to toggle rule: ${error.message}`);
    },
  });

  return {
    rules: rules || [],
    isLoading,
    error,
    refetch,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}

export function useFulfillmentSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["fulfillment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fulfillment_settings")
        .select("*")
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as FulfillmentSettings | null;
    },
  });

  const saveSettings = useMutation({
    mutationFn: async (newSettings: Partial<FulfillmentSettings>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("fulfillment_settings")
        .upsert({
          ...newSettings,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fulfillment-settings"] });
      toast.success("Settings saved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  const defaultSettings: FulfillmentSettings = {
    id: "",
    user_id: "",
    auto_fulfill_enabled: false,
    auto_tracking_sync: true,
    auto_stock_sync: true,
    auto_price_sync: false,
    default_margin_type: "percentage",
    default_margin_value: 30,
    minimum_margin: 10,
    price_rounding: "nearest",
    auto_deactivate_oos: true,
    retry_failed_orders: true,
    max_retries: 3,
    retry_delay_minutes: 30,
    notification_email: true,
    notification_webhook: undefined,
    preferred_suppliers: [],
    created_at: "",
    updated_at: "",
  };

  return {
    settings: settings || defaultSettings,
    isLoading,
    error,
    saveSettings,
  };
}
