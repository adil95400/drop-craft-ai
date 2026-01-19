/**
 * @deprecated Use useSuppliersUnified from '@/hooks/unified' instead
 * This file is kept for backward compatibility and will be removed in a future version
 */
import { useSuppliersUnified, UnifiedSupplier } from '@/hooks/unified'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Re-export Supplier type for backward compatibility
export interface Supplier {
  id: string
  name: string
  website?: string
  country?: string
  status: 'active' | 'inactive'
  rating?: number
  api_endpoint?: string
  user_id: string
  created_at: string
  updated_at: string
  credentials_updated_at?: string
  last_access_at?: string
  access_count?: number
  has_api_key?: boolean
  has_encrypted_credentials?: boolean
  contact_email_masked?: string
  contact_phone_masked?: string
}

export const useRealSuppliers = (filters?: any) => {
  console.warn('[DEPRECATED] useRealSuppliers - utilisez useSuppliersUnified de @/hooks/unified')
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const result = useSuppliersUnified({
    category: filters?.category,
    status: filters?.status,
    search: filters?.search
  })

  // Map UnifiedSupplier to legacy Supplier format
  const suppliers: Supplier[] = result.suppliers.map((s: UnifiedSupplier) => ({
    id: s.id,
    name: s.name,
    website: s.website,
    country: s.country,
    status: s.status === 'verified' ? 'active' as const : 'inactive' as const,
    rating: s.rating,
    api_endpoint: s.api_endpoint,
    user_id: s.user_id,
    created_at: s.created_at,
    updated_at: s.updated_at,
    credentials_updated_at: s.credentials_updated_at,
    last_access_at: s.last_access_at,
    access_count: s.access_count,
    has_api_key: false,
    has_encrypted_credentials: false
  }))

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    inactive: suppliers.filter(s => s.status === 'inactive').length,
    averageRating: suppliers.length > 0 
      ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length 
      : 0,
    topCountries: suppliers.reduce((acc: Record<string, number>, supplier) => {
      if (supplier.country) {
        acc[supplier.country] = (acc[supplier.country] || 0) + 1
      }
      return acc
    }, {})
  }

  // Add mutation support for backward compatibility
  const addMutation = useMutation({
    mutationFn: async (newSupplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase
        .from('premium_suppliers')
        .insert([{
          name: newSupplier.name,
          website_url: newSupplier.website,
          country: newSupplier.country,
          is_verified: newSupplier.status === 'active',
          rating: newSupplier.rating
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] })
      toast({
        title: "Fournisseur ajouté",
        description: "Le fournisseur a été créé avec succès",
      })
    }
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Supplier> }) => {
      const allowedUpdates: any = {}
      if (updates.name) allowedUpdates.name = updates.name
      if (updates.website) allowedUpdates.website_url = updates.website
      if (updates.country) allowedUpdates.country = updates.country
      if (updates.status) allowedUpdates.is_verified = updates.status === 'active'
      if (updates.rating) allowedUpdates.rating = updates.rating
      
      const { data, error } = await supabase
        .from('premium_suppliers')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] })
      toast({
        title: "Fournisseur mis à jour",
        description: "Le fournisseur a été modifié avec succès",
      })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('premium_suppliers')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] })
      toast({
        title: "Fournisseur supprimé",
        description: "Le fournisseur a été supprimé avec succès",
      })
    }
  })

  const analyzeMutation = useMutation({
    mutationFn: async (url: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase.functions.invoke('analyze-supplier', {
        body: { url, userId: user.id }
      })
      
      if (error) throw error
      if (!data.success) throw new Error(data.error || 'Échec de l\'analyse')
      
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['unified-suppliers'] })
      toast({
        title: "Fournisseur analysé",
        description: `${data.analysis?.name || 'Fournisseur'} a été ajouté avec succès`,
      })
    },
    onError: (error: any) => {
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Impossible d'analyser le fournisseur",
        variant: "destructive"
      })
    }
  })

  return {
    suppliers,
    stats,
    isLoading: result.isLoading,
    error: result.error,
    addSupplier: addMutation.mutateAsync,
    updateSupplier: updateMutation.mutate,
    deleteSupplier: deleteMutation.mutateAsync,
    analyzeSupplier: analyzeMutation.mutate,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isAnalyzing: analyzeMutation.isPending
  }
}
