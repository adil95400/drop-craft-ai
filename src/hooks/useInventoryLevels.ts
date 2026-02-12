/**
 * Hook: useInventoryLevels — Stock multi-locations par variante (via API V1)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { inventoryApi } from '@/services/api/client'
import type { InventoryLevel, InventoryLocation } from '@/domains/commerce/types'

export function useInventoryLocations(userId?: string) {
  return useQuery({
    queryKey: ['inventory-locations', userId],
    enabled: !!userId,
    queryFn: async () => {
      const resp = await inventoryApi.locations()
      return (resp.items ?? []) as InventoryLocation[]
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
      const resp = await inventoryApi.levels({ variant_id: variantId, location_id: locationId })
      return (resp.items ?? []) as InventoryLevel[]
    },
  })

  const upsert = useMutation({
    mutationFn: async (input: Omit<InventoryLevel, 'id' | 'updated_at'> & { id?: string }) => {
      return inventoryApi.upsertLevel(input) as Promise<InventoryLevel>
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return { ...query, upsert }
}
