// ============================================
// ShopOpti+ AI Predictive Search v5.7.2
// Nexus AI-style winning product detection
// Trend analysis and market prediction
// ============================================

const ShopOptiPredictiveSearch = {
  VERSION: '5.7.2',
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
  
  // Cache for predictions
  cache: new Map(),
  cacheMaxAge: 30 * 60 * 1000, // 30 minutes
  
  // ============================================
  // TREND INDICATORS
  // ============================================
  trendIndicators: {
    // Sales velocity thresholds
    velocity: {
      hot: 1000,      // 1000+ sales/week
      rising: 200,    // 200+ sales/week
      stable: 50,     // 50+ sales/week
      cold: 0
    },
    
    // Rating quality thresholds
    rating: {
      excellent: 4.5,
      good: 4.0,
      acceptable: 3.5,
      poor: 0
    },
    
    // Competition score (lower is better)
    competition: {
      low: 10,        // < 10 similar products
      medium: 50,     // 10-50 similar products
      high: 200,      // 50-200 similar products
      saturated: 500  // 200+ similar products
    }
  },
  
  // ============================================
  // PREDICTIVE SCORING ALGORITHM
  // ============================================
  calculateWinnerScore(product) {
    let score = 0;
    const factors = {};
    
    // 1. Sales velocity (30%)
    const sales = product.sales || product.orders || 0;
    const salesScore = this.normalizeSales(sales);
    factors.salesVelocity = salesScore;
    score += salesScore * 0.30;
    
    // 2. Rating quality (20%)
    const rating = product.rating || 0;
    const ratingScore = (rating / 5) * 100;
    factors.ratingQuality = ratingScore;
    score += ratingScore * 0.20;
    
    // 3. Review count / Social proof (15%)
    const reviews = product.reviews || product.reviewCount || 0;
    const reviewScore = Math.min(reviews / 100, 1) * 100;
    factors.socialProof = reviewScore;
    score += reviewScore * 0.15;
    
    // 4. Price competitiveness (15%)
    const price = parseFloat(product.price) || 0;
    const avgMarketPrice = 30; // Placeholder - should come from market data
    const priceScore = price > 0 ? Math.max(0, 100 - Math.abs(price - avgMarketPrice) * 2) : 50;
    factors.priceCompetitiveness = priceScore;
    score += priceScore * 0.15;
    
    // 5. Trend momentum (10%)
    const momentumScore = this.calculateMomentum(product);
    factors.trendMomentum = momentumScore;
    score += momentumScore * 0.10;
    
    // 6. Visual appeal potential (10%)
    const visualScore = this.assessVisualPotential(product);
    factors.visualAppeal = visualScore;
    score += visualScore * 0.10;
    
    return {
      totalScore: Math.round(score),
      factors,
      tier: this.getTier(score),
      confidence: this.calculateConfidence(factors)
    };
  },
  
  normalizeSales(sales) {
    if (sales >= 1000) return 100;
    if (sales >= 500) return 85;
    if (sales >= 200) return 70;
    if (sales >= 100) return 55;
    if (sales >= 50) return 40;
    if (sales >= 20) return 25;
    return Math.min(sales, 20);
  },
  
  calculateMomentum(product) {
    // Estimate momentum based on available signals
    let momentum = 50; // Neutral baseline
    
    // Recent sales boost
    if (product.recentSales || product.trending) {
      momentum += 20;
    }
    
    // New product bonus (less competition)
    if (product.isNew) {
      momentum += 15;
    }
    
    // Seasonal relevance
    const seasonalBoost = this.getSeasonalRelevance(product);
    momentum += seasonalBoost;
    
    return Math.min(momentum, 100);
  },
  
  getSeasonalRelevance(product) {
    const title = (product.title || '').toLowerCase();
    const month = new Date().getMonth();
    
    const seasonalKeywords = {
      winter: ['christmas', 'noël', 'winter', 'hiver', 'snow', 'neige', 'warm', 'chaud'],
      summer: ['summer', 'été', 'beach', 'plage', 'pool', 'piscine', 'sun', 'soleil'],
      spring: ['spring', 'printemps', 'garden', 'jardin', 'flower', 'fleur'],
      fall: ['halloween', 'autumn', 'automne', 'thanksgiving']
    };
    
    const currentSeason = 
      (month >= 11 || month <= 1) ? 'winter' :
      (month >= 2 && month <= 4) ? 'spring' :
      (month >= 5 && month <= 7) ? 'summer' : 'fall';
    
    const keywords = seasonalKeywords[currentSeason] || [];
    if (keywords.some(kw => title.includes(kw))) {
      return 15;
    }
    return 0;
  },
  
  assessVisualPotential(product) {
    let score = 50; // Baseline
    
    // Multiple images = higher quality listing
    const imageCount = (product.images || []).length;
    score += Math.min(imageCount * 5, 25);
    
    // Video presence
    if (product.hasVideo || product.video) {
      score += 15;
    }
    
    // High-res images
    if (product.hdImages) {
      score += 10;
    }
    
    return Math.min(score, 100);
  },
  
  getTier(score) {
    if (score >= 85) return { name: 'WINNER', emoji: '🏆', color: '#10b981' };
    if (score >= 70) return { name: 'PROMISING', emoji: '🔥', color: '#f59e0b' };
    if (score >= 55) return { name: 'POTENTIAL', emoji: '⭐', color: '#6366f1' };
    if (score >= 40) return { name: 'AVERAGE', emoji: '📊', color: '#64748b' };
    return { name: 'RISKY', emoji: '⚠️', color: '#ef4444' };
  },
  
  calculateConfidence(factors) {
    // Confidence based on data completeness
    const dataPoints = Object.values(factors).filter(v => v > 0).length;
    return Math.round((dataPoints / 6) * 100);
  },
  
  // ============================================
  // MARKET ANALYSIS
  // ============================================
  async analyzeMarket(keyword, options = {}) {
    const cacheKey = `market_${keyword}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheMaxAge) {
      return cached.data;
    }
    
    try {
      const response = await fetch(`${this.API_URL}/winners-trends`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': await this.getToken()
        },
        body: JSON.stringify({
          q: keyword,
          analysisType: 'market',
          ...options
        })
      });
      
      if (!response.ok) throw new Error('Market analysis failed');
      
      const data = await response.json();
      
      // Cache results
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (e) {
      console.warn('[ShopOpti+ Predictive] Market analysis error:', e);
      return null;
    }
  },
  
  // ============================================
  // PRODUCT RECOMMENDATIONS
  // ============================================
  async getRecommendations(context = {}) {
    const { currentProduct, userHistory, niche } = context;
    
    const recommendations = [];
    
    // Similar products
    if (currentProduct) {
      const similar = await this.findSimilar(currentProduct);
      recommendations.push(...similar.slice(0, 5).map(p => ({
        ...p,
        reason: 'Produit similaire'
      })));
    }
    
    // Trending in niche
    if (niche) {
      const trending = await this.getTrendingInNiche(niche);
      recommendations.push(...trending.slice(0, 5).map(p => ({
        ...p,
        reason: `Tendance ${niche}`
      })));
    }
    
    // Score all recommendations
    return recommendations.map(p => ({
      ...p,
      winnerAnalysis: this.calculateWinnerScore(p)
    })).sort((a, b) => b.winnerAnalysis.totalScore - a.winnerAnalysis.totalScore);
  },
  
  async findSimilar(product) {
    try {
      const response = await fetch(`${this.API_URL}/extension-supplier-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': await this.getToken()
        },
        body: JSON.stringify({
          product: {
            title: product.title,
            images: product.images?.slice(0, 2)
          },
          mode: 'similar',
          maxResults: 10
        })
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.results || [];
    } catch (e) {
      return [];
    }
  },
  
  async getTrendingInNiche(niche) {
    try {
      const response = await fetch(`${this.API_URL}/winners-aggregator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': await this.getToken()
        },
        body: JSON.stringify({
          q: niche,
          category: niche,
          sources: ['trends', 'ebay', 'amazon'],
          limit: 10
        })
      });
      
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.products || [];
    } catch (e) {
      return [];
    }
  },
  
  // ============================================
  // REAL-TIME SCORING UI
  // ============================================
  createScoreWidget(product) {
    const analysis = this.calculateWinnerScore(product);
    
    const widget = document.createElement('div');
    widget.className = 'shopopti-score-widget';
    
    // Main score badge
    const badge = document.createElement('div');
    badge.className = 'shopopti-score-badge';
    badge.style.background = analysis.tier.color;
    
    const score = document.createElement('span');
    score.className = 'shopopti-score-value';
    score.textContent = analysis.totalScore;
    badge.appendChild(score);
    
    const emoji = document.createElement('span');
    emoji.className = 'shopopti-score-emoji';
    emoji.textContent = analysis.tier.emoji;
    badge.appendChild(emoji);
    
    widget.appendChild(badge);
    
    // Tier label
    const label = document.createElement('div');
    label.className = 'shopopti-score-label';
    label.textContent = analysis.tier.name;
    widget.appendChild(label);
    
    // Confidence indicator
    const confidence = document.createElement('div');
    confidence.className = 'shopopti-score-confidence';
    confidence.textContent = `${analysis.confidence}% confiance`;
    widget.appendChild(confidence);
    
    return widget;
  },
  
  injectScoreWidgetStyles() {
    if (document.getElementById('shopopti-score-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'shopopti-score-styles';
    style.textContent = `
      .shopopti-score-widget {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 12px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      }
      
      .shopopti-score-badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        color: white;
        font-weight: 700;
      }
      
      .shopopti-score-value {
        font-size: 18px;
      }
      
      .shopopti-score-emoji {
        font-size: 16px;
      }
      
      .shopopti-score-label {
        color: white;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .shopopti-score-confidence {
        color: rgba(255, 255, 255, 0.6);
        font-size: 9px;
      }
    `;
    document.head.appendChild(style);
  },
  
  // ============================================
  // HELPERS
  // ============================================
  async getToken() {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(['extensionToken'], (result) => {
          resolve(result.extensionToken);
        });
      } else {
        resolve(null);
      }
    });
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiPredictiveSearch = ShopOptiPredictiveSearch;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ShopOptiPredictiveSearch;
}
