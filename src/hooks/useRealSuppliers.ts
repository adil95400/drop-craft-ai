import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/integrations/supabase/client'

export interface Supplier {
  id: string
  name: string
  contact_email?: string
  contact_phone?: string
  website?: string
  country?: string
  status: 'active' | 'inactive'
  rating?: number
  api_key?: string
  api_endpoint?: string
  user_id: string
  created_at: string
  updated_at: string
  credentials_updated_at?: string
  last_access_at?: string
  access_count?: number
  encrypted_credentials?: any
}

export const useRealSuppliers = (filters?: any) => {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: suppliers = [], isLoading, error } = useQuery({
    queryKey: ['real-suppliers', filters],
    queryFn: async () => {
      let query = supabase.from('suppliers').select('*')
      
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      if (filters?.country) {
        query = query.eq('country', filters.country)
      }
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,contact_email.ilike.%${filters.search}%`)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data as Supplier[]
    },
  })

  const addSupplier = useMutation({
    mutationFn: async (newSupplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non authentifié')
      
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{ ...newSupplier, user_id: user.id }])
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
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
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
    isAdding: addSupplier.isPending,
    isUpdating: updateSupplier.isPending,
    isDeleting: deleteSupplier.isPending
  }
}