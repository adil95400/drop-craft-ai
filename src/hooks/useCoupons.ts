import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Coupon {
  id: string
  code: string
  description?: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount?: number
  max_discount_amount?: number
  usage_limit?: number
  used_count: number
  starts_at?: string
  expires_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export const useCoupons = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch coupons
  const { data: coupons = [], isLoading, error } = useQuery({
    queryKey: ['coupons'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('coupons' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data as any[]) || []
    }
  })

  // Validate coupon
  const validateCoupon = async (code: string): Promise<Coupon | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('coupons' as any)
      .select('*')
      .eq('code', code)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !data) {
      toast({
        title: "Coupon invalide",
        description: "Le code promo n'existe pas ou a expiré",
        variant: "destructive"
      })
      return null
    }

    const couponData = data as any
    const now = new Date()
    if (couponData.starts_at && new Date(couponData.starts_at) > now) {
      toast({
        title: "Coupon non valide",
        description: "Ce coupon n'est pas encore actif",
        variant: "destructive"
      })
      return null
    }

    if (couponData.expires_at && new Date(couponData.expires_at) < now) {
      toast({
        title: "Coupon expiré",
        description: "Ce coupon n'est plus valide",
        variant: "destructive"
      })
      return null
    }

    if (couponData.usage_limit && couponData.usage_count >= couponData.usage_limit) {
      toast({
        title: "Coupon épuisé",
        description: "Ce coupon a atteint sa limite d'utilisation",
        variant: "destructive"
      })
      return null
    }

    return couponData as Coupon
  }

  // Apply coupon
  const applyCoupon = useMutation({
    mutationFn: async ({ code, cartTotal }: { code: string; cartTotal: number }) => {
      const coupon = await validateCoupon(code)
      if (!coupon) throw new Error('Invalid coupon')

      if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
        throw new Error(`Montant minimum requis: ${coupon.min_order_amount}€`)
      }

      let discount = 0
      if (coupon.discount_type === 'percentage') {
        discount = (cartTotal * coupon.discount_value) / 100
        if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
          discount = coupon.max_discount_amount
        }
      } else {
        discount = coupon.discount_value
      }

      // Increment usage count
      await supabase
        .from('coupons' as any)
        .update({ usage_count: coupon.used_count + 1 } as any)
        .eq('id', coupon.id)

      return { coupon, discount }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] })
      toast({
        title: "Coupon appliqué",
        description: `Vous économisez ${data.discount.toFixed(2)}€`,
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

  const calculateDiscount = (coupon: Coupon, orderAmount: number): number => {
    let discount = 0
    if (coupon.discount_type === 'percentage') {
      discount = (orderAmount * coupon.discount_value) / 100
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, coupon.max_discount_amount)
      }
    } else {
      discount = coupon.discount_value
    }
    return Math.min(discount, orderAmount)
  }

  return {
    coupons,
    isLoading,
    error,
    validateCoupon,
    applyCoupon: applyCoupon.mutate,
    isApplyingCoupon: applyCoupon.isPending,
    calculateDiscount
  }
}