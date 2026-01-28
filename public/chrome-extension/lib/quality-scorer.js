/**
 * ShopOpti+ Quality Scorer v5.7.0
 * Platform-aware weighted scoring system
 * Provides explainable quality scores for product imports
 */

(function() {
  'use strict';

  if (window.__shopoptiQualityScorerLoaded) return;
  window.__shopoptiQualityScorerLoaded = true;

  /**
   * Scoring weights by category (total = 100%)
   */
  const SCORING_WEIGHTS = {
    identification: 15,  // External ID, URL, Platform
    content: 25,         // Title, Description, Brand
    media: 25,           // Images, Videos
    variants: 15,        // Variant coverage
    pricing: 10,         // Price, Original price, Currency
    metadata: 10         // Reviews, Specifications, Shipping
  };

  /**
   * Platform-specific weight adjustments
   * Some platforms have stronger/weaker data points
   */
  const PLATFORM_ADJUSTMENTS = {
    aliexpress: {
      media: 1.2,        // Strong image galleries
      variants: 1.1,     // Good variant support
      metadata: 0.8      // Reviews often incomplete
    },
    amazon: {
      content: 1.2,      // Rich descriptions
      media: 1.1,        // A+ content
      variants: 0.9,     // ASIN-based, less granular
      metadata: 1.2      // Strong specifications
    },
    shopify: {
      content: 1.0,
      media: 1.0,
      variants: 1.2,     // Native variant support
      metadata: 0.8      // Varies by store
    },
    temu: {
      media: 1.1,
      variants: 1.0,
      pricing: 1.2,      // Strong pricing data
      metadata: 0.7
    },
    ebay: {
      identification: 1.1,
      content: 1.0,
      pricing: 1.1,
      metadata: 0.9
    },
    etsy: {
      content: 1.2,      // Artisan descriptions
      media: 1.1,
      variants: 1.0,
      metadata: 1.0
    }
  };

  /**
   * Minimum thresholds for quality levels
   */
  const QUALITY_THRESHOLDS = {
    excellent: 85,
    good: 70,
    acceptable: 55,
    poor: 40,
    insufficient: 0
  };

  /**
   * Field scoring rules
   */
  const FIELD_SCORING = {
    // Identification
    external_id: {
      category: 'identification',
      weight: 5,
      score: (value) => value && value.length >= 3 ? 100 : 0
    },
    url: {
      category: 'identification',
      weight: 5,
      score: (value) => value && value.startsWith('http') ? 100 : 0
    },
    platform: {
      category: 'identification',
      weight: 5,
      score: (value) => value && value.length >= 2 ? 100 : 0
    },

    // Content
    title: {
      category: 'content',
      weight: 10,
      score: (value) => {
        if (!value) return 0;
        const len = value.length;
        if (len < 10) return 20;
        if (len < 30) return 60;
        if (len < 80) return 100;
        if (len < 150) return 90;
        return 70; // Too long
      }
    },
    description: {
      category: 'content',
      weight: 10,
      score: (value) => {
        if (!value) return 0;
        const len = value.length;
        if (len < 50) return 20;
        if (len < 200) return 60;
        if (len < 1000) return 100;
        if (len < 5000) return 90;
        return 80;
      }
    },
    brand: {
      category: 'content',
      weight: 5,
      score: (value) => value && value.length >= 2 ? 100 : 0
    },

    // Media
    images: {
      category: 'media',
      weight: 20,
      score: (value) => {
        if (!Array.isArray(value)) return 0;
        const count = value.length;
        if (count === 0) return 0;
        if (count === 1) return 40;
        if (count < 3) return 60;
        if (count < 5) return 80;
        if (count < 10) return 100;
        return 95; // Many images is good but diminishing returns
      }
    },
    videos: {
      category: 'media',
      weight: 5,
      score: (value) => {
        if (!Array.isArray(value)) return 50; // Optional field
        if (value.length === 0) return 50;
        if (value.length >= 1) return 100;
        return 50;
      }
    },

    // Variants
    variants: {
      category: 'variants',
      weight: 15,
      score: (value, productData) => {
        if (!Array.isArray(value)) return 50; // Optional
        if (value.length === 0) return 50; // Single variant products
        
        // Check variant quality
        let qualityScore = 0;
        const checks = {
          hasPrice: value.every(v => v.price > 0),
          hasSku: value.filter(v => v.sku).length / value.length > 0.5,
          hasOptions: value.every(v => Object.keys(v.options || {}).length > 0),
          hasImages: value.filter(v => v.image_url).length / value.length > 0.3
        };
        
        if (checks.hasPrice) qualityScore += 40;
        if (checks.hasSku) qualityScore += 20;
        if (checks.hasOptions) qualityScore += 30;
        if (checks.hasImages) qualityScore += 10;
        
        return Math.min(100, qualityScore);
      }
    },

    // Pricing
    price: {
      category: 'pricing',
      weight: 6,
      score: (value) => value && value > 0 ? 100 : 0
    },
    original_price: {
      category: 'pricing',
      weight: 2,
      score: (value, productData) => {
        if (value && value > (productData?.price || 0)) return 100;
        return 50; // Optional field
      }
    },
    currency: {
      category: 'pricing',
      weight: 2,
      score: (value) => value && value.length === 3 ? 100 : 50
    },

    // Metadata
    reviews: {
      category: 'metadata',
      weight: 3,
      score: (value) => {
        if (!Array.isArray(value)) return 40;
        if (value.length === 0) return 40;
        if (value.length < 5) return 60;
        if (value.length < 20) return 80;
        return 100;
      }
    },
    rating: {
      category: 'metadata',
      weight: 2,
      score: (value) => {
        if (!value || value < 0) return 40;
        if (value >= 0 && value <= 5) return 100;
        return 40;
      }
    },
    reviews_count: {
      category: 'metadata',
      weight: 2,
      score: (value) => {
        if (!value || value < 0) return 40;
        if (value > 0) return 100;
        return 40;
      }
    },
    specifications: {
      category: 'metadata',
      weight: 2,
      score: (value) => {
        if (!value || typeof value !== 'object') return 40;
        const count = Object.keys(value).length;
        if (count === 0) return 40;
        if (count < 3) return 60;
        if (count < 10) return 80;
        return 100;
      }
    },
    shipping_info: {
      category: 'metadata',
      weight: 1,
      score: (value) => {
        if (!value) return 40;
        if (typeof value === 'object' && Object.keys(value).length > 0) return 100;
        return 60;
      }
    }
  };

  /**
   * Main QualityScorer class
   */
  class QualityScorer {
    constructor() {
      this.version = '5.7.0';
      this.weights = SCORING_WEIGHTS;
      this.platformAdjustments = PLATFORM_ADJUSTMENTS;
      this.thresholds = QUALITY_THRESHOLDS;
      this.fieldScoring = FIELD_SCORING;
    }

    /**
     * Calculate comprehensive quality score
     * @param {object} productData - Normalized product data
     * @param {string} platform - Source platform for weight adjustments
     * @returns {object} Detailed score report
     */
    calculate(productData, platform = 'generic') {
      const startTime = Date.now();
      
      // Get platform-specific adjustments
      const adjustments = this.platformAdjustments[platform] || {};
      
      // Score each field
      const fieldScores = {};
      const categoryScores = {
        identification: { score: 0, maxScore: 0, fields: [] },
        content: { score: 0, maxScore: 0, fields: [] },
        media: { score: 0, maxScore: 0, fields: [] },
        variants: { score: 0, maxScore: 0, fields: [] },
        pricing: { score: 0, maxScore: 0, fields: [] },
        metadata: { score: 0, maxScore: 0, fields: [] }
      };

      Object.entries(this.fieldScoring).forEach(([fieldName, config]) => {
        const value = productData[fieldName];
        const rawScore = config.score(value, productData);
        const weight = config.weight;
        const category = config.category;
        const adjustment = adjustments[category] || 1;
        
        const adjustedWeight = weight * adjustment;
        const weightedScore = (rawScore / 100) * adjustedWeight;

        fieldScores[fieldName] = {
          rawScore,
          weight: adjustedWeight,
          weightedScore,
          category,
          value: this.summarizeValue(value)
        };

        categoryScores[category].score += weightedScore;
        categoryScores[category].maxScore += adjustedWeight;
        categoryScores[category].fields.push({
          name: fieldName,
          score: rawScore,
          weight: adjustedWeight
        });
      });

      // Calculate category percentages
      Object.keys(categoryScores).forEach(category => {
        const cat = categoryScores[category];
        cat.percentage = cat.maxScore > 0 
          ? Math.round((cat.score / cat.maxScore) * 100) 
          : 0;
      });

      // Calculate overall score
      let totalScore = 0;
      let totalWeight = 0;
      Object.entries(categoryScores).forEach(([category, data]) => {
        const baseWeight = this.weights[category];
        const adjustment = adjustments[category] || 1;
        const adjustedWeight = baseWeight * adjustment;
        
        totalScore += (data.percentage / 100) * adjustedWeight;
        totalWeight += adjustedWeight;
      });

      const overallScore = totalWeight > 0 
        ? Math.round((totalScore / totalWeight) * 100) 
        : 0;

      // Determine quality level
      const qualityLevel = this.getQualityLevel(overallScore);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(categoryScores, fieldScores);
      
      // Build issues list
      const issues = this.identifyIssues(productData, fieldScores);

      return {
        score: overallScore,
        qualityLevel,
        badge: this.getQualityBadge(overallScore),
        canImport: overallScore >= this.thresholds.poor,
        isRecommended: overallScore >= this.thresholds.acceptable,
        
        categories: categoryScores,
        fields: fieldScores,
        
        issues,
        recommendations,
        
        platform,
        adjustmentsApplied: Object.keys(adjustments).length > 0,
        calculationTimeMs: Date.now() - startTime,
        
        summary: this.generateSummary(overallScore, issues.length)
      };
    }

    /**
     * Get quality level from score
     */
    getQualityLevel(score) {
      if (score >= this.thresholds.excellent) return 'excellent';
      if (score >= this.thresholds.good) return 'good';
      if (score >= this.thresholds.acceptable) return 'acceptable';
      if (score >= this.thresholds.poor) return 'poor';
      return 'insufficient';
    }

    /**
     * Get visual badge for UI
     */
    getQualityBadge(score) {
      if (score >= 85) return { text: 'Excellent', color: '#22c55e', icon: '✓✓', emoji: '🟢' };
      if (score >= 70) return { text: 'Bon', color: '#84cc16', icon: '✓', emoji: '🟢' };
      if (score >= 55) return { text: 'Correct', color: '#eab308', icon: '~', emoji: '🟡' };
      if (score >= 40) return { text: 'Incomplet', color: '#f97316', icon: '!', emoji: '🟠' };
      return { text: 'Insuffisant', color: '#ef4444', icon: '✗', emoji: '🔴' };
    }

    /**
     * Summarize value for display
     */
    summarizeValue(value) {
      if (value === null || value === undefined) return 'Non disponible';
      if (Array.isArray(value)) return `${value.length} élément(s)`;
      if (typeof value === 'object') return `${Object.keys(value).length} propriété(s)`;
      if (typeof value === 'string') {
        if (value.length > 50) return value.substring(0, 47) + '...';
        return value;
      }
      if (typeof value === 'number') return value.toLocaleString('fr-FR');
      return String(value);
    }

    /**
     * Identify issues with the product data
     */
    identifyIssues(productData, fieldScores) {
      const issues = [];

      // Critical issues
      if (!productData.title || productData.title.length < 10) {
        issues.push({
          severity: 'critical',
          field: 'title',
          message: 'Titre manquant ou trop court',
          impact: 'Import bloqué'
        });
      }

      if (!productData.price || productData.price <= 0) {
        issues.push({
          severity: 'critical',
          field: 'price',
          message: 'Prix invalide ou manquant',
          impact: 'Import bloqué'
        });
      }

      // Important issues
      if (!productData.images || productData.images.length === 0) {
        issues.push({
          severity: 'important',
          field: 'images',
          message: 'Aucune image détectée',
          impact: 'Produit difficile à vendre'
        });
      } else if (productData.images.length < 3) {
        issues.push({
          severity: 'warning',
          field: 'images',
          message: 'Moins de 3 images',
          impact: 'Conversion réduite'
        });
      }

      if (!productData.description || productData.description.length < 100) {
        issues.push({
          severity: 'important',
          field: 'description',
          message: 'Description insuffisante',
          impact: 'SEO et conversion impactés'
        });
      }

      if (!productData.brand) {
        issues.push({
          severity: 'warning',
          field: 'brand',
          message: 'Marque non détectée',
          impact: 'Filtrage par marque impossible'
        });
      }

      // Variant issues
      if (productData.variants && productData.variants.length > 0) {
        const variantsWithoutSku = productData.variants.filter(v => !v.sku).length;
        if (variantsWithoutSku > productData.variants.length * 0.5) {
          issues.push({
            severity: 'warning',
            field: 'variants',
            message: `${variantsWithoutSku}/${productData.variants.length} variantes sans SKU`,
            impact: 'Gestion des stocks difficile'
          });
        }

        const variantsWithoutImages = productData.variants.filter(v => !v.image_url).length;
        if (variantsWithoutImages === productData.variants.length && productData.variants.length > 1) {
          issues.push({
            severity: 'warning',
            field: 'variants',
            message: 'Aucune variante avec image dédiée',
            impact: 'Expérience client réduite'
          });
        }
      }

      return issues.sort((a, b) => {
        const order = { critical: 0, important: 1, warning: 2 };
        return order[a.severity] - order[b.severity];
      });
    }

    /**
     * Generate improvement recommendations
     */
    generateRecommendations(categoryScores, fieldScores) {
      const recommendations = [];

      // Media recommendations
      if (categoryScores.media.percentage < 70) {
        if (fieldScores.images.rawScore < 80) {
          recommendations.push({
            priority: 'high',
            category: 'media',
            action: 'Ajouter plus d\'images',
            benefit: 'Améliore la conversion de +15-30%'
          });
        }
        if (fieldScores.videos.rawScore < 60) {
          recommendations.push({
            priority: 'medium',
            category: 'media',
            action: 'Ajouter une vidéo produit',
            benefit: 'Augmente le temps sur page'
          });
        }
      }

      // Content recommendations
      if (categoryScores.content.percentage < 70) {
        if (fieldScores.description.rawScore < 60) {
          recommendations.push({
            priority: 'high',
            category: 'content',
            action: 'Enrichir la description',
            benefit: 'Améliore le SEO et les ventes'
          });
        }
      }

      // Variant recommendations
      if (categoryScores.variants.percentage < 60) {
        recommendations.push({
          priority: 'medium',
          category: 'variants',
          action: 'Compléter les SKUs des variantes',
          benefit: 'Facilite la gestion des stocks'
        });
      }

      return recommendations;
    }

    /**
     * Generate human-readable summary
     */
    generateSummary(score, issueCount) {
      if (score >= 85) {
        return `✅ Excellent - Produit prêt pour l'import avec toutes les données`;
      }
      if (score >= 70) {
        return `🟢 Bon - Import recommandé${issueCount > 0 ? `, ${issueCount} point(s) à améliorer` : ''}`;
      }
      if (score >= 55) {
        return `🟡 Correct - Import possible mais ${issueCount} amélioration(s) recommandée(s)`;
      }
      if (score >= 40) {
        return `🟠 Incomplet - Import risqué, données importantes manquantes`;
      }
      return `🔴 Insuffisant - Import bloqué, données critiques manquantes`;
    }

    /**
     * Quick check - returns simple pass/fail
     */
    quickCheck(productData) {
      const report = this.calculate(productData, productData.platform || 'generic');
      return {
        canImport: report.canImport,
        score: report.score,
        qualityLevel: report.qualityLevel,
        criticalIssues: report.issues.filter(i => i.severity === 'critical')
      };
    }

    /**
     * Compare two products
     */
    compare(product1, product2) {
      const score1 = this.calculate(product1, product1.platform);
      const score2 = this.calculate(product2, product2.platform);
      
      return {
        product1: { score: score1.score, level: score1.qualityLevel },
        product2: { score: score2.score, level: score2.qualityLevel },
        difference: score1.score - score2.score,
        winner: score1.score >= score2.score ? 1 : 2
      };
    }
  }

  // Singleton instance
  const qualityScorer = new QualityScorer();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiQualityScorer = qualityScorer;
    window.QualityScorer = QualityScorer;
  }

  console.log('[ShopOpti+] QualityScorer v5.7.0 loaded');

})();
