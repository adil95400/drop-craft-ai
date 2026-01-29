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
    const { data, error } = await (supabase as any)
      .from('supplier_networks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async connectNetwork(userId: string, networkId: string, networkName: string, credentials?: any) {
    const { data, error } = await (supabase as any)
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

  async syncBTSWholesaler(supplierId: string, userId: string, limit?: number) {
    const { data, error } = await supabase.functions.invoke('bts-feed-sync', {
      body: { supplierId, userId, action: 'sync', limit: limit || 0 }
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
    let query = (supabase as any)
      .from('supplier_catalog')
      .select('*')
      .order('created_at', { ascending: false });

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
    return data || [];
  }

  async quickImportProduct(userId: string, catalogProductId: string, customizations?: any) {
    // Get catalog product
    const { data: catalogProduct, error: catalogError } = await (supabase as any)
      .from('supplier_catalog')
      .select('*')
      .eq('id', catalogProductId)
      .single();

    if (catalogError) throw catalogError;

    const cp = catalogProduct as any;
    const supplierInfo = cp.supplier_info as Record<string, any> || {};
    
    // Import to user's products
    const { data: importedProduct, error: importError } = await supabase
      .from('products')
      .insert({
        user_id: userId,
        name: customizations?.name || cp.title,
        description: customizations?.description || cp.description,
        price: customizations?.price || (cp.price || 0) * 1.5, // 50% markup default
        cost_price: cp.cost_price,
        sku: cp.external_product_id,
        image_url: cp.images?.[0],
        category: cp.category,
        stock_quantity: cp.stock_quantity,
        status: 'active'
      } as any)
      .select()
      .single();

    if (importError) throw importError;

    // Log import activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'quick_import',
        entity_type: 'product',
        entity_id: importedProduct.id,
        description: `Imported product from catalog: ${cp.title}`,
        details: {
          catalog_product_id: catalogProductId,
          import_config: customizations || {}
        }
      });

    return importedProduct;
  }

  async getImportHistory(userId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'quick_import')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
}

export const supplierNetworkService = SupplierNetworkService.getInstance();
