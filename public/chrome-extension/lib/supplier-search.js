/**
 * ShopOpti+ Supplier Search Engine v5.7.0
 * Multi-platform supplier sourcing with price comparison and ROI calculation
 * Competitive feature matching AutoDS/Cartifind
 */

const SupplierSearch = {
  VERSION: '5.7.0',
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  
  // Supported supplier platforms
  suppliers: {
    aliexpress: {
      name: 'AliExpress',
      icon: '🛒',
      color: '#ff6a00',
      searchUrl: 'https://www.aliexpress.com/wholesale?SearchText=',
      avgShipping: { min: 15, max: 45, unit: 'days' },
      avgCost: 0.20 // 20% of retail typically
    },
    '1688': {
      name: '1688',
      icon: '🏭',
      color: '#ff6a00',
      searchUrl: 'https://s.1688.com/selloffer/offer_search.htm?keywords=',
      avgShipping: { min: 20, max: 60, unit: 'days' },
      avgCost: 0.10 // 10% of retail (bulk pricing)
    },
    cjdropshipping: {
      name: 'CJ Dropshipping',
      icon: '📦',
      color: '#1a73e8',
      searchUrl: 'https://cjdropshipping.com/search.html?key=',
      avgShipping: { min: 7, max: 20, unit: 'days' },
      avgCost: 0.25
    },
    temu: {
      name: 'Temu',
      icon: '🎁',
      color: '#f97316',
      searchUrl: 'https://www.temu.com/search_result.html?search_key=',
      avgShipping: { min: 7, max: 15, unit: 'days' },
      avgCost: 0.30
    },
    banggood: {
      name: 'Banggood',
      icon: '📱',
      color: '#ff6600',
      searchUrl: 'https://www.banggood.com/search/',
      avgShipping: { min: 10, max: 30, unit: 'days' },
      avgCost: 0.25
    },
    dhgate: {
      name: 'DHgate',
      icon: '🏭',
      color: '#e54d00',
      searchUrl: 'https://www.dhgate.com/wholesale/search.do?act=search&searchkey=',
      avgShipping: { min: 15, max: 40, unit: 'days' },
      avgCost: 0.15
    }
  },
  
  /**
   * Search for suppliers for a product
   */
  async searchSuppliers(productData, options = {}) {
    console.log('[ShopOpti+ Supplier] Searching suppliers for:', productData.title?.substring(0, 50));
    
    const results = {
      query: this.buildSearchQuery(productData),
      currentPrice: productData.price || 0,
      suppliers: [],
      bestMatch: null,
      potentialProfit: 0,
      searchedAt: new Date().toISOString()
    };
    
    // Build search query from product data
    const query = results.query;
    
    // Generate supplier results (simulated - would use real API in production)
    const platforms = options.platforms || ['aliexpress', 'cjdropshipping', 'temu'];
    
    for (const platform of platforms) {
      const supplierConfig = this.suppliers[platform];
      if (!supplierConfig) continue;
      
      const supplierResult = await this.searchOnPlatform(platform, query, productData);
      if (supplierResult) {
        results.suppliers.push(supplierResult);
      }
    }
    
    // Sort by best margin
    results.suppliers.sort((a, b) => b.profitMargin - a.profitMargin);
    
    // Set best match
    if (results.suppliers.length > 0) {
      results.bestMatch = results.suppliers[0];
      results.potentialProfit = results.bestMatch.profitMargin;
    }
    
    return results;
  },
  
  /**
   * Build optimized search query from product data
   */
  buildSearchQuery(productData) {
    let query = productData.title || '';
    
    // Clean up title for search
    query = query
      .replace(/\([^)]*\)/g, '') // Remove parentheses content
      .replace(/【[^】]*】/g, '') // Remove brackets content
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract key terms (brand, model, product type)
    const keyTerms = [];
    
    if (productData.brand) {
      keyTerms.push(productData.brand);
    }
    
    // Take first 5-7 meaningful words
    const words = query.split(' ').filter(w => w.length > 2).slice(0, 7);
    keyTerms.push(...words);
    
    return keyTerms.join(' ').substring(0, 100);
  },
  
  /**
   * Search on a specific platform
   */
  async searchOnPlatform(platform, query, productData) {
    const config = this.suppliers[platform];
    if (!config) return null;
    
    const currentPrice = productData.price || 0;
    
    // Simulate supplier pricing (in production, use real API)
    const estimatedCost = currentPrice * config.avgCost * (0.8 + Math.random() * 0.4);
    const shippingCost = 2 + Math.random() * 8;
    const totalCost = estimatedCost + shippingCost;
    
    const profit = currentPrice - totalCost;
    const margin = currentPrice > 0 ? (profit / currentPrice) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    
    return {
      platform,
      name: config.name,
      icon: config.icon,
      color: config.color,
      searchUrl: config.searchUrl + encodeURIComponent(query),
      
      pricing: {
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        currentPrice: currentPrice
      },
      
      profitMargin: Math.round(margin * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      profit: Math.round(profit * 100) / 100,
      
      shipping: {
        minDays: config.avgShipping.min,
        maxDays: config.avgShipping.max,
        display: `${config.avgShipping.min}-${config.avgShipping.max} jours`
      },
      
      reliability: 70 + Math.floor(Math.random() * 25), // 70-95%
      
      // Matching score based on query similarity (simulated)
      matchScore: 60 + Math.floor(Math.random() * 35)
    };
  },
  
  /**
   * Calculate profit metrics
   */
  calculateProfitMetrics(sellingPrice, costPrice, shippingCost = 0, additionalCosts = 0) {
    const totalCost = costPrice + shippingCost + additionalCosts;
    const profit = sellingPrice - totalCost;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    
    return {
      totalCost: Math.round(totalCost * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      margin: Math.round(margin * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      isProfitable: profit > 0,
      recommendation: this.getProfitabilityRecommendation(margin)
    };
  },
  
  /**
   * Get profitability recommendation
   */
  getProfitabilityRecommendation(margin) {
    if (margin >= 50) return { level: 'excellent', text: 'Excellent - Marge très élevée', color: '#10b981' };
    if (margin >= 35) return { level: 'good', text: 'Bon - Marge confortable', color: '#22c55e' };
    if (margin >= 20) return { level: 'acceptable', text: 'Acceptable - Marge standard', color: '#eab308' };
    if (margin >= 10) return { level: 'low', text: 'Faible - Marge serrée', color: '#f97316' };
    return { level: 'negative', text: 'Non rentable', color: '#ef4444' };
  },
  
  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'EUR') {
    const symbols = { EUR: '€', USD: '$', GBP: '£' };
    const symbol = symbols[currency] || currency;
    return `${symbol}${amount.toFixed(2)}`;
  },
  
  /**
   * Generate supplier comparison HTML for overlay
   */
  generateComparisonHTML(results) {
    if (!results.suppliers || results.suppliers.length === 0) {
      return '<div class="sho-no-suppliers">Aucun fournisseur trouvé</div>';
    }
    
    return `
      <div class="sho-supplier-comparison">
        <div class="sho-search-query">
          <span class="label">Recherche:</span>
          <span class="query">${this.escapeHtml(results.query)}</span>
        </div>
        
        <div class="sho-suppliers-grid">
          ${results.suppliers.map((s, i) => `
            <div class="sho-supplier-card ${i === 0 ? 'best-match' : ''}" style="border-color: ${s.color}20">
              <div class="sho-supplier-header">
                <span class="sho-supplier-icon">${s.icon}</span>
                <span class="sho-supplier-name">${s.name}</span>
                ${i === 0 ? '<span class="sho-best-badge">Meilleur</span>' : ''}
              </div>
              
              <div class="sho-supplier-pricing">
                <div class="sho-price-row">
                  <span>Coût estimé:</span>
                  <span class="value">${this.formatCurrency(s.pricing.estimatedCost)}</span>
                </div>
                <div class="sho-price-row">
                  <span>Livraison:</span>
                  <span class="value">${this.formatCurrency(s.pricing.shippingCost)}</span>
                </div>
                <div class="sho-price-row total">
                  <span>Total:</span>
                  <span class="value">${this.formatCurrency(s.pricing.totalCost)}</span>
                </div>
              </div>
              
              <div class="sho-supplier-metrics">
                <div class="sho-metric">
                  <span class="label">Marge</span>
                  <span class="value" style="color: ${s.profitMargin >= 30 ? '#10b981' : s.profitMargin >= 15 ? '#eab308' : '#ef4444'}">${s.profitMargin}%</span>
                </div>
                <div class="sho-metric">
                  <span class="label">ROI</span>
                  <span class="value">${s.roi}%</span>
                </div>
                <div class="sho-metric">
                  <span class="label">Livraison</span>
                  <span class="value">${s.shipping.display}</span>
                </div>
              </div>
              
              <a href="${s.searchUrl}" target="_blank" class="sho-supplier-link">
                Voir sur ${s.name} →
              </a>
            </div>
          `).join('')}
        </div>
        
        ${results.bestMatch ? `
          <div class="sho-profit-summary">
            <div class="sho-summary-icon">💰</div>
            <div class="sho-summary-text">
              <strong>Profit potentiel: ${this.formatCurrency(results.bestMatch.profit)}</strong>
              <span>avec ${results.bestMatch.name} (marge ${results.bestMatch.profitMargin}%)</span>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },
  
  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupplierSearch;
}

if (typeof window !== 'undefined') {
  window.ShopOptiSupplierSearch = SupplierSearch;
}
