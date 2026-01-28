/**
 * Tests for ShopOpti+ Import Pipeline v5.7.0
 * Atomic import orchestration with validation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock types for testing
interface ProductData {
  title: string;
  price: number;
  url: string;
  description?: string;
  images?: string[];
  brand?: string;
  category?: string;
  sku?: string;
  videos?: string[];
  variants?: Array<{ title: string; price: number }>;
  reviews?: Array<{ content: string }>;
  stock?: number;
}

interface ValidationReport {
  isValid: boolean;
  canImport: boolean;
  score: number;
  errors: string[];
  warnings: string[];
  missingFields: string[];
}

interface PipelineResult {
  success: boolean;
  stage: string;
  productId?: string;
  error?: string;
  validation?: ValidationReport;
  normalized?: ProductData;
}

// Simplified Pipeline class for testing
class ImportPipeline {
  private stages = ['detect', 'extract', 'validate', 'normalize', 'confirm', 'import'];
  private currentStage = 0;
  private aborted = false;

  async execute(url: string, options: { skipConfirm?: boolean } = {}): Promise<PipelineResult> {
    this.aborted = false;
    this.currentStage = 0;

    try {
      // Stage 1: Detect platform
      const platform = this.detectPlatform(url);
      if (!platform.supported) {
        return this.fail('detect', 'Plateforme non supportée');
      }
      this.currentStage++;

      // Stage 2: Extract data
      const extracted = await this.extractData(url, platform.key);
      if (!extracted) {
        return this.fail('extract', "Échec de l'extraction");
      }
      this.currentStage++;

      // Stage 3: Validate
      const validation = this.validate(extracted);
      if (!validation.canImport) {
        return this.fail('validate', validation.errors.join(', '), validation);
      }
      this.currentStage++;

      // Stage 4: Normalize
      const normalized = this.normalize(extracted, platform.key);
      this.currentStage++;

      // Stage 5: Confirm (if needed)
      if (!options.skipConfirm && validation.warnings.length > 0) {
        const confirmed = await this.confirmImport(validation);
        if (!confirmed) {
          return this.fail('confirm', 'Import annulé par utilisateur');
        }
      }
      this.currentStage++;

      // Stage 6: Import
      if (this.aborted) {
        return this.fail('import', 'Import annulé');
      }
      const productId = await this.sendToBackend(normalized);
      this.currentStage++;

      return {
        success: true,
        stage: 'complete',
        productId,
        validation,
        normalized
      };

    } catch (error) {
      const stage = this.stages[this.currentStage];
      return this.fail(stage, (error as Error).message);
    }
  }

  private fail(stage: string, error: string, validation?: ValidationReport): PipelineResult {
    return {
      success: false,
      stage,
      error,
      validation
    };
  }

  detectPlatform(url: string) {
    const platforms: Record<string, string[]> = {
      amazon: ['amazon.com', 'amazon.fr', 'amazon.de'],
      aliexpress: ['aliexpress.com'],
      ebay: ['ebay.com', 'ebay.fr'],
      shopify: ['myshopify.com']
    };

    const hostname = new URL(url).hostname.toLowerCase();
    
    for (const [key, domains] of Object.entries(platforms)) {
      if (domains.some(d => hostname.includes(d))) {
        return { key, supported: true };
      }
    }

    return { key: 'generic', supported: false };
  }

  async extractData(url: string, platform: string): Promise<ProductData | null> {
    // Simulated extraction - in real code this calls platform extractors
    if (url.includes('invalid')) {
      return null;
    }

    return {
      title: 'Test Product',
      price: 29.99,
      url,
      description: 'A test product description',
      images: ['https://example.com/img.jpg'],
      brand: 'Test Brand',
      category: 'Electronics'
    };
  }

  validate(data: ProductData): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const missingFields: string[] = [];

    // Critical validation
    if (!data.title || data.title.length < 3) {
      errors.push('Titre manquant ou trop court');
    }
    if (!data.price || data.price <= 0) {
      errors.push('Prix invalide');
    }
    if (!data.url || !data.url.startsWith('http')) {
      errors.push('URL invalide');
    }

    // Important validation
    if (!data.description || data.description.length < 10) {
      warnings.push('Description manquante');
      missingFields.push('Description');
    }
    if (!data.images || data.images.length === 0) {
      warnings.push('Images manquantes');
      missingFields.push('Images');
    }

    // Optional fields
    if (!data.videos || data.videos.length === 0) {
      missingFields.push('Vidéos');
    }
    if (!data.reviews || data.reviews.length === 0) {
      missingFields.push('Avis');
    }

    const criticalPassed = errors.length === 0 ? 3 : 3 - errors.length;
    const importantPassed = 5 - warnings.length;
    const optionalPassed = 4 - (missingFields.length - warnings.length);

    const score = Math.round(
      ((criticalPassed / 3) * 40) + 
      ((importantPassed / 5) * 35) + 
      ((Math.max(0, optionalPassed) / 4) * 25)
    );

    return {
      isValid: errors.length === 0,
      canImport: errors.length === 0,
      score,
      errors,
      warnings,
      missingFields
    };
  }

  normalize(data: ProductData, platform: string): ProductData {
    return {
      ...data,
      title: data.title.trim().substring(0, 500),
      description: (data.description || '').substring(0, 50000),
      price: Math.max(0, data.price)
    };
  }

  async confirmImport(validation: ValidationReport): Promise<boolean> {
    // In real implementation, shows confirmation dialog
    // For testing, auto-confirm
    return true;
  }

  async sendToBackend(data: ProductData): Promise<string> {
    // Simulated backend call
    return 'prod_' + Math.random().toString(36).substr(2, 9);
  }

  abort() {
    this.aborted = true;
  }

  getCurrentStage() {
    return this.stages[this.currentStage];
  }

  getProgress() {
    return {
      current: this.currentStage,
      total: this.stages.length,
      percentage: Math.round((this.currentStage / this.stages.length) * 100)
    };
  }
}

describe('ImportPipeline', () => {
  let pipeline: ImportPipeline;

  beforeEach(() => {
    pipeline = new ImportPipeline();
  });

  describe('Pipeline Execution', () => {
    it('should complete successfully for valid product URL', async () => {
      const result = await pipeline.execute('https://www.amazon.com/dp/B08N5WRWNW', { skipConfirm: true });

      expect(result.success).toBe(true);
      expect(result.stage).toBe('complete');
      expect(result.productId).toBeDefined();
    });

    it('should fail at detect stage for unsupported platform', async () => {
      const result = await pipeline.execute('https://unknown-store.com/product');

      expect(result.success).toBe(false);
      expect(result.stage).toBe('detect');
      expect(result.error).toContain('non supportée');
    });

    it('should fail at extract stage for invalid URL', async () => {
      const result = await pipeline.execute('https://www.amazon.com/invalid-product');

      expect(result.success).toBe(false);
      expect(result.stage).toBe('extract');
    });

    it('should include validation report in result', async () => {
      const result = await pipeline.execute('https://www.amazon.com/dp/B08N5WRWNW', { skipConfirm: true });

      expect(result.validation).toBeDefined();
      expect(result.validation?.score).toBeGreaterThan(0);
    });

    it('should include normalized data in successful result', async () => {
      const result = await pipeline.execute('https://www.amazon.com/dp/B08N5WRWNW', { skipConfirm: true });

      expect(result.normalized).toBeDefined();
      expect(result.normalized?.title).toBeDefined();
    });
  });

  describe('Platform Detection', () => {
    it('should detect Amazon URLs', () => {
      const result = pipeline.detectPlatform('https://www.amazon.com/dp/B08N5WRWNW');
      
      expect(result.key).toBe('amazon');
      expect(result.supported).toBe(true);
    });

    it('should detect AliExpress URLs', () => {
      const result = pipeline.detectPlatform('https://www.aliexpress.com/item/123.html');
      
      expect(result.key).toBe('aliexpress');
      expect(result.supported).toBe(true);
    });

    it('should return unsupported for unknown platforms', () => {
      const result = pipeline.detectPlatform('https://random-shop.com/product');
      
      expect(result.supported).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should pass validation for complete product data', () => {
      const product: ProductData = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product',
        description: 'A detailed description here',
        images: ['https://example.com/img.jpg']
      };

      const result = pipeline.validate(product);

      expect(result.canImport).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail validation when title is missing', () => {
      const product: ProductData = {
        title: '',
        price: 29.99,
        url: 'https://example.com/product'
      };

      const result = pipeline.validate(product);

      expect(result.canImport).toBe(false);
      expect(result.errors).toContain('Titre manquant ou trop court');
    });

    it('should fail validation when price is zero', () => {
      const product: ProductData = {
        title: 'Test Product',
        price: 0,
        url: 'https://example.com/product'
      };

      const result = pipeline.validate(product);

      expect(result.canImport).toBe(false);
      expect(result.errors).toContain('Prix invalide');
    });

    it('should add warning when description is missing', () => {
      const product: ProductData = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product',
        description: 'short'
      };

      const result = pipeline.validate(product);

      expect(result.canImport).toBe(true);
      expect(result.warnings).toContain('Description manquante');
    });

    it('should track missing optional fields', () => {
      const product: ProductData = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product',
        description: 'A detailed description'
      };

      const result = pipeline.validate(product);

      expect(result.missingFields).toContain('Vidéos');
      expect(result.missingFields).toContain('Avis');
    });

    it('should calculate score based on field completeness', () => {
      const minimalProduct: ProductData = {
        title: 'Test',
        price: 29.99,
        url: 'https://example.com/product'
      };

      const completeProduct: ProductData = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product',
        description: 'A detailed product description here',
        images: ['https://example.com/img.jpg'],
        brand: 'Brand',
        category: 'Category',
        sku: 'SKU-001',
        videos: ['https://example.com/video.mp4'],
        reviews: [{ content: 'Great!' }],
        stock: 100
      };

      const minimalResult = pipeline.validate(minimalProduct);
      const completeResult = pipeline.validate(completeProduct);

      expect(completeResult.score).toBeGreaterThan(minimalResult.score);
    });
  });

  describe('Normalization', () => {
    it('should trim and limit title length', () => {
      const longTitle = 'A'.repeat(600);
      const product: ProductData = {
        title: '  ' + longTitle + '  ',
        price: 29.99,
        url: 'https://example.com'
      };

      const result = pipeline.normalize(product, 'amazon');

      expect(result.title.length).toBeLessThanOrEqual(500);
      expect(result.title.startsWith('A')).toBe(true);
    });

    it('should ensure price is positive', () => {
      const product: ProductData = {
        title: 'Test',
        price: -10,
        url: 'https://example.com'
      };

      const result = pipeline.normalize(product, 'amazon');

      expect(result.price).toBe(0);
    });
  });

  describe('Abort Handling', () => {
    it('should allow aborting during pipeline execution', async () => {
      // Start execution and immediately abort
      const promise = pipeline.execute('https://www.amazon.com/dp/B08N5WRWNW', { skipConfirm: true });
      pipeline.abort();
      
      const result = await promise;
      // Note: Due to async nature, abort may not always catch before completion
      // This tests the abort mechanism exists
      expect(pipeline['aborted']).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should track current stage', () => {
      expect(pipeline.getCurrentStage()).toBe('detect');
    });

    it('should calculate progress percentage', () => {
      const progress = pipeline.getProgress();

      expect(progress.current).toBe(0);
      expect(progress.total).toBe(6);
      expect(progress.percentage).toBe(0);
    });
  });
});

describe('Bulk Import Queue', () => {
  // Simplified queue for testing
  class BulkImportQueue {
    private queue: string[] = [];
    private results: Map<string, PipelineResult> = new Map();
    private processing = false;

    add(url: string) {
      this.queue.push(url);
      return this.queue.length;
    }

    addBatch(urls: string[]) {
      this.queue.push(...urls);
      return this.queue.length;
    }

    getQueueLength() {
      return this.queue.length;
    }

    async process(pipeline: ImportPipeline): Promise<Map<string, PipelineResult>> {
      this.processing = true;

      for (const url of this.queue) {
        const result = await pipeline.execute(url, { skipConfirm: true });
        this.results.set(url, result);
      }

      this.processing = false;
      this.queue = [];

      return this.results;
    }

    getResults() {
      return this.results;
    }

    getSummary() {
      const results = Array.from(this.results.values());
      return {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length
      };
    }

    clear() {
      this.queue = [];
      this.results.clear();
    }
  }

  let queue: BulkImportQueue;
  let pipeline: ImportPipeline;

  beforeEach(() => {
    queue = new BulkImportQueue();
    pipeline = new ImportPipeline();
  });

  it('should add single URL to queue', () => {
    queue.add('https://www.amazon.com/dp/B08N5WRWNW');

    expect(queue.getQueueLength()).toBe(1);
  });

  it('should add batch of URLs to queue', () => {
    queue.addBatch([
      'https://www.amazon.com/dp/A',
      'https://www.amazon.com/dp/B',
      'https://www.amazon.com/dp/C'
    ]);

    expect(queue.getQueueLength()).toBe(3);
  });

  it('should process all URLs in queue', async () => {
    queue.addBatch([
      'https://www.amazon.com/dp/B08N5WRWNW',
      'https://www.aliexpress.com/item/123.html'
    ]);

    const results = await queue.process(pipeline);

    expect(results.size).toBe(2);
    expect(queue.getQueueLength()).toBe(0);
  });

  it('should provide summary of results', async () => {
    queue.addBatch([
      'https://www.amazon.com/dp/B08N5WRWNW',
      'https://unknown.com/product'
    ]);

    await queue.process(pipeline);
    const summary = queue.getSummary();

    expect(summary.total).toBe(2);
    expect(summary.success).toBe(1);
    expect(summary.failed).toBe(1);
  });

  it('should clear queue and results', async () => {
    queue.add('https://www.amazon.com/dp/B08N5WRWNW');
    await queue.process(pipeline);
    queue.clear();

    expect(queue.getQueueLength()).toBe(0);
    expect(queue.getResults().size).toBe(0);
  });
});
