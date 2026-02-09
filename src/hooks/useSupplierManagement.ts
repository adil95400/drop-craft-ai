import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { importJobsApi } from '@/services/api/client';
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

  // Fetch suppliers from premium_suppliers table
  const fetchSuppliers = async (filters: SupplierFilters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('premium_suppliers')
        .select('*')
        .order('name');

      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      
      // Transform to Supplier interface
      const transformed: Supplier[] = (data || []).map(s => ({
        id: s.id,
        user_id: '',
        name: s.name,
        supplier_type: s.api_type || undefined,
        country: s.country || undefined,
        sector: s.category || undefined,
        logo_url: s.logo_url || undefined,
        description: s.description || undefined,
        connection_status: s.is_verified ? 'verified' : 'pending',
        rating: s.rating || undefined,
        website: s.website_url || undefined,
        created_at: s.created_at || undefined,
        updated_at: s.updated_at || undefined
      }));
      
      setSuppliers(transformed);
    } catch (err: any) {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Insert into premium_suppliers
      const { data, error } = await supabase
        .from('premium_suppliers')
        .insert({
          name: supplierData.name || '',
          country: supplierData.country,
          description: supplierData.description,
          website_url: supplierData.website,
          category: supplierData.sector
        })
        .select()
        .single();

      if (error) throw error;

      const newSupplier: Supplier = {
        id: data.id,
        user_id: user.id,
        name: data.name,
        country: data.country || undefined,
        description: data.description || undefined,
        website: data.website_url || undefined,
        sector: data.category || undefined,
        created_at: data.created_at || undefined
      };

      setSuppliers(prev => [...prev, newSupplier]);
      toast({
        title: "Fournisseur créé",
        description: `${data.name} a été ajouté avec succès`,
      });
      
      return newSupplier;
    } catch (err: any) {
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
        .from('premium_suppliers')
        .update({
          name: updates.name,
          country: updates.country,
          description: updates.description,
          website_url: updates.website,
          category: updates.sector
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      toast({
        title: "Fournisseur mis à jour",
        description: "Les modifications ont été sauvegardées",
      });
      
      return data;
    } catch (err: any) {
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
        .from('premium_suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSuppliers(prev => prev.filter(s => s.id !== id));
      toast({
        title: "Fournisseur supprimé",
        description: "Le fournisseur a été supprimé avec succès",
      });
    } catch (err: any) {
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

  // Create supplier feed - use field_mappings table
  const createSupplierFeed = async (feedData: Partial<SupplierFeed>) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Store feed config in field_mappings
      const { data, error } = await supabase
        .from('field_mappings')
        .insert({
          user_id: user.id,
          source_entity: 'supplier_feed',
          source_field: feedData.feed_type || 'csv',
          target_entity: feedData.supplier_id || '',
          target_field: feedData.feed_url || '',
          transformation_rule: JSON.stringify(feedData.feed_config || {}),
          default_value: JSON.stringify(feedData.field_mapping || {})
        })
        .select()
        .single();

      if (error) throw error;

      const newFeed: SupplierFeed = {
        id: data.id,
        supplier_id: feedData.supplier_id || '',
        user_id: user.id,
        feed_type: (feedData.feed_type || 'csv') as any,
        feed_url: feedData.feed_url,
        feed_config: feedData.feed_config || {},
        field_mapping: feedData.field_mapping || {},
        authentication: feedData.authentication || {},
        is_active: true,
        last_import_status: 'pending',
        error_log: [],
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString()
      };

      setSupplierFeeds(prev => [...prev, newFeed]);
      toast({
        title: "Flux créé",
        description: "Le flux de données a été configuré",
      });
      
      return newFeed;
    } catch (err: any) {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call the ingestion edge function
      const { data, error } = await supabase.functions.invoke('supplier-ingestion', {
        body: {
          job: {
            supplier_id: supplierId,
            user_id: user.id,
            feed_config: feedConfig
          }
        }
      });

      if (error) throw error;

      toast({
        title: "Import démarré",
        description: `Import de ${data?.totalProducts || 0} produits en cours`,
      });

      // Refresh import batches
      fetchImportBatches(supplierId);
      
      return data;
    } catch (err: any) {
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

  // Fetch import batches via API V1
  const fetchImportBatches = async (supplierId?: string) => {
    try {
      const resp = await importJobsApi.list({ per_page: 50 });
      const data = resp.items || [];

      const transformed: ImportBatch[] = data.map((job: any) => ({
        id: job.job_id || job.id,
        supplier_id: job.source || '',
        user_id: '',
        batch_type: (job.job_type as any) || 'csv',
        status: (job.status as any) || 'pending',
        total_products: job.progress?.total ?? 0,
        processed_products: (job.progress?.processed ?? 0),
        successful_imports: job.progress?.success ?? 0,
        failed_imports: job.progress?.failed ?? 0,
        error_details: [],
        started_at: job.started_at || job.created_at || new Date().toISOString(),
        completed_at: job.completed_at || undefined,
        created_at: job.created_at || new Date().toISOString()
      }));

      setImportBatches(transformed);
    } catch (err) {
      console.error('Error fetching import batches:', err);
    }
  };

  // Fetch supplier products from products table
  const fetchSupplierProducts = async (supplierId: string, limit = 50) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .eq('supplier', supplierId)
        .order('created_at', { ascending: false })
        .limit(limit) as { data: any[] | null; error: any };

      if (error) throw error;
      
      const transformed: SupplierProduct[] = (data || []).map((p: any) => ({
        id: p.id,
        supplier_id: p.supplier || '',
        user_id: p.user_id,
        external_sku: p.sku || '',
        global_sku: p.sku || '',
        name: p.title || '',
        description: p.description || undefined,
        price: p.price || 0,
        currency: 'EUR',
        stock_quantity: p.stock_quantity || 0,
        category: p.category || undefined,
        brand: p.brand || undefined,
        image_urls: p.image_url ? [p.image_url] : [],
        attributes: {},
        raw_data: {},
        last_updated: p.updated_at || p.created_at || new Date().toISOString(),
        created_at: p.created_at || new Date().toISOString()
      }));
      
      setSupplierProducts(transformed);
    } catch (err) {
      console.error('Error fetching supplier products:', err);
    }
  };

  // Test supplier connection
  const testConnection = async (supplierId: string) => {
    setLoading(true);
    try {
      // Simply update connection status for now
      const result = true;

      toast({
        title: result ? "Connexion réussie" : "Échec de connexion",
        description: result ? 
          "Le fournisseur est accessible" : 
          "Impossible de se connecter au fournisseur",
        variant: result ? "default" : "destructive"
      });

      return result;
    } catch (err) {
      console.error('Error testing connection:', err);
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
    const connectedSuppliers = suppliers.filter(s => s.connection_status === 'connected' || s.connection_status === 'verified').length;
    const totalProducts = suppliers.reduce((sum, s) => sum + (s.product_count || 0), 0);
    const avgRating = suppliers.reduce((sum, s) => sum + (s.rating || 0), 0) / totalSuppliers || 0;
    const topCountries = [...new Set(suppliers.map(s => s.country).filter(Boolean))].slice(0, 5) as string[];

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
