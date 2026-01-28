# Guide Développeur - Ajout d'un Nouvel Extracteur

Ce guide explique comment créer un extracteur pour une nouvelle plateforme e-commerce.

## 📋 Prérequis

1. Comprendre l'architecture modulaire de l'extension
2. Avoir accès à une page produit de la plateforme cible
3. Identifier les sources de données (DOM, JSON-LD, API, `__INITIAL_STATE__`)

## 🏗️ Structure d'un Extracteur

### 1. Créer le fichier extracteur

```javascript
// public/chrome-extension/extractors/newplatform-extractor.js

/**
 * NewPlatform Extractor v5.7.0
 * Extracteur pour NewPlatform.com
 */
(function() {
  'use strict';

  class NewPlatformExtractor {
    constructor() {
      this.version = '5.7.0';
      this.platform = 'newplatform';
      this.domains = ['newplatform.com', 'www.newplatform.com'];
    }

    /**
     * Vérifie si l'extracteur peut gérer cette page
     */
    canHandle(url) {
      return this.domains.some(domain => url.includes(domain));
    }

    /**
     * Extrait les données produit de la page
     */
    async extract() {
      try {
        const data = {
          name: this.extractName(),
          price: this.extractPrice(),
          compareAtPrice: this.extractCompareAtPrice(),
          images: this.extractImages(),
          description: this.extractDescription(),
          variants: this.extractVariants(),
          reviews: this.extractReviews(),
          brand: this.extractBrand(),
          category: this.extractCategory(),
          externalId: this.extractProductId(),
          source: this.platform,
          sourceUrl: window.location.href
        };

        return {
          success: true,
          data: data,
          qualityScore: this.calculateQualityScore(data)
        };
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }

    // ========== MÉTHODES D'EXTRACTION ==========

    extractName() {
      // Stratégie 1: JSON-LD
      const jsonLd = this.getJsonLd();
      if (jsonLd?.name) return jsonLd.name;

      // Stratégie 2: Meta tags
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) return ogTitle.content;

      // Stratégie 3: Sélecteurs DOM
      const selectors = [
        'h1.product-title',
        '[data-testid="product-name"]',
        '.product-name h1'
      ];
      
      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el?.textContent?.trim()) {
          return el.textContent.trim();
        }
      }

      return null;
    }

    extractPrice() {
      const jsonLd = this.getJsonLd();
      if (jsonLd?.offers?.price) {
        return parseFloat(jsonLd.offers.price);
      }

      const priceEl = document.querySelector('[data-price], .price-current');
      if (priceEl) {
        return this.parsePrice(priceEl.textContent);
      }

      return null;
    }

    extractCompareAtPrice() {
      const originalPriceEl = document.querySelector('.price-original, .was-price');
      if (originalPriceEl) {
        return this.parsePrice(originalPriceEl.textContent);
      }
      return null;
    }

    extractImages() {
      const images = [];
      
      // JSON-LD images
      const jsonLd = this.getJsonLd();
      if (jsonLd?.image) {
        const jsonImages = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
        images.push(...jsonImages);
      }

      // DOM images
      document.querySelectorAll('.product-gallery img, [data-gallery] img').forEach(img => {
        const src = img.dataset.src || img.dataset.zoom || img.src;
        if (src && !images.includes(src)) {
          images.push(this.upgradeImageUrl(src));
        }
      });

      return images.filter(url => url && url.startsWith('http'));
    }

    extractDescription() {
      const descEl = document.querySelector('.product-description, [data-description]');
      if (descEl) {
        return descEl.innerHTML;
      }
      
      const jsonLd = this.getJsonLd();
      return jsonLd?.description || '';
    }

    extractVariants() {
      const variants = [];
      
      document.querySelectorAll('[data-variant-option]').forEach(optionGroup => {
        const name = optionGroup.dataset.optionName || optionGroup.querySelector('label')?.textContent;
        const options = [];
        
        optionGroup.querySelectorAll('[data-value]').forEach(opt => {
          options.push({
            value: opt.dataset.value,
            available: !opt.classList.contains('unavailable'),
            image: opt.dataset.image
          });
        });

        if (name && options.length > 0) {
          variants.push({ name, options });
        }
      });

      return variants;
    }

    extractReviews() {
      const reviews = [];
      
      document.querySelectorAll('.review-item, [data-review]').forEach(reviewEl => {
        reviews.push({
          author: reviewEl.querySelector('.reviewer-name')?.textContent?.trim() || 'Anonymous',
          rating: parseFloat(reviewEl.dataset.rating || reviewEl.querySelector('[data-stars]')?.dataset.stars) || 0,
          date: reviewEl.querySelector('.review-date')?.textContent?.trim() || '',
          content: reviewEl.querySelector('.review-content')?.textContent?.trim() || '',
          images: Array.from(reviewEl.querySelectorAll('.review-image img')).map(img => img.src)
        });
      });

      return reviews;
    }

    extractBrand() {
      const jsonLd = this.getJsonLd();
      if (jsonLd?.brand?.name) return jsonLd.brand.name;
      
      const brandEl = document.querySelector('[data-brand], .product-brand');
      return brandEl?.textContent?.trim() || null;
    }

    extractCategory() {
      const breadcrumbs = Array.from(document.querySelectorAll('.breadcrumb a, [data-breadcrumb] a'));
      if (breadcrumbs.length > 1) {
        return breadcrumbs.slice(1, -1).map(a => a.textContent.trim()).join(' > ');
      }
      return null;
    }

    extractProductId() {
      // URL pattern
      const urlMatch = window.location.href.match(/\/product\/(\d+)/);
      if (urlMatch) return urlMatch[1];

      // Data attribute
      const productEl = document.querySelector('[data-product-id]');
      if (productEl) return productEl.dataset.productId;

      // JSON-LD
      const jsonLd = this.getJsonLd();
      if (jsonLd?.sku) return jsonLd.sku;

      return null;
    }

    // ========== UTILITAIRES ==========

    getJsonLd() {
      try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product' || data['@type']?.includes('Product')) {
            return data;
          }
        }
      } catch (e) {}
      return null;
    }

    parsePrice(priceStr) {
      if (!priceStr) return null;
      const cleaned = priceStr.replace(/[^0-9.,]/g, '').trim();
      
      // Format européen (1.234,56)
      if (cleaned.includes(',') && cleaned.includes('.')) {
        if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
          return parseFloat(cleaned.replace(/\./g, '').replace(',', '.'));
        }
      }
      
      // Format avec virgule décimale (29,99)
      if (cleaned.includes(',') && !cleaned.includes('.')) {
        const parts = cleaned.split(',');
        if (parts[1]?.length === 2) {
          return parseFloat(cleaned.replace(',', '.'));
        }
      }

      return parseFloat(cleaned.replace(',', ''));
    }

    upgradeImageUrl(url) {
      // Remplacer les thumbnails par les versions HD
      return url
        .replace(/_thumb\./, '_large.')
        .replace(/\?.*$/, ''); // Retirer les query params de redimensionnement
    }

    calculateQualityScore(data) {
      let score = 0;
      
      if (data.name && data.name.length >= 3) score += 20;
      if (data.price && data.price > 0) score += 20;
      if (data.images && data.images.length > 0) score += 10;
      if (data.images && data.images.length >= 3) score += 10;
      if (data.description && data.description.length >= 50) score += 15;
      if (data.variants && data.variants.length > 0) score += 10;
      if (data.brand) score += 5;
      if (data.reviews && data.reviews.length > 0) score += 5;
      if (data.externalId) score += 5;

      return score;
    }
  }

  // Enregistrement global
  window.NewPlatformExtractor = NewPlatformExtractor;

  // Auto-enregistrement dans le registry si disponible
  if (window.ShopOptiExtractorRegistry) {
    window.ShopOptiExtractorRegistry.register('newplatform', new NewPlatformExtractor());
  }
})();
```

### 2. Enregistrer dans le Registry

Ajouter dans `extractors/extractor-registry.js`:

```javascript
// Dans la map PLATFORM_EXTRACTORS
const PLATFORM_EXTRACTORS = {
  // ... extracteurs existants
  'newplatform': () => new window.NewPlatformExtractor()
};
```

### 3. Mettre à jour le manifest

Dans `manifest.json`, ajouter le nouveau script:

```json
{
  "content_scripts": [
    {
      "js": [
        // ... autres scripts
        "extractors/newplatform-extractor.js"
      ],
      "matches": [
        // ... patterns existants
        "*://*.newplatform.com/*"
      ]
    }
  ]
}
```

### 4. Ajouter la détection de plateforme

Dans `lib/platform-detector.js`:

```javascript
// Ajouter le pattern de détection
const PLATFORM_PATTERNS = {
  // ... patterns existants
  newplatform: {
    domains: ['newplatform.com'],
    productUrlPattern: /\/product\/(\d+)/,
    idExtractor: (url) => url.match(/\/product\/(\d+)/)?.[1]
  }
};
```

## 🧪 Tester l'Extracteur

### Test Unitaire

```typescript
// src/test/chrome-extension/__tests__/newplatform-extractor.test.ts

import { describe, it, expect } from 'vitest';

describe('NewPlatform Extractor', () => {
  it('extracts product name correctly', () => {
    // Mock du DOM
    const mockData = { name: 'Test Product' };
    expect(mockData.name).toBe('Test Product');
  });

  it('parses European price format', () => {
    const parsePrice = (str: string) => {
      const cleaned = str.replace(/[^0-9.,]/g, '');
      return parseFloat(cleaned.replace(',', '.'));
    };
    
    expect(parsePrice('29,99 €')).toBe(29.99);
  });
});
```

### Test Manuel

1. Charger l'extension mise à jour dans Chrome
2. Visiter une page produit sur la nouvelle plateforme
3. Vérifier que le bouton d'import apparaît
4. Tester l'extraction complète
5. Vérifier le score de qualité

## 📝 Checklist Avant Merge

- [ ] Extracteur implémente toutes les méthodes de base
- [ ] Tests unitaires passent
- [ ] Test manuel sur 5+ produits différents
- [ ] Gestion des erreurs robuste
- [ ] Score de qualité calibré correctement
- [ ] Documentation mise à jour (README, CHANGELOG)
- [ ] Version bumped à 5.7.x

## 🔧 Debugging

```javascript
// Dans la console du navigateur
ShopOptiExtractorRegistry.extract().then(console.log);

// Vérifier la détection de plateforme
ShopOptiPlatformDetector.detect(window.location.href);

// Logs détaillés
localStorage.setItem('SHOPOPTI_DEBUG', 'true');
```
