/**
 * ShopOpti+ Price Rules Engine v5.6.2
 * AutoDS-like pricing rules: markup, rounding, tax, min/max
 */

const ShopOptiPriceRules = {
  VERSION: '5.6.2',

  // Default rules
  defaultRules: {
    markupType: 'percentage', // 'percentage' | 'fixed'
    markupValue: 30,
    includeShipping: true,
    taxRate: 0, // VAT percentage
    roundingRule: 'none', // 'none' | '99' | '95' | '00' | 'up' | 'down'
    minPrice: 0,
    maxPrice: 0, // 0 = no max
    minProfit: 0,
    currency: 'EUR'
  },

  /**
   * Apply pricing rules to calculate final selling price
   */
  calculatePrice(costPrice, shippingCost = 0, rules = {}) {
    const r = { ...this.defaultRules, ...rules };
    
    // Base cost
    let baseCost = costPrice;
    if (r.includeShipping) {
      baseCost += shippingCost;
    }

    // Apply markup
    let sellingPrice;
    if (r.markupType === 'percentage') {
      sellingPrice = baseCost * (1 + r.markupValue / 100);
    } else {
      sellingPrice = baseCost + r.markupValue;
    }

    // Apply tax
    if (r.taxRate > 0) {
      sellingPrice *= (1 + r.taxRate / 100);
    }

    // Apply rounding
    sellingPrice = this.applyRounding(sellingPrice, r.roundingRule);

    // Apply min/max constraints
    if (r.minPrice > 0 && sellingPrice < r.minPrice) {
      sellingPrice = r.minPrice;
    }
    if (r.maxPrice > 0 && sellingPrice > r.maxPrice) {
      sellingPrice = r.maxPrice;
    }

    // Ensure minimum profit
    if (r.minProfit > 0) {
      const profit = sellingPrice - baseCost;
      if (profit < r.minProfit) {
        sellingPrice = baseCost + r.minProfit;
        sellingPrice = this.applyRounding(sellingPrice, r.roundingRule);
      }
    }

    return {
      costPrice,
      shippingCost,
      baseCost,
      sellingPrice: Math.round(sellingPrice * 100) / 100,
      profit: Math.round((sellingPrice - baseCost) * 100) / 100,
      margin: baseCost > 0 ? Math.round(((sellingPrice - baseCost) / sellingPrice) * 100) : 0,
      markup: baseCost > 0 ? Math.round(((sellingPrice - baseCost) / baseCost) * 100) : 0
    };
  },

  /**
   * Apply rounding rules
   */
  applyRounding(price, rule) {
    switch (rule) {
      case '99':
        return Math.floor(price) + 0.99;
      case '95':
        return Math.floor(price) + 0.95;
      case '00':
        return Math.round(price);
      case 'up':
        return Math.ceil(price);
      case 'down':
        return Math.floor(price);
      default:
        return price;
    }
  },

  /**
   * Bulk apply rules to multiple products
   */
  applyToProducts(products, rules = {}) {
    return products.map(product => {
      const result = this.calculatePrice(
        product.costPrice || product.price || 0,
        product.shippingCost || 0,
        rules
      );
      return {
        ...product,
        costPrice: result.costPrice,
        sellingPrice: result.sellingPrice,
        profit: result.profit,
        margin: result.margin
      };
    });
  },

  /**
   * Save rules to storage
   */
  async saveRules(rules) {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ priceRules: rules });
    }
    return rules;
  },

  /**
   * Load rules from storage
   */
  async loadRules() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get(['priceRules']);
      return { ...this.defaultRules, ...result.priceRules };
    }
    return this.defaultRules;
  },

  /**
   * Create rules from template
   */
  getTemplate(templateName) {
    const templates = {
      'aggressive': {
        markupType: 'percentage',
        markupValue: 50,
        roundingRule: '99',
        minProfit: 5
      },
      'standard': {
        markupType: 'percentage',
        markupValue: 30,
        roundingRule: '99',
        minProfit: 3
      },
      'conservative': {
        markupType: 'percentage',
        markupValue: 20,
        roundingRule: '95',
        minProfit: 2
      },
      'premium': {
        markupType: 'percentage',
        markupValue: 100,
        roundingRule: '00',
        minProfit: 10
      }
    };
    return templates[templateName] || templates['standard'];
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiPriceRules = ShopOptiPriceRules;
}
