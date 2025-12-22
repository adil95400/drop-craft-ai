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
  has_api_key?: boolean
  has_encrypted_credentials?: boolean
  contact_email_masked?: string
  contact_phone_masked?: string
}

// Mock suppliers for demo
const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'BigBuy',
    website: 'https://bigbuy.eu',
    country: 'ES',
    status: 'active',
    rating: 4.5,
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'CJ Dropshipping',
    website: 'https://cjdropshipping.com',
    country: 'CN',
    status: 'active',
    rating: 4.2,
    user_id: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
]

export const useRealSuppliers = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['real-suppliers', filters],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return mockSuppliers
      
      // Query premium_suppliers table
      const { data, error } = await (supabase
        .from('premium_suppliers')
        .select('*')
        .order('created_at', { ascending: false }) as any)
      
      if (error) {
        console.error('Error fetching suppliers:', error)
        return mockSuppliers
      }
      
      if (!data || data.length === 0) return mockSuppliers
      
      let filteredData = data.map((s: any) => ({
        id: s.id,
        name: s.name,
        website: s.website_url,
        country: s.country,
        status: (s.is_verified ? 'active' : 'inactive') as 'active' | 'inactive',
        rating: s.rating,
        user_id: user.id,
        created_at: s.created_at,
        updated_at: s.updated_at
      })) as Supplier[]
      
      // Apply client-side filtering
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
          s.website?.toLowerCase().includes(searchLower)
        )
      }
      
      return filteredData
    },
  })

  const addSupplier = useMutation({
    mutationFn: async (newSupplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'has_api_key' | 'has_encrypted_credentials' | 'contact_email_masked' | 'contact_phone_masked'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await (supabase
        .from('premium_suppliers')
        .insert([{
          name: newSupplier.name,
          website_url: newSupplier.website,
          country: newSupplier.country,
          is_verified: newSupplier.status === 'active',
          rating: newSupplier.rating
        }])
        .select()
        .single() as any)
      
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
      const allowedUpdates: any = {}
      if (updates.name) allowedUpdates.name = updates.name
      if (updates.website) allowedUpdates.website_url = updates.website
      if (updates.country) allowedUpdates.country = updates.country
      if (updates.status) allowedUpdates.is_verified = updates.status === 'active'
      if (updates.rating) allowedUpdates.rating = updates.rating
      
      const { data, error } = await (supabase
        .from('premium_suppliers')
        .update(allowedUpdates)
        .eq('id', id)
        .select()
        .single() as any)
      
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
      const { error } = await (supabase
        .from('premium_suppliers')
        .delete()
        .eq('id', id) as any)
      
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
