import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import type { Database } from '@/integrations/supabase/types'

type PromotionalCoupon = Database['public']['Tables']['promotional_coupons']['Row']
type CouponInsert = Database['public']['Tables']['promotional_coupons']['Insert']

export function useCoupons() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['promotional-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotional_coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as PromotionalCoupon[]
    },
  })

  const createCouponMutation = useMutation({
    mutationFn: async (coupon: CouponInsert) => {
      const { data, error } = await supabase
        .from('promotional_coupons')
        .insert(coupon)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-coupons'] })
      toast({
        title: '✅ Coupon créé',
        description: 'Le coupon a été créé avec succès',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le coupon',
        variant: 'destructive',
      })
    },
  })

  const updateCouponMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CouponInsert> }) => {
      const { data, error } = await supabase
        .from('promotional_coupons')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-coupons'] })
      toast({
        title: '✅ Coupon mis à jour',
        description: 'Les modifications ont été enregistrées',
      })
    },
  })

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotional_coupons')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-coupons'] })
      toast({
        title: '✅ Coupon supprimé',
        description: 'Le coupon a été supprimé',
      })
    },
  })

  const validateCouponMutation = useMutation({
    mutationFn: async ({ code, amount }: { code: string; amount: number }) => {
      const { data, error } = await supabase.functions.invoke('coupon-validate', {
        body: { code, amount },
      })

      if (error) throw error
      return data
    },
  })

  const redeemCouponMutation = useMutation({
    mutationFn: async (params: {
      code: string
      amount: number
      orderId?: string
      subscriptionId?: string
      metadata?: any
    }) => {
      const { data, error } = await supabase.functions.invoke('coupon-redeem', {
        body: params,
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promotional-coupons'] })
      toast({
        title: '✅ Coupon appliqué',
        description: `Réduction de ${data.discount.amount}€ appliquée`,
      })
    },
  })

  return {
    coupons: coupons || [],
    isLoading,
    createCoupon: createCouponMutation.mutate,
    isCreating: createCouponMutation.isPending,
    updateCoupon: updateCouponMutation.mutate,
    isUpdating: updateCouponMutation.isPending,
    deleteCoupon: deleteCouponMutation.mutate,
    isDeleting: deleteCouponMutation.isPending,
    validateCoupon: validateCouponMutation.mutate,
    isValidating: validateCouponMutation.isPending,
    redeemCoupon: redeemCouponMutation.mutate,
    isRedeeming: redeemCouponMutation.isPending,
  }
}
