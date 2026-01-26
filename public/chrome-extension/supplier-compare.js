/**
 * ShopOpti+ Supplier Comparison Engine v5.7.0
 * Find alternative suppliers with better prices/shipping
 * Complete cost calculation with CostCalculator integration
 * Automatic fallback when API fails
 */

(function() {
  'use strict';

  if (window.__shopOptiSupplierCompareLoaded) return;
  window.__shopOptiSupplierCompareLoaded = true;

  const CONFIG = {
    VERSION: '5.7.0',
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    SUPPLIERS: {
      aliexpress: { name: 'AliExpress', icon: '🛒', avgShipping: 15, reliability: 85, color: '#ff6a00' },
      temu: { name: 'Temu', icon: '🛍️', avgShipping: 12, reliability: 80, color: '#f97316' },
      cjdropshipping: { name: 'CJ Dropshipping', icon: '📦', avgShipping: 8, reliability: 90, color: '#1a73e8' },
      banggood: { name: 'Banggood', icon: '🏪', avgShipping: 14, reliability: 82, color: '#ff6600' },
      dhgate: { name: 'DHgate', icon: '🏭', avgShipping: 18, reliability: 78, color: '#e54d00' },
      '1688': { name: '1688', icon: '🇨🇳', avgShipping: 20, reliability: 75, color: '#ff6600' },
      amazon: { name: 'Amazon', icon: '📦', avgShipping: 3, reliability: 95, color: '#ff9900' },
      ebay: { name: 'eBay', icon: '🏷️', avgShipping: 10, reliability: 85, color: '#e53238' },
      shein: { name: 'Shein', icon: '👗', avgShipping: 12, reliability: 80, color: '#000000' },
      wish: { name: 'Wish', icon: '⭐', avgShipping: 25, reliability: 70, color: '#2fb7ec' }
    }
  };

  class ShopOptiSupplierCompare {
    constructor() {
      this.currentProduct = null;
      this.alternatives = [];
      this.usedFallback = false;
      this.init();
    }

    async init() {
      this.injectStyles();
      this.injectUI();
      this.bindEvents();
      console.log(`🔍 ShopOpti+ Supplier Compare v${CONFIG.VERSION} initialized`);
    }

    injectStyles() {
      if (document.getElementById('dc-supplier-styles')) return;

      const style = document.createElement('style');
      style.id = 'dc-supplier-styles';
      style.textContent = `
        .dc-supplier-btn {
          position: fixed;
          bottom: 390px;
          right: 20px;
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.5);
          z-index: 999991;
          transition: all 0.3s ease;
        }

        .dc-supplier-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.6);
        }

        .dc-supplier-panel {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 800px;
          max-width: 95vw;
          max-height: 85vh;
          background: linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%);
          border-radius: 20px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
          z-index: 999999;
          display: none;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid rgba(16, 185, 129, 0.3);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dc-supplier-panel.open {
          display: flex;
          animation: dc-supplier-open 0.3s ease forwards;
        }

        @keyframes dc-supplier-open {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        .dc-supplier-backdrop {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: 999998;
          display: none;
        }

        .dc-supplier-backdrop.open { display: block; }

        .dc-supplier-header {
          padding: 24px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          position: relative;
        }

        .dc-supplier-header h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dc-supplier-header p {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .dc-supplier-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s ease;
        }

        .dc-supplier-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .dc-supplier-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .dc-supplier-current {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 24px;
          display: flex;
          gap: 20px;
        }

        .dc-supplier-current-img {
          width: 100px;
          height: 100px;
          border-radius: 12px;
          object-fit: cover;
          background: rgba(0, 0, 0, 0.3);
        }

        .dc-supplier-current-info { flex: 1; }

        .dc-supplier-current-title {
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dc-supplier-current-meta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
        }

        .dc-supplier-current-meta-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 13px;
        }

        .dc-supplier-current-meta-value {
          color: #10b981;
          font-weight: 600;
        }

        .dc-supplier-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .dc-supplier-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          transition: all 0.3s ease;
          position: relative;
        }

        .dc-supplier-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(16, 185, 129, 0.3);
          transform: translateX(4px);
        }

        .dc-supplier-card.best {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .dc-supplier-card.best::before {
          content: '🏆 Meilleur choix';
          position: absolute;
          top: -10px;
          left: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }

        .dc-supplier-card-img {
          width: 80px;
          height: 80px;
          border-radius: 10px;
          object-fit: cover;
          background: rgba(0, 0, 0, 0.3);
        }

        .dc-supplier-card-content { flex: 1; }

        .dc-supplier-card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .dc-supplier-card-platform {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dc-supplier-card-platform-icon {
          font-size: 20px;
        }

        .dc-supplier-card-platform-name {
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
        }

        .dc-supplier-card-price {
          text-align: right;
        }

        .dc-supplier-card-price-current {
          color: #10b981;
          font-size: 20px;
          font-weight: 700;
        }

        .dc-supplier-card-price-savings {
          color: #f59e0b;
          font-size: 12px;
          font-weight: 500;
        }

        .dc-supplier-card-stats {
          display: flex;
          gap: 16px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .dc-supplier-card-stat {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 12px;
        }

        .dc-supplier-card-stat-value {
          color: #e2e8f0;
          font-weight: 500;
        }

        .dc-supplier-card-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .dc-supplier-card-btn {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dc-supplier-card-btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .dc-supplier-card-btn-primary:hover {
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .dc-supplier-card-btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dc-supplier-card-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .dc-supplier-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px;
        }

        .dc-supplier-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(16, 185, 129, 0.2);
          border-top-color: #10b981;
          border-radius: 50%;
          animation: dc-supplier-spin 0.8s linear infinite;
        }

        @keyframes dc-supplier-spin {
          to { transform: rotate(360deg); }
        }

        .dc-supplier-loading-text {
          color: #94a3b8;
          margin-top: 16px;
          font-size: 14px;
        }

        .dc-supplier-empty {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }

        .dc-supplier-empty-icon { font-size: 48px; margin-bottom: 16px; }

        .dc-supplier-filters {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .dc-supplier-filter {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 8px 16px;
          color: #94a3b8;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dc-supplier-filter:hover, .dc-supplier-filter.active {
          background: rgba(16, 185, 129, 0.2);
          border-color: #10b981;
          color: #10b981;
        }

        .dc-supplier-summary {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .dc-supplier-summary-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
        }

        .dc-supplier-summary-value {
          color: #10b981;
          font-size: 24px;
          font-weight: 700;
        }

        .dc-supplier-summary-label {
          color: #94a3b8;
          font-size: 11px;
          margin-top: 4px;
        }
      `;
      document.head.appendChild(style);
    }

    injectUI() {
      // Floating button
      const btn = document.createElement('button');
      btn.className = 'dc-supplier-btn';
      btn.id = 'dc-supplier-btn';
      btn.innerHTML = '🔍';
      btn.title = 'Comparaison fournisseurs';
      document.body.appendChild(btn);

      // Backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'dc-supplier-backdrop';
      backdrop.id = 'dc-supplier-backdrop';
      document.body.appendChild(backdrop);

      // Panel
      const panel = document.createElement('div');
      panel.className = 'dc-supplier-panel';
      panel.id = 'dc-supplier-panel';
      panel.innerHTML = `
        <div class="dc-supplier-header">
          <h3>🔍 Comparaison Fournisseurs</h3>
          <p>Trouvez les meilleurs fournisseurs alternatifs</p>
          <button class="dc-supplier-close" id="dc-supplier-close">✕</button>
        </div>
        <div class="dc-supplier-content" id="dc-supplier-content">
          <div class="dc-supplier-loading">
            <div class="dc-supplier-spinner"></div>
            <div class="dc-supplier-loading-text">Recherche en cours...</div>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    bindEvents() {
      document.getElementById('dc-supplier-btn')?.addEventListener('click', () => this.toggle());
      document.getElementById('dc-supplier-close')?.addEventListener('click', () => this.close());
      document.getElementById('dc-supplier-backdrop')?.addEventListener('click', () => this.close());
    }

    toggle() {
      const panel = document.getElementById('dc-supplier-panel');
      const backdrop = document.getElementById('dc-supplier-backdrop');
      const isOpen = panel?.classList.contains('open');
      
      panel?.classList.toggle('open');
      backdrop?.classList.toggle('open');

      if (!isOpen) {
        this.searchAlternatives();
      }
    }

    close() {
      document.getElementById('dc-supplier-panel')?.classList.remove('open');
      document.getElementById('dc-supplier-backdrop')?.classList.remove('open');
    }

    async searchAlternatives() {
      const content = document.getElementById('dc-supplier-content');
      content.innerHTML = `
        <div class="dc-supplier-loading">
          <div class="dc-supplier-spinner"></div>
          <div class="dc-supplier-loading-text">Analyse du produit et recherche d'alternatives...</div>
        </div>
      `;

      try {
        // Extract current product info
        const product = await this.extractCurrentProduct();
        this.currentProduct = product;

        // Search for alternatives (simulated for now)
        const alternatives = await this.findAlternatives(product);
        this.alternatives = alternatives;

        this.renderResults(product, alternatives);
      } catch (error) {
        console.error('Supplier search error:', error);
        content.innerHTML = `
          <div class="dc-supplier-empty">
            <div class="dc-supplier-empty-icon">❌</div>
            <p>Impossible de trouver des alternatives</p>
          </div>
        `;
      }
    }

    async extractCurrentProduct() {
      const product = {
        title: '',
        price: 0,
        image: '',
        platform: this.detectPlatform(),
        url: window.location.href
      };

      // JSON-LD
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent);
          if (json['@type'] === 'Product') {
            product.title = json.name || '';
            const offer = Array.isArray(json.offers) ? json.offers[0] : json.offers;
            product.price = parseFloat(offer?.price) || 0;
            product.image = Array.isArray(json.image) ? json.image[0] : json.image;
          }
        } catch (e) {}
      }

      // DOM fallback
      if (!product.title) {
        product.title = document.querySelector('h1')?.textContent?.trim() || 'Produit inconnu';
      }
      if (!product.price) {
        const priceEl = document.querySelector('[class*="price"]');
        product.price = this.parsePrice(priceEl?.textContent || '0');
      }
      if (!product.image) {
        product.image = document.querySelector('.gallery img, .product-image img, img[class*="product"]')?.src || '';
      }

      return product;
    }

    detectPlatform() {
      const hostname = window.location.hostname;
      if (hostname.includes('aliexpress')) return 'aliexpress';
      if (hostname.includes('temu')) return 'temu';
      if (hostname.includes('amazon')) return 'amazon';
      if (hostname.includes('ebay')) return 'ebay';
      if (hostname.includes('banggood')) return 'banggood';
      if (hostname.includes('1688')) return '1688';
      return 'unknown';
    }

    parsePrice(text) {
      const match = text.match(/[\d.,]+/);
      if (match) {
        return parseFloat(match[0].replace(',', '.'));
      }
      return 0;
    }

    async findAlternatives(product) {
      this.usedFallback = false;
      
      // Try API first
      try {
        const token = await this.getToken();
        const response = await fetch(`${CONFIG.API_URL}/supplier-compare`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'x-extension-token': token })
          },
          body: JSON.stringify({
            title: product.title,
            price: product.price,
            platform: product.platform
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            // Add margin calculation using CostCalculator
            return this.enrichWithMargins(data, product.price);
          }
        }
      } catch (e) {
        console.log('[ShopOpti+] API failed, using fallback...');
      }

      // Use local fallback if available
      if (window.ShopOptiSupplierFallback) {
        this.usedFallback = true;
        console.log('[ShopOpti+] Using local supplier fallback');
        
        const fallbackResults = await window.ShopOptiSupplierFallback.generateFallbackResults(
          { title: product.title, price: product.price },
          { platforms: Object.keys(CONFIG.SUPPLIERS).filter(k => k !== product.platform), reason: 'API unavailable' }
        );
        
        return this.enrichWithMargins(fallbackResults.suppliers, product.price);
      }

      // Ultimate fallback: simulated alternatives
      return this.simulateAlternatives(product);
    }

    // Enrich results with complete margin calculation from CostCalculator
    enrichWithMargins(alternatives, sellingPrice) {
      if (!window.ShopOptiCostCalculator || !sellingPrice) return alternatives;
      
      return alternatives.map(alt => {
        const productCost = alt.price || alt.pricing?.estimatedCost || 0;
        const shippingCost = alt.shippingCost || alt.pricing?.shippingCost || 0;
        
        const calc = window.ShopOptiCostCalculator.calculateComplete({
          productCost,
          shippingCost,
          sellingPrice,
          vatRate: 20,
          paymentProcessor: 'stripe',
          platform: 'shopify',
          includeVat: true
        });
        
        return {
          ...alt,
          // Complete margin data
          marginData: calc,
          netMargin: calc.margins.net,
          netProfit: calc.profit.net,
          grossMargin: calc.margins.gross,
          roi: calc.margins.roi,
          totalCosts: calc.costs.totalCosts,
          profitabilityLevel: calc.analysis.profitabilityLevel,
          recommendation: calc.analysis.recommendation,
          // Keep original estimate flag
          isEstimate: alt.isEstimate || false
        };
      }).sort((a, b) => (b.netMargin || 0) - (a.netMargin || 0));
    }

    simulateAlternatives(product) {
      const basePrice = product.price || 10;
      const platforms = Object.entries(CONFIG.SUPPLIERS).filter(([key]) => key !== product.platform);

      const results = platforms.map(([key, info], index) => {
        const priceVariation = 0.7 + Math.random() * 0.6; // 70% to 130%
        const price = Math.round(basePrice * priceVariation * 100) / 100;
        const shippingCost = Math.round(Math.random() * 5 * 100) / 100;
        const savings = Math.round((basePrice - price) * 100) / 100;
        
        return {
          platform: key,
          ...info,
          title: product.title,
          price,
          shippingCost,
          savings: savings > 0 ? savings : 0,
          savingsPercent: savings > 0 ? Math.round((savings / basePrice) * 100) : 0,
          shipping: info.avgShipping + Math.floor(Math.random() * 5) - 2,
          rating: (Math.random() * 1 + 4).toFixed(1),
          reviews: Math.floor(Math.random() * 5000) + 100,
          orders: Math.floor(Math.random() * 10000) + 500,
          image: product.image,
          url: `https://${key === '1688' ? 's.1688.com/selloffer/offer_search.htm?keywords=' : key + '.com/search?q='}${encodeURIComponent(product.title)}`,
          isEstimate: true
        };
      });
      
      // Enrich with margin calculation
      return this.enrichWithMargins(results, basePrice);
    }

    renderResults(product, alternatives) {
      const content = document.getElementById('dc-supplier-content');
      
      const bestSavings = alternatives.reduce((max, a) => Math.max(max, a.savings || 0), 0);
      const avgSavings = alternatives.reduce((sum, a) => sum + (a.savings || 0), 0) / alternatives.length;
      const fastestShipping = Math.min(...alternatives.map(a => a.shipping || a.avgShipping || 30));
      const bestMargin = alternatives.reduce((max, a) => Math.max(max, a.netMargin || 0), 0);

      content.innerHTML = `
        ${this.usedFallback ? `
          <div class="dc-fallback-warning" style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">⚠️</span>
            <div>
              <div style="color: #f59e0b; font-weight: 600; font-size: 13px;">Mode Estimation</div>
              <div style="color: #94a3b8; font-size: 12px;">Prix estimés basés sur les moyennes du marché - vérifiez sur les plateformes</div>
            </div>
          </div>
        ` : ''}
        
        <div class="dc-supplier-current">
          <img class="dc-supplier-current-img" src="${product.image}" alt="${product.title}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/></svg>'">
          <div class="dc-supplier-current-info">
            <div class="dc-supplier-current-title">${product.title}</div>
            <div class="dc-supplier-current-meta">
              <div class="dc-supplier-current-meta-item">
                <span>💰 Prix actuel:</span>
                <span class="dc-supplier-current-meta-value">${product.price.toFixed(2)}€</span>
              </div>
              <div class="dc-supplier-current-meta-item">
                <span>🏪 Plateforme:</span>
                <span class="dc-supplier-current-meta-value">${CONFIG.SUPPLIERS[product.platform]?.name || product.platform}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="dc-supplier-summary">
          <div class="dc-supplier-summary-card">
            <div class="dc-supplier-summary-value">${alternatives.length}</div>
            <div class="dc-supplier-summary-label">Alternatives trouvées</div>
          </div>
          <div class="dc-supplier-summary-card">
            <div class="dc-supplier-summary-value" style="color: ${bestMargin >= 30 ? '#10b981' : bestMargin >= 15 ? '#eab308' : '#ef4444'}">${bestMargin.toFixed(1)}%</div>
            <div class="dc-supplier-summary-label">Meilleure marge nette</div>
          </div>
          <div class="dc-supplier-summary-card">
            <div class="dc-supplier-summary-value">${bestSavings.toFixed(2)}€</div>
            <div class="dc-supplier-summary-label">Économie max</div>
          </div>
          <div class="dc-supplier-summary-card">
            <div class="dc-supplier-summary-value">${fastestShipping}j</div>
            <div class="dc-supplier-summary-label">Livraison la plus rapide</div>
          </div>
        </div>

        <div class="dc-supplier-filters">
          <button class="dc-supplier-filter active" data-filter="margin">📊 Meilleure marge</button>
          <button class="dc-supplier-filter" data-filter="price">💰 Meilleur prix</button>
          <button class="dc-supplier-filter" data-filter="shipping">🚚 Livraison rapide</button>
          <button class="dc-supplier-filter" data-filter="rating">⭐ Mieux noté</button>
        </div>

        <div class="dc-supplier-list" id="dc-supplier-list">
          ${alternatives.map((alt, index) => this.renderAlternativeCard(alt, index === 0)).join('')}
        </div>
      `;

      // Bind filter events
      content.querySelectorAll('.dc-supplier-filter').forEach(btn => {
        btn.addEventListener('click', (e) => this.applyFilter(e.target.dataset.filter));
      });

      // Bind action events
      content.querySelectorAll('[data-action="open"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const url = e.target.dataset.url;
          window.open(url, '_blank');
        });
      });

      content.querySelectorAll('[data-action="import"]').forEach(btn => {
        btn.addEventListener('click', (e) => this.importFromSupplier(e.target.dataset.index));
      });
    }

    renderAlternativeCard(alt, isBest = false) {
      const profitLevel = alt.profitabilityLevel || { level: 'unknown', label: 'N/A', color: '#94a3b8', icon: '❓' };
      const price = alt.price || alt.pricing?.estimatedCost || 0;
      const shipping = alt.shipping || alt.avgShipping || 15;
      
      return `
        <div class="dc-supplier-card ${isBest ? 'best' : ''}">
          ${alt.isEstimate ? `<span class="dc-estimate-badge" style="position: absolute; top: 10px; right: 10px; background: rgba(245, 158, 11, 0.2); color: #f59e0b; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 600;">Estimé</span>` : ''}
          <img class="dc-supplier-card-img" src="${alt.image || ''}" alt="${alt.title || ''}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/></svg>'">
          <div class="dc-supplier-card-content">
            <div class="dc-supplier-card-header">
              <div class="dc-supplier-card-platform">
                <span class="dc-supplier-card-platform-icon">${alt.icon}</span>
                <span class="dc-supplier-card-platform-name">${alt.name}</span>
              </div>
              <div class="dc-supplier-card-price">
                <div class="dc-supplier-card-price-current">${price.toFixed(2)}€</div>
                ${alt.savings > 0 ? `<div class="dc-supplier-card-price-savings">-${alt.savingsPercent}% (${alt.savings.toFixed(2)}€)</div>` : ''}
              </div>
            </div>
            
            <!-- Margin display from CostCalculator -->
            ${alt.netMargin !== undefined ? `
              <div class="dc-margin-display" style="background: rgba(${profitLevel.level === 'excellent' || profitLevel.level === 'very_good' ? '16, 185, 129' : profitLevel.level === 'good' || profitLevel.level === 'acceptable' ? '234, 179, 8' : '239, 68, 68'}, 0.1); border-radius: 10px; padding: 10px 12px; margin: 10px 0; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <div style="color: #94a3b8; font-size: 11px;">Marge nette (TVA, frais inclus)</div>
                  <div style="color: ${profitLevel.color}; font-size: 18px; font-weight: 700;">${alt.netMargin.toFixed(1)}% <span style="font-size: 12px;">(${alt.netProfit >= 0 ? '+' : ''}${alt.netProfit.toFixed(2)}€)</span></div>
                </div>
                <div style="text-align: right;">
                  <span style="font-size: 20px;">${profitLevel.icon}</span>
                  <div style="color: ${profitLevel.color}; font-size: 11px; font-weight: 600;">${profitLevel.label}</div>
                </div>
              </div>
            ` : ''}
            
            <div class="dc-supplier-card-stats">
              <div class="dc-supplier-card-stat">
                🚚 Livraison: <span class="dc-supplier-card-stat-value">${shipping} jours</span>
              </div>
              <div class="dc-supplier-card-stat">
                ⭐ Fiabilité: <span class="dc-supplier-card-stat-value">${alt.reliability || 80}%</span>
              </div>
              ${alt.totalCosts ? `
              <div class="dc-supplier-card-stat">
                💵 Coût total: <span class="dc-supplier-card-stat-value">${alt.totalCosts.toFixed(2)}€</span>
              </div>
              ` : ''}
              ${alt.roi ? `
              <div class="dc-supplier-card-stat">
                📈 ROI: <span class="dc-supplier-card-stat-value">${alt.roi.toFixed(1)}%</span>
              </div>
              ` : ''}
            </div>
            <div class="dc-supplier-card-actions">
              <button class="dc-supplier-card-btn dc-supplier-card-btn-primary" data-action="open" data-url="${alt.url || alt.searchUrl || ''}">
                🔗 Voir sur ${alt.name}
              </button>
              <button class="dc-supplier-card-btn dc-supplier-card-btn-secondary" data-action="import" data-index="${this.alternatives.indexOf(alt)}">
                📥 Importer
              </button>
            </div>
          </div>
        </div>
      `;
    }

    applyFilter(filter) {
      document.querySelectorAll('.dc-supplier-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
      });

      let sorted = [...this.alternatives];
      
      switch(filter) {
        case 'margin':
          sorted.sort((a, b) => (b.netMargin || 0) - (a.netMargin || 0));
          break;
        case 'price':
          sorted.sort((a, b) => (a.price || a.pricing?.estimatedCost || 0) - (b.price || b.pricing?.estimatedCost || 0));
          break;
        case 'shipping':
          sorted.sort((a, b) => (a.shipping || a.avgShipping || 30) - (b.shipping || b.avgShipping || 30));
          break;
        case 'rating':
          sorted.sort((a, b) => (b.reliability || 0) - (a.reliability || 0));
          break;
      }

      const list = document.getElementById('dc-supplier-list');
      list.innerHTML = sorted.map((alt, index) => this.renderAlternativeCard(alt, index === 0)).join('');

      // Re-bind events
      list.querySelectorAll('[data-action="open"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          window.open(e.target.dataset.url, '_blank');
        });
      });
    }

    async importFromSupplier(index) {
      const alt = this.alternatives[index];
      if (alt?.url) {
        window.open(alt.url, '_blank');
      }
    }

    async getToken() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken'], (result) => {
            resolve(result.extensionToken || null);
          });
        } else {
          resolve(null);
        }
      });
    }
  }

  // Initialize
  window.ShopOptiSupplierCompare = new ShopOptiSupplierCompare();
  // Backward compatibility
  window.DropCraftSupplierCompare = window.ShopOptiSupplierCompare;
})();
