import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface ShippingZone {
  id: string
  name: string
  countries: string[]
  created_at: string
  updated_at: string
}

interface ShippingMethod {
  id: string
  zone_id: string
  name: string
  description?: string
  price: number
  min_weight?: number
  max_weight?: number
  estimated_days_min: number
  estimated_days_max: number
  is_active: boolean
  created_at: string
  updated_at: string
  zone?: ShippingZone
}

export const useShipping = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Placeholder data until shipping tables are created
  const zones: ShippingZone[] = []
  const methods: ShippingMethod[] = []
  const isLoadingZones = false
  const isLoadingMethods = false

  // Add shipping zone placeholder
  const addZone = useMutation({
    mutationFn: async (newZone: {
      name: string
      countries: string[]
    }) => {
      toast({
        title: "Fonctionnalité à venir",
        description: "Le système de livraison sera disponible bientôt",
      })
      return null
    }
  })

  // Add shipping method placeholder
  const addMethod = useMutation({
    mutationFn: async (newMethod: {
      zone_id: string
      name: string
      description?: string
      price: number
      min_weight?: number
      max_weight?: number
      estimated_days_min: number
      estimated_days_max: number
    }) => {
      toast({
        title: "Fonctionnalité à venir",
        description: "Le système de livraison sera disponible bientôt",
      })
      return null
    }
  })

  // Calculate shipping cost
  const calculateShipping = (
    country: string,
    weight: number,
    zoneId?: string
  ): ShippingMethod[] => {
    return methods.filter(method => {
      if (zoneId && method.zone_id !== zoneId) return false
      if (!method.is_active) return false
      if (!method.zone?.countries.includes(country)) return false
      if (method.min_weight && weight < method.min_weight) return false
      if (method.max_weight && weight > method.max_weight) return false
      return true
    })
  }

  return {
    zones,
    methods,
    isLoading: isLoadingZones || isLoadingMethods,
    addZone: addZone.mutate,
    isAddingZone: addZone.isPending,
    addMethod: addMethod.mutate,
    isAddingMethod: addMethod.isPending,
    calculateShipping
  }
}