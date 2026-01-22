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
      // Major International
      'aliexpress': { name: 'AliExpress', icon: '🛒', color: '#ff6a00' },
      'amazon': { name: 'Amazon', icon: '📦', color: '#ff9900' },
      'ebay': { name: 'eBay', icon: '🏷️', color: '#e53238' },
      'temu': { name: 'Temu', icon: '🎁', color: '#f97316' },
      'walmart': { name: 'Walmart', icon: '🏪', color: '#0071ce' },
      'etsy': { name: 'Etsy', icon: '🎨', color: '#f56400' },
      'wish': { name: 'Wish', icon: '⭐', color: '#2fb7ec' },
      // French Marketplaces
      'cdiscount': { name: 'Cdiscount', icon: '🇫🇷', color: '#00a0e3' },
      'fnac': { name: 'Fnac', icon: '📀', color: '#e1a400' },
      'rakuten': { name: 'Rakuten', icon: '🛍️', color: '#bf0000' },
      'darty': { name: 'Darty', icon: '⚡', color: '#e30613' },
      'boulanger': { name: 'Boulanger', icon: '🔌', color: '#004a9f' },
      'manomano': { name: 'ManoMano', icon: '🔧', color: '#00c7b7' },
      'leroymerlin': { name: 'Leroy Merlin', icon: '🏠', color: '#78be20' },
      // US Home Improvement
      'homedepot': { name: 'Home Depot', icon: '🏠', color: '#f96302' },
      'lowes': { name: 'Lowes', icon: '🔨', color: '#004990' },
      'costco': { name: 'Costco', icon: '🏬', color: '#e31837' },
      // Fashion
      'shein': { name: 'Shein', icon: '👗', color: '#000' },
      'asos': { name: 'ASOS', icon: '👔', color: '#2d2d2d' },
      'zalando': { name: 'Zalando', icon: '👟', color: '#ff6900' },
      // Asian Suppliers
      'banggood': { name: 'Banggood', icon: '📱', color: '#ff6600' },
      'dhgate': { name: 'DHgate', icon: '🏭', color: '#e54d00' },
      'cjdropshipping': { name: 'CJ', icon: '📦', color: '#1a73e8' },
      '1688': { name: '1688', icon: '🏭', color: '#ff6600' },
      'taobao': { name: 'Taobao', icon: '🛍️', color: '#ff4400' }
    }
  };

  // ---- CSP-safe network layer (page context -> content script -> background fetch) ----
  const DC_RPC_TIMEOUT_MS = 20000;

  const dcFetchJson = async (url, options) => {
    const normalizeOptions = (opts) => {
      const safe = { ...(opts || {}) };
      // Ensure headers are plain objects
      safe.headers = { ...(safe.headers || {}) };
      return safe;
    };

    // 1) Try direct fetch (works on sites without restrictive connect-src)
    try {
      const res = await fetch(url, normalizeOptions(options));
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : await res.text();
      return { ok: res.ok, status: res.status, data, via: 'direct' };
    } catch (err) {
      // fall through to RPC
      console.warn('[DropCraft] Direct fetch failed, falling back to background proxy', err);
    }

    // 2) RPC to content script (which calls background.js FETCH_API)
    const requestId = `dc_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const payload = { type: 'DC_FETCH_API', requestId, url, options: normalizeOptions(options) };

    const result = await new Promise((resolve) => {
      let done = false;

      const timeout = setTimeout(() => {
        if (done) return;
        done = true;
        window.removeEventListener('message', onMessage);
        resolve({ success: false, status: 0, error: 'Timeout proxy réseau (CSP?)' });
      }, DC_RPC_TIMEOUT_MS);

      const onMessage = (event) => {
        if (event.source !== window) return;
        const data = event.data;
        if (!data || data.type !== 'DC_FETCH_API_RESULT' || data.requestId !== requestId) return;
        if (done) return;
        done = true;
        clearTimeout(timeout);
        window.removeEventListener('message', onMessage);
        resolve(data);
      };

      window.addEventListener('message', onMessage);
      window.postMessage(payload, '*');
    });

    return {
      ok: Boolean(result.success),
      status: result.status || 0,
      data: result.data,
      error: result.error,
      via: 'proxy',
    };
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
        this.injectProductPageButton();
        
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

      // Listen for dynamic content events from content.js
      window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        
        if (event.data.type === 'DC_RESCAN_PRODUCTS') {
          console.log('[Sidebar] Re-scanning products after DOM change');
          this.detectProduct();
          this.injectListingButtons();
        }
        
        if (event.data.type === 'DC_URL_CHANGED') {
          console.log('[Sidebar] URL changed, re-initializing');
          this.detectPlatform();
          this.detectProduct();
          this.injectListingButtons();
          this.injectProductPageButton();
        }
        
        if (event.data.type === 'DC_REVIEWS_IN_VIEW') {
          console.log('[Sidebar] Reviews section in view');
          // Could trigger auto-extract here if desired
        }
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
        const res = await dcFetchJson(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token,
          },
          body: JSON.stringify({ action: 'sync_status' }),
        });

        if (res.ok) {
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
          const message = res?.data?.error || res?.error || 'Token invalide';
          throw new Error(message);
        }
      } catch (error) {
        this.showToast(`Erreur: ${error.message || 'Token invalide'}`, 'error');
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
      
      // Platform-specific selectors
      const platformSelectors = {
        aliexpress: {
          title: ['.product-title-text', 'h1', '[data-pl="product-title"]', '.title--wrap--UUHae_g h1'],
          price: ['.product-price-value', '.price-current', '.price--currentPriceText--V8_y_b5', '[data-pl="product-price"]'],
          originalPrice: ['.price-original', '.price-del', '.price--originalText--gxVO5_d'],
          images: ['.slider--slide--K6MIH9z img', '.image-view-magnifier-wrap img', '.images-view-wrap img', '.product-image img', 'img[src*="ae0"]', '.pdp-slide img'],
          rating: ['.product-reviewer-reviews .average-star', '.reviewer--rating--xrWWFzx'],
          orders: ['[class*="sold"]', '.reviewer--sold--ytPeoEy', '[class*="order"]'],
          description: ['.product-description', '.description--wrap--sP5e4IW', '.detail-desc-decorate-richtext', '#product-description'],
          videos: ['video source', 'video[src]', '[data-video-url]']
        },
        amazon: {
          title: ['#productTitle', '#title span', 'h1.a-size-large'],
          price: ['.a-price .a-offscreen', '#priceblock_ourprice', '#priceblock_dealprice', '.a-price-whole', '#corePrice_feature_div .a-offscreen'],
          originalPrice: ['.a-text-price .a-offscreen', '.priceBlockStrikePriceString'],
          images: ['#altImages img', '.imageThumbnail img', '#imageBlock img', '#landingImage', '.imgTagWrapper img', '.a-dynamic-image'],
          rating: ['#acrPopover', '.a-icon-star-small span', '#averageCustomerReviews span.a-icon-alt'],
          orders: ['#acrCustomerReviewText'],
          description: ['#productDescription', '#feature-bullets', '#aplus-content', '.a-expander-content'],
          videos: ['video source', '.vse-player video']
        },
        temu: {
          // Temu uses obfuscated classes - use robust selectors
          title: [
            'h1', 
            '[data-testid*="title"]', 
            '[class*="ProductTitle"]', 
            '[class*="goods-title"]',
            '[class*="product-name"]',
            '[class*="GoodsDetail"] h1',
            '.goods-details h1',
            'main h1',
            '[class*="title_"] h1',
            '[class*="Title_"]'
          ],
          price: [
            '[data-testid*="price"]',
            '[class*="price"]', 
            '[class*="Price"]',
            '[class*="goods-price"]',
            '[class*="salePrice"]',
            'span[class*="price"]',
            '[class*="amount"]',
            '[class*="Amount"]'
          ],
          originalPrice: [
            '[data-testid*="original"]',
            '[class*="original"]', 
            '[class*="Origin"]',
            '[class*="crossed"]',
            '[class*="strikethrough"]',
            'del[class*="price"]',
            's[class*="price"]'
          ],
          images: [
            '[class*="gallery"] img', 
            '[class*="Gallery"] img',
            '[class*="main-image"] img', 
            '[class*="MainImage"] img',
            '[class*="product-image"] img',
            '[class*="ProductImage"] img',
            '[class*="goods-img"] img',
            'img[src*="temu"]',
            'img[src*="kwcdn"]',
            'img[src*="kwimgs"]',
            '[class*="carousel"] img',
            '[class*="Carousel"] img',
            '[class*="swiper"] img',
            '[class*="Swiper"] img',
            '[class*="slider"] img',
            '[class*="Slider"] img',
            'main img[src*="http"]'
          ],
          rating: [
            '[class*="rating"]', 
            '[class*="Rating"]',
            '[class*="star"]',
            '[class*="Star"]',
            '[class*="review-score"]',
            '[class*="score"]'
          ],
          orders: [
            '[class*="sold"]', 
            '[class*="Sold"]',
            '[class*="order"]',
            '[class*="Order"]',
            '[class*="bought"]',
            '[class*="purchase"]'
          ],
          description: [
            '[class*="description"]', 
            '[class*="Description"]',
            '[class*="desc"]', 
            '[class*="Desc"]',
            '[class*="detail"]',
            '[class*="Detail"]',
            '[class*="spec"]',
            '[class*="Spec"]',
            '[class*="info"]',
            '[class*="Info"]'
          ],
          videos: [
            'video source', 
            'video[src]',
            '[class*="video"] video',
            '[class*="Video"] video'
          ]
        },
        ebay: {
          title: ['h1.x-item-title__mainTitle', '#itemTitle', 'h1[itemprop="name"]'],
          price: ['#prcIsum', '.x-price-primary span', '[itemprop="price"]', '.x-bin-price__content span'],
          originalPrice: ['.x-additional-info__textual-display', '.vi-originalPrice'],
          images: ['#vi_main_img_fs_thImg img', '.ux-image-carousel-item img', '#icImg', 'img[itemprop="image"]'],
          rating: ['.ebay-review-start-rating', '[class*="star-rating"]'],
          orders: ['[class*="sold"]', '.x-quantity__availability'],
          description: ['#desc_ifr', '.item-description', '#viTabs_0_is'],
          videos: ['video source', 'video[src]']
        },
        walmart: {
          title: ['h1[itemprop="name"]', 'h1.prod-ProductTitle', 'h1'],
          price: ['[itemprop="price"]', '.price-characteristic', '.price span'],
          images: ['[data-testid="hero-image-container"] img', '.hover-zoom-hero-image img', '.carousel-thumbnail img'],
          rating: ['[itemprop="ratingValue"]', '.stars-reviews-count-node'],
          orders: ['[class*="sold"]'],
          description: ['[data-testid="product-description"]', '.about-product-description'],
          videos: ['video source', 'video[src]']
        },
        etsy: {
          title: ['h1[data-buy-box-listing-title]', 'h1', '.wt-text-body-01'],
          price: ['[data-buy-box-region="price"] span', '.wt-text-title-03', '[class*="price"]'],
          originalPrice: ['.wt-text-strikethrough'],
          images: ['[data-image-carousel] img', '.carousel-image img', '.image-carousel-container img', 'img[data-index]'],
          rating: ['.wt-icon-star', '[class*="rating"]'],
          orders: ['[class*="sold"]', '.wt-text-body-02'],
          description: ['#description-text', '.wt-content-toggle__body', '#listing-page-description'],
          videos: ['video source', 'video[src]']
        },
        // French Marketplaces
        cdiscount: {
          title: ['h1[itemprop="name"]', '.fpDesCol h1', '[data-testid="product-title"]', '.prdtTit', '.product-title'],
          price: ['[itemprop="price"]', '.fpPrice .price', '[data-testid="price"]', '.prdtPrice', '.product-price'],
          originalPrice: ['.fpPriBrut', '.oldPrice', '[class*="crossed"]', '.prdtPriceOld'],
          images: ['#fpImgMain img', '.fpMainImg img', '.prdtImg img', '.fpMedia img', 'img[src*="cdscdn"]'],
          rating: ['[itemprop="ratingValue"]', '.fpRating', '[data-testid="rating"]'],
          orders: [],
          description: ['[itemprop="description"]', '.fpDescTxt', '[data-testid="description"]', '.prdtDesc'],
          videos: ['video source', 'video[src]', 'iframe[src*="youtube"]']
        },
        fnac: {
          title: ['h1.f-productHeader-Title', '.Article-desc', '.product-title', 'h1'],
          price: ['.f-priceBox-price', '.userPrice', '.price', '[class*="price"]'],
          originalPrice: ['.f-priceBox-oldPrice', '.oldPrice'],
          images: ['.f-productVisuals-mainImage img', '.Article-img', 'img[src*="static.fnac"]', '.product-image img'],
          rating: ['.f-rating', '.rating', '[class*="star"]'],
          orders: [],
          description: ['.f-productDetails-text', '.product-description', '.Article-txt'],
          videos: ['video source', 'video[src]']
        },
        rakuten: {
          title: ['.productTitle', '.product-name', 'h1', '.offer-title'],
          price: ['.productPrice', '.price', '.offer-price'],
          originalPrice: ['.oldPrice', '.crossed-price'],
          images: ['.productImage', 'img[src*="priceminister"]', '.product-gallery img', '.offer-image img'],
          rating: ['.rating', '[class*="star"]'],
          orders: [],
          description: ['.productDescription', '.description', '.product-info'],
          videos: ['video source', 'video[src]']
        },
        darty: {
          title: ['.product-title', 'h1', '.product-name'],
          price: ['.product-price', '.price', '[class*="price"]'],
          originalPrice: ['.old-price', '.crossed-price'],
          images: ['.product-image img', 'img[src*="darty"]', '.gallery img'],
          rating: ['.rating', '[class*="star"]'],
          orders: [],
          description: ['.product-description', '.description'],
          videos: ['video source', 'video[src]']
        },
        boulanger: {
          title: ['.product-title', 'h1', '.product-name'],
          price: ['.product-price', '.price', '[class*="price"]'],
          originalPrice: ['.old-price'],
          images: ['.product-image img', 'img[src*="boulanger"]', '.gallery img'],
          rating: ['.rating'],
          orders: [],
          description: ['.product-description'],
          videos: ['video source', 'video[src]']
        },
        manomano: {
          title: ['.product-title', 'h1', '.ProductTitle'],
          price: ['.price', '.ProductPrice', '[class*="price"]'],
          originalPrice: ['.old-price', '.crossed'],
          images: ['.product-image img', '.ProductImage img', '.gallery img'],
          rating: ['.rating', '.stars'],
          orders: [],
          description: ['.product-description', '.ProductDescription'],
          videos: ['video source', 'video[src]']
        },
        leroymerlin: {
          title: ['h1', '.product-title', '[class*="title"]'],
          price: ['.price', '[class*="price"]'],
          originalPrice: ['.old-price'],
          images: ['.product-image img', 'img[src*="leroymerlin"]', '.gallery img'],
          rating: ['.rating'],
          orders: [],
          description: ['.product-description'],
          videos: ['video source', 'video[src]']
        },
        // US Home Improvement
        homedepot: {
          title: ['.product-title__brand-name', 'h1', '.product-details__title'],
          price: ['.price', '.price-format__main-price', '[class*="price"]'],
          originalPrice: ['.price-format__was-price'],
          images: ['.mediagallery__mainimage img', '.product-image img', 'img[src*="homedepot"]'],
          rating: ['.ratings__stars', '.rating'],
          orders: [],
          description: ['.product-details__description', '.product-overview'],
          videos: ['video source', 'video[src]']
        },
        lowes: {
          title: ['h1', '.product-title', '[class*="title"]'],
          price: ['.price', '.product-price', '[class*="price"]'],
          originalPrice: ['.was-price'],
          images: ['.product-image img', 'img[src*="lowes"]', '.gallery img'],
          rating: ['.rating'],
          orders: [],
          description: ['.product-description'],
          videos: ['video source', 'video[src]']
        },
        costco: {
          title: ['h1', '.product-title', '.product-name'],
          price: ['.price', '[class*="price"]'],
          originalPrice: ['.was-price'],
          images: ['.product-image img', 'img[src*="costco"]', '.gallery img'],
          rating: ['.rating'],
          orders: [],
          description: ['.product-description'],
          videos: ['video source', 'video[src]']
        },
        // Asian Suppliers
        banggood: {
          title: ['.product-title', 'h1', '.goodsTitle'],
          price: ['.price', '.product-price', '.newPrice'],
          originalPrice: ['.oldPrice', '.crossed'],
          images: ['.product-image img', 'img[src*="banggood"]', '.gallery img'],
          rating: ['.rating', '.star'],
          orders: ['.sold', '.orders'],
          description: ['.product-description', '.description'],
          videos: ['video source', 'video[src]']
        },
        dhgate: {
          title: ['.product-title', 'h1'],
          price: ['.price', '.product-price'],
          originalPrice: ['.old-price'],
          images: ['.product-image img', 'img[src*="dhgate"]', '.gallery img'],
          rating: ['.rating'],
          orders: ['.sold'],
          description: ['.product-description'],
          videos: ['video source', 'video[src]']
        },
        shein: {
          title: ['.product-intro__head-name', 'h1', '.goods-title'],
          price: ['.product-intro__head-price', '.price', '.goods-price'],
          originalPrice: ['.del-price', '.old-price'],
          images: ['.product-intro__main-image img', '.goods-detail-bigImg img', 'img[src*="shein"]'],
          rating: ['.rate-star', '.rating'],
          orders: ['.sold'],
          description: ['.product-intro__description', '.goods-desc'],
          videos: ['video source', 'video[src]']
        },
        cjdropshipping: {
          title: ['.product-title', 'h1', '.goods-name'],
          price: ['.price', '.product-price'],
          originalPrice: ['.old-price'],
          images: ['.product-image img', 'img[src*="cjdropshipping"]', '.gallery img'],
          rating: ['.rating'],
          orders: [],
          description: ['.product-description'],
          videos: ['video source', 'video[src]']
        },
        wish: {
          title: ['.product-title', 'h1', '.ProductTitle'],
          price: ['.price', '.ProductPrice'],
          originalPrice: ['.original-price'],
          images: ['.product-image img', '.ProductImage img', '.gallery img'],
          rating: ['.rating', '.stars'],
          orders: ['.bought'],
          description: ['.product-description'],
          videos: ['video source', 'video[src]']
        }
      };
      
      // Get selectors for current platform or use generic
      const selectors = platformSelectors[platform] || {
        title: ['h1', '.product-title', '#productTitle', '[data-testid="product-title"]', '.product-title-text', '.pdp-mod-product-badge-title', '[itemprop="name"]'],
        price: ['.price', '[class*="price"]', '.product-price', '[data-testid*="price"]', '.a-price-current', '.pdp-price', '[itemprop="price"]'],
        originalPrice: ['.original-price', '[class*="original"]', '.price-original', '.a-price-regular', '.price-del'],
        images: ['img[src*="product"]', '.product-image img', '#landingImage', '.main-image img', '[data-testid="product-image"] img', 'img[alt*="product"]', '.pdp-mod-image-gallery img', '[itemprop="image"]', '.gallery img', '.thumbnail img'],
        rating: ['.rating', '[class*="rating"]', '.star-rating', '.a-icon-star', '[itemprop="ratingValue"]'],
        orders: ['[class*="order"]', '[class*="sold"]', '.product-sold'],
        description: ['.product-description', '#description', '.description', '[itemprop="description"]', '.detail-desc'],
        videos: ['video source', 'video[src]', '[data-video-url]', '.product-video video']
      };
      
      const getText = (selectorList) => {
        for (const selector of selectorList) {
          const el = document.querySelector(selector);
          if (el?.textContent?.trim()) {
            let text = el.textContent.trim();
            text = text.replace(/\s+/g, ' ').trim();
            return text;
          }
        }
        return '';
      };
      
      // Get ALL images from the page - comprehensive multi-platform extraction
      const getAllImages = (selectorList) => {
        const images = new Set();

        const parseSrcset = (srcset) => {
          if (!srcset || typeof srcset !== 'string') return [];
          return srcset
            .split(',')
            .map((part) => part.trim().split(/\s+/)[0])
            .filter(Boolean);
        };
        const platform = this.platform?.key || 'generic';
        
        console.log('[DropCraft] Starting image extraction for platform:', platform);

        // ===== 1. JSON-LD structured data (highest priority) =====
        try {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (const script of scripts) {
            try {
              const data = JSON.parse(script.textContent);
              const items = Array.isArray(data) ? data : [data];
              for (const item of items) {
                if (item['@type'] === 'Product' && item.image) {
                  const imgs = Array.isArray(item.image) ? item.image : [item.image];
                  imgs.forEach(img => {
                    const url = this.cleanImageUrl(typeof img === 'string' ? img : img.url);
                    if (this.isValidImageUrl(url)) images.add(url);
                  });
                }
              }
            } catch (e) {}
          }
        } catch (e) {}
        console.log('[DropCraft] After JSON-LD:', images.size, 'images');

        // ===== 2. Embedded JSON data extraction =====
        try {
          const allScripts = document.querySelectorAll('script:not([type]), script[type="text/javascript"]');
          for (const script of allScripts) {
            const content = script.textContent || '';
            
            // AliExpress patterns
            if (platform === 'aliexpress' || content.includes('alicdn') || content.includes('imagePathList')) {
              const patterns = [
                /"imageUrl"\s*:\s*"([^"]+)"/g,
                /"originalUrl"\s*:\s*"([^"]+)"/g,
                /"imgUrl"\s*:\s*"([^"]+)"/g,
                /"imageSrc"\s*:\s*"([^"]+)"/g
              ];
              
              for (const pattern of patterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                  const url = this.cleanImageUrl(match[1]);
                  if (this.isValidImageUrl(url)) images.add(url);
                }
              }
              
              // imagePathList array
              const pathListMatch = content.match(/"imagePathList"\s*:\s*\[([^\]]+)\]/);
              if (pathListMatch) {
                const paths = pathListMatch[1].match(/"([^"]+)"/g);
                if (paths) {
                  paths.forEach(p => {
                    let imgUrl = p.replace(/"/g, '');
                    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
                    const url = this.cleanImageUrl(imgUrl);
                    if (this.isValidImageUrl(url)) images.add(url);
                  });
                }
              }
            }
            
            // Amazon patterns
            if (platform === 'amazon' || content.includes('colorImages') || content.includes('ImageBlockATF')) {
              const hiResMatches = content.match(/"hiRes"\s*:\s*"([^"]+)"/g) || [];
              hiResMatches.forEach(m => {
                const urlMatch = m.match(/"hiRes"\s*:\s*"([^"]+)"/);
                if (urlMatch) {
                  const url = this.cleanImageUrl(urlMatch[1]);
                  if (this.isValidImageUrl(url)) images.add(url);
                }
              });
              
              const largeMatches = content.match(/"large"\s*:\s*"([^"]+)"/g) || [];
              largeMatches.forEach(m => {
                const urlMatch = m.match(/"large"\s*:\s*"([^"]+)"/);
                if (urlMatch) {
                  const url = this.cleanImageUrl(urlMatch[1]);
                  if (this.isValidImageUrl(url)) images.add(url);
                }
              });
            }
            
            // Shopify patterns
            if (platform === 'shopify' || content.includes('Shopify') || content.includes('product.variants')) {
              const shopifyMatches = content.match(/"src"\s*:\s*"(https?:\/\/[^"]+shopify[^"]+)"/g) || [];
              shopifyMatches.forEach(m => {
                const urlMatch = m.match(/"src"\s*:\s*"([^"]+)"/);
                if (urlMatch) {
                  const url = this.cleanImageUrl(urlMatch[1]);
                  if (this.isValidImageUrl(url)) images.add(url);
                }
              });
            }
            
            // Cdiscount patterns
            if (platform === 'cdiscount' || content.includes('cdiscount')) {
              const cdMatches = content.match(/"(https?:\/\/[^"]*cdnssl\.cdscdn[^"]+)"/g) || [];
              cdMatches.forEach(m => {
                const url = this.cleanImageUrl(m.replace(/"/g, ''));
                if (this.isValidImageUrl(url)) images.add(url);
              });
            }
            
            // Generic image URL patterns
            const genericMatches = content.match(/"(https?:\/\/[^"]+\.(jpg|jpeg|png|webp)[^"]*)"/gi) || [];
            genericMatches.forEach(m => {
              const url = this.cleanImageUrl(m.replace(/"/g, ''));
              if (this.isValidImageUrl(url)) images.add(url);
            });
          }
        } catch (e) {
          console.warn('[DropCraft] Error extracting images from scripts:', e);
        }
        console.log('[DropCraft] After script extraction:', images.size, 'images');

        // ===== 3. Platform-specific DOM selectors =====
        const platformSelectors = {
          aliexpress: [
            '.slider--img--item img', '.slider--slide--K6MIH9z img', '.image-view-magnifier-wrap img',
            '.images-view-wrap img', '.pdp-slide img', 'img[src*="ae0"]', 'img[src*="alicdn"]',
            '.sku--image--jvAmHBF img', '[class*="gallery"] img', '.product-image-view img',
            '.magnifier-image img', '.pdp-module-img img', '.swiper-slide img'
          ],
          amazon: [
            '#imgTagWrapperId img', '#landingImage', '.a-dynamic-image', '#altImages img',
            '#imageBlock img', '.imgTagWrapper img', '[data-old-hires]', '.image-thumb img'
          ],
          ebay: [
            '[data-testid="ux-image-carousel"] img', '.ux-image-carousel img', '#mainImgHldr img',
            '.ux-image-grid img', '.filmstrip img'
          ],
          cdiscount: [
            '.fpMainPicture img', '.fpThumbs img', '.productMedia img', '.product-gallery img',
            '.jsMainProductPicture img', '.product-picture img', '.swiper-slide img',
            'img[src*="cdscdn"]', 'img[src*="cdiscount"]'
          ],
          fnac: [
            '.f-productVisual img', '.gallery img', '.product-image img', '.slider img',
            '.carousel-item img', 'img[src*="fnac"]'
          ],
          rakuten: [
            '.productImage img', 'img[src*="rakuten"]', '.product-gallery img', '.offer-image img',
            '.gallery-item img', 'img[src*="priceminister"]'
          ],
          darty: [
            '.product-image img', 'img[src*="darty"]', '.gallery img', '.carousel img',
            '.product-picture img'
          ],
          boulanger: [
            '.product-image img', 'img[src*="boulanger"]', '.gallery img', '.media-gallery img'
          ],
          manomano: [
            '.product-image img', '.ProductImage img', '.gallery img', '.swiper-slide img',
            'img[src*="manomano"]'
          ],
          leroymerlin: [
            '.product-image img', 'img[src*="leroymerlin"]', '.gallery img', '.media img',
            'img[src*="lmfr"]'
          ],
          shopify: [
            '.product__media img', '.product-featured-img', '.product-single__photo img',
            '.product-images img', '.ProductGallery img', '[data-product-featured-image]',
            '.product__photos img', '.carousel img'
          ],
          walmart: [
            '[data-testid="product-image"] img', '.prod-hero-image img', '.zoom-image img',
            'img[src*="walmart"]'
          ],
          temu: [
            '[class*="gallery"] img', '[class*="product-image"] img', '.swiper-slide img',
            'img[src*="temu"]'
          ],
          etsy: [
            '.listing-page-image img', '[data-carousel-image] img', '.carousel-image img',
            'img[src*="etsy"]'
          ],
          homedepot: [
            '.mediagallery__mainimage img', '.product-image img', 'img[src*="homedepot"]'
          ],
          lowes: [
            '.product-image img', 'img[src*="lowes"]', '.gallery img'
          ],
          costco: [
            '.product-image img', 'img[src*="costco"]', '.gallery img'
          ],
          shein: [
            '.product-intro__main-image img', '.goods-detail-bigImg img', 'img[src*="shein"]'
          ],
          banggood: [
            '.product-image img', 'img[src*="banggood"]', '.gallery img'
          ],
          dhgate: [
            '.product-image img', 'img[src*="dhgate"]', '.gallery img'
          ],
          wish: [
            '.product-image img', '.ProductImage img', '.gallery img'
          ]
        };
        
        const platformSels = platformSelectors[platform] || [];
        const allSelectors = [...platformSels, ...selectorList];
        
        for (const selector of allSelectors) {
          document.querySelectorAll(selector).forEach(el => {
            // Get all possible image sources
            const sources = [
              el.src,
              ...(parseSrcset(el.srcset) || []),
              el.dataset.src,
              el.dataset.original,
              el.dataset.zoom,
              el.dataset.zoomImage,
              el.dataset.large,
              el.dataset.highres,
              el.dataset.lazySrc,
              el.getAttribute('data-lazy-src'),
              el.getAttribute('data-old-hires')
            ].filter(Boolean);
            
            // Also check for Amazon's dynamic image data
            const dynamicImg = el.getAttribute('data-a-dynamic-image');
            if (dynamicImg) {
              try {
                const imgData = JSON.parse(dynamicImg);
                Object.keys(imgData).forEach(url => {
                  const cleaned = this.cleanImageUrl(url);
                  if (this.isValidImageUrl(cleaned)) images.add(cleaned);
                });
              } catch (e) {}
            }
            
            sources.forEach(src => {
              const url = this.cleanImageUrl(src);
              if (this.isValidImageUrl(url)) images.add(url);
            });
          });
        }
        console.log('[DropCraft] After DOM extraction:', images.size, 'images');

        // ===== 4. High-res attribute scan =====
        document.querySelectorAll('img[data-zoom-image], img[data-large], img[data-src], img[data-highres], img[data-original]').forEach(el => {
          const sources = [
            el.dataset.zoomImage, el.dataset.large, el.dataset.src,
            el.dataset.highres, el.dataset.original, el.src
          ].filter(Boolean);
          
          sources.forEach(src => {
            const url = this.cleanImageUrl(src);
            if (this.isValidImageUrl(url)) images.add(url);
          });
        });

        // ===== 5. OG image fallback =====
        const ogImage = document.querySelector('meta[property="og:image"]')?.content;
        if (ogImage) {
          const url = this.cleanImageUrl(ogImage);
          if (this.isValidImageUrl(url)) images.add(url);
        }

        console.log('[DropCraft] Final extracted images:', images.size);
        return Array.from(images).slice(0, 20); // Max 20 images
      };
      
      // Get ALL videos from the page
      const getAllVideos = (selectorList) => {
        const videos = new Set();
        
        // Check for video elements
        document.querySelectorAll('video').forEach(video => {
          if (video.src) videos.add(video.src);
          video.querySelectorAll('source').forEach(source => {
            if (source.src) videos.add(source.src);
          });
        });
        
        // Check data attributes
        document.querySelectorAll('[data-video-url], [data-video-src], [data-video]').forEach(el => {
          const url = el.dataset.videoUrl || el.dataset.videoSrc || el.dataset.video;
          if (url) videos.add(url.startsWith('//') ? 'https:' + url : url);
        });
        
        // Check for video in iframes (AliExpress, Amazon)
        document.querySelectorAll('iframe[src*="video"], iframe[src*="player"]').forEach(iframe => {
          videos.add(iframe.src);
        });
        
        return Array.from(videos).filter(v => v.includes('http')).slice(0, 10);
      };
      
      // Get full description
      const getDescription = (selectorList) => {
        let description = '';
        
        for (const selector of selectorList) {
          const el = document.querySelector(selector);
          if (el) {
            // Get HTML content for rich description
            let html = el.innerHTML;
            // Clean up script tags and styles
            html = html.replace(/<script[\s\S]*?<\/script>/gi, '');
            html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
            // Get text content
            const text = el.textContent?.trim();
            if (text && text.length > description.length) {
              description = text;
            }
          }
        }
        
        // Also check for product features/bullet points
        const features = [];
        document.querySelectorAll('#feature-bullets li, .a-unordered-list li, .product-features li, [class*="feature"] li').forEach(li => {
          const text = li.textContent?.trim();
          if (text && text.length > 10 && text.length < 500) {
            features.push(text);
          }
        });
        
        if (features.length > 0) {
          description += '\n\n' + features.join('\n');
        }
        
        return description.substring(0, 10000); // Max 10k chars
      };

      // Get reviews from the page
      const getReviews = () => {
        const reviews = [];
        const reviewSelectors = [
          '.review', '.customer-review', '[data-hook="review"]',
          '.review-item', '.feedback-item', '[class*="review-card"]',
          '.buyer-feedback', '.product-review'
        ];
        
        for (const selector of reviewSelectors) {
          document.querySelectorAll(selector).forEach(reviewEl => {
            // Try to find rating
            const ratingEl = reviewEl.querySelector('[class*="star"], [class*="rating"], .a-icon-star');
            let rating = null;
            if (ratingEl) {
              const ratingText = ratingEl.textContent || ratingEl.getAttribute('aria-label') || '';
              const match = ratingText.match(/(\d+(?:\.\d+)?)/);
              if (match) rating = parseFloat(match[1]);
            }
            
            // Get review text
            const textEl = reviewEl.querySelector('.review-text, .review-body, [data-hook="review-body"], .feedback-text, [class*="content"]');
            const text = textEl?.textContent?.trim();
            
            // Get author
            const authorEl = reviewEl.querySelector('.author-name, .profile-name, [data-hook="review-author"], .user-name');
            const author = authorEl?.textContent?.trim();
            
            // Get date
            const dateEl = reviewEl.querySelector('.review-date, [data-hook="review-date"], [class*="date"]');
            const date = dateEl?.textContent?.trim();
            
            // Get images from review
            const reviewImages = [];
            reviewEl.querySelectorAll('img').forEach(img => {
              if (img.src && !img.src.includes('avatar') && !img.src.includes('profile')) {
                reviewImages.push(img.src);
              }
            });
            
            if (text && text.length > 10) {
              reviews.push({
                rating,
                text: text.substring(0, 2000),
                author: author?.substring(0, 100),
                date,
                images: reviewImages.slice(0, 5)
              });
            }
          });
        }
        
        return reviews.slice(0, 50); // Max 50 reviews
      };
      
      const getPrice = (selectorList) => {
        const text = getText(selectorList);
        if (!text) return 0;
        
        let cleanText = text.replace(/[€$£¥₹₽\s]/g, '');
        
        if (cleanText.includes(',') && !cleanText.includes('.')) {
          return parseFloat(cleanText.replace(',', '.')) || 0;
        } else if (cleanText.includes(',') && cleanText.includes('.')) {
          return parseFloat(cleanText.replace(/\./g, '').replace(',', '.')) || 0;
        }
        
        const match = cleanText.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
      };
      
      const getRating = () => {
        const text = getText(selectors.rating);
        const match = text.match(/(\d+[.,]?\d*)/);
        return match ? parseFloat(match[1].replace(',', '.')) : null;
      };
      
      // Also try JSON-LD structured data
      const getFromStructuredData = () => {
        try {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          for (const script of scripts) {
            const data = JSON.parse(script.textContent);
            const items = Array.isArray(data) ? data : [data];
            for (const item of items) {
              if (item['@type'] === 'Product') {
                const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
                return {
                  name: item.name,
                  price: parseFloat(offer?.price) || 0,
                  images: Array.isArray(item.image) ? item.image : [item.image].filter(Boolean),
                  description: item.description,
                  rating: item.aggregateRating?.ratingValue,
                  sku: item.sku,
                  brand: item.brand?.name
                };
              }
            }
          }
        } catch (e) {}
        return null;
      };
      
      // Try structured data first
      const structuredData = getFromStructuredData();
      
      const title = structuredData?.name || getText(selectors.title);
      const price = structuredData?.price || getPrice(selectors.price);
      const originalPrice = getPrice(selectors.originalPrice);
      const images = structuredData?.images?.length > 0 ? structuredData.images : getAllImages(selectors.images);
      const videos = getAllVideos(selectors.videos);
      const rating = structuredData?.rating || getRating();
      const orders = getText(selectors.orders);
      const description = structuredData?.description || getDescription(selectors.description);
      const reviews = getReviews();
      
      if (!title) {
        console.log('[DropCraft] No product title found');
        return null;
      }
      
      console.log('[DropCraft] Product detected:', { 
        title: title.substring(0, 50), 
        price, 
        imagesCount: images.length,
        videosCount: videos.length,
        descriptionLength: description.length,
        reviewsCount: reviews.length
      });
      
      return {
        name: title,
        price: price,
        originalPrice: originalPrice > price ? originalPrice : null,
        discount: originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : null,
        image: images[0] || '',
        images: images,
        videos: videos,
        rating: rating,
        orders: orders,
        description: description,
        reviews: reviews,
        sku: structuredData?.sku || '',
        brand: structuredData?.brand || '',
        url: window.location.href,
        platform: this.platform?.name,
        platformKey: this.platform?.key
      };
    }

    cleanImageUrl(url) {
      if (!url || typeof url !== 'string') return '';
      
      let clean = url;
      
      // Handle protocol-relative URLs
      if (clean.startsWith('//')) clean = 'https:' + clean;
      
      // Skip obviously invalid images
      const skipPatterns = ['sprite', 'pixel', 'transparent', 'placeholder', 'loading', 'spacer', '1x1', 'blank', 'badge', 'button'];
      if (skipPatterns.some(p => clean.toLowerCase().includes(p)) || clean.length < 12) {
        return '';
      }
      
      // Skip SVGs and data URIs
      if (clean.includes('.svg') || clean.includes('data:image/svg') || clean.startsWith('data:')) {
        return '';
      }
      
      // Clean size parameters for high-res (keep query if URL has no clear extension)
      clean = clean
        .replace(/\._AC_.*?\./g, '.')              // Amazon: ._AC_SX200_.
        .replace(/\._[A-Z]+\d+_\./g, '.')          // Amazon: ._SS40_.
        .replace(/\._[A-Z]+_\./g, '.')              // Amazon: ._SS_.
        .replace(/_\d+x\d+\./g, '.')                // AliExpress: _350x350.
        .replace(/_\d+x\d+_/g, '_')                 // Variant: _350x350_
        .replace(/[@_]\d+x\d+/g, '')                // @350x350 or _350x350
        .replace(/\/s\d+\//g, '/')                  // Shopify /s100/
        .replace(/_small|_thumb|_mini/gi, '')       // Size suffixes

      // If the URL clearly points to an image file, strip query params (tracking/size).
      // Otherwise keep the query (some CDNs require it to serve the actual asset).
      try {
        const u = new URL(clean);
        const hasImageExt = /\.(png|jpe?g|webp|gif|avif)(?:$|\?)/i.test(u.pathname);
        if (hasImageExt) {
          u.search = '';
          clean = u.toString();
        } else {
          // Remove common tracking params but keep functional params.
          ['utm_source','utm_medium','utm_campaign','utm_term','utm_content','fbclid','gclid','msclkid'].forEach((k) => u.searchParams.delete(k));
          clean = u.toString();
        }
      } catch {
        // If URL parsing fails, keep as-is.
      }
      
      // Handle relative URLs
      if (clean.startsWith('/') && !clean.startsWith('//')) {
        clean = window.location.origin + clean;
      }
      
      return clean;
    }

    isValidImageUrl(url) {
      if (!url || typeof url !== 'string' || url.length < 12) return false;
      
      // Skip invalid patterns
      const skipPatterns = [
        'sprite', 'pixel', 'transparent', 'placeholder', 'loading',
        'spacer', '1x1', 'blank', '.svg', 'data:image/svg'
      ];
      
      const lowerUrl = url.toLowerCase();
      if (skipPatterns.some(p => lowerUrl.includes(p))) return false;
      
      // Must be a valid URL
      try { 
        new URL(url); 
        return true; 
      } catch { 
        return false; 
      }
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
      
      if (!this.currentProduct || !this.currentProduct.name) {
        // Try to re-detect product
        await this.detectProduct();
        
        if (!this.currentProduct || !this.currentProduct.name) {
          this.showToast('Aucun produit détecté - naviguez vers une page produit', 'warning');
          return;
        }
      }
      
      this.showToast('Import en cours...', 'info');
      
      try {
        const productData = {
          title: this.currentProduct.name,
          name: this.currentProduct.name,
          price: this.currentProduct.price || 0,
          image: this.currentProduct.image || '',
          imageUrl: this.currentProduct.image || '',
          images: this.currentProduct.images || [],
          videos: this.currentProduct.videos || [],
          url: this.currentProduct.url || window.location.href,
          source: 'chrome_extension',
          platform: this.currentProduct.platformKey || this.platform?.key || 'unknown',
          description: this.currentProduct.description || '',
          rating: this.currentProduct.rating || null,
          originalPrice: this.currentProduct.originalPrice || null,
          reviews: this.currentProduct.reviews || [],
          sku: this.currentProduct.sku || '',
          brand: this.currentProduct.brand || '',
          orders: this.currentProduct.orders || ''
        };

        console.log('[DropCraft] Importing product with full data:', {
          title: productData.title?.substring(0, 50),
          imagesCount: productData.images?.length || 0,
          videosCount: productData.videos?.length || 0,
          descriptionLength: productData.description?.length || 0,
          reviewsCount: productData.reviews?.length || 0
        });

        const res = await dcFetchJson(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.token,
          },
          body: JSON.stringify({
            action: 'import_products',
            products: [productData],
          }),
        });

        console.log('[DropCraft] Import result:', res);

        const result = res.data;
        if (res.ok && (result?.imported > 0 || result?.success)) {
          const productName = this.currentProduct.name.length > 30 
            ? this.currentProduct.name.substring(0, 30) + '...' 
            : this.currentProduct.name;
          this.showToast(`✅ "${productName}" importé avec ${productData.images?.length || 0} images!`, 'success');
          
          // Add to history
          this.addToHistory(this.currentProduct);
        } else {
          const errorMsg = result?.error || result?.errors?.[0]?.error || res.error || `Erreur d'import (HTTP ${res.status})`;
          console.error('[DropCraft] Import error:', { res, result });
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error('[DropCraft] Import error:', error);
        this.showToast(`❌ ${error.message}`, 'error');
      }
    }

    injectProductPageButton() {
      // A visible "Import" button on product pages (in-page UI) + safe fallback as floating button.
      if (document.querySelector('.dc-product-page-btn')) return;

      const btn = document.createElement('button');
      btn.className = 'dc-product-page-btn';
      btn.type = 'button';
      btn.textContent = '📥 Importer';
      btn.style.cssText = `
        position: fixed;
        top: 90px;
        right: 18px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        z-index: 2147483646;
        box-shadow: 0 8px 30px rgba(102, 126, 234, 0.45);
      `;

      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!this.isConnected) {
          this.showToast('Veuillez vous connecter d\'abord (clé extension)', 'warning');
          this.open();
          return;
        }
        await this.importProduct();
      });

      document.body.appendChild(btn);

      // Keep it available on SPA navigations.
      if (!this.productBtnObserver) {
        this.productBtnObserver = new MutationObserver(() => {
          if (!document.querySelector('.dc-product-page-btn')) {
            this.injectProductPageButton();
          }
        });

        this.productBtnObserver.observe(document.documentElement, { childList: true, subtree: true });
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
      if (!this.isConnected) {
        this.showToast('Veuillez vous connecter d\'abord', 'warning');
        return;
      }
      
      // Show reviews panel
      window.postMessage({ type: 'SHOW_REVIEWS_PANEL' }, '*');
      this.showToast('Panneau d\'avis ouvert', 'info');
    }

    async startMonitoring() {
      this.showToast('Surveillance activée! (Bientôt disponible)', 'success');
    }

    injectListingButtons() {
      // Extended selectors for product cards on ALL listing/catalog pages (25+ platforms)
      const listingSelectors = {
        // Major Marketplaces
        aliexpress: '.search-item-card-wrapper-gallery, .list--gallery--34TropR, [data-widget-type="search"], .search-card-item, .product-snippet, [class*="SearchProduct"], [class*="gallery-card"], [class*="list--galley"], [class*="list-item"], .JIIxO, ._1OUGS',
        amazon: '[data-component-type="s-search-result"], .s-result-item[data-asin], .s-main-slot .s-result-item',
        ebay: '.s-item:not(.s-item__pl-on-bottom), .s-item__wrapper, .srp-results .s-item',
        temu: '[class*="ProductCard"], [class*="goods-item"], [class*="product-card"], [class*="GoodsItem"], [class*="SearchProduct"], [class*="card-wrapper"], [class*="CardWrapper"], [class*="goods_item"], [class*="item-wrapper"], [class*="product-item"], article[class*="product"], div[class*="_"][class*="product"], a[href*="/goods/"]',
        walmart: '[data-testid="list-view"], [data-item-id], [class*="product-tile"], .search-result-gridview-item',
        etsy: '[data-search-results] .v2-listing-card, .wt-grid__item-xs-6, .listing-link',
        wish: '.product-feed-item, [data-product-id], .feed-row-product',
        
        // French Marketplaces
        cdiscount: '.prdtBILDetails, .prdtBIL, .product-box, .product-item, [data-productid], .prdtBloc',
        fnac: '.Article-item, .SearchResult, .productItem, .product-list-item, [data-product], .js-Product',
        rakuten: '.productOfferInfo, .product-list-item, .item-link, [data-product-id], .ProductCard',
        darty: '.product-tile, .product-item, .product-card, [data-product-id]',
        boulanger: '.product-item, .product-card, [data-product-sku]',
        manomano: '.product-card, .ProductCard, [data-product-id], .listing-product',
        leroymerlin: '.product-item, .product-card, [data-product-id], .product-tile',
        
        // US Home Improvement
        homedepot: '.product-pod, .browse-search__pod, [data-product-id], .plp-pod',
        lowes: '.product-card, [data-product-id], .product-item, .pl-card',
        costco: '.product-tile, .product-card, [data-product-id], .product-item',
        
        // Fashion
        shein: '.S-product-item, .product-item, [data-product-id], .product-card',
        asos: '.product-card, [data-product-id], .product-list-item',
        zalando: '.product-card, [data-product-id], .catalog-item',
        
        // Asian Suppliers
        '1688': '.offer-list-row .sm-offer-item, .space-offer-card-box, .offer-item',
        taobao: '.item, .J_MouserOn498, [data-item-id]',
        dhgate: '.gallery-item, .product-item, [data-product-id]',
        banggood: '.product-item, [data-product-id], .product-card',
        cjdropshipping: '.product-card, [data-product-id], .goods-item',
        
        // Generic fallback (last resort)
        generic: '.product-item, .product-card, .goods-item, [data-testid="product-card"], .product-snippet, [class*="product-item"], [class*="ProductCard"], [data-product], article[class*="product"]'
      };
      
      let productCards = [];
      const hostname = window.location.hostname.toLowerCase();
      
      // Try platform-specific selectors first
      for (const [platform, selector] of Object.entries(listingSelectors)) {
        if (hostname.includes(platform) || platform === 'generic') {
          try {
            const elements = document.querySelectorAll(selector);
            if (elements.length > 0) {
              productCards = [...productCards, ...Array.from(elements)];
            }
          } catch (e) {
            // Invalid selector for this platform, skip
          }
        }
      }
      
      // Remove duplicates and filter out tiny elements
      productCards = [...new Set(productCards)].filter(card => {
        const rect = card.getBoundingClientRect();
        return rect.width > 100 && rect.height > 100; // Filter tiny elements
      });
      
      console.log(`[DropCraft] Found ${productCards.length} product cards on listing page`);
      
      productCards.forEach(card => {
        if (card.querySelector('.dc-listing-btn')) return;
        
        // Make container relative if needed
        const computedStyle = window.getComputedStyle(card);
        if (computedStyle.position === 'static') {
          card.style.position = 'relative';
        }
        
        const btn = document.createElement('button');
        btn.className = 'dc-listing-btn';
        btn.innerHTML = '📥 Import';
        btn.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(102, 126, 234, 0.5);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          opacity: 0.95;
        `;
        
        btn.addEventListener('mouseenter', () => {
          btn.style.transform = 'scale(1.05)';
          btn.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.6)';
          btn.style.opacity = '1';
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'scale(1)';
          btn.style.boxShadow = '0 2px 10px rgba(102, 126, 234, 0.5)';
          btn.style.opacity = '0.95';
        });
        
        btn.onclick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          await this.importFromCard(card, btn);
          return false;
        };
        
        card.appendChild(btn);
      });
      
      // Observe for new products (infinite scroll / pagination / SPA)
      if (!this.listingObserver) {
        this.listingObserver = new MutationObserver(() => {
          clearTimeout(this.listingDebounce);
          this.listingDebounce = setTimeout(() => this.injectListingButtons(), 500);
        });
        
        this.listingObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      }
    }

    async importFromCard(card, btn) {
      // ===== CONNECTION CHECK (critical fix) =====
      if (!this.isConnected || !this.token) {
        this.showToast('⚠️ Veuillez vous connecter d\'abord (ouvrez le panneau Drop Craft AI)', 'warning');
        this.open(); // Open sidebar to show auth panel
        return;
      }

      // Extract product info from card - Platform-specific extractors
      const extractFromCard = () => {
        const hostname = window.location.hostname;
        
        // AliExpress
        if (hostname.includes('aliexpress')) {
          return {
            title: card.querySelector('.multi--titleText--nXeOvyr, .manhattan--titleText--WccHjR6, h3, [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.multi--price-sale--U-S0jtj, .manhattan--price-sale--1CCSZfK, [class*="price"]')),
            image: card.querySelector('img')?.src || '',
            url: card.querySelector('a[href*="/item/"], a[href*="/i/"]')?.href || window.location.href
          };
        }
        
        // Amazon
        if (hostname.includes('amazon')) {
          return {
            title: card.querySelector('h2 span, .s-title-instructions-style span')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.a-price-whole, .a-offscreen')),
            image: card.querySelector('.s-image')?.src || '',
            url: card.querySelector('a[href*="/dp/"]')?.href || window.location.href
          };
        }
        
        // eBay
        if (hostname.includes('ebay')) {
          return {
            title: card.querySelector('.s-item__title')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.s-item__price')),
            image: card.querySelector('.s-item__image img')?.src || '',
            url: card.querySelector('.s-item__link')?.href || window.location.href
          };
        }
        
        // Cdiscount
        if (hostname.includes('cdiscount')) {
          return {
            title: card.querySelector('.prdtBILTit, .prdtTitle, h2, .product-name, [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.price, .prdtPrice, [class*="price"]')),
            image: card.querySelector('img.prdtImg, img[src*="cdscdn"], img')?.src || '',
            url: card.querySelector('a[href*="/f-"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Fnac
        if (hostname.includes('fnac')) {
          return {
            title: card.querySelector('.Article-desc, .product-title, h2, [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.userPrice, .price, [class*="price"]')),
            image: card.querySelector('img.Article-img, img[src*="static.fnac"], img')?.src || '',
            url: card.querySelector('a[href*="/a"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Rakuten
        if (hostname.includes('rakuten')) {
          return {
            title: card.querySelector('.productTitle, .product-name, h2, [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.productPrice, .price, [class*="price"]')),
            image: card.querySelector('img.productImage, img[src*="priceminister"], img')?.src || '',
            url: card.querySelector('a[href*="/offer/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Darty
        if (hostname.includes('darty')) {
          return {
            title: card.querySelector('.product-title, h2, [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.product-price, .price, [class*="price"]')),
            image: card.querySelector('img[src*="darty"], img')?.src || '',
            url: card.querySelector('a[href*="/nav/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Boulanger
        if (hostname.includes('boulanger')) {
          return {
            title: card.querySelector('.product-title, h2, [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.product-price, .price, [class*="price"]')),
            image: card.querySelector('img[src*="boulanger"], img')?.src || '',
            url: card.querySelector('a[href*="/ref/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // ManoMano
        if (hostname.includes('manomano')) {
          return {
            title: card.querySelector('.product-title, h2, [class*="title"], [class*="name"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.price, [class*="price"]')),
            image: card.querySelector('img[src*="manomano"], img')?.src || '',
            url: card.querySelector('a[href*="/p/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Leroy Merlin
        if (hostname.includes('leroymerlin')) {
          return {
            title: card.querySelector('.product-title, h2, [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('.price, [class*="price"]')),
            image: card.querySelector('img[src*="leroymerlin"], img')?.src || '',
            url: card.querySelector('a[href*="/p/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Home Depot
        if (hostname.includes('homedepot')) {
          return {
            title: card.querySelector('.product-title, [class*="title"], h2')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[class*="price"]')),
            image: card.querySelector('img[src*="homedepot"], img')?.src || '',
            url: card.querySelector('a[href*="/p/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Lowes
        if (hostname.includes('lowes')) {
          return {
            title: card.querySelector('.product-title, [class*="title"], h2')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[class*="price"]')),
            image: card.querySelector('img[src*="lowes"], img')?.src || '',
            url: card.querySelector('a[href*="/pd/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Costco
        if (hostname.includes('costco')) {
          return {
            title: card.querySelector('.product-title, [class*="title"], h2')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[class*="price"]')),
            image: card.querySelector('img[src*="costco"], img')?.src || '',
            url: card.querySelector('a[href*="/.product."]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Temu - Using robust selectors (Temu obfuscates class names)
        if (hostname.includes('temu')) {
          // Try multiple strategies for Temu's dynamic classes
          const title = 
            card.querySelector('[class*="title" i]')?.textContent?.trim() ||
            card.querySelector('h3, h2, h1')?.textContent?.trim() ||
            card.querySelector('span[class*="name" i]')?.textContent?.trim() ||
            card.querySelector('a[href*="/goods/"]')?.textContent?.trim() ||
            '';
          
          const priceEl = 
            card.querySelector('[class*="price" i]') ||
            card.querySelector('[class*="amount" i]') ||
            card.querySelector('span[class*="sale" i]');
            
          const img = 
            card.querySelector('img[src*="kwcdn"]') ||
            card.querySelector('img[src*="kwimgs"]') ||
            card.querySelector('img[src*="temu"]') ||
            card.querySelector('img[src*="http"]') ||
            card.querySelector('img');
            
          const link = 
            card.querySelector('a[href*="/goods/"]') ||
            card.querySelector('a[href*="goods_id"]') ||
            card.querySelector('a[href]');
          
          return {
            title: title,
            price: this.parsePriceFromElement(priceEl),
            image: img?.src || '',
            url: link?.href || window.location.href
          };
        }
        
        // Walmart
        if (hostname.includes('walmart')) {
          return {
            title: card.querySelector('[data-automation-id="product-title"], span[class*="product-title"], [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[data-automation-id="product-price"], [class*="price"]')),
            image: card.querySelector('img[data-testid*="image"], img')?.src || '',
            url: card.querySelector('a[href*="/ip/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Etsy
        if (hostname.includes('etsy')) {
          return {
            title: card.querySelector('h3, [class*="title"]')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('span[class*="price"]')),
            image: card.querySelector('img')?.src || '',
            url: card.querySelector('a[href*="/listing/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Shein
        if (hostname.includes('shein')) {
          return {
            title: card.querySelector('.S-product-item__name, [class*="title"], h3')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[class*="price"]')),
            image: card.querySelector('img[src*="shein"], img')?.src || '',
            url: card.querySelector('a[href*="/product"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Wish
        if (hostname.includes('wish')) {
          return {
            title: card.querySelector('.product-title, [class*="title"], h3')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[class*="price"]')),
            image: card.querySelector('img')?.src || '',
            url: card.querySelector('a[href*="/product"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Banggood
        if (hostname.includes('banggood')) {
          return {
            title: card.querySelector('.product-title, [class*="title"], h3')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[class*="price"]')),
            image: card.querySelector('img[src*="banggood"], img')?.src || '',
            url: card.querySelector('a[href*="/p/"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // DHgate
        if (hostname.includes('dhgate')) {
          return {
            title: card.querySelector('.product-title, [class*="title"], h3')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[class*="price"]')),
            image: card.querySelector('img[src*="dhgate"], img')?.src || '',
            url: card.querySelector('a[href*="/product"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // CJDropshipping
        if (hostname.includes('cjdropshipping')) {
          return {
            title: card.querySelector('.product-title, [class*="title"], h3')?.textContent?.trim() || '',
            price: this.parsePriceFromElement(card.querySelector('[class*="price"]')),
            image: card.querySelector('img')?.src || '',
            url: card.querySelector('a[href*="/product"]')?.href || card.querySelector('a')?.href || window.location.href
          };
        }
        
        // Generic extraction (fallback for all other platforms)
        const link = card.querySelector('a[href*="/"]');
        const title = card.querySelector('h1, h2, h3, [class*="title"], [class*="name"]')?.textContent?.trim() || '';
        const priceEl = card.querySelector('[class*="price"]');
        const image = card.querySelector('img')?.src || '';
        
        return {
          title: title,
          price: this.parsePriceFromElement(priceEl),
          image: image,
          url: link?.href || window.location.href
        };
      };
      
      const productInfo = extractFromCard();
      
      // Validate extracted data
      if (!productInfo.title && !productInfo.image) {
        this.showToast('❌ Impossible d\'extraire les données du produit', 'error');
        return;
      }
      
      if (btn) {
        btn.innerHTML = '⏳';
        btn.disabled = true;
      }
      
      this.showToast('Import en cours...', 'info');
      
      try {
        console.log('[DropCraft] Importing from card:', {
          title: productInfo.title?.substring(0, 50),
          price: productInfo.price,
          hasImage: !!productInfo.image,
          url: productInfo.url?.substring(0, 50)
        });

        const res = await dcFetchJson(`${CONFIG.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.token,
          },
          body: JSON.stringify({
            action: 'import_products',
            products: [
              {
                title: productInfo.title || 'Produit importé',
                name: productInfo.title || 'Produit importé',
                price: productInfo.price || 0,
                image: productInfo.image || '',
                imageUrl: productInfo.image || '',
                images: productInfo.image ? [productInfo.image] : [],
                url: productInfo.url,
                source: 'chrome_extension_catalog',
                platform: this.platform?.key || 'unknown',
              },
            ],
          }),
        });

        console.log('[DropCraft] Card import result:', res);

        const result = res.data;
        if (res.ok && (result?.imported > 0 || result?.success)) {
          if (btn) {
            btn.innerHTML = '✅';
            btn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
          }
          const displayTitle = productInfo.title?.length > 25 
            ? productInfo.title.substring(0, 25) + '...' 
            : (productInfo.title || 'Produit');
          this.showToast(`✅ "${displayTitle}" importé!`, 'success');
        } else {
          // Extract detailed error message
          const errorMsg = result?.error || 
                          result?.errors?.[0]?.error || 
                          res.error || 
                          (res.status === 401 ? 'Token expiré - reconnectez-vous' : 
                           res.status === 400 ? 'Données invalides' :
                           res.status === 500 ? 'Erreur serveur' :
                           `Erreur HTTP ${res.status}`);
          throw new Error(errorMsg);
        }
      } catch (error) {
        console.error('[DropCraft] Card import error:', error);
        if (btn) {
          btn.innerHTML = '❌';
          btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
        this.showToast(`❌ ${error.message || 'Erreur inconnue'}`, 'error');
        
        // Reset button after 2s
        setTimeout(() => {
          if (btn) {
            btn.innerHTML = '📥 Import';
            btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
            btn.disabled = false;
          }
        }, 2000);
      }
    }

    parsePriceFromElement(el) {
      if (!el) return 0;
      const text = el.textContent || '';
      // Handle various price formats
      let cleanText = text.replace(/[€$£¥₹₽\s]/g, '');
      
      if (cleanText.includes(',') && !cleanText.includes('.')) {
        return parseFloat(cleanText.replace(',', '.')) || 0;
      } else if (cleanText.includes(',') && cleanText.includes('.')) {
        return parseFloat(cleanText.replace(/\./g, '').replace(',', '.')) || 0;
      }
      
      const match = cleanText.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : 0;
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
