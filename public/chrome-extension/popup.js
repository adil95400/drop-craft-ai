// ============================================
// ShopOpti+ Chrome Extension - Popup Script v5.3.0
// PROFESSIONAL UI - XSS Safe (no innerHTML with user data)
// Chrome API Safety + Sender Validation
// ============================================

class ShopOptiPopup {
  constructor() {
    // In web preview (outside Chrome Extension), `chrome.*` is undefined.
    // We must not crash: instead we show a safe preview mode with clear guidance.
    this.chrome = typeof chrome !== 'undefined' && chrome?.runtime?.id ? chrome : null;

    this.isConnected = false;
    this.extensionToken = null;
    this.stats = { products: 0, reviews: 0, monitored: 0 };
    this.activities = [];
    this.pendingItems = [];
    this.currentPlatform = null;
    this.currentSourcingProduct = null;
    this.API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
    this.APP_URL = 'https://shopopti.io';
  }

  isExtensionRuntime() {
    return !!this.chrome;
  }

  /**
   * Browser preview mode (Lovable preview / normal tab):
   * We cannot call chrome.* APIs, so we render a functional UI preview
   * with disabled actions + explicit instructions (no mock success).
   */
  initBrowserPreviewMode() {
    this.isConnected = false;
    this.extensionToken = null;

    // Basic UI state
    const status = document.getElementById('connectionStatus');
    status?.classList.remove('connected');
    status?.classList.add('disconnected');
    const statusText = status?.querySelector('.status-text');
    if (statusText) statusText.textContent = 'Prévisualisation (extension non chargée)';

    const connectBtn = document.getElementById('connectBtn');
    if (connectBtn) {
      connectBtn.addEventListener('click', () => {
        this.showToast(
          "Cette page est une prévisualisation. Pour utiliser les boutons, charge l'extension dans Chrome (mode développeur).",
          'info'
        );
        window.open(this.APP_URL + '/extensions/chrome', '_blank');
      });
    }

    // Disable action buttons but keep them clickable for explanation
    const previewOnlyIds = [
      'syncBtn',
      'settingsBtn',
      'dashboardBtn',
      'importPageBtn',
      'importAllBtn',
      'importReviewsBtn',
      'priceMonitorBtn',
      'showAllPlatformsBtn',
      'sendToAppBtn'
    ];

    previewOnlyIds.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showToast(
          "Action disponible uniquement dans l'extension Chrome. Ouvre /extensions/chrome pour l'installation.",
          'warning'
        );
      });
      // Mark as disabled for a11y + styling hooks
      try {
        el.setAttribute('aria-disabled', 'true');
        el.classList.add('preview-disabled');
      } catch (_e) {}
    });

    // Platform buttons in preview
    document.querySelectorAll('.platform-btn, .platform-item, .stat-card, .tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showToast(
          "Prévisualisation: ces actions nécessitent l'API chrome.* (extension).",
          'info'
        );
      });
      btn.classList.add('preview-disabled');
    });

    // Keep dropdown UI usable (open/close) in preview
    document.getElementById('importDropdownToggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleImportDropdown();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        this.hideImportDropdown();
      }
    });

    // Final UI update
    this.updateUI?.();
  }

  async ensureContentScript(tabId) {
    if (!this.isExtensionRuntime()) return false;
    try {
      const ping = await this.chrome.tabs.sendMessage(tabId, { type: 'PING' });
      if (ping?.success) return true;
    } catch (_e) {}

    try {
      await this.chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
    } catch (_e) {}

    try {
      await this.chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
    } catch (e) {
      console.error('[ShopOpti+] Failed to inject content script:', e);
      return false;
    }

    try {
      const ping = await this.chrome.tabs.sendMessage(tabId, { type: 'PING' });
      return !!ping?.success;
    } catch (_e) {
      return false;
    }
  }

  async init() {
    if (!this.isExtensionRuntime()) {
      this.initBrowserPreviewMode();
      return;
    }
    await this.loadStoredData();
    await this.checkConnection();
    await this.detectCurrentPage();
    this.bindEvents();
    this.updateUI();
    this.initTabs();
    this.initProfitCalculator();
    this.loadConnectedStores();
    this.updateSyncStatus();
    this.updateSourcingProductInfo();
    this.loadRecentImports();
  }

  async updateSyncStatus() {
    if (!this.isExtensionRuntime()) return;
    const lastSyncTimeEl = document.getElementById('lastSyncTime');
    const { lastSync } = await this.chrome.storage.local.get(['lastSync']);
    
    if (lastSyncTimeEl && lastSync) {
      const date = new Date(lastSync);
      lastSyncTimeEl.textContent = `Dernière sync: ${date.toLocaleTimeString('fr-FR')}`;
    }
  }

  async loadStoredData() {
    if (!this.isExtensionRuntime()) return;
    try {
      const result = await this.chrome.storage.local.get([
        'extensionToken', 'stats', 'activities', 'pendingItems', 'userPlan', 'importHistory'
      ]);
      
      this.extensionToken = result.extensionToken || null;
      this.stats = result.stats || { products: 0, reviews: 0, monitored: 0 };
      this.activities = result.activities || [];
      this.pendingItems = result.pendingItems || [];
      this.userPlan = result.userPlan || 'free';
      this.importHistory = result.importHistory || [];
    } catch (error) {
      console.error('[ShopOpti+] Error loading data:', error);
    }
  }

  async saveData() {
    if (!this.isExtensionRuntime()) return;
    try {
      await this.chrome.storage.local.set({
        stats: this.stats,
        activities: this.activities,
        pendingItems: this.pendingItems,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      console.error('[ShopOpti+] Error saving data:', error);
    }
  }

  async checkConnection() {
    if (!this.extensionToken) {
      this.isConnected = false;
      return;
    }

    try {
      const response = await fetch(`${this.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.extensionToken
        },
        body: JSON.stringify({ action: 'sync_status' })
      });

      this.isConnected = response.ok;
      
      if (response.ok) {
        const data = await response.json();
        if (data.todayStats) {
          this.stats = {
            products: data.todayStats.imports || data.todayStats.successful || 0,
            reviews: data.todayStats.reviews || 0,
            monitored: data.todayStats.monitored || 0
          };
        }
        if (data.userPlan && this.isExtensionRuntime()) {
          this.userPlan = data.userPlan;
          await this.chrome.storage.local.set({ userPlan: data.userPlan });
        }
      } else if (response.status === 401) {
        this.extensionToken = null;
        if (this.isExtensionRuntime()) {
          await this.chrome.storage.local.remove(['extensionToken']);
        }
        this.showToast('Token expiré, reconnectez-vous', 'warning');
      }
    } catch (error) {
      console.error('[ShopOpti+] Connection check failed:', error);
      this.isConnected = false;
    }
  }

  async detectCurrentPage() {
    if (!this.isExtensionRuntime()) return;
    try {
      const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) return;

      const url = new URL(tab.url);
      const hostname = url.hostname.toLowerCase();

      const platforms = {
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
        'taobao': { name: 'Taobao', icon: '🛍️', color: '#ff4400' },
        'cdiscount': { name: 'Cdiscount', icon: '🛒', color: '#e31837' },
        'fnac': { name: 'Fnac', icon: '📚', color: '#e4a600' },
        'shopify': { name: 'Shopify', icon: '🛍️', color: '#96bf48' },
        'myshopify': { name: 'Shopify', icon: '🛍️', color: '#96bf48' }
      };

      for (const [key, platform] of Object.entries(platforms)) {
        if (hostname.includes(key)) {
          this.currentPlatform = { ...platform, url: tab.url, hostname };
          break;
        }
      }
      
      if (!this.currentPlatform && tab.url.includes('/products/')) {
        this.currentPlatform = { name: 'Boutique', icon: '🛍️', color: '#96bf48', url: tab.url, hostname };
      }
    } catch (error) {
      console.error('[ShopOpti+] Error detecting page:', error);
    }
  }

  bindEvents() {
    // Header buttons
    document.getElementById('syncBtn')?.addEventListener('click', () => this.syncData());
    document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
    document.getElementById('dashboardBtn')?.addEventListener('click', () => this.openDashboard());

    // Connection
    document.getElementById('connectBtn')?.addEventListener('click', () => {
      if (this.isConnected) {
        this.disconnect();
      } else {
        this.openAuth();
      }
    });

    // Main actions - FIXED
    document.getElementById('importPageBtn')?.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown-toggle')) {
        this.importCurrentPage();
      }
    });
    document.getElementById('importAllBtn')?.addEventListener('click', () => this.importAllProducts());
    document.getElementById('importReviewsBtn')?.addEventListener('click', () => this.importReviews());
    document.getElementById('priceMonitorBtn')?.addEventListener('click', () => this.startPriceMonitor());

    // Import dropdown
    document.getElementById('importDropdownToggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleImportDropdown();
    });
    document.getElementById('importProductOnlyBtn')?.addEventListener('click', () => {
      this.hideImportDropdown();
      this.importCurrentPage();
    });
    document.getElementById('importReviewsOnlyBtn')?.addEventListener('click', () => {
      this.hideImportDropdown();
      this.importReviews();
    });
    document.getElementById('importCompleteBtn')?.addEventListener('click', () => {
      this.hideImportDropdown();
      this.importProductWithReviews();
    });

    // Progress modal
    document.getElementById('closeProgressBtn')?.addEventListener('click', () => this.hideProgressModal());
    document.getElementById('cancelImportBtn')?.addEventListener('click', () => this.cancelImport());
    document.getElementById('viewProductBtn')?.addEventListener('click', () => this.viewImportedProduct());

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.action-dropdown-container')) {
        this.hideImportDropdown();
      }
    });

    // Stats cards
    document.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', () => this.handleStatClick(card.dataset.action));
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Platform buttons - FIXED
    document.querySelectorAll('.platform-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const platform = btn.dataset.platform;
        if (platform) this.handlePlatformBulkImport(platform);
      });
    });

    // Platform items in modal - FIXED
    document.querySelectorAll('.platform-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const platform = btn.dataset.platform;
        if (platform) {
          this.handlePlatformBulkImport(platform);
          this.hideAllPlatformsModal();
        }
      });
    });

    // Show all platforms modal
    document.getElementById('showAllPlatformsBtn')?.addEventListener('click', () => this.showAllPlatformsModal());
    document.getElementById('closePlatformsModal')?.addEventListener('click', () => this.hideAllPlatformsModal());
    document.getElementById('allPlatformsModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'allPlatformsModal') this.hideAllPlatformsModal();
    });

    // Mapping
    document.getElementById('addRuleBtn')?.addEventListener('click', () => this.addMappingRule());
    document.getElementById('saveMappingBtn')?.addEventListener('click', () => this.saveMapping());
    document.getElementById('autoMapBtn')?.addEventListener('click', () => this.autoMapVariants());

    // Sync
    document.getElementById('syncAllBtn')?.addEventListener('click', () => this.syncAll());
    document.getElementById('syncStockBtn')?.addEventListener('click', () => this.syncStock());
    document.getElementById('syncPricesBtn')?.addEventListener('click', () => this.syncPrices());
    document.getElementById('addStoreBtn')?.addEventListener('click', () => this.addStore());
    document.getElementById('pushProductBtn')?.addEventListener('click', () => this.pushProduct());

    // Template buttons
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => this.loadTemplate(btn.dataset.template));
    });

    // Price suggestion buttons
    document.querySelectorAll('.price-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applySuggestedMargin(parseInt(btn.dataset.margin)));
    });

    // Activity
    document.getElementById('clearActivityBtn')?.addEventListener('click', () => this.clearActivity());

    // Footer
    document.getElementById('sendToAppBtn')?.addEventListener('click', () => this.sendToApp());
  }

  // === DROPDOWN MANAGEMENT ===
  toggleImportDropdown() {
    const menu = document.getElementById('importDropdownMenu');
    const toggle = document.getElementById('importDropdownToggle');
    if (menu) {
      menu.classList.toggle('hidden');
      toggle?.classList.toggle('open', !menu.classList.contains('hidden'));
    }
  }

  hideImportDropdown() {
    const menu = document.getElementById('importDropdownMenu');
    const toggle = document.getElementById('importDropdownToggle');
    if (menu) {
      menu.classList.add('hidden');
      toggle?.classList.remove('open');
    }
  }

  // === PROGRESS MODAL ===
  showProgressModal(productName = 'Chargement...') {
    const modal = document.getElementById('importProgressModal');
    const productNameEl = document.getElementById('progressProductName');
    const viewBtn = document.getElementById('viewProductBtn');
    
    if (modal) modal.classList.remove('hidden');
    if (productNameEl) productNameEl.textContent = productName;
    if (viewBtn) viewBtn.classList.add('hidden');
    
    this.updateProgress(0, { product: 'waiting', variants: '-', images: '-', reviews: '-' });
    this.importCancelled = false;
    this.lastImportedProduct = null;
  }

  hideProgressModal() {
    const modal = document.getElementById('importProgressModal');
    if (modal) modal.classList.add('hidden');
  }

  updateProgress(percentage, statuses = {}) {
    const bar = document.getElementById('importProgressBar');
    const percentEl = document.getElementById('progressPercentage');
    const ring = document.getElementById('importProgressRing');
    
    if (bar) bar.style.width = `${percentage}%`;
    if (percentEl) percentEl.textContent = `${Math.round(percentage)}%`;

    if (ring) {
      const r = 38;
      const circumference = 2 * Math.PI * r;
      const clamped = Math.max(0, Math.min(100, percentage));
      const offset = circumference - (clamped / 100) * circumference;
      ring.style.strokeDasharray = `${circumference}`;
      ring.style.strokeDashoffset = `${offset}`;
    }
    
    const statusMap = { 'product': 'productProgress', 'variants': 'variantsProgress', 'images': 'imagesProgress', 'reviews': 'reviewsProgress' };
    
    for (const [key, elementId] of Object.entries(statusMap)) {
      const el = document.getElementById(elementId);
      if (el && statuses[key] !== undefined) {
        const statusEl = el.querySelector('.progress-status');
        if (statusEl) {
          statusEl.textContent = statuses[key];
          statusEl.className = 'progress-status';
          if (statuses[key] === 'waiting') statusEl.classList.add('waiting');
          else if (statuses[key].includes('...')) statusEl.classList.add('processing');
          else if (statuses[key].includes('✓')) statusEl.classList.add('done');
          else if (statuses[key].includes('✗')) statusEl.classList.add('error');
        }
      }
    }
  }

  showImportComplete(product) {
    this.lastImportedProduct = product;
    this.updateProgress(100, {
      product: '✓ Importé',
      variants: product.variantCount ? `✓ ${product.variantCount}` : '✓',
      images: product.imageCount ? `✓ ${product.imageCount}` : '✓',
      reviews: product.reviewCount ? `✓ ${product.reviewCount}` : '-'
    });
    
    const viewBtn = document.getElementById('viewProductBtn');
    const cancelBtn = document.getElementById('cancelImportBtn');
    if (viewBtn) viewBtn.classList.remove('hidden');
    if (cancelBtn) cancelBtn.textContent = 'Fermer';
    
    const titleEl = document.querySelector('.progress-title');
    if (titleEl) titleEl.textContent = 'Import terminé!';
  }

  cancelImport() {
    this.importCancelled = true;
    this.hideProgressModal();
    this.showToast('Import annulé', 'info');
  }

  viewImportedProduct() {
    this.hideProgressModal();
    if (this.lastImportedProduct?.id) {
      if (this.isExtensionRuntime()) {
        this.chrome.tabs.create({ url: `${this.APP_URL}/products/${this.lastImportedProduct.id}` });
      } else {
        window.open(`${this.APP_URL}/products/${this.lastImportedProduct.id}`, '_blank');
      }
    } else {
      if (this.isExtensionRuntime()) {
        this.chrome.tabs.create({ url: `${this.APP_URL}/products` });
      } else {
        window.open(`${this.APP_URL}/products`, '_blank');
      }
    }
  }

  // === IMPORT FUNCTIONS ===
  async importCurrentPage() {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord à ShopOpti', 'warning');
      this.openAuth();
      return;
    }

    const btn = document.getElementById('importPageBtn');
    const originalContent = btn?.innerHTML;
    
    try {
      if (btn) {
        btn.innerHTML = '<div class="action-icon-wrapper"><span class="spinner"></span></div><div class="action-content"><span class="action-title">Import...</span><span class="action-desc">Patientez</span></div>';
        btn.disabled = true;
      }

      const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) throw new Error('URL non détectée');

      const response = await this.chrome.runtime.sendMessage({
        type: 'IMPORT_FROM_URL',
        url: tab.url
      });

      if (response?.success) {
        this.stats.products++;
        this.addActivity(`Produit importé: ${response.data?.product?.name || 'Nouveau'}`, '✅');
        this.showToast('Produit importé avec succès!', 'success');
        await this.saveData();
        this.updateUI();
        this.loadRecentImports();
      } else {
        throw new Error(response?.error || 'Échec de l\'import');
      }
    } catch (error) {
      console.error('[ShopOpti+] Import error:', error);
      this.showToast(`Erreur: ${error.message}`, 'error');
    } finally {
      if (btn) {
        btn.innerHTML = originalContent;
        btn.disabled = false;
      }
    }
  }

  async importAllProducts() {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord', 'warning');
      this.openAuth();
      return;
    }

    const btn = document.getElementById('importAllBtn');
    const originalContent = btn?.innerHTML;

    try {
      if (btn) {
        btn.innerHTML = '<div class="action-icon-wrapper"><span class="spinner"></span></div><div class="action-content"><span class="action-title">Scan...</span><span class="action-desc">Recherche</span></div>';
        btn.disabled = true;
      }

      const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error('Onglet non détecté');

      const ok = await this.ensureContentScript(tab.id);
      if (!ok) throw new Error('Rechargez la page puis réessayez');
      
      const response = await this.chrome.tabs.sendMessage(tab.id, { type: 'GET_ALL_PRODUCT_URLS' });

      if (response?.urls?.length > 0) {
        this.showToast(`${response.urls.length} produits trouvés. Import...`, 'info');
        
        let successCount = 0;
        const limit = Math.min(response.urls.length, 20);
        
        for (let i = 0; i < limit; i++) {
          try {
            const importResult = await this.chrome.runtime.sendMessage({
              type: 'IMPORT_FROM_URL',
              url: response.urls[i]
            });
            if (importResult?.success) successCount++;
          } catch (e) {}
        }
        
        this.stats.products += successCount;
        this.addActivity(`Import masse: ${successCount}/${limit}`, '📦');
        this.showToast(`${successCount} produits importés!`, 'success');
        await this.saveData();
        this.updateUI();
      } else {
        this.showToast('Aucun produit trouvé', 'warning');
      }
    } catch (error) {
      this.showToast(`Erreur: ${error.message}`, 'error');
    } finally {
      if (btn) {
        btn.innerHTML = originalContent;
        btn.disabled = false;
      }
    }
  }

  async importReviews() {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord', 'warning');
      return;
    }

    const btn = document.getElementById('importReviewsBtn');
    const originalContent = btn?.innerHTML;

    try {
      if (btn) {
        btn.innerHTML = '<div class="action-icon-wrapper"><span class="spinner"></span></div><div class="action-content"><span class="action-title">Import...</span><span class="action-desc">Avis</span></div>';
        btn.disabled = true;
      }

      const response = await this.chrome.runtime.sendMessage({
        type: 'IMPORT_REVIEWS',
        config: { limit: 50 }
      });

      if (response?.success) {
        this.stats.reviews += response.count || 0;
        this.addActivity(`${response.count || 0} avis importés`, '⭐');
        this.showToast(`${response.count || 0} avis importés!`, 'success');
        await this.saveData();
        this.updateUI();
      } else {
        this.showToast('Aucun avis trouvé', 'warning');
      }
    } catch (error) {
      this.showToast('Erreur import avis', 'error');
    } finally {
      if (btn) {
        btn.innerHTML = originalContent;
        btn.disabled = false;
      }
    }
  }

  async importProductWithReviews() {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord', 'warning');
      return;
    }

    const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    this.showProgressModal('Import complet...');
    
    try {
      this.updateProgress(10, { product: 'Import...', variants: 'Attente', images: 'Attente', reviews: 'Attente' });
      
      const response = await this.chrome.runtime.sendMessage({
        type: 'IMPORT_PRODUCT_WITH_REVIEWS',
        url: tab.url,
        reviewLimit: 50
      });

      if (this.importCancelled) return;

      if (response?.success) {
        const product = response.product || {};
        const reviewCount = response.reviews?.count || 0;
        
        this.stats.products++;
        this.stats.reviews += reviewCount;
        
        this.showImportComplete({
          id: product.id,
          title: product.title || product.name,
          variantCount: product.variantCount,
          imageCount: product.imageCount,
          reviewCount
        });
        
        const productNameEl = document.getElementById('progressProductName');
        if (productNameEl) productNameEl.textContent = product.title || 'Produit importé';
        
        this.addActivity(`Import complet: ${product.title || 'Produit'} + ${reviewCount} avis`, '🚀');
        this.showToast('Import complet réussi!', 'success');
        await this.saveData();
        this.updateUI();
        this.loadRecentImports();
      } else {
        throw new Error(response?.error || 'Échec');
      }
    } catch (error) {
      this.updateProgress(100, { product: '✗ Erreur', variants: '-', images: '-', reviews: '-' });
      this.showToast(`Erreur: ${error.message}`, 'error');
      setTimeout(() => this.hideProgressModal(), 2000);
    }
  }

  async startPriceMonitor() {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord', 'warning');
      return;
    }

    const btn = document.getElementById('priceMonitorBtn');
    const originalContent = btn?.innerHTML;

    try {
      if (btn) {
        btn.innerHTML = '<div class="action-icon-wrapper"><span class="spinner"></span></div><div class="action-content"><span class="action-title">Config...</span><span class="action-desc">Surveillance</span></div>';
        btn.disabled = true;
      }

      const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true });
      
      // Send to backend
      const response = await this.chrome.runtime.sendMessage({
        type: 'START_PRICE_MONITOR',
        url: tab?.url
      });

      this.stats.monitored++;
      this.addActivity('Surveillance prix activée', '📊');
      this.showToast('Surveillance des prix activée!', 'success');
      await this.saveData();
      this.updateUI();
    } catch (error) {
      this.showToast('Erreur surveillance', 'error');
    } finally {
      if (btn) {
        btn.innerHTML = originalContent;
        btn.disabled = false;
      }
    }
  }

  // === PLATFORM BULK IMPORT - FIXED ===
  async handlePlatformBulkImport(platform) {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }

    const platformUrls = {
      amazon: 'https://www.amazon.fr',
      aliexpress: 'https://www.aliexpress.com',
      cdiscount: 'https://www.cdiscount.com',
      ebay: 'https://www.ebay.fr',
      temu: 'https://www.temu.com',
      shein: 'https://fr.shein.com',
      fnac: 'https://www.fnac.com',
      shopify: 'https://www.myshopify.com',
      alibaba: 'https://www.alibaba.com',
      '1688': 'https://www.1688.com',
      dhgate: 'https://www.dhgate.com',
      banggood: 'https://www.banggood.com',
      cjdropshipping: 'https://www.cjdropshipping.com',
      wish: 'https://www.wish.com',
      zalando: 'https://www.zalando.fr',
      asos: 'https://www.asos.com',
      etsy: 'https://www.etsy.com',
      manomano: 'https://www.manomano.fr',
      leroymerlin: 'https://www.leroymerlin.fr',
      homedepot: 'https://www.homedepot.com',
      wayfair: 'https://www.wayfair.com',
      darty: 'https://www.darty.com',
      boulanger: 'https://www.boulanger.com',
      walmart: 'https://www.walmart.com',
      target: 'https://www.target.com',
      costco: 'https://www.costco.com',
      rakuten: 'https://www.rakuten.fr',
      bestbuy: 'https://www.bestbuy.com',
      newegg: 'https://www.newegg.com',
      overstock: 'https://www.overstock.com'
    };

    const platformNames = {
      amazon: 'Amazon', aliexpress: 'AliExpress', cdiscount: 'Cdiscount',
      ebay: 'eBay', temu: 'Temu', shein: 'Shein', fnac: 'Fnac',
      shopify: 'Shopify', alibaba: 'Alibaba', '1688': '1688',
      dhgate: 'DHgate', banggood: 'Banggood', cjdropshipping: 'CJ',
      wish: 'Wish', zalando: 'Zalando', asos: 'ASOS', etsy: 'Etsy',
      manomano: 'ManoMano', leroymerlin: 'Leroy Merlin', homedepot: 'Home Depot',
      wayfair: 'Wayfair', darty: 'Darty', boulanger: 'Boulanger',
      walmart: 'Walmart', target: 'Target', costco: 'Costco',
      rakuten: 'Rakuten', bestbuy: 'Best Buy', newegg: 'Newegg', overstock: 'Overstock'
    };

    const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true });
    const currentUrl = tab?.url?.toLowerCase() || '';
    
    const isOnPlatform = currentUrl.includes(platform) || (platform === 'shopify' && currentUrl.includes('myshopify'));

    if (isOnPlatform) {
      if (!this.isConnected) {
        this.showToast('Connectez-vous d\'abord', 'warning');
        this.openAuth();
        return;
      }

      this.showToast(`Mode import ${platformNames[platform]} activé!`, 'success');
      
      try {
        const ok = await this.ensureContentScript(tab.id);
        if (!ok) {
          this.showToast('Rechargez la page', 'error');
          return;
        }

        await this.chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_BULK_MODE', platform });
        this.addActivity(`Import masse: ${platformNames[platform]}`, '📦');
        window.close();
      } catch (error) {
        this.showToast('Erreur activation', 'error');
      }
    } else {
      const url = platformUrls[platform];
      if (url) {
        this.showToast(`Ouverture ${platformNames[platform]}...`, 'info');
        this.chrome.tabs.create({ url });
      }
    }
  }

  showAllPlatformsModal() {
    const modal = document.getElementById('allPlatformsModal');
    if (modal) modal.classList.remove('hidden');
  }

  hideAllPlatformsModal() {
    const modal = document.getElementById('allPlatformsModal');
    if (modal) modal.classList.add('hidden');
  }

  // === UI FUNCTIONS ===
  async syncData() {
    const btn = document.getElementById('syncBtn');
    if (btn) btn.classList.add('spinning');

    try {
      await this.checkConnection();
      await this.saveData();
      this.showToast('Synchronisation réussie!', 'success');
    } catch (error) {
      this.showToast('Erreur sync', 'error');
    } finally {
      if (btn) btn.classList.remove('spinning');
    }
  }

  openSettings() {
    if (this.isExtensionRuntime()) {
      this.chrome.tabs.create({ url: `${this.APP_URL}/settings` });
    } else {
      window.open(`${this.APP_URL}/settings`, '_blank');
    }
  }

  openDashboard() {
    if (this.isExtensionRuntime()) {
      this.chrome.tabs.create({ url: `${this.APP_URL}/dashboard` });
    } else {
      window.open(`${this.APP_URL}/dashboard`, '_blank');
    }
  }

  openAuth() {
    if (this.isExtensionRuntime()) {
      this.chrome.tabs.create({ url: this.chrome.runtime.getURL('auth.html') });
    } else {
      window.open(`${this.APP_URL}/extensions/chrome`, '_blank');
    }
  }

  async disconnect() {
    if (this.isExtensionRuntime()) {
      await this.chrome.storage.local.remove(['extensionToken']);
    }
    this.extensionToken = null;
    this.isConnected = false;
    this.updateUI();
    this.showToast('Déconnecté', 'info');
  }

  sendToApp() {
    if (this.isExtensionRuntime()) {
      this.chrome.tabs.create({ url: `${this.APP_URL}/dashboard` });
    } else {
      window.open(`${this.APP_URL}/dashboard`, '_blank');
    }
  }

  handleStatClick(action) {
    const routes = { products: '/products', reviews: '/reviews', monitoring: '/price-monitoring' };
    if (this.isExtensionRuntime()) {
      this.chrome.tabs.create({ url: `${this.APP_URL}${routes[action] || '/dashboard'}` });
    } else {
      window.open(`${this.APP_URL}${routes[action] || '/dashboard'}`, '_blank');
    }
  }

  // === TABS & PROFIT ===
  initTabs() {
    this.switchTab('main');
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));

    const panels = { 'profit': 'profitTab', 'variants': 'variantsTab', 'sync': 'syncTab' };
    if (panels[tabName]) {
      const panel = document.getElementById(panels[tabName]);
      if (panel) panel.classList.remove('hidden');
    }

    const mainSections = ['.actions-section', '.platforms-section', '.activity-section'];
    mainSections.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) section.style.display = tabName === 'main' ? 'block' : 'none';
    });
  }

  initProfitCalculator() {
    ['costPrice', 'shippingCost', 'marketplaceFees', 'transactionFee', 'sellingPrice', 'estimatedQty'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.calculateProfit());
    });
  }

  calculateProfit() {
    const cost = parseFloat(document.getElementById('costPrice')?.value) || 0;
    const shipping = parseFloat(document.getElementById('shippingCost')?.value) || 0;
    const fees = parseFloat(document.getElementById('marketplaceFees')?.value) || 0;
    const txFee = parseFloat(document.getElementById('transactionFee')?.value) || 0;
    const price = parseFloat(document.getElementById('sellingPrice')?.value) || 0;
    const qty = parseInt(document.getElementById('estimatedQty')?.value) || 1;

    const totalCost = cost + shipping + fees;
    const txCost = price * (txFee / 100);
    const profit = price - totalCost - txCost;
    const margin = price > 0 ? (profit / price) * 100 : 0;
    const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

    const profitEl = document.getElementById('profitPerUnit');
    const marginEl = document.getElementById('marginPercent');
    const roiEl = document.getElementById('roiPercent');
    const totalEl = document.getElementById('totalProfit');

    if (profitEl) {
      profitEl.textContent = `${profit.toFixed(2)} €`;
      profitEl.classList.toggle('negative', profit < 0);
    }
    if (marginEl) marginEl.textContent = `${margin.toFixed(1)}%`;
    if (roiEl) roiEl.textContent = `${roi.toFixed(1)}%`;
    if (totalEl) totalEl.textContent = `${(profit * qty).toFixed(2)} €`;
  }

  applySuggestedMargin(marginPercent) {
    const cost = parseFloat(document.getElementById('costPrice')?.value) || 0;
    const shipping = parseFloat(document.getElementById('shippingCost')?.value) || 0;
    const total = cost + shipping;

    if (total > 0) {
      const suggested = total * (1 + marginPercent / 100);
      const input = document.getElementById('sellingPrice');
      if (input) {
        input.value = suggested.toFixed(2);
        this.calculateProfit();
      }
    }
  }

  // === MAPPING ===
  loadTemplate(template) {
    const templates = {
      'sizes-eu': [
        { source: 'S', target: 'EU 36-38' }, { source: 'M', target: 'EU 38-40' },
        { source: 'L', target: 'EU 40-42' }, { source: 'XL', target: 'EU 42-44' }
      ],
      'sizes-us': [
        { source: 'S', target: 'US 4-6' }, { source: 'M', target: 'US 8-10' },
        { source: 'L', target: 'US 12-14' }, { source: 'XL', target: 'US 16-18' }
      ],
      'colors': [
        { source: 'Red', target: 'Rouge' }, { source: 'Blue', target: 'Bleu' },
        { source: 'Green', target: 'Vert' }, { source: 'Black', target: 'Noir' }
      ]
    };
    
    const rules = templates[template];
    const container = document.getElementById('mappingRules');
    if (container && rules) {
      container.innerHTML = rules.map((r, i) => `
        <div class="mapping-rule" data-index="${i}">
          <input type="text" class="rule-source" value="${r.source}" placeholder="Source">
          <span class="rule-arrow">→</span>
          <input type="text" class="rule-target" value="${r.target}" placeholder="Cible">
          <button class="rule-delete" onclick="this.parentElement.remove()">×</button>
        </div>
      `).join('');
      this.showToast(`Template chargé: ${rules.length} règles`, 'success');
    }
  }

  addMappingRule() {
    const container = document.getElementById('mappingRules');
    if (!container) return;
    
    container.querySelector('.mapping-empty')?.remove();
    container.insertAdjacentHTML('beforeend', `
      <div class="mapping-rule">
        <input type="text" class="rule-source" placeholder="Source">
        <span class="rule-arrow">→</span>
        <input type="text" class="rule-target" placeholder="Cible">
        <button class="rule-delete" onclick="this.parentElement.remove()">×</button>
      </div>
    `);
  }

  async saveMapping() {
    if (!this.isExtensionRuntime()) return;
    const container = document.getElementById('mappingRules');
    if (!container) return;
    
    const rules = [];
    container.querySelectorAll('.mapping-rule').forEach(el => {
      const source = el.querySelector('.rule-source')?.value?.trim();
      const target = el.querySelector('.rule-target')?.value?.trim();
      if (source && target) rules.push({ source, target });
    });
    
    await this.chrome.storage.local.set({ variantMappingRules: rules });
    this.showToast(`${rules.length} règles sauvegardées`, 'success');
  }

  async autoMapVariants() {
    this.showToast('Auto-mapping IA...', 'info');
    setTimeout(() => {
      this.loadTemplate('sizes-eu');
      this.showToast('Auto-mapping terminé!', 'success');
    }, 1000);
  }

  // === SYNC ===
  async syncAll() {
    this.showToast('Synchronisation complète...', 'info');
    await this.checkConnection();
    await this.saveData();
    this.showToast('Sync complète réussie!', 'success');
    this.addActivity('Sync complète', '🔄');
  }

  async syncStock() {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }
    this.showToast('Sync stock...', 'info');
    try {
      await this.chrome.runtime.sendMessage({ type: 'CHECK_STOCK' });
      this.showToast('Stock synchronisé!', 'success');
      this.addActivity('Sync stock', '📦');
    } catch (e) {
      this.showToast('Erreur sync stock', 'error');
    }
  }

  async syncPrices() {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }
    this.showToast('Sync prix...', 'info');
    try {
      await this.chrome.runtime.sendMessage({ type: 'CHECK_PRICES' });
      this.showToast('Prix synchronisés!', 'success');
      this.addActivity('Sync prix', '💰');
    } catch (e) {
      this.showToast('Erreur sync prix', 'error');
    }
  }

  addStore() {
    if (this.isExtensionRuntime()) {
      this.chrome.tabs.create({ url: `${this.APP_URL}/stores/connect` });
    } else {
      window.open(`${this.APP_URL}/stores/connect`, '_blank');
    }
  }

  async loadConnectedStores() {
    if (!this.isExtensionRuntime()) return;
    try {
      const { connectedStores } = await this.chrome.storage.local.get(['connectedStores']);
      const list = document.getElementById('storesList');
      if (!list) return;
      
      if (connectedStores?.length > 0) {
        list.innerHTML = connectedStores.map(store => `
          <div class="store-item">
            <span class="store-icon">${store.type === 'shopify' ? '🛍️' : '🏪'}</span>
            <div class="store-info">
              <span class="store-name">${store.name}</span>
              <span class="store-type">${store.type}</span>
            </div>
            <span class="store-status ${store.status}">${store.status === 'connected' ? '✓' : '!'}</span>
          </div>
        `).join('');
      }
    } catch (e) {}
  }

  async pushProduct() {
    if (!this.isExtensionRuntime()) {
      this.showToast("Disponible uniquement dans l'extension Chrome", 'warning');
      return;
    }
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord', 'warning');
      return;
    }
    
    const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      this.showToast('Publication...', 'info');
      const response = await this.chrome.runtime.sendMessage({ type: 'IMPORT_FROM_URL', url: tab.url });
      
      if (response?.success) {
        this.showToast('Produit publié!', 'success');
        this.addActivity('Produit publié', '🚀');
      } else {
        this.showToast(response?.error || 'Erreur', 'error');
      }
    } catch (e) {
      this.showToast('Erreur publication', 'error');
    }
  }

  // === UI UPDATE ===
  updateUI() {
    const statusBar = document.getElementById('connectionStatus');
    const statusText = statusBar?.querySelector('.status-text');
    const connectBtn = document.getElementById('connectBtn');

    if (statusBar) statusBar.className = `status-bar ${this.isConnected ? 'connected' : 'disconnected'}`;
    if (statusText) statusText.textContent = this.isConnected ? 'Connecté à ShopOpti' : 'Non connecté';
    if (connectBtn) {
      // Use textContent instead of innerHTML (XSS safe)
      connectBtn.textContent = '';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('width', '14');
      svg.setAttribute('height', '14');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      
      const span = document.createElement('span');
      
      if (this.isConnected) {
        svg.innerHTML = '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>';
        span.textContent = 'Deconnecter';
      } else {
        svg.innerHTML = '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>';
        span.textContent = 'Connecter';
      }
      
      connectBtn.appendChild(svg);
      connectBtn.appendChild(span);
    }

    // Plan badge
    const planBadge = document.getElementById('planBadge');
    if (planBadge) {
      const names = { free: 'Free', starter: 'Starter', pro: 'Pro', ultra_pro: 'Ultra Pro' };
      planBadge.textContent = names[this.userPlan] || 'Free';
      planBadge.className = `plan-badge ${['pro', 'ultra_pro'].includes(this.userPlan) ? 'pro' : ''}`;
    }

    // Stats
    const todayProducts = document.getElementById('todayProducts');
    const todayReviews = document.getElementById('todayReviews');
    const monitoredCount = document.getElementById('monitoredCount');
    if (todayProducts) todayProducts.textContent = this.stats.products || 0;
    if (todayReviews) todayReviews.textContent = this.stats.reviews || 0;
    if (monitoredCount) monitoredCount.textContent = this.stats.monitored || 0;

    // Page info
    if (this.currentPlatform) {
      const pageInfo = document.getElementById('pageInfo');
      if (pageInfo) {
        pageInfo.classList.remove('hidden');
        const iconEl = pageInfo.querySelector('.page-icon');
        const platformEl = pageInfo.querySelector('.page-platform');
        const urlEl = pageInfo.querySelector('.page-url');
        if (iconEl) iconEl.textContent = this.currentPlatform.icon;
        if (platformEl) platformEl.textContent = this.currentPlatform.name;
        if (urlEl) urlEl.textContent = this.currentPlatform.hostname;
      }
    }

    this.renderActivities();
  }

  renderActivities() {
    const list = document.getElementById('activityList');
    if (!list) return;

    // Clear existing content safely
    list.textContent = '';

    if (this.activities.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      
      const emptyIcon = document.createElement('span');
      emptyIcon.className = 'empty-icon';
      emptyIcon.textContent = '📭';
      
      const emptyText = document.createElement('span');
      emptyText.className = 'empty-text';
      emptyText.textContent = 'Aucune activite';
      
      emptyState.appendChild(emptyIcon);
      emptyState.appendChild(emptyText);
      list.appendChild(emptyState);
      return;
    }

    this.activities.slice(0, 5).forEach((a, i) => {
      const item = document.createElement('div');
      item.className = 'activity-item';
      
      const icon = document.createElement('span');
      icon.className = 'activity-icon';
      icon.textContent = a.icon || '📦';
      
      const content = document.createElement('div');
      content.className = 'activity-content';
      
      const title = document.createElement('div');
      title.className = 'activity-title';
      title.textContent = a.title;
      
      const meta = document.createElement('div');
      meta.className = 'activity-meta';
      meta.textContent = this.formatTime(a.timestamp);
      
      content.appendChild(title);
      content.appendChild(meta);
      
      const actionBtn = document.createElement('button');
      actionBtn.className = 'activity-action';
      actionBtn.dataset.index = i;
      actionBtn.textContent = '×';
      actionBtn.addEventListener('click', () => this.removeActivity(i));
      
      item.appendChild(icon);
      item.appendChild(content);
      item.appendChild(actionBtn);
      list.appendChild(item);
    });
      </div>
    `).join('');

    list.querySelectorAll('.activity-action').forEach(btn => {
      btn.addEventListener('click', (e) => this.removeActivity(parseInt(e.target.dataset.index)));
    });
  }

  formatTime(timestamp) {
    if (!timestamp) return '';
    const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (diff < 60) return 'À l\'instant';
    if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`;
    return new Date(timestamp).toLocaleDateString('fr-FR');
  }

  addActivity(title, icon = '📦') {
    this.activities.unshift({ title, icon, timestamp: new Date().toISOString() });
    this.activities = this.activities.slice(0, 20);
    this.saveData();
    this.renderActivities();
  }

  removeActivity(index) {
    this.activities.splice(index, 1);
    this.saveData();
    this.renderActivities();
  }

  clearActivity() {
    this.activities = [];
    this.saveData();
    this.renderActivities();
  }

  // === RECENT IMPORTS ===
  async loadRecentImports() {
    if (!this.isExtensionRuntime()) return;
    const { recentImports } = await this.chrome.storage.local.get(['recentImports']);
    const list = document.getElementById('recentImportsList');
    if (!list) return;
    
    const imports = recentImports || [];
    
    if (imports.length === 0) {
      list.innerHTML = '<div class="empty-state small"><span class="empty-icon">📦</span><span class="empty-text">Aucun import récent</span></div>';
      return;
    }
    
    list.innerHTML = imports.slice(0, 5).map(item => `
      <div class="recent-import-item" data-id="${item.id || ''}">
        <img src="${item.image || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><rect fill="%231e2438" width="36" height="36"/></svg>'}" class="recent-import-thumb" alt="" onerror="this.style.display='none'"/>
        <div class="recent-import-info">
          <span class="recent-import-title">${item.title || 'Produit'}</span>
          <span class="recent-import-meta">${this.formatTime(item.timestamp)}</span>
        </div>
        <span class="recent-import-status ${item.status}">${item.status === 'success' ? '✓' : '!'}</span>
      </div>
    `).join('');
  }

  // === SOURCING ===
  async initSourcingTab() {
    document.getElementById('findSupplierBtn')?.addEventListener('click', () => this.findSuppliers());
    document.querySelectorAll('.platform-chip').forEach(chip => {
      chip.addEventListener('click', () => chip.classList.toggle('active'));
    });
  }

  async updateSourcingProductInfo() {
    if (!this.isExtensionRuntime()) return;
    const [tab] = await this.chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    try {
      const injected = await this.ensureContentScript(tab.id);
      if (injected) {
        const result = await this.chrome.tabs.sendMessage(tab.id, { type: 'GET_PRODUCT_DATA' });
        if (result?.product) {
          this.currentSourcingProduct = result.product;
          const titleEl = document.getElementById('sourcingProductTitle');
          const priceEl = document.getElementById('sourcingProductPrice');
          const findBtn = document.getElementById('findSupplierBtn');
          if (titleEl) titleEl.textContent = result.product.title || 'Produit';
          if (priceEl) priceEl.textContent = result.product.price ? `${result.product.price} €` : '--';
          if (findBtn) findBtn.disabled = false;
          return;
        }
      }
    } catch (e) {}

    const titleEl = document.getElementById('sourcingProductTitle');
    const findBtn = document.getElementById('findSupplierBtn');
    if (titleEl) titleEl.textContent = 'Chargez une page produit';
    if (findBtn) findBtn.disabled = true;
  }

  async findSuppliers() {
    if (!this.currentSourcingProduct) {
      this.showToast('Ouvrez une page produit', 'warning');
      return;
    }

    const btn = document.getElementById('findSupplierBtn');
    const container = document.getElementById('sourcingResults');

    if (btn) btn.innerHTML = '<span class="spinner"></span> Recherche...';
    if (container) container.innerHTML = '<div class="sourcing-loading"><span class="spinner"></span><span>Recherche fournisseurs...</span></div>';

    try {
      const response = await fetch(`${this.API_URL}/find-supplier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productTitle: this.currentSourcingProduct.title,
          productImage: this.currentSourcingProduct.image,
          productPrice: parseFloat(this.currentSourcingProduct.price) || 0
        })
      });

      const data = await response.json();
      if (data.suppliers?.length > 0) {
        container.innerHTML = data.suppliers.map(s => `
          <div class="supplier-card">
            <span class="supplier-platform">${s.platform}</span>
            <span class="supplier-price">${s.currency}${s.price}</span>
            <a href="${s.url}" target="_blank" class="supplier-link">→</a>
          </div>
        `).join('');
        this.showToast(`${data.suppliers.length} fournisseurs trouvés!`, 'success');
      } else {
        container.innerHTML = '<div class="empty-state"><span>Aucun fournisseur trouvé</span></div>';
      }
    } catch (e) {
      container.innerHTML = '<div class="empty-state error"><span>Erreur recherche</span></div>';
    } finally {
      if (btn) btn.innerHTML = '🔍 Trouver Fournisseurs';
    }
  }

  // === TOAST ===
  showToast(message, type = 'info') {
    document.querySelector('.toast')?.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const popup = new ShopOptiPopup();
  window.popup = popup;
  popup.init();
  popup.initSourcingTab();
});

// Toast styles
const style = document.createElement('style');
style.textContent = `
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: #1e2438;
    border: 1px solid #3b4461;
    border-radius: 12px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s ease;
  }
  .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }
  .toast.success { border-color: #10b981; }
  .toast.error { border-color: #ef4444; }
  .toast.warning { border-color: #f59e0b; }
  .toast-message { font-size: 13px; font-weight: 500; color: #f1f5f9; }
  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinning svg { animation: spin 1s linear infinite; }
`;
document.head.appendChild(style);
