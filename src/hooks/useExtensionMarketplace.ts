/**
 * Hook unifié pour gérer le marketplace d'extensions
 * Recherche, filtres, installation
 */

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { marketplaceService, type MarketplaceFilters } from '@/services/marketplaceService'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export const useExtensionMarketplace = () => {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState<MarketplaceFilters>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Récupérer les extensions du marketplace
  const { data: extensions, isLoading, error, refetch } = useQuery({
    queryKey: ['marketplace-extensions', filters],
    queryFn: () => marketplaceService.getExtensions(filters)
  })

  // Récupérer les catégories
  const { data: categories } = useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: () => marketplaceService.getCategories()
  })

  // Installer une extension
  const installMutation = useMutation({
    mutationFn: async (extensionId: string) => {
      const user = await supabase.auth.getUser()
      if (!user.data.user) throw new Error('Non authentifié')

      const { data, error } = await supabase
        .from('extensions')
        .insert([{
          name: extensionId,
          code: '', // Required field
          description: extensionId,
          status: 'active'
        }])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['extensions'] })
      toast({
        title: "Extension installée",
        description: "L'extension a été installée avec succès"
      })
    },
    onError: (error) => {
      toast({
        title: "Erreur d'installation",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  // Vérifier si une extension est installée
  const checkInstalled = async (extensionId: string) => {
    const { data } = await supabase
      .from('extensions')
      .select('id')
      .eq('name', extensionId)
      .maybeSingle()
    
    return !!data
  }

  // Mettre à jour les filtres quand la recherche ou la catégorie change
  useEffect(() => {
    setFilters({
      search: searchQuery || undefined,
      category: selectedCategory !== 'all' ? selectedCategory : undefined
    })
  }, [searchQuery, selectedCategory])

  return {
    // Data
    extensions: extensions || [],
    categories: categories || [],
    isLoading,
    error,

    // Filtres
    filters,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    setFilters,

    // Actions
    installExtension: installMutation.mutateAsync,
    checkInstalled,
    refetch,

    // States
    isInstalling: installMutation.isPending
  }
}
