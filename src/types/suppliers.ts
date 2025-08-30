export interface BaseSupplier {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  logo?: string;
  website?: string;
  country?: string;
  status: 'active' | 'inactive' | 'connected' | 'error';
  rating?: number;
}

export interface SupplierCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  username?: string;
  password?: string;
  endpoint?: string;
  [key: string]: any;
}

export interface SupplierProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  price: number;
  costPrice?: number;
  currency: string;
  stock: number;
  images: string[];
  category: string;
  brand?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  variants?: ProductVariant[];
  attributes: Record<string, any>;
  supplier: {
    id: string;
    name: string;
    sku: string;
  };
}

export interface ProductVariant {
  id: string;
  sku: string;
  title: string;
  price: number;
  costPrice?: number;
  stock: number;
  attributes: Record<string, string>; // color: "red", size: "M"
  image?: string;
}

export interface SupplierSync {
  id: string;
  supplierId: string;
  type: 'products' | 'inventory' | 'prices' | 'orders';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
  progress: number;
  totalItems: number;
  processedItems: number;
  errors: string[];
  metadata: Record<string, any>;
}

export interface SupplierConnector {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo?: string;
  category: string;
  authType: 'api_key' | 'oauth' | 'credentials' | 'none';
  features: {
    products: boolean;
    inventory: boolean;
    orders: boolean;
    webhooks: boolean;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export interface ConnectorAuth {
  supplierId: string;
  credentials: SupplierCredentials;
  isValid: boolean;
  lastValidated: Date;
  expiresAt?: Date;
}

export interface ImportJob {
  id: string;
  userId: string;
  supplierId: string;
  type: 'full_sync' | 'incremental' | 'inventory_only' | 'price_only';
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  priority: 'low' | 'normal' | 'high';
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  progress: number;
  totalItems: number;
  processedItems: number;
  successCount: number;
  errorCount: number;
  errors: string[];
  metadata: Record<string, any>;
}

export interface JobQueue {
  id: string;
  name: string;
  description: string;
  jobs: ImportJob[];
  isActive: boolean;
  concurrency: number;
  retryAttempts: number;
  retryDelay: number;
}