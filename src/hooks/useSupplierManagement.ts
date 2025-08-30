import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  supplier_type?: string;
  country?: string;
  sector?: string;
  logo_url?: string;
  description?: string;
  connection_status?: string;
  last_sync_at?: string;
  sync_frequency?: string;
  product_count?: number;
  tags?: string[];
  rating?: number;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SupplierFeed {
  id: string;
  supplier_id: string;
  user_id: string;
  feed_type: 'csv' | 'xml' | 'json' | 'api';
  feed_url?: string;
  feed_config: Record<string, any>;
  field_mapping: Record<string, string>;
  authentication: Record<string, any>;
  is_active: boolean;
  last_import_at?: string;
  last_import_status: 'success' | 'error' | 'pending' | 'processing';
  error_log: any[];
  created_at: string;
  updated_at: string;
}

export interface ImportBatch {
  id: string;
  supplier_id: string;
  user_id: string;
  batch_type: 'csv' | 'xml' | 'json' | 'api';
  status: 'processing' | 'completed' | 'failed' | 'cancelled';
  total_products: number;
  processed_products: number;
  successful_imports: number;
  failed_imports: number;
  error_details: any[];
  started_at: string;
  completed_at?: string;
  processing_time_ms?: number;
  created_at: string;
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  user_id: string;
  external_sku: string;
  global_sku: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  stock_quantity: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  ean?: string;
  upc?: string;
  image_urls: string[];
  attributes: Record<string, any>;
  raw_data: Record<string, any>;
  import_batch_id?: string;
  last_updated: string;
  created_at: string;
}

export interface SupplierFilters {
  search?: string;
  country?: string;
  sector?: string;
  supplier_type?: string;
  connection_status?: string;
}

export const useSupplierManagement = () => {
  const { toast } = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierFeeds, setSupplierFeeds] = useState<SupplierFeed[]>([]);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch suppliers with advanced search
  const fetchSuppliers = async (filters: SupplierFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.rpc('search_suppliers', {
        search_term: filters.search || null,
        country_filter: filters.country || null,
        sector_filter: filters.sector || null,
        supplier_type_filter: filters.supplier_type || null,
        limit_count: 50,
        offset_count: 0
      });

      if (error) throw error;
      setSuppliers((data || []) as Supplier[]);
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new supplier
  const createSupplier = async (supplierData: Partial<Supplier>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          name: supplierData.name || '',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          ...supplierData
        })
        .select()
        .single();

      if (error) throw error;

      setSuppliers(prev => [...prev, data]);
      toast({
        title: "Fournisseur créé",
        description: `${data.name} a été ajouté avec succès`,
      });
      
      return data;
    } catch (err) {
      console.error('Error creating supplier:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le fournisseur",
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update supplier
  const updateSupplier = async (id: string, updates: Partial<Supplier>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSuppliers(prev => prev.map(s => s.id === id ? data : s));
      toast({
        title: "Fournisseur mis à jour",
        description: "Les modifications ont été sauvegardées",
      });
      
      return data;
    } catch (err) {
      console.error('Error updating supplier:', err);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le fournisseur",
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete supplier
  const deleteSupplier = async (id: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Fournisseur supprimé",
        description: "Le fournisseur a été supprimé avec succès",
      });
    } catch (err) {
      console.error('Error deleting supplier:', err);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fournisseur",
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create supplier feed
  const createSupplierFeed = async (feedData: Partial<SupplierFeed>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('supplier_feeds')
        .insert({
          feed_type: feedData.feed_type || 'csv',
          supplier_id: feedData.supplier_id || '',
          user_id: (await supabase.auth.getUser()).data.user?.id,
          ...feedData
        })
        .select()
        .single();

      if (error) throw error;

      setSupplierFeeds(prev => [...prev, data]);
      toast({
        title: "Flux créé",
        description: "Le flux de données a été configuré",
      });
      
      return data;
    } catch (err) {
      console.error('Error creating supplier feed:', err);
      toast({
        title: "Erreur",
        description: "Impossible de créer le flux",
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Start import job
  const startImport = async (supplierId: string, feedConfig?: any) => {
    setLoading(true);
    try {
      // Get supplier feed configuration
      const { data: feed, error: feedError } = await supabase
        .from('supplier_feeds')
        .select('*')
        .eq('supplier_id', supplierId)
        .single();

      if (feedError) throw feedError;

      // Call the ingestion edge function
      const { data, error } = await supabase.functions.invoke('supplier-ingestion', {
        body: {
          job: {
            supplier_id: supplierId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            feed_type: feed.feed_type,
            feed_url: feed.feed_url,
            feed_config: { ...(feed.feed_config as any), ...feedConfig },
            field_mapping: feed.field_mapping as any,
            authentication: feed.authentication as any
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Import démarré",
        description: `Import de ${data.totalProducts} produits en cours`,
      });

      // Refresh import batches
      fetchImportBatches(supplierId);
      
      return data;
    } catch (err) {
      console.error('Error starting import:', err);
      toast({
        title: "Erreur d'import",
        description: "Impossible de démarrer l'import",
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Fetch import batches
  const fetchImportBatches = async (supplierId?: string) => {
    try {
      let query = supabase
        .from('import_batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (supplierId) {
        query = query.eq('supplier_id', supplierId);
      }

      const { data, error } = await query;
      if (error) throw error;

      setImportBatches(data || []);
    } catch (err) {
      console.error('Error fetching import batches:', err);
    }
  };

  // Fetch supplier products
  const fetchSupplierProducts = async (supplierId: string, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('supplier_products')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setSupplierProducts(data || []);
    } catch (err) {
      console.error('Error fetching supplier products:', err);
    }
  };

  // Test supplier connection
  const testConnection = async (supplierId: string) => {
    setLoading(true);
    try {
      // Get supplier feed
      const { data: feed, error: feedError } = await supabase
        .from('supplier_feeds')
        .select('*')
        .eq('supplier_id', supplierId)
        .single();

      if (feedError) throw feedError;

      // Test the connection based on feed type
      let testResult = false;
      
      switch (feed.feed_type) {
        case 'api':
          if (feed.feed_url) {
            const response = await fetch(feed.feed_url, {
              headers: (feed.authentication as any)?.api_key ? {
                'Authorization': `Bearer ${(feed.authentication as any).api_key}`
              } : {}
            });
            testResult = response.ok;
          }
          break;
        case 'csv':
        case 'xml':
          if (feed.feed_url) {
            const response = await fetch(feed.feed_url);
            testResult = response.ok;
          }
          break;
        default:
          testResult = true;
      }

      // Update connection status
      await updateSupplier(supplierId, {
        connection_status: testResult ? 'connected' : 'error'
      });

      toast({
        title: testResult ? "Connexion réussie" : "Échec de connexion",
        description: testResult ? 
          "Le fournisseur est accessible" : 
          "Impossible de se connecter au fournisseur",
        variant: testResult ? "default" : "destructive"
      });

      return testResult;
    } catch (err) {
      console.error('Error testing connection:', err);
      await updateSupplier(supplierId, {
        connection_status: 'error'
      });
      
      toast({
        title: "Erreur de test",
        description: "Impossible de tester la connexion",
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const getSupplierStats = () => {
    const totalSuppliers = suppliers.length;
    const connectedSuppliers = suppliers.filter(s => s.connection_status === 'connected').length;
    const totalProducts = suppliers.reduce((sum, s) => sum + s.product_count, 0);
    const avgRating = suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / totalSuppliers || 0;
    const topCountries = [...new Set(suppliers.map(s => s.country))].slice(0, 5);

    return {
      totalSuppliers,
      connectedSuppliers,
      totalProducts,
      avgRating: Math.round(avgRating * 10) / 10,
      topCountries
    };
  };

  // Initialize
  useEffect(() => {
    fetchSuppliers();
    fetchImportBatches();
  }, []);

  return {
    // Data
    suppliers,
    supplierFeeds,
    importBatches,
    supplierProducts,
    loading,
    error,
    
    // Actions
    fetchSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    createSupplierFeed,
    startImport,
    fetchImportBatches,
    fetchSupplierProducts,
    testConnection,
    
    // Computed
    stats: getSupplierStats()
  };
};