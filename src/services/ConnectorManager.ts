import { AdvancedBaseConnector, PlatformCredentials } from './connectors/AdvancedBaseConnector';
import { ShopifyAdvancedConnector } from './connectors/ShopifyAdvancedConnector';
import { WooCommerceConnector } from './connectors/WooCommerceConnector';
import { supabase } from '@/integrations/supabase/client';

export interface ConnectorConfig {
  id: string;
  user_id: string;
  platform: string;
  shop_id?: string;
  credentials: PlatformCredentials;
  is_active: boolean;
  last_sync_at?: string;
  sync_frequency: 'manual' | 'hourly' | 'daily' | 'realtime';
  sync_entities: ('products' | 'orders' | 'customers' | 'inventory')[];
  webhook_endpoints?: string[];
  error_count: number;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface PlatformInfo {
  id: string;
  name: string;
  display_name: string;
  description: string;
  logo_url?: string;
  category: string;
  auth_type: 'api_key' | 'oauth' | 'credentials';
  required_credentials: string[];
  optional_credentials: string[];
  features: {
    products: boolean;
    orders: boolean;
    customers: boolean;
    inventory: boolean;
    webhooks: boolean;
  };
  documentation_url?: string;
  setup_guide_url?: string;
}

export class ConnectorManager {
  private static instance: ConnectorManager;
  private connectors: Map<string, AdvancedBaseConnector> = new Map();
  private configs: Map<string, ConnectorConfig> = new Map();

  static getInstance(): ConnectorManager {
    if (!ConnectorManager.instance) {
      ConnectorManager.instance = new ConnectorManager();
    }
    return ConnectorManager.instance;
  }

  // Plateformes supportées
  getSupportedPlatforms(): PlatformInfo[] {
    return [
      {
        id: 'shopify',
        name: 'shopify',
        display_name: 'Shopify',
        description: 'Plateforme e-commerce leader mondial',
        logo_url: '/platforms/shopify.svg',
        category: 'E-commerce Platform',
        auth_type: 'api_key',
        required_credentials: ['shop_url', 'accessToken'],
        optional_credentials: ['api_version', 'webhook_secret'],
        features: {
          products: true,
          orders: true,
          customers: true,
          inventory: true,
          webhooks: true
        },
        documentation_url: 'https://shopify.dev/docs',
        setup_guide_url: 'https://help.shopify.com/en/api'
      },
      {
        id: 'woocommerce',
        name: 'woocommerce',
        display_name: 'WooCommerce',
        description: 'Plugin e-commerce pour WordPress',
        logo_url: '/platforms/woocommerce.svg',
        category: 'E-commerce Platform',
        auth_type: 'credentials',
        required_credentials: ['shop_url', 'clientId', 'clientSecret'],
        optional_credentials: ['webhook_secret', 'api_version'],
        features: {
          products: true,
          orders: true,
          customers: true,
          inventory: true,
          webhooks: true
        },
        documentation_url: 'https://woocommerce.github.io/woocommerce-rest-api-docs/',
        setup_guide_url: 'https://woocommerce.com/document/woocommerce-rest-api/'
      }
    ];
  }

  // Création d'un connecteur (version mémoire pour test)
  async createConnector(
    userId: string,
    platform: string,
    credentials: PlatformCredentials,
    config: Partial<ConnectorConfig> = {}
  ): Promise<string> {
    try {
      // Validation des credentials
      await this.validateCredentials(platform, credentials);

      // Créer la configuration en mémoire
      const connectorConfig: ConnectorConfig = {
        id: crypto.randomUUID(),
        user_id: userId,
        platform,
        credentials,
        is_active: config.is_active ?? true,
        sync_frequency: config.sync_frequency || 'manual',
        sync_entities: config.sync_entities || ['products', 'orders', 'customers'],
        error_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...config
      };

      // Stocker en mémoire
      this.configs.set(connectorConfig.id, connectorConfig);

      // Créer l'instance du connecteur
      const connector = this.instantiateConnector(connectorConfig);
      this.connectors.set(connectorConfig.id, connector);

      return connectorConfig.id;
    } catch (error) {
      console.error('Error creating connector:', error);
      throw error;
    }
  }

  // Récupération des connecteurs d'un utilisateur (version mémoire)
  async getUserConnectors(userId: string): Promise<ConnectorConfig[]> {
    try {
      const configs = Array.from(this.configs.values())
        .filter(config => config.user_id === userId && config.is_active);
      
      return configs;
    } catch (error) {
      console.error('Error fetching user connectors:', error);
      return [];
    }
  }

  // Obtenir un connecteur par ID (version mémoire)
  async getConnector(connectorId: string): Promise<AdvancedBaseConnector | null> {
    try {
      if (this.connectors.has(connectorId)) {
        return this.connectors.get(connectorId)!;
      }

      const config = this.configs.get(connectorId);
      if (!config) return null;

      const connector = this.instantiateConnector(config);
      this.connectors.set(connectorId, connector);

      return connector;
    } catch (error) {
      console.error('Error getting connector:', error);
      return null;
    }
  }

  // Test de connexion
  async testConnection(connectorId: string): Promise<boolean> {
    try {
      const connector = await this.getConnector(connectorId);
      if (!connector) return false;

      const isValid = await connector.testConnection();
      
      // Mettre à jour le statut en mémoire
      const config = this.configs.get(connectorId);
      if (config) {
        config.is_active = isValid;
        config.updated_at = new Date().toISOString();
        if (!isValid) {
          config.error_count += 1;
          config.last_error = 'Connection test failed';
        }
        this.configs.set(connectorId, config);
      }
      
      return isValid;
    } catch (error) {
      console.error('Error testing connection:', error);
      const config = this.configs.get(connectorId);
      if (config) {
        config.is_active = false;
        config.error_count += 1;
        config.last_error = error.message || 'Unknown error';
        this.configs.set(connectorId, config);
      }
      return false;
    }
  }

  // Synchronisation
  async syncConnector(
    connectorId: string,
    entities: ('products' | 'orders' | 'customers')[] = ['products'],
    options: { incremental?: boolean; since?: Date } = {}
  ): Promise<any> {
    try {
      const connector = await this.getConnector(connectorId);
      if (!connector) throw new Error('Connector not found');

      const results: any = {};

      for (const entity of entities) {
        switch (entity) {
          case 'products':
            results.products = await connector.syncProducts(options);
            break;
          case 'orders':
            results.orders = await connector.syncOrders(options);
            break;
          case 'customers':
            results.customers = await connector.syncCustomers(options);
            break;
        }
      }

      // Mettre à jour la date de dernière sync
      const config = this.configs.get(connectorId);
      if (config) {
        config.last_sync_at = new Date().toISOString();
        config.updated_at = new Date().toISOString();
        this.configs.set(connectorId, config);
      }

      return results;
    } catch (error) {
      console.error('Error syncing connector:', error);
      const config = this.configs.get(connectorId);
      if (config) {
        config.error_count += 1;
        config.last_error = error.message || 'Sync failed';
        this.configs.set(connectorId, config);
      }
      throw error;
    }
  }

  // Configuration des webhooks (simulé)
  async setupWebhooksForConnector(connectorId: string): Promise<void> {
    try {
      const connector = await this.getConnector(connectorId);
      const config = this.configs.get(connectorId);
      
      if (!connector || !config) return;

      // Simulation de la configuration des webhooks
      const events = ['products/create', 'products/update', 'orders/create', 'orders/update'];
      const webhookIds = await connector.setupWebhooks(events);

      // Mettre à jour la configuration
      config.webhook_endpoints = webhookIds;
      config.updated_at = new Date().toISOString();
      this.configs.set(connectorId, config);

    } catch (error) {
      console.error('Error setting up webhooks:', error);
      throw error;
    }
  }

  // Traitement des webhooks (simulé)
  async processWebhook(
    platform: string,
    event: any,
    signature?: string
  ): Promise<void> {
    try {
      const configs = Array.from(this.configs.values())
        .filter(config => config.platform === platform && config.is_active);

      for (const config of configs) {
        const connector = await this.getConnector(config.id);
        if (!connector) continue;

        if (signature && !connector.verifyWebhook(JSON.stringify(event), signature)) {
          console.warn(`Invalid webhook signature for connector ${config.id}`);
          continue;
        }

        await connector.processWebhookEvent({
          id: crypto.randomUUID(),
          topic: event.topic || event.type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payload: event,
          processed: false,
          retry_count: 0
        });

        // Logger l'événement en mémoire
        console.log(`Processed webhook for connector ${config.id}:`, event);
      }
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  // Méthodes privées

  private instantiateConnector(config: ConnectorConfig): AdvancedBaseConnector {
    switch (config.platform) {
      case 'shopify':
        return new ShopifyAdvancedConnector(config.credentials, config.user_id, config.shop_id);
      case 'woocommerce':
        return new WooCommerceConnector(config.credentials, config.user_id, config.shop_id);
      default:
        throw new Error(`Unsupported platform: ${config.platform}`);
    }
  }

  private async validateCredentials(platform: string, credentials: PlatformCredentials): Promise<void> {
    const platformInfo = this.getSupportedPlatforms().find(p => p.id === platform);
    if (!platformInfo) {
      throw new Error(`Platform ${platform} not supported`);
    }

    for (const field of platformInfo.required_credentials) {
      if (!credentials[field as keyof PlatformCredentials]) {
        throw new Error(`Missing required credential: ${field}`);
      }
    }
  }

  // Méthodes utilitaires pour l'encryption (simulées)
  private encryptCredentials(credentials: PlatformCredentials): string {
    return Buffer.from(JSON.stringify(credentials)).toString('base64');
  }

  private decryptCredentials(encrypted: string): PlatformCredentials {
    return JSON.parse(Buffer.from(encrypted, 'base64').toString());
  }

  // Méthodes pour la gestion des statistiques
  getConnectorStats(userId: string): any {
    const userConfigs = Array.from(this.configs.values())
      .filter(config => config.user_id === userId);

    return {
      total: userConfigs.length,
      active: userConfigs.filter(c => c.is_active).length,
      inactive: userConfigs.filter(c => !c.is_active).length,
      platforms: [...new Set(userConfigs.map(c => c.platform))],
      lastSync: userConfigs.reduce((latest, config) => {
        if (!latest || (config.last_sync_at && config.last_sync_at > latest)) {
          return config.last_sync_at;
        }
        return latest;
      }, null as string | null)
    };
  }

  // Nettoyage des ressources
  clearConnectors(userId: string): void {
    const userConfigs = Array.from(this.configs.entries())
      .filter(([_, config]) => config.user_id === userId);

    userConfigs.forEach(([id, _]) => {
      this.connectors.delete(id);
      this.configs.delete(id);
    });
  }
}