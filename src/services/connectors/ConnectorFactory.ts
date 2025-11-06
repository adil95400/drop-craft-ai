import { SupplierConnector, SupplierCredentials } from '@/types/suppliers';
import { BaseConnector } from './BaseConnector';
import { ShopifyConnector } from './ShopifyConnector';
import { WooCommerceConnector } from './WooCommerceConnector';
import { AmazonConnector } from './AmazonConnector';
import { EtsyConnector } from './EtsyConnector';
import { CdiscountConnector } from './CdiscountConnector';

export class ConnectorFactory {
  private static connectors: Map<string, SupplierConnector> = new Map([
    ['shopify', {
      id: 'shopify',
      name: 'shopify',
      displayName: 'Shopify',
      description: 'Connectez votre boutique Shopify',
      category: 'ecommerce',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 40, requestsPerHour: 2000 },
    }],
    ['woocommerce', {
      id: 'woocommerce',
      name: 'woocommerce',
      displayName: 'WooCommerce',
      description: 'Connectez votre boutique WooCommerce',
      category: 'ecommerce',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['amazon', {
      id: 'amazon',
      name: 'amazon',
      displayName: 'Amazon SP-API',
      description: 'Connectez votre compte Amazon Seller',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 500 },
    }],
    ['etsy', {
      id: 'etsy',
      name: 'etsy',
      displayName: 'Etsy',
      description: 'Connectez votre boutique Etsy',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 10, requestsPerHour: 10000 },
    }],
    ['cdiscount', {
      id: 'cdiscount',
      name: 'cdiscount',
      displayName: 'Cdiscount',
      description: 'Connectez votre compte vendeur Cdiscount',
      category: 'marketplace',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
  ]);

  static getAvailableConnectors(): SupplierConnector[] {
    return Array.from(this.connectors.values());
  }

  static getConnector(connectorId: string): SupplierConnector | undefined {
    return this.connectors.get(connectorId);
  }

  static async createConnectorInstance(
    connectorId: string,
    credentials: SupplierCredentials
  ): Promise<BaseConnector | null> {
    switch (connectorId) {
      case 'shopify':
        return new ShopifyConnector(credentials);
      case 'woocommerce':
        return new WooCommerceConnector(credentials);
      case 'amazon':
        return new AmazonConnector(credentials);
      case 'etsy':
        return new EtsyConnector(credentials);
      case 'cdiscount':
        return new CdiscountConnector(credentials);
      default:
        console.warn(`Connector ${connectorId} not found`);
        return null;
    }
  }

  static validateCredentials(connectorId: string, credentials: SupplierCredentials): boolean {
    const connector = this.connectors.get(connectorId);
    if (!connector) return false;

    switch (connectorId) {
      case 'shopify':
        return !!(credentials.endpoint || credentials.shop_domain) && !!credentials.accessToken;
      case 'woocommerce':
        return !!(credentials.endpoint || credentials.site_url) && !!credentials.apiKey && !!credentials.apiSecret;
      case 'amazon':
        return !!credentials.accessToken && !!credentials.marketplace_id;
      case 'etsy':
        return !!credentials.apiKey && !!credentials.shop_id && !!credentials.accessToken;
      case 'cdiscount':
        return !!credentials.apiKey;
      default:
        return false;
    }
  }
}
