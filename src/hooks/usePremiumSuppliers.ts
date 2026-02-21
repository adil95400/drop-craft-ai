import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export function usePremiumSuppliers() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Récupérer les fournisseurs premium
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['premium-suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('premium_suppliers')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // Récupérer les connexions de l'utilisateur
  const { data: connections, isLoading: isLoadingConnections } = useQuery({
    queryKey: ['premium-connections'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('premium_supplier_connections')
        .select(`
          *,
          supplier:premium_suppliers(*)
        `)
        .eq('user_id', user.id)

      if (error) throw error
      return data || []
    }
  })

  // Récupérer les produits premium from supplier_products or catalog_products
  const { data: premiumProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['premium-products'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []

      // Use products (canonical table)
      const { data, error } = await (supabase
        .from('products') as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(100)

      if (error) throw error
      return data || []
    }
  })

  // Connecter un fournisseur
  const connectSupplier = useMutation({
    mutationFn: async (supplierId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase.functions.invoke('premium-supplier-connect', {
        body: {
          userId: user.id,
          supplierId
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['premium-connections'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      
      toast({
        title: 'Connexion établie ! 🎉',
        description: `${data?.data?.products_imported || 0} produits premium importés`
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erreur de connexion',
        description: error.message,
        variant: 'destructive'
      })
    }
  })

  // Déconnecter un fournisseur - use connection_status column
  const disconnectSupplier = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('premium_supplier_connections')
        .update({ connection_status: 'suspended' })
        .eq('id', connectionId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-connections'] })
      toast({
        title: 'Déconnecté',
        description: 'La connexion a été suspendue'
      })
    }
  })

  // Synchroniser un fournisseur - use premium_supplier_id column
  const syncSupplier = useMutation({
    mutationFn: async (connectionId: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Récupérer la connexion
      const { data: connection } = await supabase
        .from('premium_supplier_connections')
        .select('premium_supplier_id')
        .eq('id', connectionId)
        .single()

      if (!connection) throw new Error('Connection not found')

      // Appeler la fonction de sync
      const { data, error } = await supabase.functions.invoke('premium-supplier-connect', {
        body: {
          userId: user.id,
          supplierId: connection.premium_supplier_id
        }
      })

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['premium-connections'] })
      queryClient.invalidateQueries({ queryKey: ['imported-products'] })
      
      toast({
        title: 'Synchronisation terminée',
        description: `${data?.data?.products_imported || 0} produits mis à jour`
      })
    }
  })

  return {
    suppliers,
    connections,
    premiumProducts,
    
    isLoadingSuppliers,
    isLoadingConnections,
    isLoadingProducts,
    
    connectSupplier: connectSupplier.mutate,
    isConnecting: connectSupplier.isPending,
    
    disconnectSupplier: disconnectSupplier.mutate,
    isDisconnecting: disconnectSupplier.isPending,
    
    syncSupplier: syncSupplier.mutate,
    isSyncing: syncSupplier.isPending
  }
}
