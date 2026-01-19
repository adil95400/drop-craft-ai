import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';
import { supabase } from '@/integrations/supabase/client';

export class AliExpressConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://api-sg.aliexpress.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'AliExpress Dropshipping';
  }

  async validateCredentials(): Promise<boolean> {
    return !!this.credentials.access_token;
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('supplier_products')
        .select('*')
        .eq('source', 'aliexpress')
        .limit(options.limit || 50);

      if (error || !data) return [];
      return data.map((p: any) => this.mapToSupplierProduct(p));
    } catch {
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const client = supabase as any;
      const { data, error } = await client
        .from('supplier_products')
        .select('*')
        .eq('source', 'aliexpress')
        .eq('external_product_id', sku)
        .single();

      return error || !data ? null : this.mapToSupplierProduct(data);
    } catch {
      return null;
    }
  }

  private mapToSupplierProduct(p: any): SupplierProduct {
    const images: string[] = p.image_url ? [p.image_url] : [];
    if (Array.isArray(p.images)) images.push(...p.images.filter((i: any) => typeof i === 'string'));
    const attrs = typeof p.attributes === 'object' && p.attributes ? p.attributes : {};

    return {
      id: p.id,
      sku: p.external_product_id || p.id,
      title: p.title || '',
      description: p.description || '',
      price: p.price || 0,
      costPrice: p.cost_price || 0,
      currency: p.currency || 'USD',
      stock: p.stock_quantity || 0,
      images,
      category: attrs.category || '',
      brand: attrs.brand || '',
      supplier: { id: 'aliexpress', name: 'AliExpress Dropshipping', sku: p.external_product_id || p.id },
      attributes: attrs
    };
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { result.errors.push('Not authenticated'); return result; }

    const client = supabase as any;
    for (const product of products) {
      const { error } = await client.from('supplier_products').upsert({
        user_id: user.id, source: 'aliexpress', external_product_id: product.sku,
        title: product.title, description: product.description, price: product.price,
        cost_price: product.costPrice, currency: product.currency, stock_quantity: product.stock,
        image_url: product.images[0] || null, images: product.images,
        attributes: { category: product.category, brand: product.brand, ...product.attributes }
      });
      error ? result.errors.push(product.sku) : result.imported++;
    }
    return result;
  }
}
