import { SupplierConnector, SupplierCredentials } from '@/types/suppliers';
import { BaseConnector } from './BaseConnector';
import { ShopifyConnector } from './ShopifyConnector';
import { WooCommerceConnector } from './WooCommerceConnector';
import { AmazonConnector } from './AmazonConnector';
import { EtsyConnector } from './EtsyConnector';
import { CdiscountConnector } from './CdiscountConnector';
import { PrestaShopConnector } from './PrestaShopConnector';
import { MagentoConnector } from './MagentoConnector';
import { BigCommerceConnector } from './BigCommerceConnector';
import { OpenCartConnector } from './OpenCartConnector';
import { SquareConnector } from './SquareConnector';
import { EcwidConnector } from './EcwidConnector';
import { WixConnector } from './WixConnector';
import { LightspeedConnector } from './LightspeedConnector';
import { RakutenConnector } from './RakutenConnector';
import { FnacConnector } from './FnacConnector';
import { ZalandoConnector } from './ZalandoConnector';
import { AliExpressConnector } from './AliExpressConnector';
import { WishConnector } from './WishConnector';
import { ShopeeConnector } from './ShopeeConnector';
import { MercadoLibreConnector } from './MercadoLibreConnector';
import { MiraklConnector } from './MiraklConnector';
// EBayConnector uses different architecture - to be integrated later
import { BigBuyConnector } from './BigBuyConnector';
import { EproloConnector } from './EproloConnector';
import { PrintfulConnector } from './PrintfulConnector';
import { SynceeConnector } from './SynceeConnector';
import { VidaXLConnector } from './VidaXLConnector';
import { AlibabaConnector } from './AlibabaConnector';

export class ConnectorFactory {
  private static connectors: Map<string, SupplierConnector> = new Map([
    // E-commerce Platforms
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
    ['prestashop', {
      id: 'prestashop',
      name: 'prestashop',
      displayName: 'PrestaShop',
      description: 'Connectez votre boutique PrestaShop',
      category: 'ecommerce',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['magento', {
      id: 'magento',
      name: 'magento',
      displayName: 'Magento',
      description: 'Connectez votre boutique Magento',
      category: 'ecommerce',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 500 },
    }],
    ['bigcommerce', {
      id: 'bigcommerce',
      name: 'bigcommerce',
      displayName: 'BigCommerce',
      description: 'Connectez votre boutique BigCommerce',
      category: 'ecommerce',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 400 },
    }],
    ['opencart', {
      id: 'opencart',
      name: 'opencart',
      displayName: 'OpenCart',
      description: 'Connectez votre boutique OpenCart',
      category: 'ecommerce',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['square', {
      id: 'square',
      name: 'square',
      displayName: 'Square',
      description: 'Connectez votre compte Square',
      category: 'ecommerce',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 100, requestsPerHour: 5000 },
    }],
    ['ecwid', {
      id: 'ecwid',
      name: 'ecwid',
      displayName: 'Ecwid',
      description: 'Connectez votre boutique Ecwid',
      category: 'ecommerce',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['wix', {
      id: 'wix',
      name: 'wix',
      displayName: 'Wix',
      description: 'Connectez votre boutique Wix',
      category: 'ecommerce',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['lightspeed', {
      id: 'lightspeed',
      name: 'lightspeed',
      displayName: 'Lightspeed',
      description: 'Connectez votre système Lightspeed',
      category: 'ecommerce',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    
    // Marketplaces
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
    ['ebay', {
      id: 'ebay',
      name: 'ebay',
      displayName: 'eBay',
      description: 'Connectez votre compte eBay',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 5, requestsPerHour: 5000 },
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
    ['rakuten', {
      id: 'rakuten',
      name: 'rakuten',
      displayName: 'Rakuten France',
      description: 'Connectez votre compte Rakuten',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['fnac', {
      id: 'fnac',
      name: 'fnac',
      displayName: 'Fnac Marketplace',
      description: 'Connectez votre compte Fnac vendeur',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 500 },
    }],
    ['zalando', {
      id: 'zalando',
      name: 'zalando',
      displayName: 'Zalando Partner',
      description: 'Connectez votre compte Zalando Partner',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 500 },
    }],
    ['aliexpress', {
      id: 'aliexpress',
      name: 'aliexpress',
      displayName: 'AliExpress',
      description: 'Connectez votre compte AliExpress',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['wish', {
      id: 'wish',
      name: 'wish',
      displayName: 'Wish',
      description: 'Connectez votre compte Wish Merchant',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['shopee', {
      id: 'shopee',
      name: 'shopee',
      displayName: 'Shopee',
      description: 'Connectez votre boutique Shopee',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['mercadolibre', {
      id: 'mercadolibre',
      name: 'mercadolibre',
      displayName: 'MercadoLibre',
      description: 'Connectez votre compte MercadoLibre',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['mirakl', {
      id: 'mirakl',
      name: 'mirakl',
      displayName: 'Mirakl',
      description: 'Connectez votre marketplace Mirakl',
      category: 'marketplace',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['alibaba', {
      id: 'alibaba',
      name: 'alibaba',
      displayName: 'Alibaba.com',
      description: 'Connectez votre compte Alibaba',
      category: 'marketplace',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 20, requestsPerHour: 500 },
    }],
    
    // Dropshipping Suppliers
    ['bigbuy', {
      id: 'bigbuy',
      name: 'bigbuy',
      displayName: 'BigBuy',
      description: 'Connectez votre compte BigBuy',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 3000 },
    }],
    ['eprolo', {
      id: 'eprolo',
      name: 'eprolo',
      displayName: 'Eprolo',
      description: 'Connectez votre compte Eprolo',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['printful', {
      id: 'printful',
      name: 'printful',
      displayName: 'Printful',
      description: 'Connectez votre compte Printful',
      category: 'supplier',
      authType: 'oauth',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 },
    }],
    ['syncee', {
      id: 'syncee',
      name: 'syncee',
      displayName: 'Syncee',
      description: 'Connectez votre compte Syncee',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1000 },
    }],
    ['vidaxl', {
      id: 'vidaxl',
      name: 'vidaxl',
      displayName: 'VidaXL',
      description: 'Connectez votre compte VidaXL',
      category: 'supplier',
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
      // E-commerce platforms
      case 'shopify':
        return new ShopifyConnector(credentials);
      case 'woocommerce':
        return new WooCommerceConnector(credentials);
      case 'prestashop':
        return new PrestaShopConnector(credentials);
      case 'magento':
        return new MagentoConnector(credentials);
      case 'bigcommerce':
        return new BigCommerceConnector(credentials);
      case 'opencart':
        return new OpenCartConnector(credentials);
      case 'square':
        return new SquareConnector(credentials);
      case 'ecwid':
        return new EcwidConnector(credentials);
      case 'wix':
        return new WixConnector(credentials);
      case 'lightspeed':
        return new LightspeedConnector(credentials);
        
      // Marketplaces
      case 'amazon':
        return new AmazonConnector(credentials);
      case 'ebay':
        // eBay uses different connector architecture - temporarily unavailable
        console.warn('eBay connector integration in progress');
        return null;
      case 'etsy':
        return new EtsyConnector(credentials);
      case 'cdiscount':
        return new CdiscountConnector(credentials);
      case 'rakuten':
        return new RakutenConnector(credentials);
      case 'fnac':
        return new FnacConnector(credentials);
      case 'zalando':
        return new ZalandoConnector(credentials);
      case 'aliexpress':
        return new AliExpressConnector(credentials);
      case 'wish':
        return new WishConnector(credentials);
      case 'shopee':
        return new ShopeeConnector(credentials);
      case 'mercadolibre':
        return new MercadoLibreConnector(credentials);
      case 'mirakl':
        return new MiraklConnector(credentials);
      case 'alibaba':
        return new AlibabaConnector(credentials);
        
      // Dropshipping suppliers
      case 'bigbuy':
        return new BigBuyConnector(credentials);
      case 'eprolo':
        return new EproloConnector(credentials);
      case 'printful':
        return new PrintfulConnector(credentials);
      case 'syncee':
        return new SynceeConnector(credentials);
      case 'vidaxl':
        return new VidaXLConnector(credentials);
        
      default:
        console.warn(`Connector ${connectorId} not found`);
        return null;
    }
  }

  static validateCredentials(connectorId: string, credentials: SupplierCredentials): boolean {
    const connector = this.connectors.get(connectorId);
    if (!connector) return false;

    switch (connectorId) {
      // E-commerce platforms
      case 'shopify':
        return !!(credentials.endpoint || credentials.shop_domain) && !!credentials.accessToken;
      case 'woocommerce':
        return !!(credentials.endpoint || credentials.site_url) && !!credentials.apiKey && !!credentials.apiSecret;
      case 'prestashop':
        return !!(credentials.shop_url || credentials.domain) && !!credentials.webservice_key;
      case 'magento':
        return !!(credentials.base_url || credentials.domain) && !!credentials.access_token;
      case 'bigcommerce':
        return !!credentials.store_hash && !!credentials.access_token;
      case 'opencart':
        return !!(credentials.shop_url || credentials.domain) && !!credentials.apiKey;
      case 'square':
        return !!credentials.access_token && !!credentials.location_id;
      case 'ecwid':
        return !!credentials.store_id && !!credentials.access_token;
      case 'wix':
        return !!credentials.access_token && !!credentials.site_id;
      case 'lightspeed':
        return !!credentials.access_token && !!credentials.account_id;
        
      // Marketplaces
      case 'amazon':
        return !!credentials.accessToken && !!credentials.marketplace_id;
      case 'ebay':
        return !!credentials.apiKey && !!credentials.apiSecret;
      case 'etsy':
        return !!credentials.apiKey && !!credentials.shop_id && !!credentials.accessToken;
      case 'cdiscount':
        return !!credentials.apiKey;
      case 'rakuten':
      case 'fnac':
      case 'zalando':
      case 'aliexpress':
      case 'wish':
        return !!credentials.access_token;
      case 'shopee':
        return !!credentials.access_token && !!credentials.shop_id;
      case 'mercadolibre':
        return !!credentials.access_token && !!credentials.user_id;
      case 'mirakl':
        return !!credentials.api_key && !!credentials.api_url;
      case 'alibaba':
        return !!credentials.access_token;
        
      // Dropshipping suppliers
      case 'bigbuy':
      case 'eprolo':
      case 'syncee':
      case 'vidaxl':
        return !!credentials.apiKey;
      case 'printful':
        return !!credentials.access_token;
        
      default:
        return false;
    }
  }
}
