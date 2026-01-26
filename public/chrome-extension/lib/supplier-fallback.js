/**
 * ShopOpti+ Local Supplier Fallback v5.7.0
 * Fallback scraping when backend API fails or quota exceeded
 * Provides basic supplier search without API dependency
 */

const SupplierFallback = {
  VERSION: '5.7.0',
  
  // Platform search configurations
  platforms: {
    aliexpress: {
      name: 'AliExpress',
      icon: '🛒',
      color: '#ff6a00',
      baseUrl: 'https://www.aliexpress.com/wholesale',
      searchParam: 'SearchText',
      avgShipping: { min: 15, max: 45 },
      avgPriceRatio: 0.20,
      reliability: 85
    },
    temu: {
      name: 'Temu',
      icon: '🎁',
      color: '#f97316',
      baseUrl: 'https://www.temu.com/search_result.html',
      searchParam: 'search_key',
      avgShipping: { min: 7, max: 15 },
      avgPriceRatio: 0.30,
      reliability: 80
    },
    '1688': {
      name: '1688',
      icon: '🏭',
      color: '#ff6a00',
      baseUrl: 'https://s.1688.com/selloffer/offer_search.htm',
      searchParam: 'keywords',
      avgShipping: { min: 20, max: 60 },
      avgPriceRatio: 0.10,
      reliability: 75
    },
    cjdropshipping: {
      name: 'CJ Dropshipping',
      icon: '📦',
      color: '#1a73e8',
      baseUrl: 'https://cjdropshipping.com/search.html',
      searchParam: 'key',
      avgShipping: { min: 7, max: 20 },
      avgPriceRatio: 0.25,
      reliability: 90
    },
    banggood: {
      name: 'Banggood',
      icon: '📱',
      color: '#ff6600',
      baseUrl: 'https://www.banggood.com/search',
      searchParam: 'q',
      avgShipping: { min: 10, max: 30 },
      avgPriceRatio: 0.25,
      reliability: 82
    },
    dhgate: {
      name: 'DHgate',
      icon: '🏭',
      color: '#e54d00',
      baseUrl: 'https://www.dhgate.com/wholesale/search.do',
      searchParam: 'searchkey',
      avgShipping: { min: 15, max: 40 },
      avgPriceRatio: 0.15,
      reliability: 78
    }
  },
  
  /**
   * Generate fallback supplier results when API fails
   */
  async generateFallbackResults(productData, options = {}) {
    console.log('[ShopOpti+ Fallback] Generating local supplier estimates...');
    
    const query = this.buildSearchQuery(productData);
    const currentPrice = productData.price || 0;
    const selectedPlatforms = options.platforms || ['aliexpress', 'temu', 'cjdropshipping'];
    
    const results = {
      query,
      currentPrice,
      suppliers: [],
      bestMatch: null,
      isFallback: true,
      fallbackReason: options.reason || 'API unavailable',
      searchedAt: new Date().toISOString()
    };
    
    // Generate estimated supplier data for each platform
    for (const platformKey of selectedPlatforms) {
      const platform = this.platforms[platformKey];
      if (!platform) continue;
      
      const supplierResult = this.estimateSupplierPricing(platformKey, platform, currentPrice, query);
      results.suppliers.push(supplierResult);
    }
    
    // Sort by estimated profit margin
    results.suppliers.sort((a, b) => b.profitMargin - a.profitMargin);
    
    // Set best match
    if (results.suppliers.length > 0) {
      results.bestMatch = results.suppliers[0];
    }
    
    return results;
  },
  
  /**
   * Build optimized search query
   */
  buildSearchQuery(productData) {
    let query = productData.title || '';
    
    // Clean title for search
    query = query
      .replace(/\([^)]*\)/g, '') // Remove parentheses
      .replace(/【[^】]*】/g, '') // Remove brackets
      .replace(/\[[^\]]*\]/g, '') // Remove square brackets
      .replace(/[^\w\s-]/g, ' ') // Remove special chars
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract key terms (first 6 meaningful words)
    const words = query.split(' ').filter(w => w.length > 2).slice(0, 6);
    
    // Add brand if available
    if (productData.brand && !words.includes(productData.brand)) {
      words.unshift(productData.brand);
    }
    
    return words.join(' ').substring(0, 80);
  },
  
  /**
   * Estimate supplier pricing based on market averages
   */
  estimateSupplierPricing(platformKey, platform, sellingPrice, query) {
    // Calculate estimated cost based on platform's average ratio
    const baseRatio = platform.avgPriceRatio;
    const variance = 0.8 + Math.random() * 0.4; // 80% to 120% of base
    const estimatedCost = sellingPrice * baseRatio * variance;
    
    // Estimate shipping based on platform
    const shippingVariance = 0.7 + Math.random() * 0.6; // 70% to 130%
    const avgShipping = (platform.avgShipping.min + platform.avgShipping.max) / 2;
    const shippingCost = 2 + (avgShipping / 10) * shippingVariance; // €2-€8 typically
    
    const totalCost = estimatedCost + shippingCost;
    const profit = sellingPrice - totalCost;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
    
    return {
      platform: platformKey,
      name: platform.name,
      icon: platform.icon,
      color: platform.color,
      searchUrl: this.buildSearchUrl(platformKey, query),
      
      pricing: {
        estimatedCost: Math.round(estimatedCost * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        currentPrice: sellingPrice,
        isEstimate: true
      },
      
      profitMargin: Math.round(margin * 10) / 10,
      roi: Math.round(roi * 10) / 10,
      profit: Math.round(profit * 100) / 100,
      
      shipping: {
        minDays: platform.avgShipping.min,
        maxDays: platform.avgShipping.max,
        display: `${platform.avgShipping.min}-${platform.avgShipping.max} jours`
      },
      
      reliability: platform.reliability,
      confidence: 60 + Math.floor(Math.random() * 25), // 60-85% confidence for estimates
      
      // Flag that this is an estimate
      isEstimate: true,
      disclaimer: 'Prix estimé - vérifiez sur la plateforme'
    };
  },
  
  /**
   * Build search URL for platform
   */
  buildSearchUrl(platformKey, query) {
    const platform = this.platforms[platformKey];
    if (!platform) return '';
    
    const encodedQuery = encodeURIComponent(query);
    return `${platform.baseUrl}?${platform.searchParam}=${encodedQuery}`;
  },
  
  /**
   * Get search links for all platforms (quick fallback)
   */
  getQuickSearchLinks(productTitle) {
    const query = this.buildSearchQuery({ title: productTitle });
    
    return Object.entries(this.platforms).map(([key, platform]) => ({
      platform: key,
      name: platform.name,
      icon: platform.icon,
      color: platform.color,
      url: this.buildSearchUrl(key, query)
    }));
  },
  
  /**
   * Generate fallback HTML for display
   */
  generateFallbackHTML(results, currency = 'EUR') {
    const formatCurrency = (amount) => {
      const symbols = { EUR: '€', USD: '$', GBP: '£' };
      return `${symbols[currency] || currency}${amount.toFixed(2)}`;
    };
    
    return `
      <div class="sho-fallback-results">
        <div class="sho-fallback-warning">
          <span class="sho-warning-icon">⚠️</span>
          <span class="sho-warning-text">
            Mode hors-ligne - Prix estimés basés sur les moyennes du marché
          </span>
        </div>
        
        <div class="sho-search-query">
          <span class="label">Recherche:</span>
          <span class="query">${this.escapeHtml(results.query)}</span>
        </div>
        
        <div class="sho-suppliers-grid">
          ${results.suppliers.map((s, i) => `
            <div class="sho-supplier-card ${i === 0 ? 'best-match' : ''}" style="border-color: ${s.color}40">
              <div class="sho-supplier-header">
                <span class="sho-supplier-icon">${s.icon}</span>
                <span class="sho-supplier-name">${s.name}</span>
                ${i === 0 ? '<span class="sho-best-badge">Meilleur estimé</span>' : ''}
                <span class="sho-estimate-badge">Estimé</span>
              </div>
              
              <div class="sho-supplier-pricing">
                <div class="sho-price-row">
                  <span>Coût estimé:</span>
                  <span class="value">${formatCurrency(s.pricing.estimatedCost)}</span>
                </div>
                <div class="sho-price-row">
                  <span>Livraison est.:</span>
                  <span class="value">~${formatCurrency(s.pricing.shippingCost)}</span>
                </div>
                <div class="sho-price-row total">
                  <span>Total:</span>
                  <span class="value">${formatCurrency(s.pricing.totalCost)}</span>
                </div>
              </div>
              
              <div class="sho-supplier-metrics">
                <div class="sho-metric">
                  <span class="label">Marge est.</span>
                  <span class="value" style="color: ${s.profitMargin >= 30 ? '#10b981' : s.profitMargin >= 15 ? '#eab308' : '#ef4444'}">${s.profitMargin}%</span>
                </div>
                <div class="sho-metric">
                  <span class="label">Livraison</span>
                  <span class="value">${s.shipping.display}</span>
                </div>
              </div>
              
              <a href="${s.searchUrl}" target="_blank" class="sho-supplier-link">
                Vérifier sur ${s.name} →
              </a>
            </div>
          `).join('')}
        </div>
        
        <div class="sho-fallback-note">
          <span class="sho-note-icon">💡</span>
          <span>Cliquez sur les liens pour vérifier les prix réels sur chaque plateforme</span>
        </div>
      </div>
    `;
  },
  
  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SupplierFallback;
}

if (typeof window !== 'undefined') {
  window.ShopOptiSupplierFallback = SupplierFallback;
}
