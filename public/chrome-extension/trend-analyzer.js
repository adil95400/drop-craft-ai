/**
 * Drop Craft AI - Trend Analyzer & Product Research v4.0
 * AI-powered product trend analysis and winning product detection
 */

(function() {
  'use strict';

  if (window.__dropCraftTrendAnalyzerLoaded) return;
  window.__dropCraftTrendAnalyzerLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    TREND_INDICATORS: {
      HIGH_ORDERS: 1000,
      GOOD_RATING: 4.5,
      HIGH_REVIEWS: 500,
      PRICE_SWEET_SPOT: { min: 10, max: 50 },
      PROFIT_MARGIN_TARGET: 40
    }
  };

  class DropCraftTrendAnalyzer {
    constructor() {
      this.platform = this.detectPlatform();
      this.analysisCache = new Map();
      this.injectUI();
      this.bindEvents();
    }

    detectPlatform() {
      const hostname = window.location.hostname;
      if (hostname.includes('aliexpress')) return 'aliexpress';
      if (hostname.includes('amazon')) return 'amazon';
      if (hostname.includes('temu')) return 'temu';
      if (hostname.includes('ebay')) return 'ebay';
      if (hostname.includes('1688')) return '1688';
      if (hostname.includes('alibaba')) return 'alibaba';
      return 'unknown';
    }

    injectUI() {
      const style = document.createElement('style');
      style.id = 'dc-trend-styles';
      style.textContent = `
        .dc-trend-panel {
          position: fixed;
          top: 70px;
          right: 20px;
          width: 400px;
          max-height: calc(100vh - 100px);
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          z-index: 10001;
          display: none;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .dc-trend-panel.active { display: flex; flex-direction: column; }
        
        .dc-trend-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .dc-trend-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .dc-trend-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 18px;
        }
        
        .dc-trend-close:hover { color: #ef4444; }
        
        .dc-trend-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }
        
        .dc-trend-score {
          text-align: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          margin-bottom: 20px;
        }
        
        .dc-trend-score-value {
          font-size: 64px;
          font-weight: 800;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .dc-trend-score-label {
          color: #94a3b8;
          font-size: 14px;
          margin-top: 4px;
        }
        
        .dc-trend-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 12px;
        }
        
        .dc-trend-badge.hot {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: white;
        }
        
        .dc-trend-badge.good {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .dc-trend-badge.moderate {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        
        .dc-trend-badge.risky {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        .dc-trend-metrics {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .dc-trend-metric {
          background: rgba(255, 255, 255, 0.05);
          padding: 16px;
          border-radius: 12px;
        }
        
        .dc-trend-metric-icon {
          font-size: 24px;
          margin-bottom: 8px;
        }
        
        .dc-trend-metric-value {
          color: white;
          font-size: 20px;
          font-weight: 700;
        }
        
        .dc-trend-metric-label {
          color: #64748b;
          font-size: 11px;
          margin-top: 2px;
        }
        
        .dc-trend-metric-change {
          font-size: 11px;
          margin-top: 4px;
        }
        
        .dc-trend-metric-change.positive { color: #10b981; }
        .dc-trend-metric-change.negative { color: #ef4444; }
        
        .dc-trend-section {
          margin-bottom: 20px;
        }
        
        .dc-trend-section-title {
          color: white;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .dc-trend-insights {
          background: rgba(102, 126, 234, 0.1);
          border: 1px solid rgba(102, 126, 234, 0.2);
          border-radius: 12px;
          padding: 16px;
        }
        
        .dc-trend-insight-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
          color: #e2e8f0;
          font-size: 13px;
          line-height: 1.5;
        }
        
        .dc-trend-insight-item:last-child { margin-bottom: 0; }
        
        .dc-trend-insight-icon {
          flex-shrink: 0;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        
        .dc-trend-insight-icon.positive { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .dc-trend-insight-icon.negative { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        .dc-trend-insight-icon.neutral { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        
        .dc-trend-competitors {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          overflow: hidden;
        }
        
        .dc-trend-competitor {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .dc-trend-competitor:last-child { border-bottom: none; }
        
        .dc-trend-competitor-img {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
        }
        
        .dc-trend-competitor-info { flex: 1; }
        
        .dc-trend-competitor-title {
          color: white;
          font-size: 12px;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .dc-trend-competitor-meta {
          color: #64748b;
          font-size: 11px;
          margin-top: 2px;
        }
        
        .dc-trend-competitor-price {
          color: #10b981;
          font-weight: 700;
          font-size: 14px;
        }
        
        .dc-trend-actions {
          padding: 16px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 10px;
        }
        
        .dc-trend-btn {
          flex: 1;
          padding: 12px 16px;
          border-radius: 10px;
          border: none;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dc-trend-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .dc-trend-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .dc-trend-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        /* Product overlay score badge */
        .dc-trend-overlay-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          z-index: 102;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .dc-trend-overlay-badge.hot {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: white;
        }
        
        .dc-trend-overlay-badge.good {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .dc-trend-overlay-badge.moderate {
          background: rgba(245, 158, 11, 0.9);
          color: white;
        }
        
        .dc-trend-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .dc-trend-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(102, 126, 234, 0.2);
          border-top-color: #667eea;
          border-radius: 50%;
          animation: dc-spin 1s linear infinite;
        }
        
        @keyframes dc-spin {
          to { transform: rotate(360deg); }
        }
        
        .dc-trend-loading-text {
          color: #94a3b8;
          margin-top: 16px;
          font-size: 14px;
        }
      `;
      document.head.appendChild(style);

      const panel = document.createElement('div');
      panel.className = 'dc-trend-panel';
      panel.id = 'dc-trend-panel';
      panel.innerHTML = `
        <div class="dc-trend-header">
          <div class="dc-trend-title">
            🔥 Analyse Tendance
          </div>
          <button class="dc-trend-close" id="dc-trend-close">✕</button>
        </div>
        <div class="dc-trend-content" id="dc-trend-content">
          <div class="dc-trend-loading">
            <div class="dc-trend-spinner"></div>
            <div class="dc-trend-loading-text">Analyse IA en cours...</div>
          </div>
        </div>
        <div class="dc-trend-actions">
          <button class="dc-trend-btn dc-trend-btn-secondary" id="dc-trend-refresh">
            🔄 Actualiser
          </button>
          <button class="dc-trend-btn dc-trend-btn-primary" id="dc-trend-import">
            📦 Importer produit
          </button>
        </div>
      `;
      document.body.appendChild(panel);
    }

    bindEvents() {
      document.getElementById('dc-trend-close')?.addEventListener('click', () => this.hide());
      document.getElementById('dc-trend-refresh')?.addEventListener('click', () => this.analyze());
      document.getElementById('dc-trend-import')?.addEventListener('click', () => this.importProduct());

      window.addEventListener('message', (event) => {
        if (event.data.type === 'SHOW_TREND_PANEL') {
          this.show();
          this.analyze();
        }
      });
    }

    show() {
      const panel = document.getElementById('dc-trend-panel');
      if (panel) panel.classList.add('active');
    }

    hide() {
      const panel = document.getElementById('dc-trend-panel');
      if (panel) panel.classList.remove('active');
    }

    async analyze() {
      const content = document.getElementById('dc-trend-content');
      content.innerHTML = `
        <div class="dc-trend-loading">
          <div class="dc-trend-spinner"></div>
          <div class="dc-trend-loading-text">Analyse IA en cours...</div>
        </div>
      `;

      try {
        const productData = await this.extractProductData();
        const analysis = await this.performAnalysis(productData);
        this.renderAnalysis(analysis);
      } catch (error) {
        content.innerHTML = `
          <div class="dc-trend-loading">
            <div style="color: #ef4444; font-size: 48px;">❌</div>
            <div class="dc-trend-loading-text">Erreur lors de l'analyse</div>
          </div>
        `;
      }
    }

    async extractProductData() {
      // Extract current product data
      const data = {
        url: window.location.href,
        platform: this.platform,
        title: '',
        price: 0,
        originalPrice: 0,
        rating: 0,
        reviewCount: 0,
        orderCount: 0,
        images: [],
        description: '',
        seller: '',
        category: ''
      };

      // Try JSON-LD first
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent);
          if (json['@type'] === 'Product') {
            data.title = json.name || data.title;
            data.description = json.description || data.description;
            const offer = Array.isArray(json.offers) ? json.offers[0] : json.offers;
            data.price = parseFloat(offer?.price) || data.price;
            data.rating = json.aggregateRating?.ratingValue || data.rating;
            data.reviewCount = json.aggregateRating?.reviewCount || data.reviewCount;
          }
        } catch (e) {}
      }

      // Platform-specific extraction
      if (this.platform === 'aliexpress') {
        data.title = data.title || document.querySelector('h1')?.textContent?.trim();
        data.orderCount = this.parseNumber(document.querySelector('[class*="order"]')?.textContent);
        data.seller = document.querySelector('.store-name, [class*="store-name"]')?.textContent?.trim();
      } else if (this.platform === 'amazon') {
        data.title = data.title || document.getElementById('productTitle')?.textContent?.trim();
        data.seller = document.getElementById('bylineInfo')?.textContent?.trim();
      }

      // Get price if not found
      if (!data.price) {
        const priceEl = document.querySelector('[class*="price"]:not([class*="original"])');
        data.price = this.parsePrice(priceEl?.textContent || '0');
      }

      // Get images
      const imgEls = document.querySelectorAll('.gallery img, .product-image img, [class*="gallery"] img');
      imgEls.forEach(img => {
        const src = img.src || img.dataset.src;
        if (src && !data.images.includes(src)) data.images.push(src);
      });

      return data;
    }

    parseNumber(text) {
      if (!text) return 0;
      const match = text.replace(/[,\s]/g, '').match(/[\d.]+/);
      return match ? parseInt(match[0]) : 0;
    }

    parsePrice(text) {
      if (!text) return 0;
      const match = text.replace(/[,\s]/g, '.').match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
    }

    async performAnalysis(productData) {
      // Calculate trend score based on multiple factors
      let score = 50; // Base score
      const insights = [];
      const metrics = {};

      // Orders analysis
      metrics.orders = productData.orderCount;
      if (productData.orderCount > CONFIG.TREND_INDICATORS.HIGH_ORDERS) {
        score += 20;
        insights.push({ type: 'positive', text: `Volume de ventes élevé (${productData.orderCount.toLocaleString()} commandes)` });
      } else if (productData.orderCount > 100) {
        score += 10;
        insights.push({ type: 'neutral', text: 'Volume de ventes modéré' });
      } else {
        insights.push({ type: 'negative', text: 'Volume de ventes faible - produit moins testé' });
      }

      // Rating analysis
      metrics.rating = productData.rating;
      if (productData.rating >= CONFIG.TREND_INDICATORS.GOOD_RATING) {
        score += 15;
        insights.push({ type: 'positive', text: `Excellente note (${productData.rating}/5)` });
      } else if (productData.rating >= 4.0) {
        score += 8;
        insights.push({ type: 'neutral', text: `Bonne note (${productData.rating}/5)` });
      } else if (productData.rating > 0) {
        score -= 10;
        insights.push({ type: 'negative', text: `Note médiocre (${productData.rating}/5) - risque de retours` });
      }

      // Reviews count
      metrics.reviews = productData.reviewCount;
      if (productData.reviewCount >= CONFIG.TREND_INDICATORS.HIGH_REVIEWS) {
        score += 10;
        insights.push({ type: 'positive', text: `Beaucoup d'avis (${productData.reviewCount})` });
      }

      // Price sweet spot analysis
      metrics.price = productData.price;
      const { min, max } = CONFIG.TREND_INDICATORS.PRICE_SWEET_SPOT;
      if (productData.price >= min && productData.price <= max) {
        score += 10;
        insights.push({ type: 'positive', text: `Prix optimal pour dropshipping (${productData.price}€)` });
      } else if (productData.price < min) {
        insights.push({ type: 'neutral', text: 'Prix bas - marges potentiellement limitées' });
      } else {
        insights.push({ type: 'neutral', text: 'Prix élevé - cible marché de niche' });
      }

      // Profit margin estimation
      const suggestedPrice = productData.price * 2.5;
      const estimatedProfit = suggestedPrice - productData.price;
      const profitMargin = Math.round((estimatedProfit / suggestedPrice) * 100);
      metrics.profitMargin = profitMargin;
      
      if (profitMargin >= CONFIG.TREND_INDICATORS.PROFIT_MARGIN_TARGET) {
        score += 10;
        insights.push({ type: 'positive', text: `Marge bénéficiaire attractive (${profitMargin}%)` });
      }

      // Cap score
      score = Math.min(100, Math.max(0, score));

      // Determine badge
      let badge = 'moderate';
      let badgeText = 'Potentiel Modéré';
      if (score >= 80) {
        badge = 'hot';
        badgeText = '🔥 Produit Gagnant';
      } else if (score >= 60) {
        badge = 'good';
        badgeText = '✓ Bon Potentiel';
      } else if (score < 40) {
        badge = 'risky';
        badgeText = '⚠️ Risqué';
      }

      return {
        score,
        badge,
        badgeText,
        insights,
        metrics,
        productData,
        suggestedPrice: suggestedPrice.toFixed(2),
        profitMargin
      };
    }

    renderAnalysis(analysis) {
      const content = document.getElementById('dc-trend-content');
      content.innerHTML = `
        <div class="dc-trend-score">
          <div class="dc-trend-score-value">${analysis.score}</div>
          <div class="dc-trend-score-label">Score Tendance</div>
          <div class="dc-trend-badge ${analysis.badge}">${analysis.badgeText}</div>
        </div>
        
        <div class="dc-trend-metrics">
          <div class="dc-trend-metric">
            <div class="dc-trend-metric-icon">📦</div>
            <div class="dc-trend-metric-value">${(analysis.metrics.orders || 0).toLocaleString()}</div>
            <div class="dc-trend-metric-label">Commandes</div>
          </div>
          <div class="dc-trend-metric">
            <div class="dc-trend-metric-icon">⭐</div>
            <div class="dc-trend-metric-value">${analysis.metrics.rating || '-'}</div>
            <div class="dc-trend-metric-label">Note</div>
          </div>
          <div class="dc-trend-metric">
            <div class="dc-trend-metric-icon">💬</div>
            <div class="dc-trend-metric-value">${(analysis.metrics.reviews || 0).toLocaleString()}</div>
            <div class="dc-trend-metric-label">Avis</div>
          </div>
          <div class="dc-trend-metric">
            <div class="dc-trend-metric-icon">💰</div>
            <div class="dc-trend-metric-value">${analysis.profitMargin}%</div>
            <div class="dc-trend-metric-label">Marge estimée</div>
          </div>
        </div>
        
        <div class="dc-trend-section">
          <div class="dc-trend-section-title">
            🎯 Recommandations IA
          </div>
          <div class="dc-trend-insights">
            ${analysis.insights.map(insight => `
              <div class="dc-trend-insight-item">
                <div class="dc-trend-insight-icon ${insight.type}">
                  ${insight.type === 'positive' ? '✓' : insight.type === 'negative' ? '✗' : '•'}
                </div>
                <span>${insight.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="dc-trend-section">
          <div class="dc-trend-section-title">
            💵 Prix Suggéré
          </div>
          <div class="dc-trend-insights" style="text-align: center;">
            <div style="color: white; font-size: 28px; font-weight: 700;">
              ${analysis.suggestedPrice}€
            </div>
            <div style="color: #64748b; font-size: 12px; margin-top: 4px;">
              Prix d'achat: ${analysis.productData.price}€ → Marge: ${analysis.profitMargin}%
            </div>
          </div>
        </div>
      `;
    }

    async importProduct() {
      const data = await this.extractProductData();
      window.postMessage({
        type: 'SINGLE_PRODUCT_EXTRACTED',
        product: data
      }, '*');
      this.showToast('Produit envoyé pour import!', 'success');
      this.hide();
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 440px;
        background: ${type === 'success' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 
                      type === 'error' ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' :
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10002;
        animation: slideIn 0.3s ease-out;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    }

    // Add trend badges to product cards in listing pages
    async injectTrendBadges() {
      const platformConfig = {
        'aliexpress': '.search-item-card-wrapper-gallery, .product-snippet',
        'amazon': '[data-component-type="s-search-result"]',
        'temu': '[data-testid="goods-item"]'
      };

      const selector = platformConfig[this.platform];
      if (!selector) return;

      const cards = document.querySelectorAll(selector);
      for (const card of cards) {
        if (card.querySelector('.dc-trend-overlay-badge')) continue;

        const orderText = card.querySelector('[class*="order"], [class*="sold"]')?.textContent;
        const ratingText = card.querySelector('[class*="star"], [class*="rating"]')?.textContent;
        
        const orders = this.parseNumber(orderText);
        const rating = this.parsePrice(ratingText);
        
        // Quick score calculation
        let quickScore = 50;
        if (orders > 1000) quickScore += 25;
        else if (orders > 100) quickScore += 10;
        if (rating >= 4.5) quickScore += 15;
        else if (rating >= 4.0) quickScore += 8;

        if (quickScore >= 70) {
          const badge = document.createElement('div');
          badge.className = `dc-trend-overlay-badge ${quickScore >= 80 ? 'hot' : 'good'}`;
          badge.innerHTML = `🔥 ${quickScore}`;
          card.style.position = 'relative';
          card.appendChild(badge);
        }
      }
    }
  }

  // Auto-initialize
  window.DropCraftTrendAnalyzer = DropCraftTrendAnalyzer;
  new DropCraftTrendAnalyzer();
})();
