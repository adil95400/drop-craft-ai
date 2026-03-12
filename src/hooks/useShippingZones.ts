import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ShippingZone {
  id: string;
  user_id: string;
  name: string;
  countries: string[];
  regions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ShippingRate {
  id: string;
  user_id: string;
  zone_id: string;
  carrier_id: string | null;
  name: string;
  rate_type: string;
  base_rate: number;
  per_kg_rate: number;
  free_shipping_threshold: number | null;
  min_weight: number;
  max_weight: number | null;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface ShippingRule {
  id: string;
  user_id: string;
  name: string;
  priority: number;
  conditions: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  is_active: boolean;
  trigger_count: number;
  last_triggered_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useShippingZones() {
  return useQuery({
    queryKey: ['shipping-zones'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await (supabase.from('shipping_zones') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return (data || []) as ShippingZone[];
    },
  });
}

export function useCreateShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zone: Partial<ShippingZone>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { error } = await (supabase.from('shipping_zones') as any).insert([{ ...zone, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-zones'] }); toast.success('Zone créée'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteShippingZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('shipping_zones') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-zones'] }); toast.success('Zone supprimée'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useShippingRates(zoneId?: string) {
  return useQuery({
    queryKey: ['shipping-rates', zoneId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      let query = (supabase.from('shipping_rates') as any).select('*').eq('user_id', user.id);
      if (zoneId) query = query.eq('zone_id', zoneId);
      const { data, error } = await query.order('base_rate');
      if (error) throw error;
      return (data || []) as ShippingRate[];
    },
  });
}

export function useCreateShippingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rate: Partial<ShippingRate>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { error } = await (supabase.from('shipping_rates') as any).insert([{ ...rate, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-rates'] }); toast.success('Tarif créé'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteShippingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('shipping_rates') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-rates'] }); toast.success('Tarif supprimé'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useShippingRules() {
  return useQuery({
    queryKey: ['shipping-rules'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { data, error } = await (supabase.from('shipping_rules') as any)
        .select('*')
        .eq('user_id', user.id)
        .order('priority');
      if (error) throw error;
      return (data || []) as ShippingRule[];
    },
  });
}

export function useCreateShippingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rule: Partial<ShippingRule>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non authentifié');
      const { error } = await (supabase.from('shipping_rules') as any).insert([{ ...rule, user_id: user.id }]);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-rules'] }); toast.success('Règle créée'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useToggleShippingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await (supabase.from('shipping_rules') as any).update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-rules'] }); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteShippingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('shipping_rules') as any).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['shipping-rules'] }); toast.success('Règle supprimée'); },
    onError: (e: Error) => toast.error(e.message),
  });
}

/** Calculate shipping cost for a given weight and destination */
export function calculateShippingCost(
  rates: ShippingRate[],
  weight: number,
  orderTotal: number
): { rate: ShippingRate; cost: number; estimatedDays: string } | null {
  const activeRates = rates
    .filter(r => r.is_active)
    .filter(r => weight >= r.min_weight && (!r.max_weight || weight <= r.max_weight));

  if (activeRates.length === 0) return null;

  const best = activeRates.sort((a, b) => a.base_rate - b.base_rate)[0];
  
  // Check free shipping
  if (best.free_shipping_threshold && orderTotal >= best.free_shipping_threshold) {
    return {
      rate: best,
      cost: 0,
      estimatedDays: `${best.estimated_days_min}-${best.estimated_days_max} jours`,
    };
  }

  const cost = best.base_rate + (best.per_kg_rate || 0) * weight;
  return {
    rate: best,
    cost: Math.round(cost * 100) / 100,
    estimatedDays: `${best.estimated_days_min}-${best.estimated_days_max} jours`,
  };
}
