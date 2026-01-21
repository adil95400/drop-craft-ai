// Drop Craft AI - Professional Sidebar Extension v4.0
// Inspired by AutoDS - Complete rewrite

(function() {
  'use strict';

  // Prevent multiple injections
  if (window.__dropCraftSidebarLoaded) return;
  window.__dropCraftSidebarLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io',
    SUPPORTED_PLATFORMS: {
      'aliexpress': { name: 'AliExpress', icon: '🛒', color: '#ff6a00' },
      'amazon': { name: 'Amazon', icon: '📦', color: '#ff9900' },
      'ebay': { name: 'eBay', icon: '🏷️', color: '#e53238' },
      'temu': { name: 'Temu', icon: '🎁', color: '#f97316' },
      'walmart': { name: 'Walmart', icon: '🏪', color: '#0071ce' },
      'etsy': { name: 'Etsy', icon: '🎨', color: '#f56400' },
      'wish': { name: 'Wish', icon: '⭐', color: '#2fb7ec' },
      'banggood': { name: 'Banggood', icon: '📱', color: '#ff6600' },
      'dhgate': { name: 'DHgate', icon: '🏭', color: '#e54d00' },
      'cjdropshipping': { name: 'CJ', icon: '📦', color: '#1a73e8' },
      'shein': { name: 'Shein', icon: '👗', color: '#000' },
      '1688': { name: '1688', icon: '🏭', color: '#ff6600' },
      'taobao': { name: 'Taobao', icon: '🛍️', color: '#ff4400' }
    }
  };

  class DropCraftSidebar {
    constructor() {
      this.isOpen = false;
      this.isConnected = false;
      this.token = null;
      this.currentProduct = null;
      this.platform = null;
      this.history = [];
      
      this.init();
    }

    async init() {
      await this.loadStoredData();
      this.detectPlatform();
      
      if (this.platform) {
        this.injectStyles();
        this.createUI();
        this.bindEvents();
        this.detectProduct();
        this.injectListingButtons();
        
        // Show page badge
        this.showPageBadge();
      }
    }

    async loadStoredData() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['extensionToken', 'importHistory'], (result) => {
            this.token = result.extensionToken;
            this.history = result.importHistory || [];
            this.isConnected = !!this.token;
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    detectPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      
      for (const [key, platform] of Object.entries(CONFIG.SUPPORTED_PLATFORMS)) {
        if (hostname.includes(key)) {
          this.platform = { key, ...platform };
          return;
        }
      }
      
      // Check for Shopify/WooCommerce
      if (document.querySelector('meta[name="generator"][content*="Shopify"]')) {
        this.platform = { key: 'shopify', name: 'Shopify', icon: '🛍️', color: '#96bf48' };
      } else if (document.querySelector('meta[name="generator"][content*="WooCommerce"]')) {
        this.platform = { key: 'woocommerce', name: 'WooCommerce', icon: '🛒', color: '#96588a' };
      }
    }

    injectStyles() {
      if (document.querySelector('#dc-sidebar-styles')) return;
      
      const link = document.createElement('link');
      link.id = 'dc-sidebar-styles';
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('sidebar.css');
      document.head.appendChild(link);
    }

    createUI() {
      // Remove existing UI
      document.querySelectorAll('.dc-sidebar, .dc-toggle-fab, .dc-page-badge, .dc-toast-container').forEach(el => el.remove());
      
      // Create sidebar
      this.sidebar = document.createElement('div');
      this.sidebar.className = 'dc-sidebar';
      this.sidebar.innerHTML = this.getSidebarHTML();
      document.body.appendChild(this.sidebar);
      
      // Create FAB
      this.fab = document.createElement('button');
      this.fab.className = 'dc-toggle-fab';
      this.fab.innerHTML = '<span class="dc-fab-icon">🚀</span>';
      document.body.appendChild(this.fab);
      
      // Create toast container
      this.toastContainer = document.createElement('div');
      this.toastContainer.className = 'dc-toast-container';
      document.body.appendChild(this.toastContainer);
    }

    getSidebarHTML() {
      return `
        <!-- Header -->
        <div class="dc-sidebar-header">
          <div class="dc-sidebar-logo">
            <div class="dc-sidebar-logo-icon">🚀</div>
            <div class="dc-sidebar-logo-text">Drop Craft <span>AI</span></div>
          </div>
          <div class="dc-sidebar-actions">
            <button class="dc-icon-btn" id="dc-refresh-btn" title="Rafraîchir">🔄</button>
            <button class="dc-icon-btn" id="dc-settings-btn" title="Paramètres">⚙️</button>
            <button class="dc-icon-btn" id="dc-close-btn" title="Fermer">✕</button>
          </div>
        </div>
        
        <!-- Connection Bar -->
        <div class="dc-connection-bar ${this.isConnected ? 'connected' : ''}" id="dc-connection-bar">
          <div class="dc-connection-status">
            <span class="dc-status-dot"></span>
            <span class="dc-status-text">${this.isConnected ? 'Connecté' : 'Non connecté'}</span>
          </div>
          <button class="dc-connect-btn" id="dc-connect-btn">${this.isConnected ? 'Déconnecter' : 'Connecter'}</button>
        </div>
        
        <!-- Content -->
        <div class="dc-sidebar-content" id="dc-content">
          ${this.isConnected ? this.getMainContent() : this.getAuthContent()}
        </div>
      `;
    }

    getAuthContent() {
      return `
        <div class="dc-auth-panel">
          <div class="dc-auth-icon">🔐</div>
          <h2 class="dc-auth-title">Bienvenue sur Drop Craft AI</h2>
          <p class="dc-auth-subtitle">Connectez-vous pour importer des produits en 1 clic</p>
          <input type="text" class="dc-auth-input" id="dc-token-input" placeholder="Entrez votre clé d'extension">
          <button class="dc-auth-btn" id="dc-auth-btn">Se connecter</button>
          <a href="${CONFIG.APP_URL}/extensions/chrome" target="_blank" class="dc-auth-link">
            ℹ️ Où trouver ma clé ?
          </a>
        </div>
      `;
    }

    getMainContent() {
      return `
        <!-- Product Card (if detected) -->
        <div id="dc-product-container"></div>
        
        <!-- Actions Grid -->
        <div class="dc-actions-grid">
          <button class="dc-action-btn dc-action-btn-primary" id="dc-import-btn">
            <span class="dc-action-icon">🚀</span>
            <span class="dc-action-text">Importer le produit</span>
            <span class="dc-action-subtext">Import 1-Click</span>
          </button>
          <button class="dc-action-btn dc-action-btn-secondary" id="dc-reviews-btn">
            <span class="dc-action-icon">⭐</span>
            <span class="dc-action-text">Avis</span>
          </button>
          <button class="dc-action-btn dc-action-btn-secondary" id="dc-monitor-btn">
            <span class="dc-action-icon">📊</span>
            <span class="dc-action-text">Surveiller</span>
          </button>
        </div>
        
        <!-- Tabs -->
        <div class="dc-tabs">
          <button class="dc-tab active" data-tab="details">📋 Détails</button>
          <button class="dc-tab" data-tab="profit">💰 Profit</button>
          <button class="dc-tab" data-tab="history">📜 Historique</button>
        </div>
        
        <!-- Details Tab -->
        <div class="dc-tab-panel active" id="dc-tab-details">
          <div id="dc-variants-container"></div>
          <div id="dc-specs-container"></div>
        </div>
        
        <!-- Profit Tab -->
        <div class="dc-tab-panel" id="dc-tab-profit">
          ${this.getProfitCalculatorHTML()}
        </div>
        
        <!-- History Tab -->
        <div class="dc-tab-panel" id="dc-tab-history">
          ${this.getHistoryHTML()}
        </div>
      `;
    }

    getProfitCalculatorHTML() {
      return `
        <div class="dc-profit-calculator">
          <div class="dc-profit-header">
            <span class="dc-profit-title">💰 Calculateur de Profit</span>
          </div>
          <div class="dc-profit-inputs">
            <div class="dc-profit-input-group">
              <label class="dc-profit-label">Prix d'achat (€)</label>
              <input type="number" class="dc-profit-input" id="dc-cost-price" value="0" step="0.01">
            </div>
            <div class="dc-profit-input-group">
              <label class="dc-profit-label">Prix de vente (€)</label>
              <input type="number" class="dc-profit-input" id="dc-sell-price" value="0" step="0.01">
            </div>
            <div class="dc-profit-input-group">
              <label class="dc-profit-label">Livraison (€)</label>
              <input type="number" class="dc-profit-input" id="dc-shipping" value="0" step="0.01">
            </div>
            <div class="dc-profit-input-group">
              <label class="dc-profit-label">Frais (%)</label>
              <input type="number" class="dc-profit-input" id="dc-fees" value="2.9" step="0.1">
            </div>
          </div>
          <div class="dc-profit-results">
            <div class="dc-profit-result">
              <div class="dc-profit-result-value" id="dc-profit-value">0.00€</div>
              <div class="dc-profit-result-label">Profit</div>
            </div>
            <div class="dc-profit-result">
              <div class="dc-profit-result-value" id="dc-margin-value">0%</div>
              <div class="dc-profit-result-label">Marge</div>
            </div>
            <div class="dc-profit-result">
              <div class="dc-profit-result-value" id="dc-roi-value">0%</div>
              <div class="dc-profit-result-label">ROI</div>
            </div>
          </div>
        </div>
      `;
    }

    getHistoryHTML() {
      if (this.history.length === 0) {
        return `
          <div class="dc-loading">
            <span style="font-size: 40px;">📭</span>
            <span class="dc-loading-text">Aucun import récent</span>
          </div>
        `;
      }
      
      return `
        <div class="dc-history-section">
          <div class="dc-section-header">
            <span class="dc-section-title">Imports récents</span>
            <button class="dc-section-action" id="dc-clear-history">Effacer</button>
          </div>
          <div class="dc-history-list">
            ${this.history.slice(0, 5).map(item => `
              <div class="dc-history-item">
                <img src="${item.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="55" font-size="40" text-anchor="middle" fill="%2364748b">📦</text></svg>'}" class="dc-history-image" alt="">
                <div class="dc-history-info">
                  <div class="dc-history-title">${item.name || 'Produit importé'}</div>
                  <div class="dc-history-meta">
                    <span>${item.platform || 'Unknown'}</span>
                    <span>•</span>
                    <span>${this.formatTime(item.timestamp)}</span>
                  </div>
                </div>
                <span class="dc-history-status success">✓</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    formatTime(timestamp) {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);
      
      if (diff < 60) return 'À l\'instant';
      if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
      if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
      return date.toLocaleDateString('fr-FR');
    }

    showPageBadge() {
      const badge = document.createElement('div');
      badge.className = 'dc-page-badge';
      badge.innerHTML = `
        <span class="dc-page-badge-dot"></span>
        <span>${this.platform.icon} ${this.platform.name} détecté</span>
      `;
      badge.onclick = () => this.toggle();
      document.body.appendChild(badge);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        badge.style.opacity = '0.6';
      }, 5000);
    }

    bindEvents() {
      // FAB
      this.fab.onclick = () => this.toggle();
      
      // Close button
      this.sidebar.querySelector('#dc-close-btn')?.addEventListener('click', () => this.close());
      
      // Refresh button
      this.sidebar.querySelector('#dc-refresh-btn')?.addEventListener('click', () => this.detectProduct());
      
      // Settings button
      this.sidebar.querySelector('#dc-settings-btn')?.addEventListener('click', () => {
        window.open(`${CONFIG.APP_URL}/extensions/chrome`, '_blank');
      });
      
      // Connect button
      this.sidebar.querySelector('#dc-connect-btn')?.addEventListener('click', () => {
        if (this.isConnected) {
          this.disconnect();
        } else {
          this.showAuthPanel();
        }
      });
      
      // Auth button
      this.sidebar.querySelector('#dc-auth-btn')?.addEventListener('click', () => this.authenticate());
      
      // Import button
      this.sidebar.querySelector('#dc-import-btn')?.addEventListener('click', () => this.importProduct());
      
      // Reviews button
      this.sidebar.querySelector('#dc-reviews-btn')?.addEventListener('click', () => this.importReviews());
      
      // Monitor button
      this.sidebar.querySelector('#dc-monitor-btn')?.addEventListener('click', () => this.startMonitoring());
      
      // Tabs
      this.sidebar.querySelectorAll('.dc-tab').forEach(tab => {
        tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
      });
      
      // Profit calculator
      ['dc-cost-price', 'dc-sell-price', 'dc-shipping', 'dc-fees'].forEach(id => {
        this.sidebar.querySelector(`#${id}`)?.addEventListener('input', () => this.calculateProfit());
      });
      
      // Clear history
      this.sidebar.querySelector('#dc-clear-history')?.addEventListener('click', () => this.clearHistory());
      
      // Enter key on token input
      this.sidebar.querySelector('#dc-token-input')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.authenticate();
      });
    }

    toggle() {
      this.isOpen ? this.close() : this.open();
    }

    open() {
      this.isOpen = true;
      this.sidebar.classList.add('open');
      this.fab.classList.add('active');
      
      // Refresh product detection
      this.detectProduct();
    }

    close() {
      this.isOpen = false;
      this.sidebar.classList.remove('open');
      this.fab.classList.remove('active');
    }

    showAuthPanel() {
      const content = this.sidebar.querySelector('#dc-content');
      if (content) {
        content.innerHTML = this.getAuthContent();
        this.bindEvents();
      }
    }

    async authenticate() {
      const input = this.sidebar.querySelector('#dc-token-input');
      const token = input?.value.trim();
      
      if (!token) {
        this.showToast('Veuillez entrer votre clé d\'extension', 'warning');
        return;
      }
      
      this.showToast('Connexion en cours...', 'info');
      
      try {
        const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify({ action: 'sync_status' })
        });
        
        if (response.ok) {
          this.token = token;
          this.isConnected = true;
          
          // Save token
          if (chrome.storage) {
            chrome.storage.local.set({ extensionToken: token });
          }
          
          this.showToast('Connexion réussie!', 'success');
          
          // Update UI
          const content = this.sidebar.querySelector('#dc-content');
          const connectionBar = this.sidebar.querySelector('#dc-connection-bar');
          
          if (content) {
            content.innerHTML = this.getMainContent();
            this.bindEvents();
            this.detectProduct();
          }
          
          if (connectionBar) {
            connectionBar.classList.add('connected');
            connectionBar.querySelector('.dc-status-text').textContent = 'Connecté';
            connectionBar.querySelector('.dc-connect-btn').textContent = 'Déconnecter';
          }
        } else {
          throw new Error('Token invalide');
        }
      } catch (error) {
        this.showToast('Erreur: Token invalide', 'error');
      }
    }

    disconnect() {
      this.token = null;
      this.isConnected = false;
      
      if (chrome.storage) {
        chrome.storage.local.remove(['extensionToken']);
      }
      
      const content = this.sidebar.querySelector('#dc-content');
      const connectionBar = this.sidebar.querySelector('#dc-connection-bar');
      
      if (content) {
        content.innerHTML = this.getAuthContent();
        this.bindEvents();
      }
      
      if (connectionBar) {
        connectionBar.classList.remove('connected');
        connectionBar.querySelector('.dc-status-text').textContent = 'Non connecté';
        connectionBar.querySelector('.dc-connect-btn').textContent = 'Connecter';
      }
      
      this.showToast('Déconnecté', 'info');
    }

    switchTab(tabId) {
      // Update tab buttons
      this.sidebar.querySelectorAll('.dc-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
      });
      
      // Update panels
      this.sidebar.querySelectorAll('.dc-tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `dc-tab-${tabId}`);
      });
    }

    async detectProduct() {
      const container = this.sidebar.querySelector('#dc-product-container');
      if (!container) return;
      
      container.innerHTML = `
        <div class="dc-loading">
          <div class="dc-spinner"></div>
          <span class="dc-loading-text">Détection du produit...</span>
        </div>
      `;
      
      try {
        const product = await this.extractProductData();
        this.currentProduct = product;
        
        if (product && product.name) {
          container.innerHTML = this.getProductCardHTML(product);
          this.updateProfitCalculator(product);
        } else {
          container.innerHTML = `
            <div class="dc-loading">
              <span style="font-size: 40px;">🔍</span>
              <span class="dc-loading-text">Naviguez vers une page produit</span>
            </div>
          `;
        }
      } catch (error) {
        container.innerHTML = `
          <div class="dc-loading">
            <span style="font-size: 40px;">⚠️</span>
            <span class="dc-loading-text">Erreur de détection</span>
          </div>
        `;
      }
    }

    async extractProductData() {
      const platform = this.platform?.key;
      
      // Common selectors for different platforms
      const selectors = {
        title: [
          'h1', '.product-title', '#productTitle', '[data-testid="product-title"]',
          '.product-title-text', '.pdp-mod-product-badge-title'
        ],
        price: [
          '.price', '[class*="price"]', '.product-price', '[data-testid*="price"]',
          '.a-price-current', '.pdp-price'
        ],
        originalPrice: [
          '.original-price', '[class*="original"]', '.price-original',
          '.a-price-regular', '.price-del'
        ],
        image: [
          'img[src*="product"]', '.product-image img', '#landingImage',
          '.main-image img', '[data-testid="product-image"] img',
          'img[alt*="product"]', '.pdp-mod-image-gallery img'
        ],
        rating: [
          '.rating', '[class*="rating"]', '.star-rating', '.a-icon-star'
        ],
        reviews: [
          '.reviews', '[class*="review"]', '#acrCustomerReviewText'
        ],
        orders: [
          '[class*="order"]', '[class*="sold"]', '.product-sold'
        ]
      };
      
      const getText = (selectorList) => {
        for (const selector of selectorList) {
          const el = document.querySelector(selector);
          if (el?.textContent?.trim()) return el.textContent.trim();
        }
        return '';
      };
      
      const getImage = (selectorList) => {
        for (const selector of selectorList) {
          const el = document.querySelector(selector);
          if (el?.src) return el.src;
          if (el?.dataset?.src) return el.dataset.src;
        }
        return '';
      };
      
      const getPrice = (selectorList) => {
        const text = getText(selectorList);
        const match = text.match(/[\d,.\s]+/);
        if (match) {
          return parseFloat(match[0].replace(/[,\s]/g, '.').replace(/\.(?=.*\.)/g, ''));
        }
        return 0;
      };
      
      const getRating = () => {
        const text = getText(selectors.rating);
        const match = text.match(/(\d+[.,]?\d*)/);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
      };
      
      const title = getText(selectors.title);
      const price = getPrice(selectors.price);
      const originalPrice = getPrice(selectors.originalPrice);
      const image = getImage(selectors.image);
      const rating = getRating();
      const orders = getText(selectors.orders);
      
      if (!title) return null;
      
      return {
        name: title,
        price: price,
        originalPrice: originalPrice > price ? originalPrice : null,
        discount: originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : null,
        image: image,
        rating: rating,
        orders: orders,
        url: window.location.href,
        platform: this.platform?.name,
        platformKey: this.platform?.key
      };
    }

    getProductCardHTML(product) {
      const discount = product.discount ? `
        <span class="dc-badge dc-badge-discount">-${product.discount}%</span>
      ` : '';
      
      const originalPrice = product.originalPrice ? `
        <span class="dc-price-original">${product.originalPrice.toFixed(2)}€</span>
        <span class="dc-price-discount">-${product.discount}%</span>
      ` : '';
      
      return `
        <div class="dc-product-card">
          <div class="dc-product-image-container">
            <img src="${product.image || ''}" alt="${product.name}" class="dc-product-image" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23334155%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 font-size=%2240%22 text-anchor=%22middle%22 fill=%22%2364748b%22>📦</text></svg>'">
            <div class="dc-product-badges">
              <span class="dc-badge dc-badge-platform">${this.platform?.icon} ${this.platform?.name}</span>
              ${discount}
            </div>
            <div class="dc-product-quick-actions">
              <button class="dc-quick-action" title="Ajouter aux favoris">❤️</button>
              <button class="dc-quick-action" title="Comparer">🔄</button>
              <button class="dc-quick-action" title="Partager">📤</button>
            </div>
          </div>
          <div class="dc-product-info">
            <h3 class="dc-product-title">${product.name}</h3>
            <div class="dc-product-meta">
              ${product.rating ? `<span class="dc-product-rating">⭐ ${product.rating}</span>` : ''}
              ${product.orders ? `<span class="dc-product-orders">${product.orders}</span>` : ''}
              <span class="dc-product-shipping">🚚 Livraison</span>
            </div>
            <div class="dc-price-row">
              <span class="dc-price-current">${product.price ? product.price.toFixed(2) + '€' : 'Prix non détecté'}</span>
              ${originalPrice}
            </div>
          </div>
        </div>
      `;
    }

    updateProfitCalculator(product) {
      const costInput = this.sidebar.querySelector('#dc-cost-price');
      if (costInput && product.price) {
        costInput.value = product.price.toFixed(2);
        
        // Auto-calculate sell price with 30% margin
        const sellInput = this.sidebar.querySelector('#dc-sell-price');
        if (sellInput) {
          sellInput.value = (product.price * 1.5).toFixed(2);
        }
        
        this.calculateProfit();
      }
    }

    calculateProfit() {
      const costPrice = parseFloat(this.sidebar.querySelector('#dc-cost-price')?.value || 0);
      const sellPrice = parseFloat(this.sidebar.querySelector('#dc-sell-price')?.value || 0);
      const shipping = parseFloat(this.sidebar.querySelector('#dc-shipping')?.value || 0);
      const feesPercent = parseFloat(this.sidebar.querySelector('#dc-fees')?.value || 0);
      
      const fees = sellPrice * (feesPercent / 100);
      const totalCost = costPrice + shipping + fees;
      const profit = sellPrice - totalCost;
      const margin = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;
      
      const profitEl = this.sidebar.querySelector('#dc-profit-value');
      const marginEl = this.sidebar.querySelector('#dc-margin-value');
      const roiEl = this.sidebar.querySelector('#dc-roi-value');
      
      if (profitEl) {
        profitEl.textContent = `${profit.toFixed(2)}€`;
        profitEl.classList.toggle('negative', profit < 0);
      }
      if (marginEl) {
        marginEl.textContent = `${margin.toFixed(1)}%`;
        marginEl.classList.toggle('negative', margin < 0);
      }
      if (roiEl) {
        roiEl.textContent = `${roi.toFixed(1)}%`;
        roiEl.classList.toggle('negative', roi < 0);
      }
    }

    async importProduct() {
      if (!this.isConnected) {
        this.showToast('Veuillez vous connecter d\'abord', 'warning');
        return;
      }
      
      if (!this.currentProduct) {
        this.showToast('Aucun produit détecté', 'warning');
        return;
      }
      
      this.showToast('Import en cours...', 'info');
      
      try {
        const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.token
          },
          body: JSON.stringify({
            action: 'import_products',
            products: [{
              title: this.currentProduct.name,
              name: this.currentProduct.name,
              price: this.currentProduct.price,
              image: this.currentProduct.image,
              url: this.currentProduct.url,
              source: 'chrome_extension',
              platform: this.currentProduct.platformKey
            }]
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.imported > 0) {
          this.showToast(`✅ ${this.currentProduct.name.substring(0, 30)}... importé!`, 'success');
          
          // Add to history
          this.addToHistory(this.currentProduct);
        } else {
          throw new Error(result.error || 'Erreur d\'import');
        }
      } catch (error) {
        console.error('Import error:', error);
        this.showToast(`❌ ${error.message}`, 'error');
      }
    }

    addToHistory(product) {
      this.history.unshift({
        name: product.name,
        image: product.image,
        platform: product.platform,
        timestamp: new Date().toISOString()
      });
      
      this.history = this.history.slice(0, 20);
      
      if (chrome.storage) {
        chrome.storage.local.set({ importHistory: this.history });
      }
      
      // Update history tab
      const historyPanel = this.sidebar.querySelector('#dc-tab-history');
      if (historyPanel) {
        historyPanel.innerHTML = this.getHistoryHTML();
        this.bindEvents();
      }
    }

    clearHistory() {
      this.history = [];
      if (chrome.storage) {
        chrome.storage.local.set({ importHistory: [] });
      }
      
      const historyPanel = this.sidebar.querySelector('#dc-tab-history');
      if (historyPanel) {
        historyPanel.innerHTML = this.getHistoryHTML();
      }
      
      this.showToast('Historique effacé', 'success');
    }

    async importReviews() {
      this.showToast('Import des avis... (Bientôt disponible)', 'info');
    }

    async startMonitoring() {
      this.showToast('Surveillance activée! (Bientôt disponible)', 'success');
    }

    injectListingButtons() {
      // Selectors for product cards on listing pages
      const listingSelectors = [
        '[data-component-type="s-search-result"]', // Amazon
        '.s-item', // eBay
        '.product-item', '.goods-item', '[data-testid="product-card"]', // Various
        '.list-item', '.product-card', // Common
        '.search-card-item', '.product-snippet' // AliExpress
      ];
      
      let productCards = [];
      
      for (const selector of listingSelectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          productCards = Array.from(elements);
          break;
        }
      }
      
      productCards.forEach(card => {
        if (card.querySelector('.dc-listing-btn')) return;
        
        // Make container relative if needed
        const computedStyle = window.getComputedStyle(card);
        if (computedStyle.position === 'static') {
          card.style.position = 'relative';
        }
        
        const btn = document.createElement('button');
        btn.className = 'dc-listing-btn';
        btn.innerHTML = '+ Import';
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.importFromCard(card);
        };
        
        card.appendChild(btn);
      });
      
      // Observe for new products
      const observer = new MutationObserver(() => {
        this.injectListingButtons();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    async importFromCard(card) {
      // Find link
      const link = card.querySelector('a[href*="/"]');
      const url = link?.href || window.location.href;
      
      this.showToast('Import en cours...', 'info');
      
      try {
        const response = await fetch(`${CONFIG.API_URL}/product-url-scraper`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.token && { 'x-extension-token': this.token })
          },
          body: JSON.stringify({ url })
        });
        
        const result = await response.json();
        
        if (result.success) {
          this.showToast('✅ Produit importé!', 'success');
        } else {
          throw new Error(result.error || 'Erreur');
        }
      } catch (error) {
        this.showToast(`❌ ${error.message}`, 'error');
      }
    }

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `dc-toast ${type}`;
      toast.innerHTML = `
        <span>${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
        <span>${message}</span>
      `;
      
      this.toastContainer.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  // Initialize
  new DropCraftSidebar();
})();
