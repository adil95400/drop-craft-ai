import { supabase } from "@/integrations/supabase/client";

export class SupplierNetworkService {
  private static instance: SupplierNetworkService;

  static getInstance(): SupplierNetworkService {
    if (!SupplierNetworkService.instance) {
      SupplierNetworkService.instance = new SupplierNetworkService();
    }
    return SupplierNetworkService.instance;
  }

  async getSupplierNetworks(userId: string) {
    const { data, error } = await supabase
      .from('supplier_networks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async connectNetwork(userId: string, networkId: string, networkName: string, credentials?: any) {
    const { data, error } = await supabase
      .from('supplier_networks')
      .insert({
        user_id: userId,
        network_id: networkId,
        network_name: networkName,
        connection_status: 'connected',
        api_credentials: credentials || {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async syncCatalog(networkId: string, userId: string) {
    const { data, error } = await supabase.functions.invoke('supplier-catalog-sync', {
      body: { networkId, userId, action: 'sync' }
    });

    if (error) throw error;
    return data;
  }

  async getCatalogProducts(filters?: {
    networkId?: string;
    category?: string;
    search?: string;
    limit?: number;
  }) {
    let query = supabase
      .from('supplier_catalog')
      .select('*')
      .order('is_trending', { ascending: false })
      .order('rating', { ascending: false });

    if (filters?.networkId) {
      query = query.eq('network_id', filters.networkId);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async quickImportProduct(userId: string, catalogProductId: string, customizations?: any) {
    // Get catalog product
    const { data: catalogProduct, error: catalogError } = await supabase
      .from('supplier_catalog')
      .select('*')
      .eq('id', catalogProductId)
      .single();

    if (catalogError) throw catalogError;

    // Import to user's products
    const supplierInfo = catalogProduct.supplier_info as Record<string, any> || {};
    const { data: importedProduct, error: importError } = await supabase
      .from('imported_products')
      .insert({
        user_id: userId,
        name: customizations?.name || catalogProduct.title,
        description: customizations?.description || catalogProduct.description,
        price: customizations?.price || catalogProduct.price * 1.5, // 50% markup default
        cost_price: catalogProduct.cost_price,
        sku: catalogProduct.external_product_id,
        images: catalogProduct.images,
        category: catalogProduct.category,
        stock: catalogProduct.stock_quantity,
        supplier_info: {
          ...supplierInfo,
          catalog_id: catalogProductId,
          network_id: catalogProduct.network_id
        }
      })
      .select()
      .single();

    if (importError) throw importError;

    // Log import history
    await supabase
      .from('quick_import_history')
      .insert({
        user_id: userId,
        catalog_product_id: catalogProductId,
        imported_product_id: importedProduct.id,
        import_status: 'success',
        import_config: customizations || {}
      });

    return importedProduct;
  }

  async getImportHistory(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('quick_import_history')
      .select('*, catalog_product:catalog_product_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

export const supplierNetworkService = SupplierNetworkService.getInstance();
