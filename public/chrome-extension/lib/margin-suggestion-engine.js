/**
 * ShopOpti+ AI Margin Suggestion Engine v5.7.0
 * Provides intelligent pricing recommendations based on market data,
 * competition analysis, and profit optimization strategies
 */

(function() {
  'use strict';

  if (window.__shopoptiMarginEngineLoaded) return;
  window.__shopoptiMarginEngineLoaded = true;

  /**
   * Pricing strategy presets
   */
  const PRICING_STRATEGIES = {
    aggressive: {
      name: 'Agressif',
      description: 'Marges élevées, moins de volume',
      targetMargin: { min: 45, max: 70 },
      priceMultiplier: { min: 2.5, max: 4.0 },
      icon: '🚀'
    },
    balanced: {
      name: 'Équilibré',
      description: 'Bon équilibre volume/marge',
      targetMargin: { min: 30, max: 50 },
      priceMultiplier: { min: 1.8, max: 2.5 },
      icon: '⚖️'
    },
    competitive: {
      name: 'Compétitif',
      description: 'Prix bas, plus de volume',
      targetMargin: { min: 20, max: 35 },
      priceMultiplier: { min: 1.4, max: 1.8 },
      icon: '🎯'
    },
    premium: {
      name: 'Premium',
      description: 'Marges maximales pour produits uniques',
      targetMargin: { min: 60, max: 85 },
      priceMultiplier: { min: 3.5, max: 6.0 },
      icon: '👑'
    },
    penetration: {
      name: 'Pénétration',
      description: 'Conquête de marché rapide',
      targetMargin: { min: 10, max: 25 },
      priceMultiplier: { min: 1.15, max: 1.4 },
      icon: '🌊'
    }
  };

  /**
   * Category-specific margin expectations
   */
  const CATEGORY_MARGINS = {
    electronics: { typical: 25, premium: 40, minViable: 15 },
    fashion: { typical: 50, premium: 70, minViable: 30 },
    home: { typical: 40, premium: 60, minViable: 25 },
    beauty: { typical: 55, premium: 75, minViable: 35 },
    toys: { typical: 45, premium: 65, minViable: 25 },
    sports: { typical: 35, premium: 55, minViable: 20 },
    pet: { typical: 50, premium: 70, minViable: 30 },
    automotive: { typical: 30, premium: 50, minViable: 18 },
    general: { typical: 40, premium: 60, minViable: 20 }
  };

  /**
   * Price psychology endings
   */
  const PRICE_ENDINGS = {
    charm: { ending: 0.99, description: 'Prix psychologique classique' },
    rounded: { ending: 0.00, description: 'Prix rond premium' },
    economy: { ending: 0.95, description: 'Perception économique' },
    mid: { ending: 0.50, description: 'Équilibré' }
  };

  class MarginSuggestionEngine {
    constructor() {
      this.competitorCache = new Map();
      this.historyCache = new Map();
    }

    /**
     * Get comprehensive margin suggestions for a product
     * @param {Object} product - Product data
     * @param {Object} options - Suggestion options
     * @returns {MarginSuggestion}
     */
    getSuggestions(product, options = {}) {
      console.log('[MarginEngine] Generating suggestions for:', product.name?.substring(0, 40));

      const costData = this.analyzeCosts(product);
      const marketData = this.analyzeMarket(product, options);
      const categoryData = this.analyzeCategory(product);

      // Generate suggestions for each strategy
      const strategies = Object.entries(PRICING_STRATEGIES).map(([key, strategy]) => {
        return this.calculateStrategyPrice(key, strategy, costData, marketData, categoryData);
      });

      // Determine best recommendation
      const recommendation = this.determineBestStrategy(strategies, product, options);

      // Generate pricing tiers
      const pricingTiers = this.generatePricingTiers(costData, marketData);

      // Calculate break-even and profitability metrics
      const profitability = this.calculateProfitability(costData, recommendation.suggestedPrice);

      return {
        product: {
          id: product.id,
          name: product.name,
          costPrice: costData.totalCost
        },
        costs: costData,
        market: marketData,
        category: categoryData,
        strategies,
        recommendation,
        pricingTiers,
        profitability,
        priceEndingOptions: this.suggestPriceEndings(recommendation.suggestedPrice),
        warnings: this.generateWarnings(costData, marketData, recommendation),
        timestamp: new Date().toISOString()
      };
    }

    /**
     * Analyze all costs associated with the product
     */
    analyzeCosts(product) {
      const productCost = product.costPrice || product.supplierPrice || product.price || 0;
      const shippingCost = product.shippingCost || product.shipping || 0;
      
      // Estimate additional costs
      const processingFee = productCost * 0.03; // ~3% payment processing
      const platformFee = productCost * 0.05; // ~5% platform fees
      const marketingAllocation = productCost * 0.10; // ~10% marketing budget
      const returnAllowance = productCost * 0.05; // ~5% for returns/refunds

      const totalCost = productCost + shippingCost + processingFee + platformFee + marketingAllocation + returnAllowance;

      return {
        productCost: Math.round(productCost * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        processingFee: Math.round(processingFee * 100) / 100,
        platformFee: Math.round(platformFee * 100) / 100,
        marketingAllocation: Math.round(marketingAllocation * 100) / 100,
        returnAllowance: Math.round(returnAllowance * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        currency: product.currency || 'EUR'
      };
    }

    /**
     * Analyze market conditions
     */
    analyzeMarket(product, options) {
      // Simulate market analysis (in production, would fetch real competitor data)
      const basePrice = product.price || product.costPrice || 20;
      
      // Generate realistic competitor price range
      const competitorLow = basePrice * 0.85;
      const competitorHigh = basePrice * 1.35;
      const competitorAvg = (competitorLow + competitorHigh) / 2;

      // Determine market saturation level
      const category = this.detectCategory(product);
      const saturationLevels = {
        electronics: 'high',
        fashion: 'high',
        home: 'medium',
        beauty: 'high',
        toys: 'medium',
        sports: 'medium',
        pet: 'low',
        automotive: 'medium',
        general: 'medium'
      };

      const saturation = saturationLevels[category] || 'medium';

      // Demand estimation based on category and price point
      const demandScores = {
        low: 0.8,
        medium: 0.6,
        high: 0.4
      };

      return {
        competitorPrices: {
          low: Math.round(competitorLow * 100) / 100,
          high: Math.round(competitorHigh * 100) / 100,
          average: Math.round(competitorAvg * 100) / 100,
          sampleSize: Math.floor(Math.random() * 20) + 5
        },
        saturation,
        demandScore: demandScores[saturation],
        seasonality: this.detectSeasonality(),
        priceElasticity: this.estimatePriceElasticity(category, basePrice),
        recommendedPosition: this.determineMarketPosition(saturation, category)
      };
    }

    /**
     * Analyze category-specific factors
     */
    analyzeCategory(product) {
      const category = this.detectCategory(product);
      const margins = CATEGORY_MARGINS[category] || CATEGORY_MARGINS.general;

      return {
        category,
        typicalMargin: margins.typical,
        premiumMargin: margins.premium,
        minViableMargin: margins.minViable,
        industryBenchmark: margins.typical
      };
    }

    /**
     * Detect product category
     */
    detectCategory(product) {
      const text = ((product.name || '') + ' ' + (product.category || '') + ' ' + (product.description || '')).toLowerCase();
      
      const categoryKeywords = {
        electronics: ['phone', 'electronic', 'charger', 'cable', 'usb', 'bluetooth', 'speaker', 'headphone', 'watch', 'camera'],
        fashion: ['dress', 'shirt', 'pants', 'shoes', 'bag', 'fashion', 'clothing', 'wear', 'jacket', 'jewelry'],
        home: ['home', 'kitchen', 'bathroom', 'bedroom', 'decor', 'furniture', 'storage', 'organizer', 'pillow', 'curtain'],
        beauty: ['beauty', 'makeup', 'cosmetic', 'skincare', 'hair', 'cream', 'serum', 'perfume', 'brush'],
        toys: ['toy', 'game', 'puzzle', 'doll', 'kids', 'children', 'baby', 'plush', 'educational'],
        sports: ['sport', 'fitness', 'gym', 'yoga', 'outdoor', 'camping', 'hiking', 'running'],
        pet: ['pet', 'dog', 'cat', 'animal', 'collar', 'leash', 'bowl', 'cage'],
        automotive: ['car', 'auto', 'vehicle', 'motor', 'tire', 'accessory', 'gps']
      };

      for (const [category, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(kw => text.includes(kw))) {
          return category;
        }
      }

      return 'general';
    }

    /**
     * Calculate price for a specific strategy
     */
    calculateStrategyPrice(key, strategy, costData, marketData, categoryData) {
      const { totalCost } = costData;
      
      // Calculate base price from target margin
      const targetMargin = (strategy.targetMargin.min + strategy.targetMargin.max) / 2;
      const marginBasedPrice = totalCost / (1 - targetMargin / 100);

      // Calculate price from multiplier
      const avgMultiplier = (strategy.priceMultiplier.min + strategy.priceMultiplier.max) / 2;
      const multiplierBasedPrice = costData.productCost * avgMultiplier;

      // Blend the two approaches
      const suggestedPrice = (marginBasedPrice * 0.6 + multiplierBasedPrice * 0.4);

      // Adjust based on market position
      const marketAdjustment = this.calculateMarketAdjustment(suggestedPrice, marketData, key);
      const adjustedPrice = suggestedPrice * marketAdjustment;

      // Calculate resulting metrics
      const profit = adjustedPrice - totalCost;
      const margin = (profit / adjustedPrice) * 100;
      const roi = (profit / totalCost) * 100;

      return {
        strategyKey: key,
        strategy: strategy.name,
        description: strategy.description,
        icon: strategy.icon,
        suggestedPrice: Math.round(adjustedPrice * 100) / 100,
        priceRange: {
          min: Math.round(totalCost / (1 - strategy.targetMargin.max / 100) * 100) / 100,
          max: Math.round(totalCost / (1 - strategy.targetMargin.min / 100) * 100) / 100
        },
        profit: Math.round(profit * 100) / 100,
        margin: Math.round(margin * 10) / 10,
        roi: Math.round(roi),
        marketPosition: this.getMarketPosition(adjustedPrice, marketData),
        viability: this.assessViability(margin, categoryData)
      };
    }

    /**
     * Calculate market-based price adjustment
     */
    calculateMarketAdjustment(basePrice, marketData, strategy) {
      const competitorAvg = marketData.competitorPrices.average;
      
      if (!competitorAvg) return 1;

      const ratio = basePrice / competitorAvg;

      // Strategy-specific adjustments
      const adjustments = {
        aggressive: 1.0, // Ignore competitors
        balanced: ratio > 1.2 ? 0.95 : (ratio < 0.8 ? 1.05 : 1),
        competitive: ratio > 1.1 ? 0.9 : 1,
        premium: ratio < 1.2 ? 1.1 : 1,
        penetration: ratio > 1 ? 0.85 : 1
      };

      return adjustments[strategy] || 1;
    }

    /**
     * Determine best strategy recommendation
     */
    determineBestStrategy(strategies, product, options) {
      // Score each strategy
      const scored = strategies.map(s => ({
        ...s,
        overallScore: this.scoreStrategy(s, options)
      }));

      // Sort by score
      scored.sort((a, b) => b.overallScore - a.overallScore);

      const best = scored[0];

      return {
        ...best,
        alternatives: scored.slice(1, 3),
        reasoning: this.generateReasoning(best, options)
      };
    }

    /**
     * Score a strategy based on preferences
     */
    scoreStrategy(strategy, options) {
      let score = 0;

      // Viability score (40%)
      const viabilityScores = { excellent: 100, good: 75, acceptable: 50, risky: 25, not_viable: 0 };
      score += (viabilityScores[strategy.viability] || 50) * 0.4;

      // Margin health (30%)
      score += Math.min(strategy.margin, 50) * 0.6;

      // Market position (20%)
      const positionScores = { below: 40, match: 60, premium: 80 };
      score += (positionScores[strategy.marketPosition] || 60) * 0.2;

      // User preference adjustment (10%)
      if (options.preferHighMargin && strategy.margin > 40) {
        score += 10;
      }
      if (options.preferVolume && strategy.margin < 35) {
        score += 10;
      }

      return Math.round(score);
    }

    /**
     * Generate pricing tiers
     */
    generatePricingTiers(costData, marketData) {
      const basePrice = costData.productCost;
      
      return {
        minimum: {
          price: Math.round(costData.totalCost * 1.1 * 100) / 100,
          label: 'Prix minimum',
          description: 'Couvre les coûts + 10% marge',
          margin: 10
        },
        break_even: {
          price: costData.totalCost,
          label: 'Seuil rentabilité',
          description: 'Couvre exactement les coûts',
          margin: 0
        },
        comfortable: {
          price: Math.round(costData.totalCost * 1.5 * 100) / 100,
          label: 'Prix confortable',
          description: 'Marge saine de ~33%',
          margin: 33
        },
        optimal: {
          price: Math.round(costData.totalCost * 2 * 100) / 100,
          label: 'Prix optimal',
          description: 'Marge excellente de 50%',
          margin: 50
        },
        premium: {
          price: Math.round(costData.totalCost * 3 * 100) / 100,
          label: 'Prix premium',
          description: 'Positionnement haut de gamme',
          margin: 67
        }
      };
    }

    /**
     * Calculate profitability metrics
     */
    calculateProfitability(costData, sellingPrice) {
      const { totalCost } = costData;
      const profit = sellingPrice - totalCost;
      const margin = (profit / sellingPrice) * 100;

      // Calculate units needed for profit targets
      const monthlyProfitTargets = [500, 1000, 2000, 5000];
      const unitsForTarget = monthlyProfitTargets.map(target => ({
        target,
        unitsNeeded: Math.ceil(target / profit),
        dailySales: Math.ceil((target / profit) / 30)
      }));

      return {
        profitPerUnit: Math.round(profit * 100) / 100,
        marginPercent: Math.round(margin * 10) / 10,
        breakEvenPrice: totalCost,
        monthlyTargets: unitsForTarget,
        annualPotential: Math.round(profit * 365 * 3) // Assuming 3 sales/day
      };
    }

    /**
     * Suggest price endings
     */
    suggestPriceEndings(basePrice) {
      const wholePart = Math.floor(basePrice);
      
      return Object.entries(PRICE_ENDINGS).map(([key, config]) => ({
        key,
        price: wholePart + config.ending,
        description: config.description,
        formatted: `${wholePart}${config.ending === 0 ? '.00' : config.ending.toString().substring(1)}`
      }));
    }

    /**
     * Generate warnings
     */
    generateWarnings(costData, marketData, recommendation) {
      const warnings = [];

      // Low margin warning
      if (recommendation.margin < 20) {
        warnings.push({
          type: 'low_margin',
          severity: 'high',
          message: `Marge de ${recommendation.margin}% trop faible - Risque de perte sur retours/refunds`
        });
      }

      // Price too high warning
      if (recommendation.marketPosition === 'premium' && marketData.saturation === 'high') {
        warnings.push({
          type: 'high_price',
          severity: 'medium',
          message: 'Prix supérieur au marché dans une catégorie saturée'
        });
      }

      // High competition warning
      if (marketData.saturation === 'high') {
        warnings.push({
          type: 'competition',
          severity: 'low',
          message: 'Forte concurrence - Différenciation nécessaire'
        });
      }

      return warnings;
    }

    /**
     * Generate recommendation reasoning
     */
    generateReasoning(strategy, options) {
      const reasons = [];

      reasons.push(`Marge de ${strategy.margin}% alignée avec le marché`);
      
      if (strategy.viability === 'excellent') {
        reasons.push('Excellente viabilité à long terme');
      }

      if (strategy.marketPosition === 'match') {
        reasons.push('Prix compétitif par rapport aux concurrents');
      }

      return reasons;
    }

    /**
     * Helper methods
     */
    getMarketPosition(price, marketData) {
      const avg = marketData.competitorPrices.average;
      if (!avg) return 'unknown';
      
      if (price < avg * 0.9) return 'below';
      if (price > avg * 1.1) return 'premium';
      return 'match';
    }

    assessViability(margin, categoryData) {
      if (margin >= categoryData.premiumMargin) return 'excellent';
      if (margin >= categoryData.typicalMargin) return 'good';
      if (margin >= categoryData.minViableMargin) return 'acceptable';
      if (margin >= 10) return 'risky';
      return 'not_viable';
    }

    detectSeasonality() {
      const month = new Date().getMonth();
      // Holiday season boost
      if (month >= 10 || month <= 1) return 'high';
      // Summer slowdown
      if (month >= 6 && month <= 8) return 'low';
      return 'normal';
    }

    estimatePriceElasticity(category, price) {
      // Higher price = more elastic
      // Luxury items = less elastic
      const categoryElasticity = {
        fashion: 1.2,
        electronics: 1.5,
        beauty: 0.8,
        home: 1.1,
        general: 1.0
      };

      const baseElasticity = categoryElasticity[category] || 1.0;
      const priceAdjustment = price > 50 ? 1.2 : (price < 20 ? 0.8 : 1.0);

      return Math.round(baseElasticity * priceAdjustment * 10) / 10;
    }

    determineMarketPosition(saturation, category) {
      if (saturation === 'high') return 'competitive';
      if (saturation === 'low') return 'flexible';
      return 'balanced';
    }

    /**
     * Get available strategies
     */
    getStrategies() {
      return PRICING_STRATEGIES;
    }
  }

  // Export singleton
  window.ShopOptiMarginEngine = new MarginSuggestionEngine();

  console.log('[ShopOpti+] AI Margin Suggestion Engine v5.7.0 loaded');

})();
