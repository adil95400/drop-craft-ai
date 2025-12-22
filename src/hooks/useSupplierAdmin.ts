import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface SupplierFormData {
  name: string
  country: string
  description?: string
  logo_url?: string
  website_url?: string
  api_endpoint?: string
  contact_email?: string
  categories?: string[]
  tier?: 'gold' | 'platinum' | 'diamond'
  minimum_order_value?: number
  avg_delivery_days?: number
  return_policy_days?: number
  featured?: boolean
  is_active?: boolean
}

export function useSupplierAdmin() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupérer tous les fournisseurs
  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['admin-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_suppliers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })

  // Ajouter un fournisseur
  const addSupplier = useMutation({
    mutationFn: async (supplierData: SupplierFormData) => {
      const { data, error } = await supabase
        .from('premium_suppliers')
        .insert(supplierData as any)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['premium-suppliers'] })
      toast({
        title: 'Fournisseur ajouté',
        description: 'Le fournisseur a été ajouté avec succès'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Mettre à jour un fournisseur
  const updateSupplier = useMutation({
    mutationFn: async ({ id, ...updates }: SupplierFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('premium_suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['premium-suppliers'] })
      toast({
        title: 'Fournisseur mis à jour',
        description: 'Les modifications ont été enregistrées'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Supprimer un fournisseur
  const deleteSupplier = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('premium_suppliers')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['premium-suppliers'] })
      toast({
        title: 'Fournisseur supprimé',
        description: 'Le fournisseur a été supprimé avec succès'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Importer depuis API
  const importFromAPI = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey?: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('import-suppliers', {
        body: {
          provider,
          apiKey,
          userId: user.id
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-suppliers'] })
      queryClient.invalidateQueries({ queryKey: ['premium-suppliers'] })
      toast({
        title: 'Import réussi',
        description: `${data.imported} fournisseurs importés`
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur d\'import',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Exporter les fournisseurs
  const exportSuppliers = useMutation({
    mutationFn: async () => {
      if (!suppliers) throw new Error('No suppliers to export')

      // Créer un CSV
      const headers = ['Nom', 'Pays', 'Catégorie', 'Min Order', 'Livraison', 'Vérifié', 'Recommandé']
      const rows = suppliers.map(s => [
        s.name,
        s.country || '',
        s.category || '',
        s.min_order_value || 0,
        s.avg_shipping_days || 0,
        s.is_verified ? 'Oui' : 'Non',
        s.is_featured ? 'Oui' : 'Non'
      ])

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `suppliers-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    },
    onSuccess: () => {
      toast({
        title: 'Export réussi',
        description: 'Les fournisseurs ont été exportés'
      })
    }
  })

  return {
    suppliers,
    isLoading,
    
    addSupplier: addSupplier.mutate,
    isAdding: addSupplier.isPending,
    
    updateSupplier: updateSupplier.mutate,
    isUpdating: updateSupplier.isPending,
    
    deleteSupplier: deleteSupplier.mutate,
    isDeleting: deleteSupplier.isPending,
    
    importFromAPI: importFromAPI.mutate,
    isImporting: importFromAPI.isPending,
    
    exportSuppliers: exportSuppliers.mutate,
    isExporting: exportSuppliers.isPending
  }
}
