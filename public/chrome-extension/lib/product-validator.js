/**
 * ShopOpti+ Product Validator v5.7.1
 * Validates product data completeness and quality before import
 * CRITICAL: Images are now MANDATORY for import
 * Ensures atomic imports: 100% valid OR explicit user acknowledgment
 */

(function() {
  'use strict';

  // Field definitions with validation rules
  // PHASE 1: Images moved to CRITICAL fields
  const FIELD_DEFINITIONS = {
    // Critical fields (import BLOCKED if missing)
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
      },
      // PHASE 1 FIX: Images are now CRITICAL
      images: {
        label: 'Images',
        validate: (v) => Array.isArray(v) && v.length > 0 && v.some(img => typeof img === 'string' && img.startsWith('http')),
        message: 'Au moins 1 image valide est obligatoire pour l\'import'
      }
    },

    // Important fields (warning if missing, but import allowed)
    important: {
      description: {
        label: 'Description',
        validate: (v) => typeof v === 'string' && v.trim().length >= 10,
        message: 'Description trop courte ou absente'
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
        label: 'SKU / ID externe',
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

  // Import blocking severity
  const IMPORT_RULES = {
    // If ANY critical field fails, import is BLOCKED
    blockOnCriticalFailure: true,
    // Minimum score to allow import (even if critical passes)
    minimumImportScore: 30,
    // Force draft status if score below this
    draftThreshold: 60,
    // Fields that trigger "À traiter" backlog if missing
    backlogTriggerFields: ['description', 'brand', 'category']
  };

  class ProductValidator {
    constructor() {
      this.fieldDefinitions = FIELD_DEFINITIONS;
      this.importRules = IMPORT_RULES;
    }

    /**
     * Validate product data and return detailed report
     * @param {Object} productData - Raw product data from extractor
     * @returns {Object} Validation report with atomic import decision
     */
    validate(productData) {
      const report = {
        isValid: true,
        canImport: true,
        shouldBeDraft: false,
        shouldBeBacklogged: false,
        backlogReasons: [],
        score: 0,
        scoreBreakdown: {},
        critical: { passed: [], failed: [] },
        important: { passed: [], failed: [] },
        optional: { passed: [], failed: [] },
        summary: '',
        userMessage: '',
        missingFields: [],
        warnings: [],
        errors: [],
        importDecision: {
          action: 'import', // 'import' | 'draft' | 'block'
          reason: '',
          details: []
        }
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
              
              // Check if this field triggers backlog
              if (this.importRules.backlogTriggerFields.includes(fieldName)) {
                report.shouldBeBacklogged = true;
                report.backlogReasons.push(fieldDef.message);
              }
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

      // PHASE 1 ATOMIC IMPORT LOGIC
      
      // Rule 1: Critical validation - BLOCKS import if ANY critical field fails
      if (report.critical.failed.length > 0) {
        report.isValid = false;
        report.canImport = false;
        report.importDecision = {
          action: 'block',
          reason: 'Données critiques manquantes',
          details: report.critical.failed.map(f => f.message)
        };
      }

      // Calculate overall score
      report.score = this.calculateOverallScore(report.scoreBreakdown);

      // Rule 2: Score-based draft decision
      if (report.canImport && report.score < this.importRules.draftThreshold) {
        report.shouldBeDraft = true;
        report.importDecision = {
          action: 'draft',
          reason: `Score qualité insuffisant (${report.score}% < ${this.importRules.draftThreshold}%)`,
          details: report.warnings
        };
      }

      // Rule 3: Backlog decision based on important fields
      if (report.canImport && report.shouldBeBacklogged) {
        report.shouldBeDraft = true;
        report.importDecision = {
          action: 'draft',
          reason: 'Données importantes manquantes → À traiter',
          details: report.backlogReasons
        };
      }

      // If we can import normally
      if (report.canImport && !report.shouldBeDraft) {
        report.importDecision = {
          action: 'import',
          reason: 'Données complètes',
          details: []
        };
      }

      // Generate user-friendly messages
      report.summary = this.generateSummary(report);
      report.userMessage = this.generateUserMessage(report);

      // Log validation for debugging
      console.log('[ShopOpti+] Validation result:', {
        score: report.score,
        canImport: report.canImport,
        decision: report.importDecision.action,
        criticalFailed: report.critical.failed.map(f => f.field),
        importantFailed: report.important.failed.map(f => f.field)
      });

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
        images: ['image_urls', 'imageUrls', 'gallery', 'photos', 'image_url'],
        price: ['current_price', 'currentPrice', 'sale_price'],
        originalPrice: ['compare_at_price', 'compareAtPrice', 'original_price', 'was_price'],
        brand: ['vendor', 'manufacturer', 'seller'],
        category: ['product_type', 'productType', 'categories'],
        stock: ['inventory', 'quantity', 'stock_quantity', 'inventoryQuantity'],
        sku: ['product_id', 'productId', 'item_id', 'external_id', 'asin', 'itemId'],
        variants: ['options', 'variations', 'skus'],
        reviews: ['ratings', 'customer_reviews', 'feedback'],
        specifications: ['specs', 'attributes', 'technical_details'],
        shippingInfo: ['shipping', 'delivery', 'shipping_details']
      };

      const fieldAliases = aliases[fieldName] || [];
      for (const alias of fieldAliases) {
        if (data[alias] !== undefined) {
          // Special handling for images - convert single URL to array
          if (fieldName === 'images' && typeof data[alias] === 'string') {
            return [data[alias]];
          }
          return data[alias];
        }
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
      const { score, importDecision } = report;
      
      if (importDecision.action === 'block') {
        return '🔴 BLOQUÉ - Données critiques manquantes (titre, prix ou images)';
      }
      if (importDecision.action === 'draft') {
        return '🟠 BROUILLON - Sera ajouté au backlog "À traiter"';
      }
      if (score >= 90) return '✅ Excellent - Import complet recommandé';
      if (score >= 75) return '🟢 Bon - Import avec données complètes';
      if (score >= 60) return '🟡 Correct - Quelques données manquantes';
      return '🟠 Incomplet - Vérifiez les données avant publication';
    }

    /**
     * Generate user-facing message
     */
    generateUserMessage(report) {
      const { importDecision, critical, missingFields } = report;

      if (importDecision.action === 'block') {
        const criticalMissing = critical.failed.map(f => f.label).join(', ');
        return `❌ Import impossible : ${criticalMissing} manquant(s). Veuillez vérifier le produit source.`;
      }

      if (importDecision.action === 'draft') {
        return `⚠️ Produit créé en BROUILLON (${importDecision.reason}). Complétez-le depuis "À traiter".`;
      }

      if (missingFields.length === 0) {
        return '✅ Toutes les données sont disponibles - Import complet';
      }

      const missing = missingFields.slice(0, 3).join(', ');
      const more = missingFields.length > 3 
        ? ` et ${missingFields.length - 3} autre(s)`
        : '';

      return `✓ Import réussi. Données optionnelles manquantes : ${missing}${more}`;
    }

    /**
     * Get quality badge for UI
     */
    getQualityBadge(score, importDecision) {
      if (importDecision && importDecision.action === 'block') {
        return { text: 'Bloqué', color: '#dc2626', icon: '✗', severity: 'critical' };
      }
      if (importDecision && importDecision.action === 'draft') {
        return { text: 'Brouillon', color: '#f97316', icon: '!', severity: 'warning' };
      }
      if (score >= 90) return { text: 'Excellent', color: '#22c55e', icon: '✓✓', severity: 'success' };
      if (score >= 75) return { text: 'Bon', color: '#84cc16', icon: '✓', severity: 'success' };
      if (score >= 60) return { text: 'Correct', color: '#eab308', icon: '~', severity: 'info' };
      if (score >= 40) return { text: 'Incomplet', color: '#f97316', icon: '!', severity: 'warning' };
      return { text: 'Insuffisant', color: '#ef4444', icon: '✗', severity: 'error' };
    }

    /**
     * Quick check - returns import decision
     */
    canImport(productData) {
      const report = this.validate(productData);
      return {
        allowed: report.canImport,
        asDraft: report.shouldBeDraft,
        decision: report.importDecision
      };
    }

    /**
     * Get missing fields summary
     */
    getMissingFieldsSummary(productData) {
      const report = this.validate(productData);
      return {
        critical: report.critical.failed.map(f => f.label),
        important: report.important.failed.map(f => f.label),
        optional: report.optional.failed.map(f => f.label),
        blockingReason: report.importDecision.action === 'block' ? report.importDecision.reason : null
      };
    }

    /**
     * Get structured log for debugging
     */
    getValidationLog(productData, url, platform) {
      const report = this.validate(productData);
      return {
        timestamp: new Date().toISOString(),
        url,
        platform,
        extensionVersion: '5.7.1',
        score: report.score,
        decision: report.importDecision.action,
        criticalPassed: report.critical.passed.map(f => f.field),
        criticalFailed: report.critical.failed.map(f => f.field),
        importantFailed: report.important.failed.map(f => f.field),
        errors: report.errors,
        warnings: report.warnings
      };
    }
  }

  // Singleton instance
  const validator = new ProductValidator();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiValidator = validator;
    window.ProductValidator = ProductValidator;
    window.VALIDATOR_RULES = IMPORT_RULES;
  }

  console.log('[ShopOpti+] ProductValidator v5.7.1 loaded - Images now CRITICAL');
})();
