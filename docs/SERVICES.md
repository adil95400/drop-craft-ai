# Services Documentation

## 📋 Vue d'ensemble

Les services encapsulent la logique métier complexe et fournissent une interface cohérente pour les opérations backend.

## 🏗️ Architecture des Services

### Pattern Singleton

Tous les services suivent le pattern Singleton pour garantir une instance unique:

```typescript
class MyService {
  private static instance: MyService;
  
  private constructor() {
    // Private constructor
  }
  
  static getInstance(): MyService {
    if (!MyService.instance) {
      MyService.instance = new MyService();
    }
    return MyService.instance;
  }
}

export const myService = MyService.getInstance();
```

## 📦 Services Principaux

### 1. UnifiedCacheService

Service de cache centralisé avec stratégies TTL par domaine.

**Fichier**: `src/services/UnifiedCacheService.ts`

#### Fonctionnalités

- Cache multi-domaine avec TTL différenciés
- Invalidation sélective par pattern
- Statistiques de cache (hit rate, total, actifs, expirés)
- Nettoyage automatique toutes les 10 minutes

#### Domaines de Cache

```typescript
type CacheDomain = 
  | 'static'        // 1h - Données rarement modifiées
  | 'user'          // 30min - Données utilisateur
  | 'transactional' // 30s - Données transactionnelles
  | 'realtime'      // 5s - Données temps réel
  | 'analytics'     // 5min - Métriques analytics
```

#### Utilisation

```typescript
import { unifiedCache } from '@/services/UnifiedCacheService';

// Définir une donnée dans le cache
unifiedCache.set('products-list', productsData, 'user');

// Récupérer depuis le cache
const cached = unifiedCache.get('products-list');

// Vérifier l'existence
if (unifiedCache.has('products-list')) {
  // ...
}

// Invalidation
unifiedCache.invalidate('products-'); // Pattern matching
unifiedCache.invalidate(); // Clear all

// Statistiques
const stats = unifiedCache.getStats();
console.log(`Hit rate: ${stats.hitRate * 100}%`);
```

#### Exports Pratiques

```typescript
import { 
  cacheSet, 
  cacheGet, 
  cacheHas, 
  cacheInvalidate, 
  cacheStats 
} from '@/services/UnifiedCacheService';

cacheSet('key', data, 'user');
const data = cacheGet('key');
```

---

### 2. OrderFulfillmentService

Gestion automatisée du fulfillment des commandes.

**Fichier**: `src/services/OrderFulfillmentService.ts`

#### Fonctionnalités

- Règles de fulfillment personnalisables
- Placement automatique de commandes
- Notifications configurables
- Logs d'exécution détaillés

#### Méthodes Principales

```typescript
import { orderFulfillmentService } from '@/services/OrderFulfillmentService';

// Récupérer les règles
const rules = await orderFulfillmentService.getFulfillmentRules(userId);

// Créer une règle
const rule = await orderFulfillmentService.createFulfillmentRule(userId, {
  rule_name: 'Auto-fulfill low-stock',
  trigger_conditions: {
    stock_level: { operator: 'less_than', value: 10 }
  },
  fulfillment_actions: {
    notify: true,
    auto_order: true,
    supplier: 'bigbuy'
  },
  auto_place_order: true,
  notification_settings: {
    email: true,
    sms: false
  }
});

// Traiter une commande
await orderFulfillmentService.processOrder(userId, orderId, ruleId);

// Récupérer les logs
const logs = await orderFulfillmentService.getFulfillmentLogs(userId, {
  status: 'completed',
  limit: 50
});
```

#### Structure de Règle

```typescript
interface FulfillmentRule {
  rule_name: string;
  trigger_conditions: {
    stock_level?: { operator: string; value: number };
    order_value?: { operator: string; value: number };
    product_category?: string[];
  };
  fulfillment_actions: {
    notify: boolean;
    auto_order: boolean;
    supplier?: string;
    warehouse?: string;
  };
  auto_place_order: boolean;
  notification_settings: {
    email: boolean;
    sms: boolean;
    webhook?: string;
  };
}
```

---

### 3. PriceStockMonitorService

Surveillance en temps réel des prix et stocks fournisseurs.

**Fichier**: `src/services/PriceStockMonitorService.ts`

#### Fonctionnalités

- Monitoring automatique des prix
- Alertes de rupture de stock
- Ajustement automatique de prix (optionnel)
- Historique des changements

#### Méthodes Principales

```typescript
import { priceStockMonitorService } from '@/services/PriceStockMonitorService';

// Créer un monitor
const monitor = await priceStockMonitorService.createMonitor(userId, {
  catalog_product_id: 'cat-123',
  check_frequency_minutes: 60,
  price_change_threshold: 5, // %
  stock_alert_threshold: 10,
  auto_adjust_price: true,
  price_adjustment_rules: {
    strategy: 'competitive',
    margin: 20, // %
    max_discount: 15 // %
  }
});

// Vérifier tous les monitors
await priceStockMonitorService.checkAllMonitors(userId);

// Vérifier un monitor spécifique
await priceStockMonitorService.checkSingleMonitor(userId, monitorId);

// Récupérer les alertes
const alerts = await priceStockMonitorService.getAlerts(userId, {
  isRead: false,
  severity: 'high',
  limit: 20
});

// Marquer comme lu
await priceStockMonitorService.markAlertAsRead(alertId);

// Résoudre une alerte
await priceStockMonitorService.resolveAlert(alertId);
```

#### Configuration de Monitor

```typescript
interface PriceStockMonitor {
  catalog_product_id: string;
  check_frequency_minutes: number; // 15, 30, 60, 120, 360, 720
  price_change_threshold: number; // % de changement
  stock_alert_threshold: number; // Seuil de stock minimum
  auto_adjust_price: boolean;
  price_adjustment_rules: {
    strategy: 'competitive' | 'fixed_margin' | 'dynamic';
    margin: number; // %
    max_discount: number; // %
    min_profit: number; // %
  };
}
```

---

### 4. PWAService

Gestion Progressive Web App et notifications push.

**Fichier**: `src/services/PWAService.ts`

#### Fonctionnalités

- Installation PWA
- Notifications push
- Service Worker management
- Détection d'installation

#### Méthodes Principales

```typescript
import { PWAService } from '@/services/PWAService';

// Initialiser PWA
PWAService.init();

// Vérifier si installable
if (PWAService.canInstall()) {
  const installed = await PWAService.installPWA();
  if (installed) {
    console.log('PWA installée avec succès');
  }
}

// Vérifier si déjà installée
if (PWAService.isInstalled()) {
  console.log('PWA déjà installée');
}

// Demander permission notifications
const permission = await PWAService.requestNotificationPermission();

if (permission === 'granted') {
  // S'abonner aux push notifications
  const subscription = await PWAService.subscribeToPushNotifications();
}
```

#### Service Worker

Le Service Worker est automatiquement enregistré au chargement de l'app:

```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

self.addEventListener('fetch', (event) => {
  // Cache strategy
});
```

---

### 5. ImportManager

Gestion des imports de produits multi-sources.

**Fichier**: `src/services/ImportManager.ts`

#### Fonctionnalités

- Import CSV, XML, JSON, API
- Suivi de progression en temps réel
- Gestion d'erreurs par ligne
- Templates d'import réutilisables
- Auto-détection de champs

#### Méthodes Principales

```typescript
import { importManager } from '@/services/ImportManager';

// Import CSV
const job = await importManager.importFromCsv(csvContent, templateId);

// Import XML
const job = await importManager.importFromXml(xmlContent, templateId);

// Import URL
const job = await importManager.importFromUrl(url, templateId);

// Import FTP
const job = await importManager.importFromFtp(
  ftpHost, 
  ftpUser, 
  ftpPass, 
  ftpPath,
  templateId
);

// Suivre la progression
const currentJob = importManager.getJob(job.id);
console.log(`Progression: ${currentJob.progress}%`);

// Obtenir tous les jobs
const allJobs = importManager.getAllJobs();

// Annuler un job
await importManager.cancelJob(job.id);
```

#### Structure de Job

```typescript
interface ImportJob {
  id: string;
  type: 'csv' | 'api' | 'xml' | 'json';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  totalItems: number;
  processedItems: number;
  successItems: number;
  errorItems: number;
  errors: string[];
  createdAt: Date;
  completedAt?: Date;
}
```

#### Templates

```typescript
// Créer un template
const template = await importManager.createTemplate({
  name: 'Template Shopify',
  type: 'csv',
  config: {
    delimiter: ',',
    encoding: 'utf-8'
  },
  mapping: {
    'Product Name': 'name',
    'Product Price': 'price',
    'Product SKU': 'sku'
  }
});

// Utiliser le template
const job = await importManager.importFromCsv(csvContent, template.id);
```

---

### 6. FirecrawlService

Scraping intelligent de pages produits.

**Fichier**: `src/services/FirecrawlService.ts`

#### Fonctionnalités

- Scraping de pages produits
- Extraction automatique de données
- Analyse SEO
- Génération de variantes
- Support crawling multi-pages

#### Méthodes Principales

```typescript
import { FirecrawlService } from '@/services/FirecrawlService';

// Scraper une URL
const result = await FirecrawlService.scrapeUrl('https://example.com/product', {
  extract_images: true,
  analyze_seo: true,
  generate_variants: true,
  price_tracking: true
});

if (result.success) {
  const { data } = result;
  console.log(data.markdown); // Contenu en markdown
  console.log(data.metadata); // Méta-données
  console.log(data.linksOnPage); // Liens trouvés
}

// Crawler tout un site
const crawlResult = await FirecrawlService.crawlWebsite('https://example.com', {
  limit: 100,
  allowBackwardCrawling: false,
  excludePaths: ['/admin', '/cart'],
  includePaths: ['/products']
});

// Extraire les produits
const products = await FirecrawlService.extractProductsFromUrl(url);

if (products.success) {
  products.products.forEach(product => {
    console.log(product.name, product.price);
  });
}
```

#### Configuration de Scraping

```typescript
interface ScrapeConfig {
  extract_images: boolean;     // Extraire les images
  analyze_seo: boolean;         // Analyser le SEO
  generate_variants: boolean;   // Générer des variantes
  price_tracking: boolean;      // Tracker le prix
}

interface CrawlOptions {
  limit?: number;                      // Max de pages
  allowBackwardCrawling?: boolean;     // Crawler les parents
  allowExternalContentLinks?: boolean; // Liens externes
  excludePaths?: string[];             // Chemins à exclure
  includePaths?: string[];             // Chemins à inclure
}
```

---

## 🔧 Bonnes Pratiques

### 1. Gestion d'Erreurs

Toujours utiliser try-catch avec logging:

```typescript
async myMethod() {
  try {
    const result = await this.operation();
    return result;
  } catch (error) {
    console.error('Error in myMethod:', error);
    throw error;
  }
}
```

### 2. Typage Fort

Utiliser TypeScript strict:

```typescript
interface ServiceConfig {
  timeout: number;
  retries: number;
}

class MyService {
  private config: ServiceConfig;
  
  constructor(config: ServiceConfig) {
    this.config = config;
  }
}
```

### 3. Async/Await

Préférer async/await aux callbacks:

```typescript
// ✅ Bon
async getData() {
  const data = await this.fetch();
  return this.process(data);
}

// ❌ Éviter
getData(callback) {
  this.fetch().then(data => {
    callback(this.process(data));
  });
}
```

### 4. Immutabilité

Ne jamais muter les paramètres:

```typescript
// ✅ Bon
processData(data: Data[]): Data[] {
  return [...data].map(item => ({
    ...item,
    processed: true
  }));
}

// ❌ Éviter
processData(data: Data[]): Data[] {
  data.forEach(item => item.processed = true);
  return data;
}
```

---

## 🧪 Testing

Chaque service doit avoir ses tests unitaires:

```typescript
// MyService.test.ts
import { describe, it, expect } from 'vitest';
import { myService } from './MyService';

describe('MyService', () => {
  it('should process data correctly', async () => {
    const result = await myService.processData(mockData);
    expect(result).toHaveLength(5);
  });
  
  it('should handle errors gracefully', async () => {
    await expect(
      myService.processInvalidData()
    ).rejects.toThrow();
  });
});
```

---

## 📊 Performance

### Cache Strategy

```typescript
class MyService {
  private cache = new Map();
  
  async getData(id: string) {
    // Check cache
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }
    
    // Fetch and cache
    const data = await this.fetchData(id);
    this.cache.set(id, data);
    
    return data;
  }
}
```

### Debouncing

```typescript
import { debounce } from 'lodash';

class MyService {
  debouncedSearch = debounce(
    async (query: string) => {
      return await this.search(query);
    },
    300
  );
}
```

---

## 🔐 Sécurité

### Validation d'Entrées

```typescript
class MyService {
  async createRecord(data: unknown) {
    // Validate
    const validated = schema.parse(data);
    
    // Process
    return await this.insert(validated);
  }
}
```

### Sanitization

```typescript
import DOMPurify from 'dompurify';

class MyService {
  sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html);
  }
}
```

---

**Note**: Tous les services doivent suivre ces patterns pour maintenir une architecture cohérente.
