import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export interface SavedProductView {
  id: string
  name: string
  description?: string
  filters: Record<string, any>
  sort_config?: Record<string, any>
  columns?: string[]
  is_default: boolean
  is_preset: boolean
  icon?: string
  color?: string
  product_count?: number
  created_at: string
}

export const PRESET_VIEWS: Omit<SavedProductView, 'id' | 'created_at'>[] = [
  {
    name: 'Marge faible',
    description: 'Produits avec marge < 15%',
    filters: { profit_margin_lt: 15, status: 'active' },
    icon: 'TrendingDown',
    color: 'red',
    is_default: false,
    is_preset: true,
  },
  {
    name: 'Stock critique',
    description: 'Produits avec stock ≤ 5 unités',
    filters: { stock_quantity_lte: 5, stock_quantity_gt: 0, status: 'active' },
    icon: 'AlertTriangle',
    color: 'orange',
    is_default: false,
    is_preset: true,
  },
  {
    name: 'Rupture de stock',
    description: 'Produits en rupture (stock = 0)',
    filters: { stock_quantity: 0, status: 'active' },
    icon: 'PackageX',
    color: 'red',
    is_default: false,
    is_preset: true,
  },
  {
    name: 'Sans image',
    description: 'Produits sans image principale',
    filters: { main_image_url_is_null: true },
    icon: 'ImageOff',
    color: 'gray',
    is_default: false,
    is_preset: true,
  },
  {
    name: 'Brouillons',
    description: 'Produits en brouillon',
    filters: { status: 'draft' },
    icon: 'FileEdit',
    color: 'blue',
    is_default: false,
    is_preset: true,
  },
  {
    name: 'Meilleurs vendeurs',
    description: 'Produits triés par quantité vendue',
    filters: { status: 'active' },
    sort_config: { field: 'sales_count', direction: 'desc' },
    icon: 'Trophy',
    color: 'yellow',
    is_default: false,
    is_preset: true,
  },
  {
    name: 'Récemment ajoutés',
    description: 'Derniers produits créés',
    filters: {},
    sort_config: { field: 'created_at', direction: 'desc' },
    icon: 'Clock',
    color: 'green',
    is_default: false,
    is_preset: true,
  },
  {
    name: 'SEO incomplet',
    description: 'Produits sans titre ou description SEO',
    filters: { seo_incomplete: true },
    icon: 'Search',
    color: 'purple',
    is_default: false,
    is_preset: true,
  },
]

export function useSavedViews() {
  return useQuery({
    queryKey: ['saved-product-views'],
    queryFn: async () => {
      const { data, error } = await (supabase.from('saved_product_views') as any)
        .select('*')
        .order('is_default', { ascending: false })
        .order('name')

      if (error) throw error
      return (data || []) as SavedProductView[]
    },
  })
}

export function useCreateSavedView() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (view: { name: string; description?: string; filters: Record<string, any>; sort_config?: Record<string, any>; icon?: string; color?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await (supabase.from('saved_product_views') as any)
        .insert({ ...view, user_id: user.id })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-product-views'] })
      toast.success('Vue sauvegardée')
    },
    onError: (e: any) => toast.error(`Erreur: ${e.message}`),
  })
}

export function useDeleteSavedView() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (viewId: string) => {
      const { error } = await (supabase.from('saved_product_views') as any)
        .delete()
        .eq('id', viewId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['saved-product-views'] })
      toast.success('Vue supprimée')
    },
    onError: (e: any) => toast.error(`Erreur: ${e.message}`),
  })
}
