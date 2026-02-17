/**
 * ShopOpti+ Unified Button Injector v6.0.0
 * Injects consistent import buttons across ALL supported platforms
 * Single design, single behavior, single position strategy
 */

;(function() {
  'use strict';

  // ==================== BUTTON DESIGN SYSTEM ====================
  const BUTTON_STYLES = `
    .shopopti-import-btn {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      padding: 12px 24px !important;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%) !important;
      color: white !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      font-size: 14px !important;
      font-weight: 600 !important;
      border: none !important;
      border-radius: 10px !important;
      cursor: pointer !important;
      transition: all 0.2s ease !important;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4) !important;
      z-index: 999999 !important;
      min-width: 160px !important;
      height: 44px !important;
      text-decoration: none !important;
      position: relative !important;
      overflow: hidden !important;
    }

    .shopopti-import-btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5) !important;
    }

    .shopopti-import-btn:active {
      transform: translateY(0) !important;
    }

    .shopopti-import-btn:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
      transform: none !important;
    }

    .shopopti-import-btn.loading {
      pointer-events: none !important;
    }

    .shopopti-import-btn.loading .shopopti-btn-text {
      opacity: 0 !important;
    }

    .shopopti-import-btn .shopopti-btn-icon {
      width: 18px !important;
      height: 18px !important;
      flex-shrink: 0 !important;
    }

    .shopopti-import-btn .shopopti-btn-text {
      transition: opacity 0.2s !important;
    }

    .shopopti-import-btn .shopopti-spinner {
      position: absolute !important;
      width: 20px !important;
      height: 20px !important;
      border: 2px solid rgba(255,255,255,0.3) !important;
      border-top-color: white !important;
      border-radius: 50% !important;
      animation: shopopti-spin 0.8s linear infinite !important;
    }

    .shopopti-import-btn.success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
    }

    .shopopti-import-btn.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
    }

    /* Floating button for fallback */
    .shopopti-floating-btn {
      position: fixed !important;
      bottom: 24px !important;
      right: 24px !important;
      z-index: 2147483640 !important;
    }

    /* Inline button container */
    .shopopti-btn-container {
      display: flex !important;
      align-items: center !important;
      gap: 12px !important;
      margin: 12px 0 !important;
    }

    /* Quick action buttons */
    .shopopti-quick-actions {
      display: flex !important;
      gap: 8px !important;
      margin-left: 8px !important;
    }

    .shopopti-quick-btn {
      width: 36px !important;
      height: 36px !important;
      border-radius: 8px !important;
      background: #f3f4f6 !important;
      border: none !important;
      cursor: pointer !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      transition: all 0.2s !important;
    }

    .shopopti-quick-btn:hover {
      background: #e5e7eb !important;
    }

    .shopopti-quick-btn svg {
      width: 16px !important;
      height: 16px !important;
      color: #374151 !important;
    }

    /* Badge for quality score */
    .shopopti-quality-badge {
      position: absolute !important;
      top: -8px !important;
      right: -8px !important;
      background: #22c55e !important;
      color: white !important;
      font-size: 10px !important;
      font-weight: 700 !important;
      padding: 2px 6px !important;
      border-radius: 10px !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
    }

    @keyframes shopopti-spin {
      to { transform: rotate(360deg); }
    }

    @keyframes shopopti-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    /* Toast notification */
    .shopopti-toast {
      position: fixed !important;
      bottom: 80px !important;
      right: 24px !important;
      background: #1f2937 !important;
      color: white !important;
      padding: 12px 20px !important;
      border-radius: 10px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      z-index: 2147483645 !important;
      animation: shopopti-slide-up 0.3s ease !important;
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3) !important;
    }

    .shopopti-toast.success {
      background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%) !important;
    }

    .shopopti-toast.error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%) !important;
    }

    @keyframes shopopti-slide-up {
      from { 
        opacity: 0;
        transform: translateY(20px);
      }
      to { 
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;

  // ==================== PLATFORM INJECTION RULES ====================
  const INJECTION_RULES = {
    aliexpress: {
      selectors: [
        '.product-action',
        '.product-info',
        '[class*="ProductActions"]',
        '[class*="product-action"]',
        '.uniform-banner-box'
      ],
      position: 'afterbegin',
      context: 'product'
    },
    amazon: {
      selectors: [
        '#addToCart',
        '#add-to-cart-button',
        '#desktop_buybox',
        '#buybox',
        '#rightCol',
        '#buy-now-button',
        '.a-button-stack',
        '#ppd',
        '#centerCol',
        '#productTitle'
      ],
      position: 'afterend',
      context: 'product'
    },
    ebay: {
      selectors: [
        '.x-bin-action',
        '.d-tabs-sections',
        '[data-testid="x-bin-action"]',
        '.vim-buybox'
      ],
      position: 'beforebegin',
      context: 'product'
    },
    shopify: {
      selectors: [
        '.product-form__buttons',
        '.product__buttons',
        '[class*="product-form"]',
        'form[action*="/cart/add"]'
      ],
      position: 'beforebegin',
      context: 'product'
    },
    temu: {
      selectors: [
        '._2bz_YBnS',
        '[class*="ProductAction"]',
        '.product-page-main'
      ],
      position: 'afterbegin',
      context: 'product'
    },
    shein: {
      selectors: [
        '.product-intro__add',
        '[class*="add-to-bag"]',
        '.product-intro__info'
      ],
      position: 'beforebegin',
      context: 'product'
    },
    wish: {
      selectors: [
        '[class*="BuyButton"]',
        '[class*="product-buy"]',
        '.product-page-content'
      ],
      position: 'beforebegin',
      context: 'product'
    },
    cdiscount: {
      selectors: [
        '.fpAddBsk',
        '.fpBlocAdd',
        '#fpZone'
      ],
      position: 'beforebegin',
      context: 'product'
    },
    fnac: {
      selectors: [
        '.f-buyBox-cta',
        '.f-productHeader-actions',
        '.f-buyBox'
      ],
      position: 'beforebegin',
      context: 'product'
    }
  };

  // ==================== UNIFIED BUTTON INJECTOR ====================
  class UnifiedButtonInjector {
    constructor() {
      this.injectedButtons = new Set();
      this.observer = null;
      this.injectStyles();
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
      if (document.getElementById('shopopti-unified-btn-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'shopopti-unified-btn-styles';
      style.textContent = BUTTON_STYLES;
      document.head.appendChild(style);
    }

    /**
     * Detect current platform from URL
     */
    detectPlatform() {
      const url = window.location.href;
      const patterns = {
        aliexpress: /aliexpress\.(com|us|ru)/i,
        amazon: /amazon\.(com|fr|de|co\.uk|es|it|ca)/i,
        ebay: /ebay\.(com|fr|de|co\.uk)/i,
        shopify: /\.myshopify\.com|\/products\//i,
        temu: /temu\.com/i,
        shein: /shein\.(com|fr)/i,
        wish: /wish\.com/i,
        cdiscount: /cdiscount\.com/i,
        fnac: /fnac\.com/i,
        rakuten: /rakuten\.(com|fr)/i,
        walmart: /walmart\.com/i,
        homedepot: /homedepot\.com/i,
        etsy: /etsy\.com/i,
        banggood: /banggood\.com/i,
        dhgate: /dhgate\.com/i,
        cjdropshipping: /cjdropshipping\.com/i,
        tiktok: /tiktok\.com\/.*shop/i
      };

      for (const [platform, pattern] of Object.entries(patterns)) {
        if (pattern.test(url)) {
          return platform;
        }
      }
      return null;
    }

    /**
     * Check if current page is a product page
     */
    isProductPage(platform) {
      const url = window.location.href;
      const patterns = {
        aliexpress: /\/item\/\d+|\/i\/\d+/,
        amazon: /\/dp\/[A-Z0-9]+|\/gp\/product\/[A-Z0-9]+/,
        ebay: /\/itm\/\d+/,
        shopify: /\/products\//,
        temu: /\/goods/,
        shein: /\/[a-z]+-p-\d+/,
        default: /product|item|goods|\/p\/|\/dp\//
      };

      const pattern = patterns[platform] || patterns.default;
      return pattern.test(url);
    }

    /**
     * Create the unified import button
     */
    createButton(options = {}) {
      const container = document.createElement('div');
      container.className = 'shopopti-btn-container';
      container.id = `shopopti-btn-${Date.now()}`;

      const button = document.createElement('button');
      button.className = 'shopopti-import-btn';
      button.innerHTML = `
        <svg class="shopopti-btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span class="shopopti-btn-text">Importer ShopOpti</span>
        <div class="shopopti-spinner" style="display: none;"></div>
      `;

      // Click handler
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await this.handleImportClick(button);
      });

      container.appendChild(button);

      // Add quick action buttons if enabled
      if (options.showQuickActions) {
        container.appendChild(this.createQuickActions());
      }

      return container;
    }

    /**
     * Create quick action buttons (monitor, compare)
     */
    createQuickActions() {
      const quickActions = document.createElement('div');
      quickActions.className = 'shopopti-quick-actions';

      // Monitor price button
      const monitorBtn = document.createElement('button');
      monitorBtn.className = 'shopopti-quick-btn';
      monitorBtn.title = 'Surveiller le prix';
      monitorBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      `;
      monitorBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleMonitorClick();
      });

      // Add to favorites button
      const favBtn = document.createElement('button');
      favBtn.className = 'shopopti-quick-btn';
      favBtn.title = 'Ajouter aux favoris';
      favBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      `;
      favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleFavoriteClick();
      });

      quickActions.appendChild(monitorBtn);
      quickActions.appendChild(favBtn);

      return quickActions;
    }

    /**
     * Handle import button click - BACKEND-FIRST ARCHITECTURE
     * No local extraction - sends only URL to backend
     */
    async handleImportClick(button) {
      const url = window.location.href;
      
      // Set loading state
      this.setButtonState(button, 'loading');

      try {
        // BACKEND-FIRST: Use BackendFirstImport (no local extraction)
        if (window.BackendFirstImport) {
          console.log('[ShopOpti+] Using BackendFirstImport (backend-first architecture)');
          
          const result = await window.BackendFirstImport.import(url, {}, button);

          // Result is already handled by ImportResponseHandler
          // Just update button state if needed
          if (result.ok) {
            // Button state managed by ImportResponseHandler
            return;
          } else {
            // Error already shown by ImportResponseHandler
            setTimeout(() => {
              this.setButtonState(button, 'default');
            }, 3000);
          }
          return;
        }

        // LEGACY FALLBACK: Use old pipeline (for backwards compatibility)
        if (window.ShopOptiPipeline) {
          console.warn('[ShopOpti+] Falling back to legacy ShopOptiPipeline');
          
          const result = await window.ShopOptiPipeline.processUrl(url, {});

          if (result.status === 'awaiting_confirmation') {
            this.setButtonState(button, 'default');
            
            if (window.ShopOptiPreImportDialog) {
              const confirmed = await window.ShopOptiPreImportDialog.show(
                result.product,
                result.validation
              );

              if (confirmed) {
                this.setButtonState(button, 'loading');
                const importResult = await window.ShopOptiPipeline.confirmImport(result.jobId);
                
                if (importResult.success) {
                  this.setButtonState(button, 'success');
                  this.showToast('✅ Produit importé avec succès!', 'success');
                } else {
                  this.setButtonState(button, 'error');
                  this.showToast(`❌ ${importResult.error}`, 'error');
                }
              }
            }
          } else if (result.success) {
            this.setButtonState(button, 'success');
            this.showToast('✅ Produit importé avec succès!', 'success');
          } else {
            this.setButtonState(button, 'error');
            this.showToast(`❌ ${result.error}`, 'error');
          }
        } else {
          // No import system available
          throw new Error('Système d\'import non disponible');
        }
      } catch (error) {
        console.error('[ShopOpti+] Import error:', error);
        this.setButtonState(button, 'error');
        this.showToast(`❌ ${error.message}`, 'error');
      }

      // Reset button after delay
      setTimeout(() => {
        this.setButtonState(button, 'default');
      }, 3000);
    }

    /**
     * Handle monitor click
     */
    async handleMonitorClick() {
      const url = window.location.href;
      this.showToast('👁️ Surveillance du prix activée', 'success');
      
      if (window.ShopOptiAPI) {
        try {
          await window.ShopOptiAPI.addToMonitoring({ url });
        } catch (e) {
          console.error('[ShopOpti+] Monitor error:', e);
        }
      }
    }

    /**
     * Handle favorite click
     */
    handleFavoriteClick() {
      this.showToast('❤️ Ajouté aux favoris', 'success');
    }

    /**
     * Set button visual state
     */
    setButtonState(button, state) {
      const spinner = button.querySelector('.shopopti-spinner');
      const text = button.querySelector('.shopopti-btn-text');

      button.classList.remove('loading', 'success', 'error');

      switch (state) {
        case 'loading':
          button.classList.add('loading');
          spinner.style.display = 'block';
          button.disabled = true;
          break;
        case 'success':
          button.classList.add('success');
          spinner.style.display = 'none';
          text.textContent = '✓ Importé';
          button.disabled = false;
          break;
        case 'error':
          button.classList.add('error');
          spinner.style.display = 'none';
          text.textContent = '✗ Erreur';
          button.disabled = false;
          break;
        default:
          spinner.style.display = 'none';
          text.textContent = 'Importer ShopOpti';
          button.disabled = false;
      }
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
      // Remove existing toast
      document.querySelectorAll('.shopopti-toast').forEach(t => t.remove());

      const toast = document.createElement('div');
      toast.className = `shopopti-toast ${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);

      setTimeout(() => toast.remove(), 4000);
    }

    /**
     * Inject button into page
     */
    inject() {
      const platform = this.detectPlatform();
      if (!platform) {
        console.log('[ShopOpti+] Platform not supported');
        return;
      }

      if (!this.isProductPage(platform)) {
        console.log('[ShopOpti+] Not a product page');
        return;
      }

      // Prevent duplicate injection
      if (document.querySelector('.shopopti-import-btn')) {
        return;
      }

      const rules = INJECTION_RULES[platform] || {};
      const selectors = rules.selectors || [];
      let injected = false;

      // Try each selector
      for (const selector of selectors) {
        const target = document.querySelector(selector);
        if (target) {
          const button = this.createButton({ showQuickActions: true });
          
          switch (rules.position) {
            case 'afterbegin':
              target.insertAdjacentElement('afterbegin', button);
              break;
            case 'afterend':
              target.insertAdjacentElement('afterend', button);
              break;
            default:
              target.insertAdjacentElement('beforebegin', button);
          }

          this.injectedButtons.add(button.id);
          injected = true;
          console.log(`[ShopOpti+] Button injected via selector: ${selector}`);
          break;
        }
      }

      // Fallback: inject floating button
      if (!injected) {
        this.injectFloatingButton();
      }
    }

    /**
     * Inject floating button as fallback
     */
    injectFloatingButton() {
      if (document.querySelector('.shopopti-floating-btn')) return;

      const button = this.createButton();
      button.classList.add('shopopti-floating-btn');
      document.body.appendChild(button);
      
      console.log('[ShopOpti+] Floating button injected (fallback)');
    }

    /**
     * Start observing for dynamic content
     */
    startObserver() {
      if (this.observer) return;

      this.observer = new MutationObserver(() => {
        // Re-inject if button was removed
        if (!document.querySelector('.shopopti-import-btn')) {
          this.inject();
        }
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    /**
     * Initialize injector
     */
    init() {
      // Initial injection
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          this.inject();
          this.startObserver();
        });
      } else {
        this.inject();
        this.startObserver();
      }

      // Re-inject on URL changes (SPA navigation)
      let lastUrl = window.location.href;
      setInterval(() => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          setTimeout(() => this.inject(), 1000);
        }
      }, 1000);

      console.log('[ShopOpti+] UnifiedButtonInjector initialized');
    }
  }

  // Create and initialize
  const injector = new UnifiedButtonInjector();

  // Export
  if (typeof window !== 'undefined') {
    window.ShopOptiButtonInjector = injector;
    window.UnifiedButtonInjector = UnifiedButtonInjector;
  }

  // Auto-initialize
  injector.init();

  console.log('[ShopOpti+] UnifiedButtonInjector v5.7.0 loaded');
})();
