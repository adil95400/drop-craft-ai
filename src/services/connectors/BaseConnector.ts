export interface SupplierCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  endpoint?: string;
  shopDomain?: string;
  sellerId?: string;
  [key: string]: any;
}

export interface SyncResult {
  success: boolean;
  total: number;
  imported: number;
  updated: number;
  errors: number;
  duplicates: number;
  executionTime: number;
  errorDetails?: string[];
}

export interface SupplierProduct {
  externalId: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  sku?: string;
  category?: string;
  brand?: string;
  images: string[];
  stock?: number;
  attributes?: Record<string, any>;
}

export interface SyncOptions {
  fullSync?: boolean;
  category?: string;
  limit?: number;
  offset?: number;
  lastSyncDate?: Date;
}

export abstract class BaseConnector {
  protected credentials: SupplierCredentials = {};
  protected isConnected: boolean = false;

  constructor(protected supplierName: string) {}

  abstract connect(credentials: SupplierCredentials): Promise<boolean>;
  abstract testConnection(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract syncProducts(options?: SyncOptions): Promise<SyncResult>;
  abstract fetchProduct(externalId: string): Promise<SupplierProduct | null>;
  abstract updateInventory(products: SupplierProduct[]): Promise<SyncResult>;
  protected abstract getAuthHeaders(): Record<string, string>;

  protected validateCredentials(credentials: SupplierCredentials): boolean {
    return !!(credentials.apiKey || credentials.username || credentials.accessToken);
  }

  getSupplierName(): string {
    return this.supplierName;
  }

  get isAuthenticated(): boolean {
    return this.isConnected;
  }
}