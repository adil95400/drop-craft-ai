/**
 * Hook: useInventoryLevels — Stock multi-locations par variante
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { InventoryLevel, InventoryLocation } from '@/domains/commerce/types'

export function useInventoryLocations(userId?: string) {
  return useQuery({
    queryKey: ['inventory-locations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_locations')
        .select('*')
        .eq('user_id', userId!)
        .order('name')
      if (error) throw error
      return data as InventoryLocation[]
    },
  })
}

export function useInventoryLevels(userId?: string, variantId?: string, locationId?: string) {
  const qc = useQueryClient()
  const key = ['inventory-levels', userId, variantId, locationId]

  const query = useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      let q = supabase.from('inventory_levels').select('*').eq('user_id', userId!)
      if (variantId) q = q.eq('variant_id', variantId)
      if (locationId) q = q.eq('location_id', locationId)
      const { data, error } = await q
      if (error) throw error
      return data as InventoryLevel[]
    },
  })

  const upsert = useMutation({
    mutationFn: async (input: Omit<InventoryLevel, 'id' | 'updated_at'> & { id?: string }) => {
      const { data, error } = await supabase
        .from('inventory_levels')
        .upsert({ ...input, user_id: userId! })
        .select()
        .single()
      if (error) throw error
      return data as InventoryLevel
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, upsert }
}
