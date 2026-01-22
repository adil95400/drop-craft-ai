/**
 * Shopopti+ - AI Price Optimizer v4.3.0
 * Intelligent pricing suggestions based on market analysis
 * Professional feature surpassing AutoDS pricing tools
 */

(function() {
  'use strict';

  if (window.__shopoptiPriceOptimizerLoaded) return;
  window.__shopoptiPriceOptimizerLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    DEFAULT_MARKUP: {
      low: 2.0,      // 100% markup
      medium: 2.5,   // 150% markup
      high: 3.0,     // 200% markup
      premium: 4.0   // 300% markup
    },
    PSYCHOLOGICAL_ENDINGS: ['.99', '.97', '.95', '.00'],
    CURRENCY_SYMBOLS: {
      EUR: '€',
      USD: '$',
      GBP: '£',
      CAD: 'C$',
      AUD: 'A$'
    }
  };

  class ShopoptiPriceOptimizer {
    constructor() {
      this.currentProduct = null;
      this.priceAnalysis = null;
      this.settings = {
        currency: 'EUR',
        strategy: 'balanced',
        includeShipping: true,
        psychologicalPricing: true,
        roundUp: true
      };
      this.init();
    }

    async init() {
      await this.loadSettings();
      console.log('💰 Shopopti+ Price Optimizer v4.3 initialized');
    }

    async loadSettings() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['dc_price_settings'], (result) => {
            if (result.dc_price_settings) {
              this.settings = { ...this.settings, ...result.dc_price_settings };
            }
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    async saveSettings(newSettings) {
      this.settings = { ...this.settings, ...newSettings };
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.set({ dc_price_settings: this.settings }, resolve);
        } else {
          resolve();
        }
      });
    }

    /**
     * Analyze and optimize product pricing
     */
    async optimizePrice(product) {
      this.currentProduct = product;

      try {
        // Try API analysis first
        const apiResult = await this.callPricingApi(product);
        if (apiResult) {
          this.priceAnalysis = apiResult;
          return apiResult;
        }
      } catch (error) {
        console.warn('API pricing failed, using local:', error);
      }

      // Fallback to local analysis
      return this.performLocalPricing(product);
    }

    async callPricingApi(product) {
      const token = await this.getToken();
      if (!token) return null;

      try {
        const response = await fetch(`${CONFIG.API_URL}/ai-price-optimizer`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify({
            product,
            settings: this.settings
          })
        });

        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Pricing API error:', error);
      }
      return null;
    }

    async getToken() {
      return new Promise(resolve => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], (result) => {
            resolve(result.extensionToken);
          });
        } else {
          resolve(null);
        }
      });
    }

    /**
     * Perform local pricing analysis
     */
    performLocalPricing(product) {
      const costPrice = this.extractNumericPrice(product.price || product.cost_price);
      const shippingCost = this.settings.includeShipping 
        ? this.extractNumericPrice(product.shipping_cost || 0) 
        : 0;
      
      const totalCost = costPrice + shippingCost;

      if (totalCost <= 0) {
        return {
          success: false,
          error: 'Prix de revient non disponible'
        };
      }

      // Analyze product category for pricing strategy
      const categoryAnalysis = this.analyzeCategory(product);
      
      // Calculate pricing tiers
      const tiers = this.calculatePricingTiers(totalCost, categoryAnalysis);

      // Apply psychological pricing if enabled
      if (this.settings.psychologicalPricing) {
        Object.keys(tiers).forEach(tier => {
          tiers[tier].price = this.applyPsychologicalPricing(tiers[tier].price);
        });
      }

      // Calculate margins
      Object.keys(tiers).forEach(tier => {
        const sellingPrice = tiers[tier].price;
        tiers[tier].profit = sellingPrice - totalCost;
        tiers[tier].marginPercent = ((sellingPrice - totalCost) / sellingPrice * 100).toFixed(1);
        tiers[tier].markup = ((sellingPrice - totalCost) / totalCost * 100).toFixed(0);
      });

      // Generate recommendations
      const recommendations = this.generatePricingRecommendations(tiers, product, categoryAnalysis);

      // Calculate break-even
      const breakEven = this.calculateBreakEven(totalCost);

      const result = {
        success: true,
        costBreakdown: {
          productCost: costPrice,
          shippingCost: shippingCost,
          totalCost: totalCost,
          currency: this.settings.currency
        },
        tiers,
        recommendedTier: this.selectRecommendedTier(tiers, categoryAnalysis),
        breakEven,
        categoryAnalysis,
        recommendations,
        competitorPrices: this.estimateCompetitorPrices(totalCost, categoryAnalysis),
        timestamp: new Date().toISOString()
      };

      this.priceAnalysis = result;
      return result;
    }

    /**
     * Analyze product category for pricing strategy
     */
    analyzeCategory(product) {
      const title = (product.title || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      const text = `${title} ${category}`;

      // Luxury/Premium indicators
      const luxuryIndicators = ['luxury', 'premium', 'designer', 'exclusive', 'limited', 'gold', 'silver', 'diamond'];
      const isLuxury = luxuryIndicators.some(i => text.includes(i));

      // Budget/Value indicators
      const budgetIndicators = ['budget', 'cheap', 'value', 'basic', 'simple', 'mini'];
      const isBudget = budgetIndicators.some(i => text.includes(i));

      // Tech/Electronics
      const techIndicators = ['phone', 'tablet', 'laptop', 'computer', 'electronic', 'smart', 'wireless', 'bluetooth'];
      const isTech = techIndicators.some(i => text.includes(i));

      // Fashion
      const fashionIndicators = ['dress', 'shirt', 'pants', 'shoes', 'bag', 'accessory', 'jewelry', 'watch'];
      const isFashion = fashionIndicators.some(i => text.includes(i));

      // Home & Garden
      const homeIndicators = ['home', 'kitchen', 'garden', 'furniture', 'decor', 'storage', 'organization'];
      const isHome = homeIndicators.some(i => text.includes(i));

      // Determine suggested markup multiplier
      let suggestedMultiplier = CONFIG.DEFAULT_MARKUP.medium;
      let priceStrategy = 'balanced';

      if (isLuxury) {
        suggestedMultiplier = CONFIG.DEFAULT_MARKUP.premium;
        priceStrategy = 'premium';
      } else if (isBudget) {
        suggestedMultiplier = CONFIG.DEFAULT_MARKUP.low;
        priceStrategy = 'volume';
      } else if (isTech) {
        suggestedMultiplier = CONFIG.DEFAULT_MARKUP.medium;
        priceStrategy = 'competitive';
      } else if (isFashion) {
        suggestedMultiplier = CONFIG.DEFAULT_MARKUP.high;
        priceStrategy = 'value-based';
      } else if (isHome) {
        suggestedMultiplier = CONFIG.DEFAULT_MARKUP.medium;
        priceStrategy = 'balanced';
      }

      return {
        isLuxury,
        isBudget,
        isTech,
        isFashion,
        isHome,
        suggestedMultiplier,
        priceStrategy,
        categoryType: isLuxury ? 'luxury' : isBudget ? 'budget' : isTech ? 'tech' : isFashion ? 'fashion' : isHome ? 'home' : 'general'
      };
    }

    /**
     * Calculate pricing tiers
     */
    calculatePricingTiers(totalCost, categoryAnalysis) {
      const baseMultiplier = categoryAnalysis.suggestedMultiplier;

      return {
        aggressive: {
          name: 'Agressif',
          description: 'Prix bas pour volume élevé',
          price: this.roundPrice(totalCost * (baseMultiplier - 0.5)),
          icon: '🔥',
          color: '#ef4444'
        },
        balanced: {
          name: 'Équilibré',
          description: 'Meilleur rapport marge/volume',
          price: this.roundPrice(totalCost * baseMultiplier),
          icon: '⚖️',
          color: '#3b82f6',
          recommended: true
        },
        premium: {
          name: 'Premium',
          description: 'Marge élevée, positionnement haut de gamme',
          price: this.roundPrice(totalCost * (baseMultiplier + 0.7)),
          icon: '💎',
          color: '#8b5cf6'
        },
        luxury: {
          name: 'Luxe',
          description: 'Positionnement exclusif',
          price: this.roundPrice(totalCost * (baseMultiplier + 1.5)),
          icon: '👑',
          color: '#f59e0b'
        }
      };
    }

    /**
     * Apply psychological pricing
     */
    applyPsychologicalPricing(price) {
      const wholePart = Math.floor(price);
      const preferredEndings = ['.99', '.97', '.95'];
      
      // For prices under 10, use .99
      if (price < 10) {
        return wholePart + 0.99;
      }
      
      // For prices under 100, consider .97 or .99
      if (price < 100) {
        return wholePart + 0.97;
      }
      
      // For higher prices, round to nearest 5 or 10 and subtract 0.01
      const roundedTo5 = Math.round(price / 5) * 5;
      return roundedTo5 - 0.01;
    }

    /**
     * Round price according to settings
     */
    roundPrice(price) {
      if (this.settings.roundUp) {
        return Math.ceil(price * 100) / 100;
      }
      return Math.round(price * 100) / 100;
    }

    /**
     * Select recommended pricing tier
     */
    selectRecommendedTier(tiers, categoryAnalysis) {
      switch (categoryAnalysis.priceStrategy) {
        case 'premium':
          return 'premium';
        case 'volume':
          return 'aggressive';
        case 'value-based':
          return 'balanced';
        case 'competitive':
          return 'aggressive';
        default:
          return 'balanced';
      }
    }

    /**
     * Calculate break-even analysis
     */
    calculateBreakEven(totalCost) {
      // Assume 20% of revenue goes to ads/marketing
      const adSpendPercent = 0.20;
      // Assume 3% transaction fees
      const transactionFeePercent = 0.03;
      
      const effectiveCost = totalCost / (1 - adSpendPercent - transactionFeePercent);

      return {
        minPrice: this.roundPrice(effectiveCost),
        withAds: this.roundPrice(totalCost * 1.3),
        withFees: this.roundPrice(totalCost * 1.05),
        assumptions: {
          adSpendPercent: adSpendPercent * 100,
          transactionFeePercent: transactionFeePercent * 100
        }
      };
    }

    /**
     * Estimate competitor prices
     */
    estimateCompetitorPrices(totalCost, categoryAnalysis) {
      const basePrice = totalCost * categoryAnalysis.suggestedMultiplier;
      
      return {
        low: this.roundPrice(basePrice * 0.8),
        average: this.roundPrice(basePrice),
        high: this.roundPrice(basePrice * 1.3),
        note: 'Estimation basée sur les moyennes du marché'
      };
    }

    /**
     * Generate pricing recommendations
     */
    generatePricingRecommendations(tiers, product, categoryAnalysis) {
      const recommendations = [];

      // Strategy-based recommendations
      switch (categoryAnalysis.priceStrategy) {
        case 'premium':
          recommendations.push({
            type: 'strategy',
            priority: 'high',
            text: 'Positionnement premium détecté. Investissez dans des photos professionnelles et une description haut de gamme.',
            icon: '💎'
          });
          break;
        case 'volume':
          recommendations.push({
            type: 'strategy',
            priority: 'high',
            text: 'Stratégie volume recommandée. Optimisez les coûts d\'ads et proposez des bundles.',
            icon: '📦'
          });
          break;
        case 'competitive':
          recommendations.push({
            type: 'strategy',
            priority: 'high',
            text: 'Marché concurrentiel. Différenciez par le service (livraison rapide, garantie étendue).',
            icon: '🎯'
          });
          break;
      }

      // Margin recommendations
      if (tiers.balanced.marginPercent < 40) {
        recommendations.push({
          type: 'margin',
          priority: 'warning',
          text: `Marge de ${tiers.balanced.marginPercent}% - Envisagez de négocier avec le fournisseur ou d'augmenter le prix.`,
          icon: '⚠️'
        });
      }

      // A/B testing recommendation
      recommendations.push({
        type: 'testing',
        priority: 'medium',
        text: `Testez le prix ${tiers.balanced.price}€ vs ${tiers.premium.price}€ pour optimiser la conversion.`,
        icon: '🧪'
      });

      // Bundle recommendation
      if (categoryAnalysis.isHome || categoryAnalysis.isFashion) {
        recommendations.push({
          type: 'bundle',
          priority: 'medium',
          text: 'Créez un bundle avec des accessoires complémentaires pour augmenter le panier moyen.',
          icon: '🎁'
        });
      }

      // Shipping recommendation
      if (product.shipping_cost && this.extractNumericPrice(product.shipping_cost) > 0) {
        recommendations.push({
          type: 'shipping',
          priority: 'low',
          text: 'Intégrez les frais de port au prix pour proposer la "livraison gratuite" (meilleur taux de conversion).',
          icon: '🚚'
        });
      }

      return recommendations;
    }

    /**
     * Generate comparison prices for different platforms
     */
    generatePlatformPrices(basePrice) {
      const platformFactors = {
        shopify: 1.0,
        amazon: 1.15,      // Higher fees
        ebay: 1.10,        // Auction platform markup
        etsy: 1.12,        // Handmade/vintage markup
        walmart: 1.08,     // Competitive pricing
        facebook: 0.95     // Social commerce discount
      };

      const prices = {};
      Object.entries(platformFactors).forEach(([platform, factor]) => {
        const adjustedPrice = basePrice * factor;
        prices[platform] = {
          price: this.applyPsychologicalPricing(adjustedPrice),
          factor,
          reason: factor > 1 
            ? `+${Math.round((factor - 1) * 100)}% frais plateforme` 
            : factor < 1 
              ? `-${Math.round((1 - factor) * 100)}% réduction compétitive`
              : 'Prix standard'
        };
      });

      return prices;
    }

    /**
     * Format price with currency
     */
    formatPrice(price, currency = null) {
      const curr = currency || this.settings.currency;
      const symbol = CONFIG.CURRENCY_SYMBOLS[curr] || curr;
      
      // Euro convention: symbol after
      if (curr === 'EUR') {
        return `${price.toFixed(2)} ${symbol}`;
      }
      
      // Other currencies: symbol before
      return `${symbol}${price.toFixed(2)}`;
    }

    // Utility
    extractNumericPrice(price) {
      if (!price) return 0;
      const match = String(price).match(/[\d.,]+/);
      if (!match) return 0;
      return parseFloat(match[0].replace(',', '.')) || 0;
    }
  }

  // Export globally
  window.ShopoptiPriceOptimizer = ShopoptiPriceOptimizer;
  window.shopoptiPriceOptimizer = new ShopoptiPriceOptimizer();

  console.log('💰 Shopopti+ Price Optimizer loaded');
})();
