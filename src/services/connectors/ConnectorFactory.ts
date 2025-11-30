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
import { EBayConnector } from './eBayConnector';
import { BigBuyConnector } from './BigBuyConnector';
import { EproloConnector } from './EproloConnector';
import { PrintfulConnector } from './PrintfulConnector';
import { SynceeConnector } from './SynceeConnector';
import { VidaXLConnector } from './VidaXLConnector';
import { AlibabaConnector } from './AlibabaConnector';
import { MatterhornConnector } from './MatterhornConnector';
import { BTSWholesalerConnector } from './BTSWholesalerConnector';
import { CJDropshippingConnector } from './CJDropshippingConnector';
import {
  AtixoConnector,
  B2BUhrenConnector,
  BestNutritionConnector,
  BrandsDistributionConnector,
  ChilitecConnector,
  CLPConnector,
  EDCConnector,
  EinsAShopConnector,
  EksaTradeConnector,
  FKHandelConnector,
  GermanRidingConnector,
  HLDropshippingConnector,
  ILAUhrenConnector,
  KosatecConnector,
  MetasportConnector,
  MPSmobileConnector,
  MultitronikConnector,
  NedisConnector,
  NLGConnector,
  NovaengelConnector,
  PowerUndHandelConnector,
  RWGrosshandelConnector,
  SchmuckhandelJograboConnector,
  SpalexConnector,
  SyntroxConnector,
  TechDataConnector,
  Trends4CentsConnector,
  TuscanyLeatherConnector,
  VimandoConnector,
  WaveDistributionConnector,
  YoungFashConnector,
  YourNewStyleConnector,
  ZoodropConnector,
} from './NewEuropeanConnectors';

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
    ['matterhorn', {
      id: 'matterhorn',
      name: 'matterhorn',
      displayName: 'Matterhorn Wholesaler',
      description: 'European fashion wholesaler specializing in clothing and accessories',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['btswholesaler', {
      id: 'btswholesaler',
      name: 'btswholesaler',
      displayName: 'BTS Wholesaler',
      description: 'Fashion and sportswear wholesale supplier with diverse product catalog',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['cjdropshipping', {
      id: 'cjdropshipping',
      name: 'cjdropshipping',
      displayName: 'CJ Dropshipping',
      description: 'Complete dropshipping solution with fulfillment and POD services',
      category: 'supplier',
      authType: 'credentials',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 3000 },
    }],
    
    // New European Dropshipping Suppliers
    ['atixo', {
      id: 'atixo',
      name: 'atixo',
      displayName: 'Atixo',
      description: 'German electronics and high-tech wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['b2buhren', {
      id: 'b2buhren',
      name: 'b2buhren',
      displayName: 'B2B Uhren',
      description: 'German watch and accessories wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['bestnutrition', {
      id: 'bestnutrition',
      name: 'bestnutrition',
      displayName: 'Best Nutrition',
      description: 'Health supplements and sports nutrition supplier',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['brandsdistribution', {
      id: 'brandsdistribution',
      name: 'brandsdistribution',
      displayName: 'Brands Distribution',
      description: 'Italian fashion and accessories distributor',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['chilitec', {
      id: 'chilitec',
      name: 'chilitec',
      displayName: 'Chilitec',
      description: 'German LED and lighting wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['clp', {
      id: 'clp',
      name: 'clp',
      displayName: 'CLP',
      description: 'Garden furniture and outdoor equipment supplier',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['edc', {
      id: 'edc',
      name: 'edc',
      displayName: 'EDC',
      description: 'German electronics and accessories wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['einsashop', {
      id: 'einsashop',
      name: 'einsashop',
      displayName: 'EinsAShop',
      description: 'German multi-category supplier with fast delivery',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['eksatrade', {
      id: 'eksatrade',
      name: 'eksatrade',
      displayName: 'EksaTrade',
      description: 'European dropshipping wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['fkhandel', {
      id: 'fkhandel',
      name: 'fkhandel',
      displayName: 'FK Handel',
      description: 'German fashion and lifestyle distributor',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['germanriding', {
      id: 'germanriding',
      name: 'germanriding',
      displayName: 'German Riding',
      description: 'Equestrian equipment specialist',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['hldropshipping', {
      id: 'hldropshipping',
      name: 'hldropshipping',
      displayName: 'HL Dropshipping',
      description: 'European dropshipping platform with diverse products',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['ilauhren', {
      id: 'ilauhren',
      name: 'ilauhren',
      displayName: 'ILA Uhren',
      description: 'German watch and jewelry wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['kosatec', {
      id: 'kosatec',
      name: 'kosatec',
      displayName: 'Kosatec',
      description: 'High-tech and consumer electronics supplier',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['metasport', {
      id: 'metasport',
      name: 'metasport',
      displayName: 'Metasport',
      description: 'Sports equipment and fitness wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['mpsmobile', {
      id: 'mpsmobile',
      name: 'mpsmobile',
      displayName: 'MPSmobile',
      description: 'German smartphone and mobile accessories distributor',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['multitronik', {
      id: 'multitronik',
      name: 'multitronik',
      displayName: 'Multitronik',
      description: 'Finnish electronics and IT wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['nedis', {
      id: 'nedis',
      name: 'nedis',
      displayName: 'Nedis',
      description: 'Dutch electronics and smart home supplier',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['nlg', {
      id: 'nlg',
      name: 'nlg',
      displayName: 'NLG',
      description: 'German multi-category wholesaler with large catalog',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['novaengel', {
      id: 'novaengel',
      name: 'novaengel',
      displayName: 'Novaengel',
      description: 'Baby and children products distributor',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['powerundhandel', {
      id: 'powerundhandel',
      name: 'powerundhandel',
      displayName: 'Power und Handel',
      description: 'German power tools and equipment wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['rwgrosshandel', {
      id: 'rwgrosshandel',
      name: 'rwgrosshandel',
      displayName: 'RW Großhandel',
      description: 'German multi-category retail wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['schmuckhandeljograbo', {
      id: 'schmuckhandeljograbo',
      name: 'schmuckhandeljograbo',
      displayName: 'Schmuckhandel Jograbo',
      description: 'German jewelry and accessories wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['spalex', {
      id: 'spalex',
      name: 'spalex',
      displayName: 'Spalex',
      description: 'European home and garden products supplier',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['syntrox', {
      id: 'syntrox',
      name: 'syntrox',
      displayName: 'Syntrox',
      description: 'German appliances and kitchen equipment wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['techdata', {
      id: 'techdata',
      name: 'techdata',
      displayName: 'Tech Data',
      description: 'Global IT and technology distributor',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['trends4cents', {
      id: 'trends4cents',
      name: 'trends4cents',
      displayName: 'Trends4Cents',
      description: 'Trend products wholesaler with competitive prices',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['tuscanyleather', {
      id: 'tuscanyleather',
      name: 'tuscanyleather',
      displayName: 'TuscanyLeather',
      description: 'Italian leather goods manufacturer',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['vimando', {
      id: 'vimando',
      name: 'vimando',
      displayName: 'Vimando',
      description: 'European multi-supplier dropshipping platform',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['wavedistribution', {
      id: 'wavedistribution',
      name: 'wavedistribution',
      displayName: 'Wave Distribution',
      description: 'Electronics and tech accessories distributor',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['youngfash', {
      id: 'youngfash',
      name: 'youngfash',
      displayName: 'YoungFash',
      description: 'Young fashion and trend clothing wholesaler',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['yournewstyle', {
      id: 'yournewstyle',
      name: 'yournewstyle',
      displayName: 'YourNewStyle',
      description: 'Fashion and lifestyle accessories supplier',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
    }],
    ['zoodrop', {
      id: 'zoodrop',
      name: 'zoodrop',
      displayName: 'Zoodrop',
      description: 'Pet products dropshipping platform',
      category: 'supplier',
      authType: 'api_key',
      features: { products: true, inventory: true, orders: true, webhooks: false },
      rateLimits: { requestsPerMinute: 60, requestsPerHour: 1000 },
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
        return new EBayConnector(credentials);
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
      case 'matterhorn':
        return new MatterhornConnector(credentials);
      case 'btswholesaler':
        return new BTSWholesalerConnector(credentials);
      case 'cjdropshipping':
        return new CJDropshippingConnector(credentials);
        
      // New European dropshipping suppliers
      case 'atixo':
        return new AtixoConnector(credentials);
      case 'b2buhren':
        return new B2BUhrenConnector(credentials);
      case 'bestnutrition':
        return new BestNutritionConnector(credentials);
      case 'brandsdistribution':
        return new BrandsDistributionConnector(credentials);
      case 'chilitec':
        return new ChilitecConnector(credentials);
      case 'clp':
        return new CLPConnector(credentials);
      case 'edc':
        return new EDCConnector(credentials);
      case 'einsashop':
        return new EinsAShopConnector(credentials);
      case 'eksatrade':
        return new EksaTradeConnector(credentials);
      case 'fkhandel':
        return new FKHandelConnector(credentials);
      case 'germanriding':
        return new GermanRidingConnector(credentials);
      case 'hldropshipping':
        return new HLDropshippingConnector(credentials);
      case 'ilauhren':
        return new ILAUhrenConnector(credentials);
      case 'kosatec':
        return new KosatecConnector(credentials);
      case 'metasport':
        return new MetasportConnector(credentials);
      case 'mpsmobile':
        return new MPSmobileConnector(credentials);
      case 'multitronik':
        return new MultitronikConnector(credentials);
      case 'nedis':
        return new NedisConnector(credentials);
      case 'nlg':
        return new NLGConnector(credentials);
      case 'novaengel':
        return new NovaengelConnector(credentials);
      case 'powerundhandel':
        return new PowerUndHandelConnector(credentials);
      case 'rwgrosshandel':
        return new RWGrosshandelConnector(credentials);
      case 'schmuckhandeljograbo':
        return new SchmuckhandelJograboConnector(credentials);
      case 'spalex':
        return new SpalexConnector(credentials);
      case 'syntrox':
        return new SyntroxConnector(credentials);
      case 'techdata':
        return new TechDataConnector(credentials);
      case 'trends4cents':
        return new Trends4CentsConnector(credentials);
      case 'tuscanyleather':
        return new TuscanyLeatherConnector(credentials);
      case 'vimando':
        return new VimandoConnector(credentials);
      case 'wavedistribution':
        return new WaveDistributionConnector(credentials);
      case 'youngfash':
        return new YoungFashConnector(credentials);
      case 'yournewstyle':
        return new YourNewStyleConnector(credentials);
      case 'zoodrop':
        return new ZoodropConnector(credentials);
        
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
        return !!credentials.accessToken;
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
      case 'matterhorn':
      case 'btswholesaler':
        return !!credentials.apiKey;
      case 'printful':
        return !!credentials.access_token;
        
      default:
        return false;
    }
  }
}
