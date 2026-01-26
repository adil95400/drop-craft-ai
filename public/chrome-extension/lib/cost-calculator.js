/**
 * ShopOpti+ Cost Calculator v5.7.0
 * Complete cost calculation with shipping, taxes, commissions and net margin
 * Professional profit analysis for dropshipping
 */

const CostCalculator = {
  VERSION: '5.7.0',
  
  // Default fee structures (user-configurable)
  defaultFees: {
    // Payment processor fees
    paypal: { percentage: 2.9, fixed: 0.30, currency: 'EUR' },
    stripe: { percentage: 2.9, fixed: 0.25, currency: 'EUR' },
    shopifyPayments: { percentage: 2.4, fixed: 0.25, currency: 'EUR' },
    
    // Platform fees
    shopify: { percentage: 0, fixed: 2.0, note: 'Basic plan monthly / transaction' },
    woocommerce: { percentage: 0, fixed: 0 },
    ebay: { percentage: 10, fixed: 0 },
    amazon: { percentage: 15, fixed: 0 },
    etsy: { percentage: 6.5, fixed: 0.20 },
    
    // VAT rates by country
    vat: {
      FR: 20, DE: 19, ES: 21, IT: 22, UK: 20, US: 0,
      CA: 13, AU: 10, BE: 21, NL: 21, PT: 23, PL: 23
    }
  },
  
  // Currency conversion rates (updated dynamically)
  exchangeRates: {
    EUR: 1,
    USD: 0.92,
    GBP: 1.17,
    CAD: 0.68,
    AUD: 0.60,
    CNY: 0.13,
    JPY: 0.0061
  },
  
  /**
   * Calculate complete costs and net margin
   */
  calculateComplete(params) {
    const {
      productCost = 0,
      shippingCost = 0,
      sellingPrice = 0,
      quantity = 1,
      vatRate = 20,
      paymentProcessor = 'stripe',
      platform = 'shopify',
      customFees = [],
      sourceCurrency = 'EUR',
      targetCurrency = 'EUR',
      includeVat = true
    } = params;
    
    // Convert to target currency if needed
    const convertedProductCost = this.convertCurrency(productCost, sourceCurrency, targetCurrency);
    const convertedShippingCost = this.convertCurrency(shippingCost, sourceCurrency, targetCurrency);
    
    // Base costs
    const baseCost = (convertedProductCost + convertedShippingCost) * quantity;
    
    // Payment processor fee
    const processorFee = this.calculateProcessorFee(sellingPrice * quantity, paymentProcessor);
    
    // Platform fee
    const platformFee = this.calculatePlatformFee(sellingPrice * quantity, platform);
    
    // VAT on margin (if applicable)
    const vatAmount = includeVat ? this.calculateVat(sellingPrice * quantity, vatRate) : 0;
    
    // Custom fees
    const customFeesTotal = customFees.reduce((sum, fee) => {
      if (fee.type === 'percentage') {
        return sum + (sellingPrice * quantity * fee.value / 100);
      }
      return sum + (fee.value * quantity);
    }, 0);
    
    // Total costs
    const totalCosts = baseCost + processorFee + platformFee + customFeesTotal;
    
    // Gross revenue (before VAT)
    const grossRevenue = sellingPrice * quantity;
    const netRevenue = includeVat ? grossRevenue - vatAmount : grossRevenue;
    
    // Net profit
    const netProfit = netRevenue - totalCosts;
    
    // Margins
    const grossMargin = grossRevenue > 0 ? ((grossRevenue - baseCost) / grossRevenue * 100) : 0;
    const netMargin = grossRevenue > 0 ? (netProfit / grossRevenue * 100) : 0;
    const roi = totalCosts > 0 ? (netProfit / totalCosts * 100) : 0;
    
    // Break-even analysis
    const breakEvenPrice = totalCosts / quantity;
    const minimumPrice = breakEvenPrice * 1.1; // 10% minimum margin
    
    return {
      // Input summary
      input: {
        productCost: this.round(convertedProductCost),
        shippingCost: this.round(convertedShippingCost),
        sellingPrice: this.round(sellingPrice),
        quantity
      },
      
      // Cost breakdown
      costs: {
        baseCost: this.round(baseCost),
        productTotal: this.round(convertedProductCost * quantity),
        shippingTotal: this.round(convertedShippingCost * quantity),
        processorFee: this.round(processorFee),
        platformFee: this.round(platformFee),
        customFees: this.round(customFeesTotal),
        vatAmount: this.round(vatAmount),
        totalCosts: this.round(totalCosts)
      },
      
      // Revenue
      revenue: {
        gross: this.round(grossRevenue),
        net: this.round(netRevenue)
      },
      
      // Profit analysis
      profit: {
        gross: this.round(grossRevenue - baseCost),
        net: this.round(netProfit),
        perUnit: this.round(netProfit / quantity)
      },
      
      // Margins
      margins: {
        gross: this.round(grossMargin),
        net: this.round(netMargin),
        roi: this.round(roi)
      },
      
      // Analysis
      analysis: {
        breakEvenPrice: this.round(breakEvenPrice),
        minimumPrice: this.round(minimumPrice),
        isProfitable: netProfit > 0,
        profitabilityLevel: this.getProfitabilityLevel(netMargin),
        recommendation: this.getRecommendation(netMargin, sellingPrice, minimumPrice)
      },
      
      // For display
      formatted: {
        netProfit: this.formatCurrency(netProfit, targetCurrency),
        netMargin: `${this.round(netMargin)}%`,
        roi: `${this.round(roi)}%`,
        totalCosts: this.formatCurrency(totalCosts, targetCurrency),
        breakEven: this.formatCurrency(breakEvenPrice, targetCurrency)
      }
    };
  },
  
  /**
   * Calculate payment processor fee
   */
  calculateProcessorFee(amount, processor) {
    const fee = this.defaultFees[processor] || this.defaultFees.stripe;
    return (amount * fee.percentage / 100) + fee.fixed;
  },
  
  /**
   * Calculate platform fee
   */
  calculatePlatformFee(amount, platform) {
    const fee = this.defaultFees[platform] || { percentage: 0, fixed: 0 };
    return (amount * fee.percentage / 100) + fee.fixed;
  },
  
  /**
   * Calculate VAT
   */
  calculateVat(amount, rate) {
    return amount * rate / (100 + rate); // VAT included in price
  },
  
  /**
   * Convert currency
   */
  convertCurrency(amount, from, to) {
    if (from === to) return amount;
    const fromRate = this.exchangeRates[from] || 1;
    const toRate = this.exchangeRates[to] || 1;
    return amount * fromRate / toRate;
  },
  
  /**
   * Get profitability level
   */
  getProfitabilityLevel(margin) {
    if (margin >= 50) return { level: 'excellent', label: 'Excellent', color: '#10b981', icon: '🚀' };
    if (margin >= 35) return { level: 'very_good', label: 'Très bon', color: '#22c55e', icon: '💰' };
    if (margin >= 25) return { level: 'good', label: 'Bon', color: '#84cc16', icon: '✅' };
    if (margin >= 15) return { level: 'acceptable', label: 'Acceptable', color: '#eab308', icon: '⚠️' };
    if (margin >= 5) return { level: 'low', label: 'Faible', color: '#f97316', icon: '📉' };
    if (margin >= 0) return { level: 'break_even', label: 'Seuil rentabilité', color: '#ef4444', icon: '⏸️' };
    return { level: 'negative', label: 'Non rentable', color: '#dc2626', icon: '❌' };
  },
  
  /**
   * Get recommendation based on margin
   */
  getRecommendation(margin, currentPrice, minimumPrice) {
    if (margin >= 35) {
      return {
        action: 'proceed',
        message: 'Marge excellente, produit rentable',
        suggestedPrice: null
      };
    }
    if (margin >= 20) {
      return {
        action: 'proceed',
        message: 'Marge correcte, viable pour le dropshipping',
        suggestedPrice: null
      };
    }
    if (margin >= 10) {
      return {
        action: 'consider',
        message: 'Marge serrée - envisagez d\'augmenter le prix',
        suggestedPrice: this.round(currentPrice * 1.15)
      };
    }
    if (margin > 0) {
      return {
        action: 'caution',
        message: 'Marge trop faible - augmentez le prix ou trouvez un fournisseur moins cher',
        suggestedPrice: this.round(minimumPrice * 1.25)
      };
    }
    return {
      action: 'avoid',
      message: 'Non rentable - trouvez un meilleur fournisseur ou augmentez significativement le prix',
      suggestedPrice: this.round(minimumPrice * 1.35)
    };
  },
  
  /**
   * Compare multiple supplier offers
   */
  compareSuppliers(suppliers, sellingPrice, options = {}) {
    const results = suppliers.map(supplier => {
      const calc = this.calculateComplete({
        productCost: supplier.price,
        shippingCost: supplier.shippingCost || 0,
        sellingPrice,
        vatRate: options.vatRate || 20,
        paymentProcessor: options.paymentProcessor || 'stripe',
        platform: options.platform || 'shopify',
        sourceCurrency: supplier.currency || 'EUR',
        targetCurrency: options.targetCurrency || 'EUR'
      });
      
      return {
        supplier: supplier.name,
        platform: supplier.platform,
        ...calc,
        shipping: {
          minDays: supplier.minDays || 7,
          maxDays: supplier.maxDays || 25,
          display: `${supplier.minDays || 7}-${supplier.maxDays || 25} jours`
        },
        reliability: supplier.reliability || 80,
        score: this.calculateSupplierScore(calc.margins.net, supplier.reliability || 80, supplier.maxDays || 25)
      };
    });
    
    // Sort by score (best first)
    results.sort((a, b) => b.score - a.score);
    
    return {
      suppliers: results,
      best: results[0] || null,
      recommendations: this.generateComparisonRecommendations(results)
    };
  },
  
  /**
   * Calculate supplier score (0-100)
   */
  calculateSupplierScore(margin, reliability, maxDeliveryDays) {
    // Weight factors
    const marginWeight = 0.5;
    const reliabilityWeight = 0.3;
    const speedWeight = 0.2;
    
    // Normalize margin (0-100, cap at 50% margin = 100 score)
    const marginScore = Math.min(margin * 2, 100);
    
    // Reliability is already 0-100
    const reliabilityScore = reliability;
    
    // Speed score (faster = better, 7 days = 100, 45 days = 0)
    const speedScore = Math.max(0, Math.min(100, (45 - maxDeliveryDays) / 38 * 100));
    
    return this.round(
      marginScore * marginWeight +
      reliabilityScore * reliabilityWeight +
      speedScore * speedWeight
    );
  },
  
  /**
   * Generate comparison recommendations
   */
  generateComparisonRecommendations(results) {
    if (results.length === 0) return [];
    
    const recommendations = [];
    const best = results[0];
    
    // Best overall
    recommendations.push({
      type: 'best_overall',
      supplier: best.supplier,
      reason: `Meilleur score global (${best.score}/100) avec ${best.margins.net}% de marge nette`
    });
    
    // Best margin
    const bestMargin = [...results].sort((a, b) => b.margins.net - a.margins.net)[0];
    if (bestMargin.supplier !== best.supplier) {
      recommendations.push({
        type: 'best_margin',
        supplier: bestMargin.supplier,
        reason: `Meilleure marge (${bestMargin.margins.net}%) mais score global inférieur`
      });
    }
    
    // Fastest shipping
    const fastest = [...results].sort((a, b) => a.shipping.maxDays - b.shipping.maxDays)[0];
    if (fastest.supplier !== best.supplier && fastest.shipping.maxDays < best.shipping.maxDays - 5) {
      recommendations.push({
        type: 'fastest',
        supplier: fastest.supplier,
        reason: `Livraison la plus rapide (${fastest.shipping.display})`
      });
    }
    
    return recommendations;
  },
  
  /**
   * Round to 2 decimal places
   */
  round(value) {
    return Math.round(value * 100) / 100;
  },
  
  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'EUR') {
    const symbols = { EUR: '€', USD: '$', GBP: '£', CAD: 'CA$', AUD: 'A$', CNY: '¥', JPY: '¥' };
    const symbol = symbols[currency] || currency;
    const formatted = Math.abs(amount).toFixed(2);
    return amount < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
  },
  
  /**
   * Generate HTML for cost breakdown display
   */
  generateBreakdownHTML(calculation, currency = 'EUR') {
    const { costs, profit, margins, analysis } = calculation;
    const level = analysis.profitabilityLevel;
    
    return `
      <div class="sho-cost-breakdown">
        <div class="sho-breakdown-header" style="border-left: 4px solid ${level.color}">
          <span class="sho-level-icon">${level.icon}</span>
          <span class="sho-level-label">${level.label}</span>
          <span class="sho-net-margin" style="color: ${level.color}">${margins.net}%</span>
        </div>
        
        <div class="sho-breakdown-costs">
          <div class="sho-cost-row">
            <span>Coût produit:</span>
            <span>${this.formatCurrency(costs.productTotal, currency)}</span>
          </div>
          <div class="sho-cost-row">
            <span>Livraison:</span>
            <span>${this.formatCurrency(costs.shippingTotal, currency)}</span>
          </div>
          <div class="sho-cost-row">
            <span>Frais paiement:</span>
            <span>${this.formatCurrency(costs.processorFee, currency)}</span>
          </div>
          <div class="sho-cost-row">
            <span>Frais plateforme:</span>
            <span>${this.formatCurrency(costs.platformFee, currency)}</span>
          </div>
          ${costs.vatAmount > 0 ? `
            <div class="sho-cost-row">
              <span>TVA:</span>
              <span>${this.formatCurrency(costs.vatAmount, currency)}</span>
            </div>
          ` : ''}
          <div class="sho-cost-row total">
            <span>Total coûts:</span>
            <span>${this.formatCurrency(costs.totalCosts, currency)}</span>
          </div>
        </div>
        
        <div class="sho-breakdown-profit">
          <div class="sho-profit-main" style="color: ${profit.net >= 0 ? level.color : '#ef4444'}">
            <span class="sho-profit-label">Profit Net:</span>
            <span class="sho-profit-value">${this.formatCurrency(profit.net, currency)}</span>
          </div>
          <div class="sho-profit-metrics">
            <div class="sho-metric">
              <span>Marge:</span>
              <span>${margins.net}%</span>
            </div>
            <div class="sho-metric">
              <span>ROI:</span>
              <span>${margins.roi}%</span>
            </div>
          </div>
        </div>
        
        ${analysis.recommendation.suggestedPrice ? `
          <div class="sho-breakdown-recommendation">
            <span class="sho-rec-icon">💡</span>
            <span class="sho-rec-text">${analysis.recommendation.message}</span>
            <span class="sho-rec-price">Prix suggéré: ${this.formatCurrency(analysis.recommendation.suggestedPrice, currency)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CostCalculator;
}

if (typeof window !== 'undefined') {
  window.ShopOptiCostCalculator = CostCalculator;
}
