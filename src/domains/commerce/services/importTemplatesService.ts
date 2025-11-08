export interface ImportTemplate {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  sourceType: 'marketplace' | 'url' | 'xml' | 'api';
  provider: string;
  fieldMapping: Record<string, string>;
  defaultConfig: Record<string, any>;
  urlPattern?: RegExp;
  requiresAuth?: boolean;
}

export const IMPORT_TEMPLATES: ImportTemplate[] = [
  {
    id: 'amazon',
    name: 'amazon',
    displayName: 'Amazon',
    description: 'Import products from Amazon marketplace',
    icon: '🛒',
    sourceType: 'marketplace',
    provider: 'amazon',
    requiresAuth: true,
    fieldMapping: {
      'ASIN': 'sku',
      'Title': 'name',
      'Description': 'description',
      'Price': 'price',
      'Image': 'image_url',
      'Category': 'category',
      'Brand': 'brand'
    },
    defaultConfig: {
      extractImages: true,
      generateSEO: true,
      priceTracking: true
    },
    urlPattern: /amazon\.(com|fr|de|co\.uk|es|it)/i
  },
  {
    id: 'aliexpress',
    name: 'aliexpress',
    displayName: 'AliExpress',
    description: 'Import products from AliExpress',
    icon: '🏪',
    sourceType: 'marketplace',
    provider: 'aliexpress',
    requiresAuth: false,
    fieldMapping: {
      'productId': 'sku',
      'productTitle': 'name',
      'productDescription': 'description',
      'salePrice': 'price',
      'imageUrl': 'image_url',
      'categoryName': 'category'
    },
    defaultConfig: {
      extractImages: true,
      extractVariants: true,
      generateSEO: true
    },
    urlPattern: /aliexpress\.com/i
  },
  {
    id: 'ebay',
    name: 'ebay',
    displayName: 'eBay',
    description: 'Import products from eBay marketplace',
    icon: '🔨',
    sourceType: 'marketplace',
    provider: 'ebay',
    requiresAuth: true,
    fieldMapping: {
      'itemId': 'sku',
      'title': 'name',
      'description': 'description',
      'sellingStatus.currentPrice': 'price',
      'galleryURL': 'image_url',
      'primaryCategory.categoryName': 'category'
    },
    defaultConfig: {
      extractImages: true,
      generateSEO: true
    },
    urlPattern: /ebay\.(com|fr|de|co\.uk)/i
  },
  {
    id: 'shopify',
    name: 'shopify',
    displayName: 'Shopify Store',
    description: 'Import from any Shopify store',
    icon: '🛍️',
    sourceType: 'api',
    provider: 'shopify',
    requiresAuth: true,
    fieldMapping: {
      'id': 'external_id',
      'title': 'name',
      'body_html': 'description',
      'variants[0].price': 'price',
      'images[0].src': 'image_url',
      'product_type': 'category',
      'vendor': 'brand'
    },
    defaultConfig: {
      syncInventory: true,
      syncOrders: false,
      extractImages: true
    },
    urlPattern: /myshopify\.com/i
  },
  {
    id: 'woocommerce',
    name: 'woocommerce',
    displayName: 'WooCommerce',
    description: 'Import from WooCommerce stores',
    icon: '🎯',
    sourceType: 'api',
    provider: 'woocommerce',
    requiresAuth: true,
    fieldMapping: {
      'id': 'external_id',
      'name': 'name',
      'description': 'description',
      'price': 'price',
      'images[0].src': 'image_url',
      'categories[0].name': 'category'
    },
    defaultConfig: {
      extractImages: true,
      generateSEO: true
    }
  },
  {
    id: 'generic-xml',
    name: 'generic-xml',
    displayName: 'Generic XML/RSS Feed',
    description: 'Import from any XML/RSS product feed',
    icon: '📰',
    sourceType: 'xml',
    provider: 'generic',
    requiresAuth: false,
    fieldMapping: {
      'item.title': 'name',
      'item.description': 'description',
      'item.price': 'price',
      'item.link': 'supplier_url',
      'item.image': 'image_url'
    },
    defaultConfig: {
      autoDetectFields: true,
      validateSchema: true
    }
  },
  {
    id: 'generic-url',
    name: 'generic-url',
    displayName: 'Any Website (AI Scraper)',
    description: 'Smart scraping from any website using AI',
    icon: '🤖',
    sourceType: 'url',
    provider: 'ai-scraper',
    requiresAuth: false,
    fieldMapping: {},
    defaultConfig: {
      useAI: true,
      extractImages: true,
      generateSEO: true,
      analyzeCompetitors: true
    }
  }
];

class ImportTemplatesService {
  getAllTemplates(): ImportTemplate[] {
    return IMPORT_TEMPLATES;
  }

  getTemplateById(id: string): ImportTemplate | undefined {
    return IMPORT_TEMPLATES.find(t => t.id === id);
  }

  getTemplatesBySourceType(sourceType: ImportTemplate['sourceType']): ImportTemplate[] {
    return IMPORT_TEMPLATES.filter(t => t.sourceType === sourceType);
  }

  detectTemplateFromUrl(url: string): ImportTemplate | undefined {
    return IMPORT_TEMPLATES.find(t => t.urlPattern && t.urlPattern.test(url));
  }

  getMarketplaceTemplates(): ImportTemplate[] {
    return IMPORT_TEMPLATES.filter(t => t.sourceType === 'marketplace');
  }
}

export const importTemplatesService = new ImportTemplatesService();
