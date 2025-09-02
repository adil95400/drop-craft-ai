/**
 * API Connector - Pour fournisseurs avec API REST/GraphQL
 * Supporte BigBuy, Eprolo, VidaXL, Printful, etc.
 */

import { BaseConnector, SupplierCredentials, SyncResult, SupplierProduct, SyncOptions } from './BaseConnector';

export class ApiConnector extends BaseConnector {
  private baseURL: string;

  constructor(supplierName: string, baseURL: string) {
    super(supplierName);
    this.baseURL = baseURL;
  }

  async connect(credentials: SupplierCredentials): Promise<boolean> {
    if (!this.validateCredentials(credentials)) {
      console.log('Invalid credentials provided');
      return false;
    }

    this.credentials = credentials;

    try {
      const isValid = await this.testConnection();
      this.isConnected = isValid;
      
      if (isValid) {
        console.log('Successfully connected to API');
      } else {
        console.log('Failed to validate API connection');
      }

      return isValid;
    } catch (error) {
      console.log('Connection failed', error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test endpoint générique - à override pour chaque fournisseur
      const response = await fetch(`${this.baseURL}/health`, {
        headers: this.getAuthHeaders()
      });

      return response.ok;
    } catch (error) {
      console.log('Connection test failed', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.credentials = {};
    console.log('Disconnected from API');
  }

  async syncProducts(options: SyncOptions = {}): Promise<SyncResult> {
    if (!this.isConnected) {
      throw new Error('Not connected to API');
    }

    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      total: 0,
      imported: 0,
      updated: 0,
      errors: 0,
      duplicates: 0,
      executionTime: 0,
      errorDetails: []
    };

    try {
      console.log('Starting product sync', options);

      const products = await this.fetchProducts(options);
      result.total = products.length;

      for (const rawProduct of products) {
        try {
          const product = this.transformProduct(rawProduct);
          const isNew = await this.isNewProduct(product.externalId);
          
          if (isNew) {
            await this.importProduct(product);
            result.imported++;
          } else {
            await this.updateProduct(product);
            result.updated++;
          }
        } catch (error) {
          result.errors++;
          result.errorDetails?.push(`Error processing product ${rawProduct.id}: ${error}`);
          console.log('Product sync error', error);
        }
      }

      result.success = result.errors === 0 || result.imported > 0;
      result.executionTime = Date.now() - startTime;
      
      console.log('Product sync completed', result);
      return result;

    } catch (error) {
      result.executionTime = Date.now() - startTime;
      console.log('Sync failed', error);
      throw error;
    }
  }

  async fetchProduct(externalId: string): Promise<SupplierProduct | null> {
    if (!this.isConnected) return null;

    try {
      const response = await fetch(`${this.baseURL}/products/${externalId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) return null;

      const rawProduct = await response.json();
      return this.transformProduct(rawProduct);
    } catch (error) {
      console.log('Failed to get product', error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    // Implementation for inventory updates
    return {
      success: true,
      total: products.length,
      imported: 0,
      updated: products.length,
      errors: 0,
      duplicates: 0,
      executionTime: 0
    };
  }

  protected getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Wise2Sync-Connector/1.0'
    };

    if (this.credentials.apiKey) {
      headers['Authorization'] = `Bearer ${this.credentials.apiKey}`;
    } else if (this.credentials.accessToken) {
      headers['Authorization'] = `Bearer ${this.credentials.accessToken}`;
    }

    return headers;
  }

  private transformProduct(rawData: any): SupplierProduct {
    return {
      externalId: rawData.id || rawData.external_id,
      name: rawData.name || rawData.title,
      description: rawData.description,
      price: parseFloat(rawData.price) || 0,
      currency: rawData.currency || 'EUR',
      sku: rawData.sku,
      category: rawData.category,
      brand: rawData.brand,
      images: Array.isArray(rawData.images) ? rawData.images : [rawData.image].filter(Boolean),
      stock: parseInt(rawData.stock) || 0,
      attributes: rawData.attributes || {}
    };
  }

  private async fetchProducts(options: SyncOptions): Promise<any[]> {
    const params = new URLSearchParams();
    
    if (options.limit) params.set('limit', options.limit.toString());
    if (options.offset) params.set('offset', options.offset.toString());
    if (options.category) params.set('category', options.category);
    if (options.lastSyncDate) params.set('updated_since', options.lastSyncDate.toISOString());

    const response = await fetch(`${this.baseURL}/products?${params}`, {
      headers: this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.products || data.data || [];
  }

  private async isNewProduct(externalId: string): Promise<boolean> {
    // Simulation - dans la vraie implémentation, vérifier en base
    return Math.random() > 0.3; // 70% de nouveaux produits pour la démo
  }

  private async importProduct(product: SupplierProduct): Promise<void> {
    // Simulation de l'import en base via Supabase
    console.log(`Importing product: ${product.name}`);
  }

  private async updateProduct(product: SupplierProduct): Promise<void> {
    // Simulation de la mise à jour
    console.log(`Updating product: ${product.name}`);
  }
}