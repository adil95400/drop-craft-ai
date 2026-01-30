/**
 * useDraftProducts - Hook pour les produits brouillons importés
 * Récupère les produits avec status='draft' et needs_review=true
 * Phase 3: Support des notes d'import atomique
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface DraftProduct {
  id: string
  name: string
  description?: string | null
  price: number
  cost_price?: number | null
  sku?: string | null
  image_urls?: string[] | null
  original_images?: string[] | null
  category?: string | null
  brand?: string | null
  status: string | null
  import_notes?: string | null
  source_url?: string | null
  source_platform?: string | null
  created_at: string
  updated_at: string
  user_id: string
}

export interface DraftProductStats {
  total: number
  missingImages: number
  missingDescription: number
  missingCategory: number
  missingBrand: number
  lowQuality: number
}

export function useDraftProducts() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupérer les produits brouillons
  const { data: draftProducts, isLoading, error } = useQuery({
    queryKey: ['draft-products'],
    queryFn: async (): Promise<DraftProduct[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      const { data, error } = await supabase
        .from('imported_products')
        .select('id, name, description, price, cost_price, sku, image_urls, original_images, category, brand, status, import_notes, source_url, source_platform, created_at, updated_at, user_id')
        .eq('user_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as DraftProduct[]
    },
    staleTime: 30000
  })

  // Calculer les statistiques
  const stats: DraftProductStats = {
    total: draftProducts?.length || 0,
    missingImages: draftProducts?.filter(p => !p.image_urls || p.image_urls.length === 0).length || 0,
    missingDescription: draftProducts?.filter(p => !p.description || p.description.length < 50).length || 0,
    missingCategory: draftProducts?.filter(p => !p.category).length || 0,
    missingBrand: draftProducts?.filter(p => !p.brand).length || 0,
    lowQuality: draftProducts?.filter(p => p.import_notes?.includes('qualité')).length || 0
  }

  // Parser les notes d'import pour extraire les problèmes
  const parseImportNotes = (notes?: string): string[] => {
    if (!notes) return []
    // Format: "Données incomplètes: Description manquante, Marque manquante"
    const match = notes.match(/Données incomplètes:\s*(.+)/)
    if (match) {
      return match[1].split(',').map(s => s.trim())
    }
    // Format alternatif: "Score qualité insuffisant (XX%)"
    if (notes.includes('Score qualité')) {
      return [notes]
    }
    return [notes]
  }

  // Valider et publier un brouillon
  const validateDraftMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('imported_products')
        .update({
          status: 'active',
          needs_review: false,
          import_notes: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-products'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      queryClient.invalidateQueries({ queryKey: ['products-unified'] })
      toast({
        title: 'Produit validé',
        description: 'Le produit a été publié dans votre catalogue'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de validation',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Supprimer un brouillon
  const deleteDraftMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')

      const { error } = await supabase
        .from('imported_products')
        .delete()
        .eq('id', productId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['draft-products'] })
      toast({
        title: 'Brouillon supprimé',
        description: 'Le produit a été supprimé'
      })
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur de suppression',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  return {
    draftProducts: draftProducts || [],
    stats,
    isLoading,
    error,
    parseImportNotes,
    validateDraft: validateDraftMutation.mutate,
    deleteDraft: deleteDraftMutation.mutate,
    isValidating: validateDraftMutation.isPending,
    isDeleting: deleteDraftMutation.isPending
  }
}
