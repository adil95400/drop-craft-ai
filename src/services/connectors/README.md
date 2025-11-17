# Marketplace Connectors - Documentation Technique

## Architecture des Connecteurs

Le système propose **2 niveaux de connecteurs** pour s'adapter aux standards du marché :

### 1. Connecteurs Standard (BaseConnector)
**Usage** : Intégrations simples, prototypes, proof-of-concept
- API basiques CRUD (Create, Read, Update, Delete)
- Rate limiting simple avec délais fixes
- Gestion d'erreurs basique
- Idéal pour : Tests, MVP, intégrations légères

**Connecteurs disponibles** :
- `ShopifyConnector` - API REST 2024-01
- `WooCommerceConnector` - API REST v3
- `AmazonConnector` - SP-API simplifié
- `EBayConnector` - Trading API
- `EtsyConnector`, `CdiscountConnector`, etc.

### 2. Connecteurs Avancés (AdvancedBaseConnector)
**Usage** : Production, scale, enterprise
- ✅ **Batch Operations** - Traitement en masse de 50-250 produits
- ✅ **Webhooks** - Synchronisation temps réel avec vérification HMAC
- ✅ **Rate Limiting Avancé** - Sliding window avec retry exponential backoff
- ✅ **Health Checks** - Monitoring de la santé des connexions
- ✅ **Error Recovery** - Retry automatique avec backoff exponentiel
- ✅ **Pagination Avancée** - Cursor-based et offset-based
- ✅ **Audit Logs** - Traçabilité complète des opérations

**Connecteurs disponibles** :
- `ShopifyAdvancedConnector` - 2 req/s, webhooks HMAC, GraphQL support
- `WooCommerceAdvancedConnector` - 10 req/s, webhooks natifs
- `AmazonAdvancedConnector` - SP-API complet, FBA inventory
- `EBayAdvancedConnector` - Inventory API v1, fulfillment

## Standards du Marché

### Shopify (Niveau Enterprise)
```typescript
// Rate limits respectés (comme Oberlo, DSers)
const limits = {
  requests_per_second: 2,    // Burst: 40 (leaky bucket)
  requests_per_minute: 120,  // Shopify Plus: 200
  requests_per_day: 172800,
  max_results_per_page: 250
};

// Webhooks avec vérification HMAC
const webhookEvents = [
  'orders/create',
  'orders/updated', 
  'orders/paid',
  'orders/cancelled',
  'products/create',
  'products/update',
  'inventory_levels/update'
];
```

### Amazon SP-API (Standard Professionnel)
```typescript
// Authentification AWS Signature v4 (comme SellerCentral)
const auth = {
  method: 'AWS_SIGNATURE_V4',
  region: 'us-east-1',
  service: 'execute-api',
  // Tokens LWA (Login with Amazon)
  refresh_token_ttl: '365 days',
  access_token_ttl: '3600 seconds'
};

// Rate limits par endpoint
const limits = {
  '/catalog/': { rate: 5, burst: 10 },
  '/listings/': { rate: 5, burst: 10 },
  '/orders/': { rate: 0.5, burst: 5 },
  '/fba/inventory/': { rate: 2, burst: 30 }
};
```

### WooCommerce (Standard WordPress)
```typescript
// OAuth 1.0a comme standard e-commerce
const auth = {
  method: 'OAuth1.0a',
  consumer_key: 'ck_...',
  consumer_secret: 'cs_...',
  signature_method: 'HMAC-SHA256'
};

// Webhooks natifs (comme AutomateWoo)
const webhookTopics = [
  'order.created',
  'order.updated',
  'product.created',
  'product.updated',
  'customer.created'
];
```

### eBay (Standard Marketplace)
```typescript
// Authentification OAuth 2.0 (User token)
const auth = {
  method: 'OAuth2',
  grant_type: 'authorization_code',
  scopes: [
    'https://api.ebay.com/oauth/api_scope',
    'https://api.ebay.com/oauth/api_scope/sell.inventory',
    'https://api.ebay.com/oauth/api_scope/sell.fulfillment'
  ]
};

// Multi-marketplace support
const marketplaces = [
  'EBAY_US', 'EBAY_GB', 'EBAY_DE', 
  'EBAY_FR', 'EBAY_IT', 'EBAY_ES'
];
```

## Comparaison avec Concurrents

### ChannelEngine (Enterprise)
- ✅ Batch operations jusqu'à 500 produits
- ✅ Webhooks avec retry automatique
- ✅ Rate limiting adaptatif par plateforme
- ✅ Health monitoring temps réel
- ⚠️ Prix : $149/mois minimum

### Shopify Flow (Premium)
- ✅ Automation native Shopify
- ✅ Webhooks temps réel
- ⚠️ Limité à l'écosystème Shopify
- ⚠️ Shopify Plus requis ($2000/mois)

### Sellercloud (Professional)
- ✅ Multi-marketplace avancé
- ✅ FBA/FBM complet Amazon
- ✅ Inventory forecasting AI
- ⚠️ Prix : $1000+/mois

### Notre Solution (Wise2Sync)
- ✅ **28 connecteurs professionnels**
- ✅ **Standards du marché respectés**
- ✅ **Batch operations natives**
- ✅ **Webhooks avec vérification**
- ✅ **Rate limiting intelligent**
- ✅ **Prix compétitif**

## Guide d'Implémentation

### Utilisation Basique
```typescript
import { ShopifyConnector } from '@/services/connectors/ShopifyConnector';

const connector = new ShopifyConnector({
  shop_domain: 'mystore.myshopify.com',
  accessToken: 'shpat_xxx'
});

// Fetch products
const products = await connector.fetchProducts({ limit: 50 });

// Update inventory
await connector.updateInventory([
  { sku: 'SHOE-001', quantity: 10 }
]);
```

### Utilisation Avancée (Production)
```typescript
import { ShopifyAdvancedConnector } from '@/services/connectors/ShopifyAdvancedConnector';

const connector = new ShopifyAdvancedConnector(
  {
    shop_url: 'mystore',
    accessToken: 'shpat_xxx',
    api_version: '2024-01',
    webhook_secret: 'whsec_xxx'
  },
  userId,
  shopId
);

// Test connection avec health check
const health = await connector.healthCheck();
console.log('Latency:', health.latency_ms);

// Batch operations (optimisé)
const result = await connector.bulkUpdateInventory([
  { sku: 'SHOE-001', quantity: 10 },
  { sku: 'SHOE-002', quantity: 5 },
  // ... jusqu'à 250 produits
]);

// Register webhooks
await connector.registerWebhook([
  'orders/create',
  'products/update'
], 'https://api.myapp.com/webhooks/shopify');

// Process webhook (avec vérification HMAC)
await connector.processWebhook(webhookPayload);
```

### Gestion des Erreurs
```typescript
try {
  const products = await connector.fetchProducts();
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Attendre et réessayer (fait automatiquement)
    console.log('Rate limit, retry in', error.retryAfter, 'seconds');
  } else if (error.code === 'INVALID_CREDENTIALS') {
    // Réautoriser
    console.log('Credentials expired, re-authenticate');
  } else {
    // Erreur inconnue
    console.error('Unexpected error:', error);
  }
}
```

## Monitoring & Analytics

### Métriques Suivies
```typescript
const metrics = {
  // Performance
  avg_response_time_ms: 250,
  p95_response_time_ms: 800,
  p99_response_time_ms: 1500,
  
  // Fiabilité
  success_rate: 99.5,
  error_rate: 0.5,
  timeout_rate: 0.1,
  
  // Rate Limiting
  requests_per_minute: 95,
  rate_limit_hits: 2,
  throttle_time_ms: 150
};
```

## Migration d'un Concurrent

### De ChannelEngine
```typescript
// Avant (ChannelEngine SDK)
import { ChannelEngineClient } from 'channelengine-sdk';
const client = new ChannelEngineClient('api_key');
await client.products.list();

// Après (Wise2Sync)
import { ShopifyAdvancedConnector } from '@/services/connectors';
const connector = new ShopifyAdvancedConnector(credentials, userId);
await connector.fetchProducts();
```

### De Sellercloud
```typescript
// Avant (Sellercloud API)
await sellercloud.inventory.update({
  productId: '123',
  quantity: 10,
  warehouseId: 'WH1'
});

// Après (Wise2Sync)
await connector.bulkUpdateInventory([
  { sku: '123', quantity: 10, location_id: 'WH1' }
]);
```

## Support & Documentation

- **Documentation API** : `/docs/api`
- **Exemples** : `/examples/connectors`
- **Status Page** : `https://status.wise2sync.com`
- **Discord** : `https://discord.gg/wise2sync`

## Roadmap 2024-2025

- [ ] **Q1 2025** : GraphQL support complet (Shopify, BigCommerce)
- [ ] **Q2 2025** : AI-powered inventory forecasting
- [ ] **Q3 2025** : Real-time analytics dashboard
- [ ] **Q4 2025** : Mobile app (iOS/Android)

## Contribution

Les connecteurs suivent les standards :
1. Tests unitaires obligatoires
2. Documentation inline
3. Rate limiting respecté
4. Error handling complet
5. Logging structuré

Voir `/CONTRIBUTING.md` pour plus de détails.
