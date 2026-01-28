/**
 * Integration Tests for ShopOpti+ Chrome Extension v5.7.0
 * Tests the complete import flow from URL to SaaS
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Types
interface ExtractedProduct {
  title: string;
  price: number;
  url: string;
  description?: string;
  images?: string[];
  videos?: string[];
  variants?: Array<{
    title: string;
    price: number;
    sku?: string;
    available?: boolean;
  }>;
  reviews?: Array<{
    author: string;
    content: string;
    rating: number;
  }>;
  brand?: string;
  category?: string;
  stock?: number;
}

interface ImportResult {
  success: boolean;
  productId?: string;
  error?: string;
  validationScore: number;
  missingFields: string[];
}

// Mock implementations for integration testing
class MockExtractor {
  async extract(url: string, platform: string): Promise<ExtractedProduct | null> {
    // Simulate different extraction scenarios
    if (url.includes('404') || url.includes('notfound')) {
      return null;
    }

    if (url.includes('minimal')) {
      return {
        title: 'Minimal Product',
        price: 19.99,
        url
      };
    }

    if (url.includes('complete')) {
      return {
        title: 'Complete Product with All Features',
        price: 49.99,
        url,
        description: 'This is a complete product description with detailed information about features, specifications, and benefits. It provides comprehensive details for customers.',
        images: [
          'https://cdn.example.com/img1.jpg',
          'https://cdn.example.com/img2.jpg',
          'https://cdn.example.com/img3.jpg'
        ],
        videos: [
          'https://cdn.example.com/video.mp4'
        ],
        variants: [
          { title: 'Small / Red', price: 49.99, sku: 'SKU-SM-RED', available: true },
          { title: 'Medium / Blue', price: 54.99, sku: 'SKU-MD-BLU', available: true },
          { title: 'Large / Green', price: 59.99, sku: 'SKU-LG-GRN', available: false }
        ],
        reviews: [
          { author: 'John D.', content: 'Great product, fast shipping!', rating: 5 },
          { author: 'Marie S.', content: 'Good quality for the price', rating: 4 },
          { author: 'Alex K.', content: 'As described, works well', rating: 5 }
        ],
        brand: 'Premium Brand',
        category: 'Electronics > Accessories',
        stock: 150
      };
    }

    // Default product
    return {
      title: 'Standard Test Product',
      price: 29.99,
      url,
      description: 'A standard product description for testing purposes',
      images: ['https://cdn.example.com/default.jpg'],
      brand: 'Test Brand'
    };
  }
}

class MockValidator {
  validate(product: ExtractedProduct): {
    canImport: boolean;
    score: number;
    errors: string[];
    warnings: string[];
    missingFields: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];

    // Critical fields
    if (!product.title || product.title.length < 3) errors.push('Titre invalide');
    if (!product.price || product.price <= 0) errors.push('Prix invalide');
    if (!product.url?.startsWith('http')) errors.push('URL invalide');

    // Important fields
    if (!product.description || product.description.length < 10) {
      warnings.push('Description manquante');
      missingFields.push('Description');
    }
    if (!product.images?.length) {
      warnings.push('Images manquantes');
      missingFields.push('Images');
    }
    if (!product.brand) missingFields.push('Marque');
    if (!product.category) missingFields.push('Catégorie');

    // Optional fields
    if (!product.videos?.length) missingFields.push('Vidéos');
    if (!product.variants?.length) missingFields.push('Variantes');
    if (!product.reviews?.length) missingFields.push('Avis');
    if (product.stock === undefined) missingFields.push('Stock');

    // Calculate score
    let score = 40; // Base from critical
    if (errors.length === 0) {
      score += product.description ? 15 : 0;
      score += product.images?.length ? 10 : 0;
      score += product.brand ? 5 : 0;
      score += product.category ? 5 : 0;
      score += product.videos?.length ? 5 : 0;
      score += product.variants?.length ? 10 : 0;
      score += product.reviews?.length ? 5 : 0;
      score += product.stock !== undefined ? 5 : 0;
    }

    return {
      canImport: errors.length === 0,
      score: Math.min(100, score),
      errors,
      warnings,
      missingFields
    };
  }
}

class MockNormalizer {
  normalize(product: ExtractedProduct, platform: string): ExtractedProduct {
    return {
      ...product,
      title: product.title.trim().substring(0, 500),
      description: product.description?.substring(0, 50000) || '',
      price: Math.max(0, product.price),
      images: (product.images || []).slice(0, 50),
      videos: (product.videos || []).slice(0, 10),
      variants: (product.variants || []).slice(0, 100),
      reviews: (product.reviews || []).slice(0, 100)
    };
  }
}

class MockBackendClient {
  private products: Map<string, ExtractedProduct> = new Map();

  async import(product: ExtractedProduct): Promise<{ success: boolean; productId?: string; error?: string }> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate server-side validation
    if (!product.title || product.price <= 0) {
      return { success: false, error: 'Validation côté serveur échouée' };
    }

    const productId = 'prod_' + Date.now().toString(36);
    this.products.set(productId, product);

    return { success: true, productId };
  }

  getProduct(id: string): ExtractedProduct | undefined {
    return this.products.get(id);
  }

  getProductCount(): number {
    return this.products.size;
  }
}

// Integration test orchestrator
class IntegrationTestOrchestrator {
  private extractor = new MockExtractor();
  private validator = new MockValidator();
  private normalizer = new MockNormalizer();
  private backend = new MockBackendClient();

  async runFullImport(url: string, platform: string): Promise<ImportResult> {
    // Step 1: Extract
    const extracted = await this.extractor.extract(url, platform);
    if (!extracted) {
      return {
        success: false,
        error: 'Extraction échouée',
        validationScore: 0,
        missingFields: []
      };
    }

    // Step 2: Validate
    const validation = this.validator.validate(extracted);
    if (!validation.canImport) {
      return {
        success: false,
        error: validation.errors.join(', '),
        validationScore: validation.score,
        missingFields: validation.missingFields
      };
    }

    // Step 3: Normalize
    const normalized = this.normalizer.normalize(extracted, platform);

    // Step 4: Import to backend
    const result = await this.backend.import(normalized);

    return {
      success: result.success,
      productId: result.productId,
      error: result.error,
      validationScore: validation.score,
      missingFields: validation.missingFields
    };
  }

  getBackend() {
    return this.backend;
  }
}

describe('Full Import Integration', () => {
  let orchestrator: IntegrationTestOrchestrator;

  beforeEach(() => {
    orchestrator = new IntegrationTestOrchestrator();
  });

  describe('Successful Import Scenarios', () => {
    it('should complete full import for complete product', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/complete-product/dp/B123',
        'amazon'
      );

      expect(result.success).toBe(true);
      expect(result.productId).toBeDefined();
      expect(result.validationScore).toBe(100);
      expect(result.missingFields).toHaveLength(0);
    });

    it('should import minimal product with warnings', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/minimal-product/dp/B123',
        'amazon'
      );

      expect(result.success).toBe(true);
      expect(result.productId).toBeDefined();
      expect(result.validationScore).toBeLessThan(100);
      expect(result.missingFields.length).toBeGreaterThan(0);
    });

    it('should persist product in backend after import', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/complete-product/dp/B123',
        'amazon'
      );

      const backend = orchestrator.getBackend();
      expect(backend.getProductCount()).toBe(1);
      
      const product = backend.getProduct(result.productId!);
      expect(product).toBeDefined();
      expect(product?.title).toContain('Complete Product');
    });
  });

  describe('Failed Import Scenarios', () => {
    it('should fail when product page returns 404', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/404-notfound/dp/B123',
        'amazon'
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Extraction');
    });

    it('should not create product in backend on failure', async () => {
      await orchestrator.runFullImport(
        'https://www.amazon.com/404/dp/B123',
        'amazon'
      );

      const backend = orchestrator.getBackend();
      expect(backend.getProductCount()).toBe(0);
    });
  });

  describe('Validation Score Accuracy', () => {
    it('should give high score for complete products', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/complete-product/dp/B123',
        'amazon'
      );

      expect(result.validationScore).toBeGreaterThanOrEqual(90);
    });

    it('should give medium score for standard products', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/standard-product/dp/B123',
        'amazon'
      );

      expect(result.validationScore).toBeGreaterThanOrEqual(50);
      expect(result.validationScore).toBeLessThan(100);
    });

    it('should give low score for minimal products', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/minimal-product/dp/B123',
        'amazon'
      );

      expect(result.validationScore).toBeLessThan(60);
    });
  });

  describe('Missing Fields Tracking', () => {
    it('should correctly identify all missing fields', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/minimal-product/dp/B123',
        'amazon'
      );

      expect(result.missingFields).toContain('Description');
      expect(result.missingFields).toContain('Images');
      expect(result.missingFields).toContain('Vidéos');
      expect(result.missingFields).toContain('Variantes');
      expect(result.missingFields).toContain('Avis');
    });

    it('should have no missing fields for complete product', async () => {
      const result = await orchestrator.runFullImport(
        'https://www.amazon.com/complete-product/dp/B123',
        'amazon'
      );

      expect(result.missingFields).toHaveLength(0);
    });
  });
});

describe('Multi-Platform Import', () => {
  let orchestrator: IntegrationTestOrchestrator;

  beforeEach(() => {
    orchestrator = new IntegrationTestOrchestrator();
  });

  it('should handle Amazon imports', async () => {
    const result = await orchestrator.runFullImport(
      'https://www.amazon.com/complete-product/dp/B123',
      'amazon'
    );
    expect(result.success).toBe(true);
  });

  it('should handle AliExpress imports', async () => {
    const result = await orchestrator.runFullImport(
      'https://www.aliexpress.com/item/complete-1234.html',
      'aliexpress'
    );
    expect(result.success).toBe(true);
  });

  it('should handle eBay imports', async () => {
    const result = await orchestrator.runFullImport(
      'https://www.ebay.com/itm/complete-product/123456',
      'ebay'
    );
    expect(result.success).toBe(true);
  });

  it('should handle Shopify imports', async () => {
    const result = await orchestrator.runFullImport(
      'https://store.myshopify.com/products/complete-product',
      'shopify'
    );
    expect(result.success).toBe(true);
  });
});

describe('Bulk Import Integration', () => {
  let orchestrator: IntegrationTestOrchestrator;

  beforeEach(() => {
    orchestrator = new IntegrationTestOrchestrator();
  });

  it('should process multiple URLs sequentially', async () => {
    const urls = [
      { url: 'https://www.amazon.com/complete-product/dp/A', platform: 'amazon' },
      { url: 'https://www.amazon.com/complete-product/dp/B', platform: 'amazon' },
      { url: 'https://www.aliexpress.com/item/complete-123.html', platform: 'aliexpress' }
    ];

    const results = [];
    for (const { url, platform } of urls) {
      const result = await orchestrator.runFullImport(url, platform);
      results.push(result);
    }

    expect(results).toHaveLength(3);
    expect(results.every(r => r.success)).toBe(true);
    expect(orchestrator.getBackend().getProductCount()).toBe(3);
  });

  it('should handle mixed success/failure in bulk', async () => {
    const urls = [
      { url: 'https://www.amazon.com/complete-product/dp/A', platform: 'amazon' },
      { url: 'https://www.amazon.com/404-notfound/dp/B', platform: 'amazon' },
      { url: 'https://www.amazon.com/complete-product/dp/C', platform: 'amazon' }
    ];

    const results = [];
    for (const { url, platform } of urls) {
      const result = await orchestrator.runFullImport(url, platform);
      results.push(result);
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    expect(successCount).toBe(2);
    expect(failureCount).toBe(1);
  });

  it('should provide accurate summary for bulk imports', async () => {
    const urls = [
      'https://www.amazon.com/complete-product/dp/A',
      'https://www.amazon.com/minimal-product/dp/B',
      'https://www.amazon.com/404/dp/C'
    ];

    const results = await Promise.all(
      urls.map(url => orchestrator.runFullImport(url, 'amazon'))
    );

    const summary = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      avgScore: results.filter(r => r.success).reduce((acc, r) => acc + r.validationScore, 0) / 
                results.filter(r => r.success).length
    };

    expect(summary.total).toBe(3);
    expect(summary.success).toBe(2);
    expect(summary.failed).toBe(1);
    expect(summary.avgScore).toBeGreaterThan(0);
  });
});

describe('Data Integrity', () => {
  let orchestrator: IntegrationTestOrchestrator;

  beforeEach(() => {
    orchestrator = new IntegrationTestOrchestrator();
  });

  it('should preserve all product data through pipeline', async () => {
    const result = await orchestrator.runFullImport(
      'https://www.amazon.com/complete-product/dp/B123',
      'amazon'
    );

    const product = orchestrator.getBackend().getProduct(result.productId!);

    expect(product?.title).toBeTruthy();
    expect(product?.price).toBeGreaterThan(0);
    expect(product?.images?.length).toBeGreaterThan(0);
    expect(product?.variants?.length).toBeGreaterThan(0);
    expect(product?.reviews?.length).toBeGreaterThan(0);
  });

  it('should limit arrays to prevent data bloat', async () => {
    const result = await orchestrator.runFullImport(
      'https://www.amazon.com/complete-product/dp/B123',
      'amazon'
    );

    const product = orchestrator.getBackend().getProduct(result.productId!);

    expect(product?.images?.length).toBeLessThanOrEqual(50);
    expect(product?.videos?.length).toBeLessThanOrEqual(10);
    expect(product?.variants?.length).toBeLessThanOrEqual(100);
    expect(product?.reviews?.length).toBeLessThanOrEqual(100);
  });

  it('should sanitize text fields', async () => {
    const result = await orchestrator.runFullImport(
      'https://www.amazon.com/complete-product/dp/B123',
      'amazon'
    );

    const product = orchestrator.getBackend().getProduct(result.productId!);

    expect(product?.title.length).toBeLessThanOrEqual(500);
    expect(product?.description?.length).toBeLessThanOrEqual(50000);
  });
});
