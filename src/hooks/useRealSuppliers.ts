import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

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
  // Security: Sensitive fields are masked/excluded for regular access
  has_api_key?: boolean
  has_encrypted_credentials?: boolean
  contact_email_masked?: string
  contact_phone_masked?: string
}

export const useRealSuppliers = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['real-suppliers', filters],
    queryFn: async () => {
      // Security: Use secure function instead of direct table access
      const { data, error } = await supabase.rpc('get_secure_suppliers')
      
      if (error) throw error
      
      let filteredData = data || []
      
      // Apply client-side filtering since we can't do complex filtering in the secure function
      if (filters?.status) {
        filteredData = filteredData.filter(s => s.status === filters.status)
      }
      if (filters?.country) {
        filteredData = filteredData.filter(s => s.country === filters.country)
      }
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase()
        filteredData = filteredData.filter(s => 
          s.name?.toLowerCase().includes(searchLower) ||
          s.contact_email_masked?.toLowerCase().includes(searchLower)
        )
      }
      
      return filteredData as Supplier[]
    },
  })

  const addSupplier = useMutation({
    mutationFn: async (newSupplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'has_api_key' | 'has_encrypted_credentials' | 'contact_email_masked' | 'contact_phone_masked'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      // Security: Only allow basic supplier data insertion
      const basicSupplierData = {
        name: newSupplier.name,
        website: newSupplier.website,
        country: newSupplier.country,
        status: newSupplier.status,
        rating: newSupplier.rating,
        api_endpoint: newSupplier.api_endpoint,
        user_id: user.id
      }
      
      const { data, error } = await supabase
        .from('suppliers')
        .insert([basicSupplierData])
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-suppliers'] })
      toast({
        title: "Fournisseur ajouté",
        description: "Le fournisseur a été créé avec succès",
      })
    }
  })

  const updateSupplier = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Supplier> }) => {
      // Security: Only allow updates to non-sensitive fields
      const allowedUpdates = {
        name: updates.name,
        website: updates.website,
        country: updates.country,
        status: updates.status,
        rating: updates.rating,
        api_endpoint: updates.api_endpoint
      }
      
      const { data, error } = await supabase
        .from('suppliers')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-suppliers'] })
      toast({
        title: "Fournisseur mis à jour",
        description: "Le fournisseur a été modifié avec succès",
      })
    }
  })

  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['real-suppliers'] })
      toast({
        title: "Fournisseur supprimé",
        description: "Le fournisseur a été supprimé avec succès",
      })
    }
  })

  const analyzeSupplier = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['real-suppliers'] })
      toast({
        title: "Fournisseur analysé",
        description: `${data.analysis.name} a été ajouté avec succès`,
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

  const stats = {
    total: suppliers.length,
    active: suppliers.filter(s => s.status === 'active').length,
    inactive: suppliers.filter(s => s.status === 'inactive').length,
    averageRating: suppliers.length > 0 
      ? suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / suppliers.length 
      : 0,
    topCountries: suppliers.reduce((acc: any, supplier) => {
      if (supplier.country) {
        acc[supplier.country] = (acc[supplier.country] || 0) + 1
      }
      return acc
    }, {})
  }

  return {
    suppliers,
    stats,
    isLoading,
    error,
    addSupplier: addSupplier.mutate,
    updateSupplier: updateSupplier.mutate,
    deleteSupplier: deleteSupplier.mutate,
    analyzeSupplier: analyzeSupplier.mutate,
    isAdding: addSupplier.isPending,
    isUpdating: updateSupplier.isPending,
    isDeleting: deleteSupplier.isPending,
    isAnalyzing: analyzeSupplier.isPending
  }
}