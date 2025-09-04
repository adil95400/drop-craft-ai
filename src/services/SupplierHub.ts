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