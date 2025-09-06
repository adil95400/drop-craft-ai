export interface SupplierConnectorInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  status: 'available' | 'beta' | 'coming_soon';
  authType: 'api_key' | 'credentials' | 'oauth';
  logo?: string;
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
  setupComplexity?: 'easy' | 'medium' | 'advanced';
}

export interface SyncSchedule {
  id: string;
  connectorId: string;
  frequency: 'hourly' | 'daily' | 'weekly';
  active: boolean;
  enabled: boolean;
  nextRun: Date;
}

class SupplierHubService {
  private connectors: SupplierConnectorInfo[] = [
    {
      id: 'aliexpress',
      name: 'AliExpress',
      displayName: 'AliExpress',
      description: 'Plateforme de commerce électronique chinoise',
      category: 'Marketplace',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/aliexpress.svg',
      features: { products: true, inventory: true, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'medium'
    },
    {
      id: 'shopify',
      name: 'Shopify',
      displayName: 'Shopify',
      description: 'Plateforme e-commerce complète',
      category: 'E-commerce',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/shopify.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 40, requestsPerHour: 2400 },
      setupComplexity: 'easy'
    },
    {
      id: 'amazon',
      name: 'Amazon',
      displayName: 'Amazon Marketplace',
      description: 'Plus grande marketplace mondiale',
      category: 'Marketplace',
      status: 'available',
      authType: 'credentials',
      logo: '/logos/amazon.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 25, requestsPerHour: 1500 },
      setupComplexity: 'advanced'
    },
    {
      id: 'ebay',
      name: 'eBay',
      displayName: 'eBay Marketplace',
      description: 'Plateforme de vente aux enchères et achat immédiat',
      category: 'Marketplace',
      status: 'available',
      authType: 'oauth',
      logo: '/logos/ebay.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 50, requestsPerHour: 3000 },
      setupComplexity: 'medium'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce',
      displayName: 'WooCommerce',
      description: 'Solution e-commerce WordPress',
      category: 'E-commerce',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/woocommerce.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 3600 },
      setupComplexity: 'easy'
    },
    {
      id: 'magento',
      name: 'Magento',
      displayName: 'Magento Commerce',
      description: 'Plateforme e-commerce enterprise',
      category: 'E-commerce',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/magento.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 35, requestsPerHour: 2100 },
      setupComplexity: 'advanced'
    },
    {
      id: 'prestashop',
      name: 'PrestaShop',
      displayName: 'PrestaShop',
      description: 'Solution e-commerce open source',
      category: 'E-commerce',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/prestashop.svg',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 45, requestsPerHour: 2700 },
      setupComplexity: 'medium'
    },
    {
      id: 'bigbuy',
      name: 'BigBuy',
      displayName: 'BigBuy Dropshipping',
      description: 'Fournisseur dropshipping européen',
      category: 'Dropshipping',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/bigbuy.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 1200 },
      setupComplexity: 'easy'
    },
    {
      id: 'printful',
      name: 'Printful',
      displayName: 'Printful POD',
      description: 'Print-on-demand et dropshipping',
      category: 'Print-on-Demand',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/printful.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 },
      setupComplexity: 'easy'
    },
    {
      id: 'spocket',
      name: 'Spocket',
      displayName: 'Spocket Dropshipping',
      description: 'Fournisseurs européens et américains',
      category: 'Dropshipping',
      status: 'available',
      authType: 'api_key',
      logo: '/logos/spocket.svg',
      features: { products: true, inventory: true, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'medium'
    },
    {
      id: 'temu',
      name: 'Temu',
      displayName: 'Temu Marketplace',
      description: 'Marketplace chinoise populaire',
      category: 'Marketplace',
      status: 'beta',
      authType: 'api_key',
      logo: '/logos/temu.svg',
      features: { products: true, inventory: false, orders: false, webhooks: false },
      rateLimits: { requestsPerMinute: 15, requestsPerHour: 900 },
      setupComplexity: 'advanced'
    },
    {
      id: 'walmart',
      name: 'Walmart',
      displayName: 'Walmart Marketplace',
      description: 'Géant américain du retail',
      category: 'Marketplace',
      status: 'coming_soon',
      authType: 'oauth',
      logo: '/logos/walmart.svg',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 1200 },
      setupComplexity: 'advanced'
    }
  ];

  getAvailableConnectors(): SupplierConnectorInfo[] {
    return this.connectors;
  }

  async connectSupplier(connectorId: string, credentials: Record<string, string>): Promise<boolean> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Connecting to ${connectorId} with credentials:`, credentials);
        resolve(Math.random() > 0.1); // 90% success rate
      }, 1000);
    });
  }

  async disconnectSupplier(connectorId: string): Promise<boolean> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`Disconnecting from ${connectorId}`);
        resolve(true);
      }, 500);
    });
  }

  async syncProducts(connectorId: string, options?: any): Promise<any> {
    // Simulate sync process
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          imported: Math.floor(Math.random() * 50) + 10,
          duplicates: Math.floor(Math.random() * 5),
          errors: Math.floor(Math.random() * 2)
        });
      }, 2000);
    });
  }

  async syncSupplierProducts(connectorId: string, options?: any): Promise<any> {
    return this.syncProducts(connectorId, options);
  }

  async scheduleSync(connectorId: string, schedule: any): Promise<boolean> {
    console.log(`Scheduling sync for ${connectorId}`, schedule);
    return true;
  }

  async triggerManualSync(connectorId: string): Promise<any> {
    return this.syncProducts(connectorId);
  }

  getSyncSchedules(): SyncSchedule[] {
    return [];
  }

  autoDetectFields(data: any): any {
    return {};
  }
}

export const supplierHub = new SupplierHubService();