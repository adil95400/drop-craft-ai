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
      },
      {
        id: 'prestashop',
        name: 'prestashop',
        display_name: 'PrestaShop',
        description: 'Solution e-commerce open source',
        logo_url: '/platforms/prestashop.svg',
        category: 'E-commerce Platform',
        auth_type: 'api_key',
        required_credentials: ['shop_url', 'apiKey'],
        optional_credentials: ['language_id', 'shop_id'],
        features: {
          products: true,
          orders: true,
          customers: true,
          inventory: true,
          webhooks: false
        },
        documentation_url: 'https://devdocs.prestashop.com/1.7/webservice/',
        setup_guide_url: 'https://devdocs.prestashop.com/1.7/webservice/getting-started/'
      },
      {
        id: 'magento',
        name: 'magento',
        display_name: 'Magento',
        description: 'Plateforme e-commerce Adobe Commerce',
        logo_url: '/platforms/magento.svg',
        category: 'E-commerce Platform',
        auth_type: 'oauth',
        required_credentials: ['shop_url', 'accessToken'],
        optional_credentials: ['consumer_key', 'consumer_secret'],
        features: {
          products: true,
          orders: true,
          customers: true,
          inventory: true,
          webhooks: true
        },
        documentation_url: 'https://developer.adobe.com/commerce/webapi/',
        setup_guide_url: 'https://developer.adobe.com/commerce/webapi/get-started/'
      },
      {
        id: 'bigcommerce',
        name: 'bigcommerce',
        display_name: 'BigCommerce',
        description: 'Plateforme e-commerce SaaS',
        logo_url: '/platforms/bigcommerce.svg',
        category: 'E-commerce Platform',
        auth_type: 'api_key',
        required_credentials: ['shop_url', 'accessToken'],
        optional_credentials: ['client_id', 'client_secret'],
        features: {
          products: true,
          orders: true,
          customers: true,
          inventory: true,
          webhooks: true
        },
        documentation_url: 'https://developer.bigcommerce.com/api-docs',
        setup_guide_url: 'https://developer.bigcommerce.com/api-docs/getting-started'
      }
    ];
  }

  // Création d'un connecteur
  async createConnector(
    userId: string,
    platform: string,
    credentials: PlatformCredentials,
    config: Partial<ConnectorConfig> = {}
  ): Promise<string> {
    try {
      // Validation des credentials
      await this.validateCredentials(platform, credentials);

      // Créer la configuration en base
      const connectorConfig: ConnectorConfig = {
        id: crypto.randomUUID(),
        user_id: userId,
        platform,
        credentials,
        is_active: true,
        sync_frequency: config.sync_frequency || 'manual',
        sync_entities: config.sync_entities || ['products', 'orders', 'customers'],
        error_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...config
      };

      // Sauvegarder en base de données
      const { data, error } = await supabase
        .from('platform_connectors')
        .insert([{
          id: connectorConfig.id,
          user_id: connectorConfig.user_id,
          platform: connectorConfig.platform,
          shop_id: connectorConfig.shop_id,
          credentials: this.encryptCredentials(connectorConfig.credentials),
          is_active: connectorConfig.is_active,
          sync_frequency: connectorConfig.sync_frequency,
          sync_entities: connectorConfig.sync_entities,
          webhook_endpoints: connectorConfig.webhook_endpoints,
          error_count: connectorConfig.error_count,
          last_error: connectorConfig.last_error
        }])
        .select()
        .single();

      if (error) throw error;

      // Stocker en mémoire
      this.configs.set(connectorConfig.id, connectorConfig);

      // Créer l'instance du connecteur
      const connector = this.instantiateConnector(connectorConfig);
      this.connectors.set(connectorConfig.id, connector);

      // Configurer les webhooks si demandé
      if (config.sync_frequency === 'realtime') {
        await this.setupWebhooksForConnector(connectorConfig.id);
      }

      return connectorConfig.id;
    } catch (error) {
      console.error('Error creating connector:', error);
      throw error;
    }
  }

  // Récupération des connecteurs d'un utilisateur
  async getUserConnectors(userId: string): Promise<ConnectorConfig[]> {
    try {
      const { data, error } = await supabase
        .from('platform_connectors')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      const configs = data.map(row => ({
        ...row,
        credentials: this.decryptCredentials(row.credentials)
      }));

      // Mettre à jour le cache
      configs.forEach(config => {
        this.configs.set(config.id, config);
      });

      return configs;
    } catch (error) {
      console.error('Error fetching user connectors:', error);
      return [];
    }
  }

  // Obtenir un connecteur par ID
  async getConnector(connectorId: string): Promise<AdvancedBaseConnector | null> {
    try {
      if (this.connectors.has(connectorId)) {
        return this.connectors.get(connectorId)!;
      }

      // Charger depuis la base de données
      const { data, error } = await supabase
        .from('platform_connectors')
        .select('*')
        .eq('id', connectorId)
        .single();

      if (error || !data) return null;

      const config: ConnectorConfig = {
        ...data,
        credentials: this.decryptCredentials(data.credentials)
      };

      this.configs.set(connectorId, config);

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
      
      // Mettre à jour le statut
      await this.updateConnectorStatus(connectorId, isValid);
      
      return isValid;
    } catch (error) {
      console.error('Error testing connection:', error);
      await this.updateConnectorStatus(connectorId, false, error.message);
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
      await this.updateLastSync(connectorId);

      return results;
    } catch (error) {
      console.error('Error syncing connector:', error);
      await this.updateConnectorStatus(connectorId, false, error.message);
      throw error;
    }
  }

  // Configuration des webhooks
  async setupWebhooksForConnector(connectorId: string): Promise<void> {
    try {
      const connector = await this.getConnector(connectorId);
      const config = this.configs.get(connectorId);
      
      if (!connector || !config) return;

      const capabilities = connector.getPlatformCapabilities();
      if (!capabilities.webhooks.supported) {
        console.log(`Webhooks not supported for platform: ${config.platform}`);
        return;
      }

      const events = capabilities.webhooks.events.filter(event => {
        if (config.sync_entities.includes('products') && event.includes('product')) return true;
        if (config.sync_entities.includes('orders') && event.includes('order')) return true;
        if (config.sync_entities.includes('customers') && event.includes('customer')) return true;
        return false;
      });

      const webhookIds = await connector.setupWebhooks(events);

      // Sauvegarder les IDs des webhooks
      await supabase
        .from('platform_connectors')
        .update({
          webhook_endpoints: webhookIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectorId);

    } catch (error) {
      console.error('Error setting up webhooks:', error);
      throw error;
    }
  }

  // Traitement des webhooks
  async processWebhook(
    platform: string,
    event: any,
    signature?: string
  ): Promise<void> {
    try {
      // Trouver tous les connecteurs pour cette plateforme
      const configs = Array.from(this.configs.values())
        .filter(config => config.platform === platform && config.is_active);

      for (const config of configs) {
        const connector = await this.getConnector(config.id);
        if (!connector) continue;

        // Vérifier la signature si fournie
        if (signature && !connector.verifyWebhook(JSON.stringify(event), signature)) {
          console.warn(`Invalid webhook signature for connector ${config.id}`);
          continue;
        }

        // Traiter l'événement
        await connector.processWebhookEvent({
          id: crypto.randomUUID(),
          topic: event.topic || event.type,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          payload: event,
          processed: false,
          retry_count: 0
        });

        // Logger l'événement
        await this.logWebhookEvent(config.id, event);
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
      // Ajouter d'autres plateformes ici
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

  private encryptCredentials(credentials: PlatformCredentials): string {
    // En production, utiliser une vraie encryption
    return Buffer.from(JSON.stringify(credentials)).toString('base64');
  }

  private decryptCredentials(encrypted: string): PlatformCredentials {
    // En production, utiliser le déchiffrement correspondant
    return JSON.parse(Buffer.from(encrypted, 'base64').toString());
  }

  private async updateConnectorStatus(
    connectorId: string,
    isActive: boolean,
    errorMessage?: string
  ): Promise<void> {
    try {
      await supabase
        .from('platform_connectors')
        .update({
          is_active: isActive,
          last_error: errorMessage,
          error_count: errorMessage ? 
            supabase.sql`error_count + 1` : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', connectorId);
    } catch (error) {
      console.error('Error updating connector status:', error);
    }
  }

  private async updateLastSync(connectorId: string): Promise<void> {
    try {
      await supabase
        .from('platform_connectors')
        .update({
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', connectorId);
    } catch (error) {
      console.error('Error updating last sync:', error);
    }
  }

  private async logWebhookEvent(connectorId: string, event: any): Promise<void> {
    try {
      await supabase
        .from('webhook_events')
        .insert([{
          connector_id: connectorId,
          event_type: event.topic || event.type,
          payload: event,
          processed_at: new Date().toISOString()
        }]);
    } catch (error) {
      console.error('Error logging webhook event:', error);
    }
  }
}