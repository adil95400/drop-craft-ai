/**
 * Hook pour gérer le profil utilisateur
 * Adapté à la structure existante de la table profiles
 */
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from '@/contexts/AuthContext'

export interface UserProfile {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  website: string | null
  bio: string | null
  location: string | null
  avatar_url: string | null
  twitter: string | null
  linkedin: string | null
  github: string | null
  subscription_plan: string | null
  email_verified: boolean
  products_count: number
  orders_count: number
  imports_count: number
  sessions_count: number
  credits_used: number
  credits_remaining: number
  next_billing_date: string | null
  created_at: string
  updated_at: string
}

export function useProfile() {
  const { user } = useAuth()

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // Return default profile structure if not found
        return {
          id: user.id,
          full_name: null,
          email: user.email || null,
          phone: null,
          company: null,
          website: null,
          bio: null,
          location: null,
          avatar_url: null,
          twitter: null,
          linkedin: null,
          github: null,
          subscription_plan: 'free',
          email_verified: false,
          products_count: 0,
          orders_count: 0,
          imports_count: 0,
          sessions_count: 0,
          credits_used: 0,
          credits_remaining: 5,
          next_billing_date: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }

      // Enrich with counts from other tables
      const [productStats, ordersResult] = await Promise.all([
        import('@/services/api/productHelpers').then(m => m.getProductCount()),
        supabase.from('orders').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      ])

      // Map existing fields to our interface
      return {
        id: data.id,
        full_name: data.full_name,
        email: data.email || user.email || null,
        phone: data.phone || null,
        company: data.company_name || null,
        website: data.website || null,
        bio: data.bio || null,
        location: data.location || null,
        avatar_url: data.avatar_url,
        twitter: data.twitter || null,
        linkedin: data.linkedin || null,
        github: data.github || null,
        subscription_plan: data.subscription_plan || 'free',
        email_verified: true,
        products_count: productStats || 0,
        orders_count: ordersResult.count || 0,
        imports_count: 0,
        sessions_count: 0,
        credits_used: 0,
        credits_remaining: 5,
        next_billing_date: null,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  return {
    profile,
    isLoading,
    error,
    refetch
  }
}
