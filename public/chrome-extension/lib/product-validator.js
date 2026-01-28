/**
 * ShopOpti+ Product Validator v5.7.0
 * Validates product data completeness and quality before import
 * Ensures atomic imports: 100% valid OR explicit user acknowledgment
 */

(function() {
  'use strict';

  // Field definitions with validation rules
  const FIELD_DEFINITIONS = {
    // Critical fields (import blocked if missing)
    critical: {
      title: {
        label: 'Titre',
        validate: (v) => typeof v === 'string' && v.trim().length >= 3,
        message: 'Le titre doit contenir au moins 3 caractères'
      },
      price: {
        label: 'Prix',
        validate: (v) => typeof v === 'number' && v > 0,
        message: 'Le prix doit être un nombre positif'
      },
      url: {
        label: 'URL source',
        validate: (v) => typeof v === 'string' && v.startsWith('http'),
        message: 'URL source invalide'
      }
    },

    // Important fields (warning if missing)
    important: {
      description: {
        label: 'Description',
        validate: (v) => typeof v === 'string' && v.trim().length >= 10,
        message: 'Description trop courte ou absente'
      },
      images: {
        label: 'Images',
        validate: (v) => Array.isArray(v) && v.length > 0,
        message: 'Aucune image détectée'
      },
      brand: {
        label: 'Marque',
        validate: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'Marque non détectée'
      },
      category: {
        label: 'Catégorie',
        validate: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'Catégorie non détectée'
      },
      sku: {
        label: 'SKU',
        validate: (v) => typeof v === 'string' && v.trim().length > 0,
        message: 'SKU non détecté'
      }
    },

    // Optional fields (info if missing)
    optional: {
      videos: {
        label: 'Vidéos',
        validate: (v) => Array.isArray(v) && v.length > 0,
        message: 'Aucune vidéo disponible'
      },
      variants: {
        label: 'Variantes',
        validate: (v) => Array.isArray(v) && v.length > 0,
        message: 'Aucune variante détectée'
      },
      reviews: {
        label: 'Avis',
        validate: (v) => Array.isArray(v) && v.length > 0,
        message: 'Aucun avis disponible'
      },
      stock: {
        label: 'Stock',
        validate: (v) => typeof v === 'number' && v >= 0,
        message: 'Stock non disponible'
      },
      originalPrice: {
        label: 'Prix original',
        validate: (v) => typeof v === 'number' && v > 0,
        message: 'Prix barré non détecté'
      },
      specifications: {
        label: 'Spécifications',
        validate: (v) => typeof v === 'object' && Object.keys(v || {}).length > 0,
        message: 'Pas de spécifications techniques'
      },
      shippingInfo: {
        label: 'Livraison',
        validate: (v) => typeof v === 'object' && v !== null,
        message: 'Informations de livraison non disponibles'
      }
    }
  };

  // Scoring weights
  const SCORING_WEIGHTS = {
    critical: 40,
    important: 35,
    optional: 25
  };

  class ProductValidator {
    constructor() {
      this.fieldDefinitions = FIELD_DEFINITIONS;
    }

    /**
     * Validate product data and return detailed report
     * @param {Object} productData - Raw product data from extractor
     * @returns {Object} Validation report
     */
    validate(productData) {
      const report = {
        isValid: true,
        canImport: true,
        score: 0,
        scoreBreakdown: {},
        critical: { passed: [], failed: [] },
        important: { passed: [], failed: [] },
        optional: { passed: [], failed: [] },
        summary: '',
        userMessage: '',
        missingFields: [],
        warnings: [],
        errors: []
      };

      // Validate each category
      ['critical', 'important', 'optional'].forEach(category => {
        const fields = this.fieldDefinitions[category];
        let categoryScore = 0;
        let totalFields = Object.keys(fields).length;

        Object.entries(fields).forEach(([fieldName, fieldDef]) => {
          const value = this.getFieldValue(productData, fieldName);
          const isValid = fieldDef.validate(value);

          if (isValid) {
            report[category].passed.push({
              field: fieldName,
              label: fieldDef.label,
              value: this.summarizeValue(value)
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

        // Calculate category percentage
        const categoryPercentage = totalFields > 0 ? (categoryScore / totalFields) * 100 : 0;
        report.scoreBreakdown[category] = {
          passed: categoryScore,
          total: totalFields,
          percentage: Math.round(categoryPercentage)
        };
      });

      // Critical validation - blocks import if failed
      if (report.critical.failed.length > 0) {
        report.isValid = false;
        report.canImport = false;
      }

      // Calculate overall score
      report.score = this.calculateOverallScore(report.scoreBreakdown);

      // Generate user-friendly messages
      report.summary = this.generateSummary(report);
      report.userMessage = this.generateUserMessage(report);

      return report;
    }

    /**
     * Get field value with common aliases
     */
    getFieldValue(data, fieldName) {
      // Direct match
      if (data[fieldName] !== undefined) return data[fieldName];

      // Common aliases
      const aliases = {
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
        reviews: ['ratings', 'customer_reviews', 'feedback'],
        specifications: ['specs', 'attributes', 'technical_details'],
        shippingInfo: ['shipping', 'delivery', 'shipping_details']
      };

      const fieldAliases = aliases[fieldName] || [];
      for (const alias of fieldAliases) {
        if (data[alias] !== undefined) return data[alias];
      }

      return undefined;
    }

    /**
     * Summarize value for display
     */
    summarizeValue(value) {
      if (Array.isArray(value)) {
        return `${value.length} élément(s)`;
      }
      if (typeof value === 'object' && value !== null) {
        return `${Object.keys(value).length} propriété(s)`;
      }
      if (typeof value === 'string' && value.length > 50) {
        return value.substring(0, 50) + '...';
      }
      return String(value);
    }

    /**
     * Calculate weighted overall score
     */
    calculateOverallScore(breakdown) {
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

    /**
     * Generate summary text
     */
    generateSummary(report) {
      const { score, critical, important, optional } = report;
      
      if (score >= 90) return '✅ Excellent - Import complet recommandé';
      if (score >= 75) return '🟢 Bon - Import avec données complètes';
      if (score >= 60) return '🟡 Correct - Quelques données manquantes';
      if (score >= 40) return '🟠 Incomplet - Données importantes manquantes';
      return '🔴 Insuffisant - Données critiques manquantes';
    }

    /**
     * Generate user-facing message
     */
    generateUserMessage(report) {
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

    /**
     * Get quality badge for UI
     */
    getQualityBadge(score) {
      if (score >= 90) return { text: 'Excellent', color: '#22c55e', icon: '✓✓' };
      if (score >= 75) return { text: 'Bon', color: '#84cc16', icon: '✓' };
      if (score >= 60) return { text: 'Correct', color: '#eab308', icon: '~' };
      if (score >= 40) return { text: 'Incomplet', color: '#f97316', icon: '!' };
      return { text: 'Insuffisant', color: '#ef4444', icon: '✗' };
    }

    /**
     * Quick check - just returns if importable
     */
    canImport(productData) {
      const report = this.validate(productData);
      return report.canImport;
    }

    /**
     * Get missing fields summary
     */
    getMissingFieldsSummary(productData) {
      const report = this.validate(productData);
      return {
        critical: report.critical.failed.map(f => f.label),
        important: report.important.failed.map(f => f.label),
        optional: report.optional.failed.map(f => f.label)
      };
    }
  }

  // Singleton instance
  const validator = new ProductValidator();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiValidator = validator;
    window.ProductValidator = ProductValidator;
  }

  console.log('[ShopOpti+] ProductValidator v5.7.0 loaded');
})();
