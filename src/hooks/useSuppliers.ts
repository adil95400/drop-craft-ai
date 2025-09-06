import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Supplier {
  id: string
  user_id: string
  name: string
  supplier_type: 'api' | 'csv' | 'xml' | 'ftp' | 'email'
  country: string | null
  sector: string | null
  logo_url: string | null
  website: string | null
  description: string | null
  connection_status: 'connected' | 'disconnected' | 'error' | 'pending'
  api_endpoint: string | null
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'weekly'
  last_sync_at: string | null
  next_sync_at: string | null
  product_count: number
  success_rate: number
  error_count: number
  tags: string[] | null
  rating: number
  is_premium: boolean
  created_at: string
  updated_at: string
}

export interface CreateSupplierData {
  name: string
  supplier_type: 'api' | 'csv' | 'xml' | 'ftp' | 'email'
  country?: string | null
  sector?: string | null
  logo_url?: string | null
  website?: string | null
  description?: string | null
  api_endpoint?: string | null
  sync_frequency?: 'manual' | 'hourly' | 'daily' | 'weekly'
  tags?: string[] | null
}

export const useSuppliers = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setSuppliers((data as Supplier[]) || [])
    } catch (error: any) {
      console.error('Error fetching suppliers:', error)
      toast({
        title: "Erreur",
        description: "Impossible de récupérer la liste des fournisseurs",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createSupplier = async (supplierData: CreateSupplierData) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([{
          ...supplierData,
          user_id: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Succès",
        description: "Fournisseur créé avec succès",
      })

      await fetchSuppliers()
      return { success: true, data }
    } catch (error: any) {
      console.error('Error creating supplier:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le fournisseur",
        variant: "destructive",
      })
      return { success: false, error: error.message }
    }
  }

  const updateSupplier = async (id: string, supplierData: Partial<CreateSupplierData>) => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(supplierData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Succès",
        description: "Fournisseur mis à jour avec succès",
      })

      await fetchSuppliers()
      return { success: true, data }
    } catch (error: any) {
      console.error('Error updating supplier:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le fournisseur",
        variant: "destructive",
      })
      return { success: false, error: error.message }
    }
  }

  const deleteSupplier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast({
        title: "Succès",
        description: "Fournisseur supprimé avec succès",
      })

      await fetchSuppliers()
      return { success: true }
    } catch (error: any) {
      console.error('Error deleting supplier:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le fournisseur",
        variant: "destructive",
      })
      return { success: false, error: error.message }
    }
  }

  const syncSupplier = async (id: string) => {
    try {
      // Create a sync job
      const { data, error } = await supabase
        .from('supplier_sync_jobs')
        .insert([{
          supplier_id: id,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          job_type: 'sync',
          status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Synchronisation lancée",
        description: "La synchronisation du fournisseur a été lancée",
      })

      return { success: true, data }
    } catch (error: any) {
      console.error('Error syncing supplier:', error)
      toast({
        title: "Erreur",
        description: error.message || "Impossible de lancer la synchronisation",
        variant: "destructive",
      })
      return { success: false, error: error.message }
    }
  }

  useEffect(() => {
    fetchSuppliers()
  }, [])

  return {
    suppliers,
    loading,
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    syncSupplier
  }
}