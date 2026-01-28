# API Reference - ShopOpti+ Extension v5.7.0

Documentation technique des APIs internes de l'extension.

## 📦 Modules Principaux

### ExtractorRegistry

Point d'entrée central pour toutes les extractions.

```javascript
// Accès global
window.ShopOptiExtractorRegistry

// Extraction automatique (détecte la plateforme)
const result = await ShopOptiExtractorRegistry.extract();
// Returns: { success: boolean, data: ProductData, qualityScore: number }

// Extraction avec plateforme spécifique
const result = await ShopOptiExtractorRegistry.extractFor('amazon');

// Vérifier si une plateforme est supportée
const supported = ShopOptiExtractorRegistry.isSupported('amazon'); // true

// Lister toutes les plateformes
const platforms = ShopOptiExtractorRegistry.listPlatforms();
// ['amazon', 'aliexpress', 'ebay', ...]
```

### PlatformDetector

Détection automatique de plateforme et extraction d'identifiants.

```javascript
// Accès global
window.ShopOptiPlatformDetector

// Détecter la plateforme depuis une URL
const info = ShopOptiPlatformDetector.detect('https://amazon.fr/dp/B08N5WRWNW');
// Returns: { 
//   platform: 'amazon', 
//   productId: 'B08N5WRWNW', 
//   locale: 'fr',
//   confidence: 1.0 
// }

// Vérifier si une URL est une page produit
const isProduct = ShopOptiPlatformDetector.isProductPage(url); // boolean
```

### ExtractionOrchestrator

Gestion du cycle de vie complet d'une extraction.

```javascript
// Accès global
window.ShopOptiOrchestrator

// Démarrer un job d'extraction
const jobId = ShopOptiOrchestrator.startJob(url);

// Suivre la progression
ShopOptiOrchestrator.onProgress(jobId, (status) => {
  console.log(status.step, status.progress); // 'extracting', 0.5
});

// Annuler un job
ShopOptiOrchestrator.cancelJob(jobId);

// États possibles
// 'pending' → 'detecting' → 'extracting' → 'validating' → 'normalizing' → 'confirming' → 'importing' → 'completed'
// Ou: → 'failed' | 'cancelled'
```

### ExtractorBridge

Interface unifiée entre les extracteurs et le système d'import.

```javascript
// Accès global
window.ShopOptiExtractorBridge

// Extraction avec stratégie automatique (API → Network → DOM)
const result = await ShopOptiExtractorBridge.extract({
  url: 'https://amazon.fr/dp/B08N5WRWNW',
  strategies: ['api', 'network', 'dom'], // Ordre de priorité
  timeout: 10000
});

// Normalisation des données
const normalized = ShopOptiExtractorBridge.normalize(rawData, 'amazon');

// Validation
const validation = ShopOptiExtractorBridge.validate(productData);
// Returns: { valid: boolean, score: number, errors: string[], warnings: string[] }
```

---

## 📊 Types de Données

### ProductData

Structure unifiée d'un produit extrait.

```typescript
interface ProductData {
  // Identification
  name: string;                    // Nom du produit (requis)
  externalId: string;              // ID sur la plateforme source
  source: string;                  // Nom de la plateforme
  sourceUrl: string;               // URL de la page produit

  // Prix
  price: number;                   // Prix actuel
  compareAtPrice?: number;         // Prix barré
  currency?: string;               // Code devise (EUR, USD, etc.)

  // Médias
  images: string[];                // URLs des images HD
  videos?: VideoData[];            // Données vidéo

  // Contenu
  description?: string;            // Description HTML
  shortDescription?: string;       // Résumé
  brand?: string;                  // Marque
  category?: string;               // Catégorie

  // Variantes
  variants?: VariantOption[];      // Options de variantes
  
  // Avis
  rating?: number;                 // Note moyenne (0-5)
  reviewsCount?: number;           // Nombre d'avis
  reviews?: ReviewData[];          // Avis détaillés

  // Shipping
  shipping?: ShippingData;         // Infos livraison

  // Métadonnées
  tags?: string[];                 // Tags/mots-clés
  sku?: string;                    // SKU source
  metadata?: Record<string, any>;  // Données additionnelles
}
```

### VariantOption

```typescript
interface VariantOption {
  name: string;              // "Color", "Size", etc.
  options: VariantValue[];   // Valeurs possibles
}

interface VariantValue {
  id?: string;
  value: string;             // "Red", "XL", etc.
  available: boolean;
  image?: string;            // Image spécifique à cette variante
  priceModifier?: number;    // +/- sur le prix de base
}
```

### ReviewData

```typescript
interface ReviewData {
  author: string;
  rating: number;            // 1-5
  date: string;              // ISO date string
  content: string;
  title?: string;
  images?: string[];
  helpful?: number;          // Votes utiles
  verified?: boolean;        // Achat vérifié
}
```

### ValidationResult

```typescript
interface ValidationResult {
  valid: boolean;
  score: number;             // 0-100
  errors: string[];          // Erreurs bloquantes
  warnings: string[];        // Avertissements
  suggestions: string[];     // Améliorations suggérées
}
```

---

## 🔄 Events

### Content Script Events

```javascript
// Écouter les messages du background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'EXTRACT_REQUEST':
      // Déclenche une extraction
      break;
    case 'SYNC_STATUS':
      // Mise à jour du statut de sync
      break;
  }
});

// Envoyer un message au background
chrome.runtime.sendMessage({
  type: 'IMPORT_PRODUCT',
  data: productData
});
```

### Window Events (Page ↔ Extension)

```javascript
// Recevoir des données de la page ShopOpti
window.addEventListener('message', (event) => {
  if (event.data.type === 'SHOPOPTI_AUTH_TOKEN') {
    const token = event.data.token;
    // Stocker le token
  }
});

// Envoyer des données à la page
window.postMessage({
  type: 'SHOPOPTI_IMPORT_COMPLETE',
  productId: '123',
  success: true
}, '*');
```

---

## 🛡️ Gestion des Erreurs

### Codes d'Erreur

| Code | Description |
|------|-------------|
| `PLATFORM_NOT_SUPPORTED` | Plateforme non reconnue |
| `EXTRACTION_FAILED` | Échec de l'extraction DOM/API |
| `VALIDATION_FAILED` | Données invalides (score < 60%) |
| `NETWORK_ERROR` | Erreur réseau |
| `AUTH_REQUIRED` | Token manquant ou expiré |
| `RATE_LIMITED` | Trop de requêtes |
| `IMPORT_FAILED` | Erreur lors de l'import backend |

### Retry Logic

```javascript
// Configuration du retry manager
ShopOptiRetryManager.configure({
  maxRetries: 3,
  baseDelay: 1000,        // 1s initial
  maxDelay: 30000,        // 30s maximum
  backoffMultiplier: 2,   // Exponentiel
  retryableErrors: ['NETWORK_ERROR', 'RATE_LIMITED']
});

// Exécuter avec retry
const result = await ShopOptiRetryManager.execute(
  () => extractProduct(url),
  { context: 'extraction' }
);
```

---

## 🔧 Configuration

### Storage Keys

```javascript
// Clés chrome.storage.local
{
  'shopopti_token': string,           // Token d'authentification
  'shopopti_user_id': string,         // ID utilisateur
  'shopopti_settings': {
    autoOptimize: boolean,
    importVariants: boolean,
    importReviews: boolean,
    minQualityScore: number,          // 0-100, défaut: 60
    priceRules: PriceRuleConfig
  },
  'shopopti_import_queue': ImportJob[],
  'shopopti_sync_status': SyncStatus
}
```

### Debug Mode

```javascript
// Activer les logs détaillés
localStorage.setItem('SHOPOPTI_DEBUG', 'true');

// Désactiver
localStorage.removeItem('SHOPOPTI_DEBUG');

// Vérifier
ShopOptiDebug.isEnabled(); // boolean
```

---

## 📡 Communication Backend

### Endpoints

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/functions/v1/import-product` | POST | Importer un produit |
| `/functions/v1/bulk-import` | POST | Import en masse |
| `/functions/v1/sync-products` | POST | Synchroniser catalogue |
| `/functions/v1/validate-token` | GET | Valider token extension |

### Headers Requis

```javascript
{
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-Extension-Version': '5.7.0',
  'X-Platform': 'chrome'
}
```
