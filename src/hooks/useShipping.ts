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

  // Fetch shipping zones
  const { data: zones = [], isLoading: isLoadingZones } = useQuery({
    queryKey: ['shipping-zones'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('shipping_zones' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as any as ShippingZone[]
    }
  })

  // Fetch shipping methods
  const { data: methods = [], isLoading: isLoadingMethods } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('shipping_methods' as any)
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as any as ShippingMethod[]
    }
  })

  // Add shipping zone
  const addZone = useMutation({
    mutationFn: async (newZone: {
      name: string
      countries: string[]
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from('shipping_zones' as any)
        .insert([{ ...newZone, user_id: user.id }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-zones'] })
      toast({
        title: "Zone créée",
        description: "La zone de livraison a été créée avec succès",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Add shipping method
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
      const { data, error } = await supabase
        .from('shipping_methods' as any)
        .insert([newMethod])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] })
      toast({
        title: "Méthode créée",
        description: "La méthode de livraison a été créée avec succès",
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      })
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