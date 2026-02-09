/**
 * ApiService — Legacy facade, delegates product operations to productsApi.
 * Non-product operations remain as-is until their respective API modules are built.
 */
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { productsApi } from '@/services/api/client'
import { fetchAllWithQuery } from '@/utils/supabaseUnlimited'

export class ApiService {
  // Products — delegates to API V1
  static async getProducts(filters?: any) {
    try {
      const params: any = { per_page: 500 }
      if (filters?.search) params.q = filters.search
      if (filters?.category) params.category = filters.category
      if (filters?.status) params.status = filters.status
      const resp = await productsApi.list(params)
      return resp.items ?? []
    } catch (error) {
      console.error('Error fetching products:', error)
      toast({ title: 'Erreur', description: 'Impossible de charger les produits', variant: 'destructive' })
      return []
    }
  }

  static async createProduct(product: any) {
    try {
      const resp = await productsApi.create(product)
      toast({ title: 'Succès', description: 'Produit créé avec succès' })
      return resp
    } catch (error) {
      console.error('Error creating product:', error)
      toast({ title: 'Erreur', description: 'Impossible de créer le produit', variant: 'destructive' })
      throw error
    }
  }

  static async updateProduct(id: string, updates: any) {
    try {
      const resp = await productsApi.update(id, updates)
      toast({ title: 'Succès', description: 'Produit mis à jour avec succès' })
      return resp
    } catch (error) {
      console.error('Error updating product:', error)
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le produit', variant: 'destructive' })
      throw error
    }
  }

  static async deleteProduct(id: string) {
    try {
      await productsApi.delete(id)
      toast({ title: 'Succès', description: 'Produit supprimé avec succès' })
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({ title: 'Erreur', description: 'Impossible de supprimer le produit', variant: 'destructive' })
      throw error
    }
  }

  // ── Non-product operations (unchanged, still direct Supabase) ─────────────

  static async getOrders(filters?: any) {
    try {
      const { data, error } = await fetchAllWithQuery(async (offset, limit) => {
        let query = supabase.from('orders').select('*, order_items(*)')
        if (filters?.status) query = query.eq('status', filters.status)
        if (filters?.dateFrom) query = query.gte('created_at', filters.dateFrom)
        if (filters?.dateTo) query = query.lte('created_at', filters.dateTo)
        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
        return query
      })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast({ title: 'Erreur', description: 'Impossible de charger les commandes', variant: 'destructive' })
      return []
    }
  }

  static async updateOrderStatus(id: string, status: string, trackingNumber?: string) {
    try {
      const updates: any = { status }
      if (trackingNumber) updates.tracking_number = trackingNumber
      const { data, error } = await supabase.from('orders').update(updates).eq('id', id).select().single()
      if (error) throw error
      toast({ title: 'Succès', description: 'Statut de commande mis à jour' })
      return data
    } catch (error) {
      console.error('Error updating order:', error)
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour la commande', variant: 'destructive' })
      throw error
    }
  }

  static async getCustomers(filters?: any) {
    try {
      const { data, error } = await fetchAllWithQuery(async (offset, limit) => {
        let query = (supabase.from('customers') as any).select('*')
        if (filters?.search) query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`)
        query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
        return query
      })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast({ title: 'Erreur', description: 'Impossible de charger les clients', variant: 'destructive' })
      return []
    }
  }

  static async createCustomer(customer: any) {
    try {
      const { data, error } = await supabase.from('customers').insert([customer]).select().single()
      if (error) throw error
      toast({ title: 'Succès', description: 'Client créé avec succès' })
      return data
    } catch (error) {
      console.error('Error creating customer:', error)
      toast({ title: 'Erreur', description: 'Impossible de créer le client', variant: 'destructive' })
      throw error
    }
  }

  static async updateCustomer(id: string, updates: any) {
    try {
      const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select().single()
      if (error) throw error
      toast({ title: 'Succès', description: 'Client mis à jour avec succès' })
      return data
    } catch (error) {
      console.error('Error updating customer:', error)
      toast({ title: 'Erreur', description: 'Impossible de mettre à jour le client', variant: 'destructive' })
      throw error
    }
  }

  static async getIntegrations() {
    try {
      const { data, error } = await supabase.from('integrations').select('*').order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching integrations:', error)
      toast({ title: 'Erreur', description: 'Impossible de charger les intégrations', variant: 'destructive' })
      return []
    }
  }

  static async createIntegration(integration: any) {
    try {
      const { data, error } = await supabase.from('integrations').insert([integration]).select().single()
      if (error) throw error
      toast({ title: 'Succès', description: 'Intégration créée avec succès' })
      return data
    } catch (error) {
      console.error('Error creating integration:', error)
      toast({ title: 'Erreur', description: "Impossible de créer l'intégration", variant: 'destructive' })
      throw error
    }
  }

  static async updateIntegration(id: string, updates: any) {
    try {
      const { data, error } = await supabase.from('integrations').update(updates).eq('id', id).select().single()
      if (error) throw error
      toast({ title: 'Succès', description: 'Intégration mise à jour avec succès' })
      return data
    } catch (error) {
      console.error('Error updating integration:', error)
      toast({ title: 'Erreur', description: "Impossible de mettre à jour l'intégration", variant: 'destructive' })
      throw error
    }
  }

  static async uploadFile(file: File, bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(path, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path)
      return publicUrl
    } catch (error) {
      console.error('Error uploading file:', error)
      toast({ title: 'Erreur', description: "Impossible d'uploader le fichier", variant: 'destructive' })
      throw error
    }
  }

  static async callEdgeFunction(functionName: string, payload: any) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, { body: payload })
      if (error) throw error
      return data
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error)
      toast({ title: 'Erreur', description: `Erreur lors de l'appel à ${functionName}`, variant: 'destructive' })
      throw error
    }
  }
}
