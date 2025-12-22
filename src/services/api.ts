import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Generic API service with real Supabase integration
export class ApiService {
  // Products API
  static async getProducts(filters?: any) {
    try {
      let query = supabase.from('products').select('*');
      
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les produits",
        variant: "destructive"
      });
      return [];
    }
  }

  static async createProduct(product: any) {
    try {
      const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Produit créé avec succès"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le produit",
        variant: "destructive"
      });
      throw error;
    }
  }

  static async updateProduct(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Produit mis à jour avec succès"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le produit",
        variant: "destructive"
      });
      throw error;
    }
  }

  static async deleteProduct(id: string) {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès"
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Orders API
  static async getOrders(filters?: any) {
    try {
      let query = supabase.from('orders').select('*, order_items(*)');
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les commandes",
        variant: "destructive"
      });
      return [];
    }
  }

  static async updateOrderStatus(id: string, status: string, trackingNumber?: string) {
    try {
      const updates: any = { status };
      if (trackingNumber) {
        updates.tracking_number = trackingNumber;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Statut de commande mis à jour"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commande",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Customers API
  static async getCustomers(filters?: any) {
    try {
      let query = supabase.from('customers').select('*');
      
      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les clients",
        variant: "destructive"
      });
      return [];
    }
  }

  static async createCustomer(customer: any) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Client créé avec succès"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le client",
        variant: "destructive"
      });
      throw error;
    }
  }

  static async updateCustomer(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Client mis à jour avec succès"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le client",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Integrations API
  static async getIntegrations() {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les intégrations",
        variant: "destructive"
      });
      return [];
    }
  }

  static async createIntegration(integration: any) {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .insert([integration])
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Intégration créée avec succès"
      });
      
      return data;
    } catch (error) {
      console.error('Error creating integration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'intégration",
        variant: "destructive"
      });
      throw error;
    }
  }

  static async updateIntegration(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Intégration mise à jour avec succès"
      });
      
      return data;
    } catch (error) {
      console.error('Error updating integration:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour l'intégration",
        variant: "destructive"
      });
      throw error;
    }
  }

  // File upload helper
  static async uploadFile(file: File, bucket: string, path: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'uploader le fichier",
        variant: "destructive"
      });
      throw error;
    }
  }

  // Edge Functions helpers
  static async callEdgeFunction(functionName: string, payload: any) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error calling ${functionName}:`, error);
      toast({
        title: "Erreur",
        description: `Erreur lors de l'appel à ${functionName}`,
        variant: "destructive"
      });
      throw error;
    }
  }
}