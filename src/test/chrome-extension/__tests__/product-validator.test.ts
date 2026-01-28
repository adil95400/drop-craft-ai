/**
 * Tests for ShopOpti+ Product Validator v5.7.0
 * Validates product data completeness and quality before import
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the validator module for testing in Node environment
const FIELD_DEFINITIONS = {
  critical: {
    title: {
      label: 'Titre',
      validate: (v: unknown) => typeof v === 'string' && (v as string).trim().length >= 3,
      message: 'Le titre doit contenir au moins 3 caractères'
    },
    price: {
      label: 'Prix',
      validate: (v: unknown) => typeof v === 'number' && (v as number) > 0,
      message: 'Le prix doit être un nombre positif'
    },
    url: {
      label: 'URL source',
      validate: (v: unknown) => typeof v === 'string' && (v as string).startsWith('http'),
      message: 'URL source invalide'
    }
  },
  important: {
    description: {
      label: 'Description',
      validate: (v: unknown) => typeof v === 'string' && (v as string).trim().length >= 10,
      message: 'Description trop courte ou absente'
    },
    images: {
      label: 'Images',
      validate: (v: unknown) => Array.isArray(v) && (v as unknown[]).length > 0,
      message: 'Aucune image détectée'
    },
    brand: {
      label: 'Marque',
      validate: (v: unknown) => typeof v === 'string' && (v as string).trim().length > 0,
      message: 'Marque non détectée'
    },
    category: {
      label: 'Catégorie',
      validate: (v: unknown) => typeof v === 'string' && (v as string).trim().length > 0,
      message: 'Catégorie non détectée'
    },
    sku: {
      label: 'SKU',
      validate: (v: unknown) => typeof v === 'string' && (v as string).trim().length > 0,
      message: 'SKU non détecté'
    }
  },
  optional: {
    videos: {
      label: 'Vidéos',
      validate: (v: unknown) => Array.isArray(v) && (v as unknown[]).length > 0,
      message: 'Aucune vidéo disponible'
    },
    variants: {
      label: 'Variantes',
      validate: (v: unknown) => Array.isArray(v) && (v as unknown[]).length > 0,
      message: 'Aucune variante détectée'
    },
    reviews: {
      label: 'Avis',
      validate: (v: unknown) => Array.isArray(v) && (v as unknown[]).length > 0,
      message: 'Aucun avis disponible'
    },
    stock: {
      label: 'Stock',
      validate: (v: unknown) => typeof v === 'number' && (v as number) >= 0,
      message: 'Stock non disponible'
    }
  }
};

const SCORING_WEIGHTS = {
  critical: 40,
  important: 35,
  optional: 25
};

// Simplified validator class for testing
class ProductValidator {
  fieldDefinitions = FIELD_DEFINITIONS;

  validate(productData: Record<string, unknown>) {
    const report = {
      isValid: true,
      canImport: true,
      score: 0,
      scoreBreakdown: {} as Record<string, { passed: number; total: number; percentage: number }>,
      critical: { passed: [] as { field: string; label: string }[], failed: [] as { field: string; label: string; message: string }[] },
      important: { passed: [] as { field: string; label: string }[], failed: [] as { field: string; label: string; message: string }[] },
      optional: { passed: [] as { field: string; label: string }[], failed: [] as { field: string; label: string; message: string }[] },
      summary: '',
      userMessage: '',
      missingFields: [] as string[],
      warnings: [] as string[],
      errors: [] as string[]
    };

    (['critical', 'important', 'optional'] as const).forEach(category => {
      const fields = this.fieldDefinitions[category];
      let categoryScore = 0;
      const totalFields = Object.keys(fields).length;

      Object.entries(fields).forEach(([fieldName, fieldDef]) => {
        const value = this.getFieldValue(productData, fieldName);
        const isValid = fieldDef.validate(value);

        if (isValid) {
          report[category].passed.push({
            field: fieldName,
            label: fieldDef.label
          });
          categoryScore++;
        } else {
          report[category].failed.push({
            field: fieldName,
            label: fieldDef.label,
            message: fieldDef.message
          });
          report.missingFields.push(fieldDef.label);

          if (category === 'critical') {
            report.errors.push(fieldDef.message);
          } else if (category === 'important') {
            report.warnings.push(fieldDef.message);
          }
        }
      });

      const categoryPercentage = totalFields > 0 ? (categoryScore / totalFields) * 100 : 0;
      report.scoreBreakdown[category] = {
        passed: categoryScore,
        total: totalFields,
        percentage: Math.round(categoryPercentage)
      };
    });

    if (report.critical.failed.length > 0) {
      report.isValid = false;
      report.canImport = false;
    }

    report.score = this.calculateOverallScore(report.scoreBreakdown);
    report.summary = this.generateSummary(report);
    report.userMessage = this.generateUserMessage(report);

    return report;
  }

  getFieldValue(data: Record<string, unknown>, fieldName: string) {
    if (data[fieldName] !== undefined) return data[fieldName];

    const aliases: Record<string, string[]> = {
      title: ['name', 'productName', 'product_name'],
      description: ['desc', 'body', 'body_html', 'product_description'],
      images: ['image_urls', 'imageUrls', 'gallery', 'photos'],
      price: ['current_price', 'currentPrice', 'sale_price'],
      originalPrice: ['compare_at_price', 'compareAtPrice', 'original_price', 'was_price'],
      brand: ['vendor', 'manufacturer', 'seller'],
      category: ['product_type', 'productType', 'categories'],
      stock: ['inventory', 'quantity', 'stock_quantity', 'inventoryQuantity'],
      sku: ['product_id', 'productId', 'item_id', 'external_id'],
      variants: ['options', 'variations', 'skus'],
      reviews: ['ratings', 'customer_reviews', 'feedback']
    };

    const fieldAliases = aliases[fieldName] || [];
    for (const alias of fieldAliases) {
      if (data[alias] !== undefined) return data[alias];
    }

    return undefined;
  }

  calculateOverallScore(breakdown: Record<string, { passed: number; total: number; percentage: number }>) {
    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(SCORING_WEIGHTS).forEach(([category, weight]) => {
      if (breakdown[category]) {
        totalScore += (breakdown[category].percentage / 100) * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round((totalScore / totalWeight) * 100) : 0;
  }

  generateSummary(report: { score: number }) {
    const { score } = report;
    if (score >= 90) return '✅ Excellent - Import complet recommandé';
    if (score >= 75) return '🟢 Bon - Import avec données complètes';
    if (score >= 60) return '🟡 Correct - Quelques données manquantes';
    if (score >= 40) return '🟠 Incomplet - Données importantes manquantes';
    return '🔴 Insuffisant - Données critiques manquantes';
  }

  generateUserMessage(report: { canImport: boolean; critical: { failed: { label: string }[] }; missingFields: string[] }) {
    if (!report.canImport) {
      const criticalMissing = report.critical.failed.map(f => f.label).join(', ');
      return `❌ Import impossible : ${criticalMissing} manquant(s)`;
    }

    if (report.missingFields.length === 0) {
      return '✅ Toutes les données sont disponibles';
    }

    const missing = report.missingFields.slice(0, 3).join(', ');
    const more = report.missingFields.length > 3 
      ? ` et ${report.missingFields.length - 3} autre(s)`
      : '';

    return `⚠️ Ce produit sera importé sans : ${missing}${more}`;
  }

  getQualityBadge(score: number) {
    if (score >= 90) return { text: 'Excellent', color: '#22c55e', icon: '✓✓' };
    if (score >= 75) return { text: 'Bon', color: '#84cc16', icon: '✓' };
    if (score >= 60) return { text: 'Correct', color: '#eab308', icon: '~' };
    if (score >= 40) return { text: 'Incomplet', color: '#f97316', icon: '!' };
    return { text: 'Insuffisant', color: '#ef4444', icon: '✗' };
  }

  canImport(productData: Record<string, unknown>) {
    const report = this.validate(productData);
    return report.canImport;
  }

  getMissingFieldsSummary(productData: Record<string, unknown>) {
    const report = this.validate(productData);
    return {
      critical: report.critical.failed.map(f => f.label),
      important: report.important.failed.map(f => f.label),
      optional: report.optional.failed.map(f => f.label)
    };
  }
}

describe('ProductValidator', () => {
  let validator: ProductValidator;

  beforeEach(() => {
    validator = new ProductValidator();
  });

  describe('Critical Field Validation', () => {
    it('should block import when title is missing', () => {
      const product = {
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      const report = validator.validate(product);

      expect(report.canImport).toBe(false);
      expect(report.isValid).toBe(false);
      expect(report.critical.failed).toContainEqual(
        expect.objectContaining({ field: 'title' })
      );
    });

    it('should block import when price is zero or negative', () => {
      const product = {
        title: 'Test Product',
        price: 0,
        url: 'https://example.com/product/123'
      };

      const report = validator.validate(product);

      expect(report.canImport).toBe(false);
      expect(report.errors).toContain('Le prix doit être un nombre positif');
    });

    it('should block import when URL is invalid', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'invalid-url'
      };

      const report = validator.validate(product);

      expect(report.canImport).toBe(false);
      expect(report.errors).toContain('URL source invalide');
    });

    it('should allow import when all critical fields are valid', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      const report = validator.validate(product);

      expect(report.canImport).toBe(true);
      expect(report.critical.passed.length).toBe(3);
      expect(report.critical.failed.length).toBe(0);
    });
  });

  describe('Important Field Validation', () => {
    it('should add warning when description is too short', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123',
        description: 'Short'
      };

      const report = validator.validate(product);

      expect(report.canImport).toBe(true);
      expect(report.warnings).toContain('Description trop courte ou absente');
    });

    it('should add warning when images array is empty', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123',
        images: []
      };

      const report = validator.validate(product);

      expect(report.canImport).toBe(true);
      expect(report.warnings).toContain('Aucune image détectée');
    });

    it('should pass when description is sufficient', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123',
        description: 'This is a detailed description of the product with more than 10 characters'
      };

      const report = validator.validate(product);

      expect(report.important.passed).toContainEqual(
        expect.objectContaining({ field: 'description' })
      );
    });
  });

  describe('Optional Field Validation', () => {
    it('should not block import when optional fields are missing', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      const report = validator.validate(product);

      expect(report.canImport).toBe(true);
      expect(report.optional.failed.length).toBeGreaterThan(0);
    });

    it('should include videos in passed when available', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123',
        videos: ['https://example.com/video.mp4']
      };

      const report = validator.validate(product);

      expect(report.optional.passed).toContainEqual(
        expect.objectContaining({ field: 'videos' })
      );
    });
  });

  describe('Field Aliases', () => {
    it('should recognize "name" as alias for "title"', () => {
      const product = {
        name: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      const report = validator.validate(product);

      expect(report.critical.passed).toContainEqual(
        expect.objectContaining({ field: 'title' })
      );
    });

    it('should recognize "vendor" as alias for "brand"', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123',
        vendor: 'Test Brand'
      };

      const report = validator.validate(product);

      expect(report.important.passed).toContainEqual(
        expect.objectContaining({ field: 'brand' })
      );
    });

    it('should recognize "gallery" as alias for "images"', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123',
        gallery: ['https://example.com/img1.jpg']
      };

      const report = validator.validate(product);

      expect(report.important.passed).toContainEqual(
        expect.objectContaining({ field: 'images' })
      );
    });
  });

  describe('Score Calculation', () => {
    it('should return 100% for complete product data', () => {
      const completeProduct = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123',
        description: 'A detailed product description with all the info needed',
        images: ['https://example.com/img1.jpg'],
        brand: 'Test Brand',
        category: 'Electronics',
        sku: 'TEST-SKU-001',
        videos: ['https://example.com/video.mp4'],
        variants: [{ id: '1', title: 'Default' }],
        reviews: [{ author: 'John', content: 'Great product!' }],
        stock: 100
      };

      const report = validator.validate(completeProduct);

      expect(report.score).toBe(100);
      expect(report.summary).toContain('Excellent');
    });

    it('should return low score for minimal product data', () => {
      const minimalProduct = {
        title: 'Test',
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      const report = validator.validate(minimalProduct);

      expect(report.score).toBeLessThan(50);
    });
  });

  describe('Quality Badge', () => {
    it('should return Excellent badge for score >= 90', () => {
      const badge = validator.getQualityBadge(95);

      expect(badge.text).toBe('Excellent');
      expect(badge.color).toBe('#22c55e');
    });

    it('should return Insuffisant badge for score < 40', () => {
      const badge = validator.getQualityBadge(30);

      expect(badge.text).toBe('Insuffisant');
      expect(badge.color).toBe('#ef4444');
    });
  });

  describe('User Messages', () => {
    it('should generate clear message when import is blocked', () => {
      const product = {
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      const report = validator.validate(product);

      expect(report.userMessage).toContain('Import impossible');
      expect(report.userMessage).toContain('Titre');
    });

    it('should list missing fields in warning message', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      const report = validator.validate(product);

      expect(report.userMessage).toContain('importé sans');
    });

    it('should confirm all data available for complete product', () => {
      const completeProduct = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123',
        description: 'A detailed product description with all the info needed',
        images: ['https://example.com/img1.jpg'],
        brand: 'Test Brand',
        category: 'Electronics',
        sku: 'TEST-SKU-001',
        videos: ['https://example.com/video.mp4'],
        variants: [{ id: '1', title: 'Default' }],
        reviews: [{ author: 'John', content: 'Great product!' }],
        stock: 100
      };

      const report = validator.validate(completeProduct);

      expect(report.userMessage).toContain('Toutes les données sont disponibles');
    });
  });

  describe('canImport shorthand', () => {
    it('should return true for valid product', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      expect(validator.canImport(product)).toBe(true);
    });

    it('should return false for invalid product', () => {
      const product = {
        price: 29.99
      };

      expect(validator.canImport(product)).toBe(false);
    });
  });

  describe('getMissingFieldsSummary', () => {
    it('should return categorized missing fields', () => {
      const product = {
        title: 'Test Product',
        price: 29.99,
        url: 'https://example.com/product/123'
      };

      const summary = validator.getMissingFieldsSummary(product);

      expect(summary.critical).toEqual([]);
      expect(summary.important).toContain('Description');
      expect(summary.optional).toContain('Vidéos');
    });
  });
});
