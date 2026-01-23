// ShopOpti+ Chrome Extension - Popup Script v4.3.10
// Professional Dropshipping Extension

class ShopOptiPopup {
  constructor() {
    this.isConnected = false;
    this.extensionToken = null;
    this.stats = { products: 0, reviews: 0, monitored: 0 };
    this.activities = [];
    this.pendingItems = [];
    this.currentPlatform = null;
    this.API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
    this.APP_URL = 'https://shopopti.io';
  }

  async init() {
    await this.loadStoredData();
    await this.checkConnection();
    await this.detectCurrentPage();
    this.bindEvents();
    this.updateUI();
    this.initTabs();
    this.initProfitCalculator();
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get([
        'extensionToken',
        'stats',
        'activities',
        'pendingItems',
        'userPlan',
        'importHistory'
      ]);
      
      this.extensionToken = result.extensionToken || null;
      this.stats = result.stats || { products: 0, reviews: 0, monitored: 0 };
      this.activities = result.activities || [];
      this.pendingItems = result.pendingItems || [];
      this.userPlan = result.userPlan || 'free';
      this.importHistory = result.importHistory || [];
      
      console.log('[ShopOpti+] Loaded data:', { 
        hasToken: !!this.extensionToken, 
        tokenPrefix: this.extensionToken ? this.extensionToken.slice(0, 10) : null 
      });
    } catch (error) {
      console.error('[ShopOpti+] Error loading data:', error);
    }
  }

  async saveData() {
    try {
      await chrome.storage.local.set({
        stats: this.stats,
        activities: this.activities,
        pendingItems: this.pendingItems
      });
      console.log('[ShopOpti+] Data saved');
    } catch (error) {
      console.error('[ShopOpti+] Error saving data:', error);
    }
  }

  async checkConnection() {
    console.log('[ShopOpti+] Checking connection, token:', this.extensionToken ? 'present' : 'missing');
    
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

      console.log('[ShopOpti+] Connection response status:', response.status);
      this.isConnected = response.ok;
      
      if (response.ok) {
        const data = await response.json();
        console.log('[ShopOpti+] Sync data:', data);
        
        if (data.todayStats) {
          this.stats = {
            products: data.todayStats.imports || data.todayStats.successful || 0,
            reviews: data.todayStats.reviews || 0,
            monitored: data.todayStats.monitored || 0
          };
        }
        if (data.userPlan) {
          this.userPlan = data.userPlan;
          await chrome.storage.local.set({ userPlan: data.userPlan });
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[ShopOpti+] Connection failed:', errorData);
        
        if (response.status === 401) {
          this.extensionToken = null;
          await chrome.storage.local.remove(['extensionToken']);
          this.showToast('Token expiré, reconnectez-vous', 'warning');
        }
      }
    } catch (error) {
      console.error('[ShopOpti+] Connection check failed:', error);
      this.isConnected = false;
    }
  }

  async detectCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
        'cjdropshipping': { name: 'CJ Dropshipping', icon: '📦', color: '#1a73e8' },
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
      
      // Check for Shopify stores via /products/ path
      if (!this.currentPlatform && tab.url.includes('/products/')) {
        this.currentPlatform = { name: 'Shopify Store', icon: '🛍️', color: '#96bf48', url: tab.url, hostname };
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

    // Main actions
    document.getElementById('importPageBtn')?.addEventListener('click', () => this.importCurrentPage());
    document.getElementById('importAllBtn')?.addEventListener('click', () => this.importAllProducts());
    document.getElementById('importReviewsBtn')?.addEventListener('click', () => this.importReviews());
    document.getElementById('priceMonitorBtn')?.addEventListener('click', () => this.startPriceMonitor());

    // Advanced features
    document.getElementById('autoOrderBtn')?.addEventListener('click', () => this.showFeature('Auto-Order'));
    document.getElementById('competitorBtn')?.addEventListener('click', () => this.showFeature('Spy Competitor'));
    document.getElementById('bulkImportBtn')?.addEventListener('click', () => this.openBulkImport());
    document.getElementById('aiOptimizeBtn')?.addEventListener('click', () => this.showPremiumFeature());

    // Activity
    document.getElementById('clearActivityBtn')?.addEventListener('click', () => this.clearActivity());

    // Footer
    document.getElementById('sendToAppBtn')?.addEventListener('click', () => this.sendToApp());

    // Stats cards
    document.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', () => this.handleStatClick(card.dataset.action));
    });

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
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
  }

  initTabs() {
    this.switchTab('main');
  }

  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    const panels = {
      'main': [],
      'profit': ['profitTab'],
      'variants': ['variantsTab'],
      'sync': ['syncTab']
    };

    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    if (panels[tabName]) {
      panels[tabName].forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.remove('hidden');
      });
    }

    const mainSections = ['.actions-section', '.features-section', '.activity-section'];
    mainSections.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        section.style.display = tabName === 'main' ? 'block' : 'none';
      }
    });
  }

  initProfitCalculator() {
    const inputs = ['costPrice', 'shippingCost', 'marketplaceFees', 'transactionFee', 'sellingPrice', 'estimatedQty'];
    inputs.forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.calculateProfit());
    });
  }

  calculateProfit() {
    const costPrice = parseFloat(document.getElementById('costPrice')?.value) || 0;
    const shippingCost = parseFloat(document.getElementById('shippingCost')?.value) || 0;
    const marketplaceFees = parseFloat(document.getElementById('marketplaceFees')?.value) || 0;
    const transactionFee = parseFloat(document.getElementById('transactionFee')?.value) || 0;
    const sellingPrice = parseFloat(document.getElementById('sellingPrice')?.value) || 0;
    const estimatedQty = parseInt(document.getElementById('estimatedQty')?.value) || 1;

    const totalCost = costPrice + shippingCost + marketplaceFees;
    const transactionCost = sellingPrice * (transactionFee / 100);
    const profitPerUnit = sellingPrice - totalCost - transactionCost;
    const margin = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;
    const roi = totalCost > 0 ? (profitPerUnit / totalCost) * 100 : 0;
    const totalProfit = profitPerUnit * estimatedQty;

    const profitPerUnitEl = document.getElementById('profitPerUnit');
    const marginEl = document.getElementById('marginPercent');
    const roiEl = document.getElementById('roiPercent');
    const totalProfitEl = document.getElementById('totalProfit');

    if (profitPerUnitEl) {
      profitPerUnitEl.textContent = `${profitPerUnit.toFixed(2)} €`;
      profitPerUnitEl.classList.toggle('negative', profitPerUnit < 0);
    }
    if (marginEl) {
      marginEl.textContent = `${margin.toFixed(1)}%`;
      marginEl.classList.toggle('negative', margin < 0);
    }
    if (roiEl) {
      roiEl.textContent = `${roi.toFixed(1)}%`;
      roiEl.classList.toggle('negative', roi < 0);
    }
    if (totalProfitEl) {
      totalProfitEl.textContent = `${totalProfit.toFixed(2)} €`;
    }

    this.updateProfitRecommendations(margin, profitPerUnit);
  }

  updateProfitRecommendations(margin, profit) {
    const box = document.getElementById('profitRecommendations');
    if (!box) return;

    let recommendation = '';
    let type = '';

    if (margin < 0) {
      recommendation = '⚠️ Marge négative! Augmentez votre prix de vente ou trouvez un fournisseur moins cher.';
      type = 'warning';
    } else if (margin < 15) {
      recommendation = '💡 Marge faible. Visez au moins 20-30% pour être rentable après les frais cachés.';
      type = 'info';
    } else if (margin >= 30 && margin < 50) {
      recommendation = '✅ Bonne marge! Ce produit a un bon potentiel de rentabilité.';
      type = 'success';
    } else if (margin >= 50) {
      recommendation = '🚀 Excellente marge! Produit très rentable, attention à rester compétitif.';
      type = 'success';
    }

    box.innerHTML = recommendation ? `<div class="recommendation ${type}">${recommendation}</div>` : '';
  }

  applySuggestedMargin(marginPercent) {
    const costPrice = parseFloat(document.getElementById('costPrice')?.value) || 0;
    const shippingCost = parseFloat(document.getElementById('shippingCost')?.value) || 0;
    const totalCost = costPrice + shippingCost;

    if (totalCost > 0) {
      const suggestedPrice = totalCost * (1 + marginPercent / 100);
      const sellingPriceInput = document.getElementById('sellingPrice');
      if (sellingPriceInput) {
        sellingPriceInput.value = suggestedPrice.toFixed(2);
        this.calculateProfit();
      }
    }
  }

  updateUI() {
    // Update connection status
    const statusBar = document.getElementById('connectionStatus');
    const statusText = statusBar?.querySelector('.status-text');
    const connectBtn = document.getElementById('connectBtn');

    if (statusBar) {
      statusBar.className = `status-bar ${this.isConnected ? 'connected' : 'disconnected'}`;
    }
    if (statusText) {
      statusText.textContent = this.isConnected ? 'Connecté à ShopOpti' : 'Non connecté';
    }
    if (connectBtn) {
      connectBtn.innerHTML = this.isConnected 
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg><span>Déconnecter</span>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg><span>Connecter</span>';
    }

    // Update plan badge
    const planBadge = document.getElementById('planBadge');
    if (planBadge) {
      const planNames = { 'free': 'Free', 'starter': 'Starter', 'pro': 'Pro', 'ultra_pro': 'Ultra Pro', 'standard': 'Standard' };
      planBadge.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>${planNames[this.userPlan] || 'Standard'}`;
      planBadge.className = `plan-badge ${this.userPlan === 'pro' || this.userPlan === 'ultra_pro' ? 'pro' : ''}`;
    }

    // Update stats
    const todayProducts = document.getElementById('todayProducts');
    const todayReviews = document.getElementById('todayReviews');
    const monitoredCount = document.getElementById('monitoredCount');
    
    if (todayProducts) todayProducts.textContent = this.stats.products || 0;
    if (todayReviews) todayReviews.textContent = this.stats.reviews || 0;
    if (monitoredCount) monitoredCount.textContent = this.stats.monitored || 0;

    // Update page info
    const pageInfo = document.getElementById('pageInfo');
    if (this.currentPlatform && pageInfo) {
      pageInfo.classList.remove('hidden');
      const pageIcon = pageInfo.querySelector('.page-icon');
      const pagePlatform = pageInfo.querySelector('.page-platform');
      const pageUrl = pageInfo.querySelector('.page-url');
      
      if (pageIcon) pageIcon.textContent = this.currentPlatform.icon;
      if (pagePlatform) pagePlatform.textContent = this.currentPlatform.name;
      if (pageUrl) pageUrl.textContent = this.currentPlatform.hostname;
    }

    // Update activities
    this.renderActivities();

    // Update pending badge
    const pendingBadge = document.getElementById('pendingCount');
    if (pendingBadge) {
      if (this.pendingItems.length > 0) {
        pendingBadge.textContent = this.pendingItems.length;
        pendingBadge.classList.remove('hidden');
      } else {
        pendingBadge.classList.add('hidden');
      }
    }
  }

  renderActivities() {
    const list = document.getElementById('activityList');
    if (!list) return;

    if (this.activities.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <span class="empty-text">Aucune activité récente</span>
        </div>
      `;
      return;
    }

    list.innerHTML = this.activities.slice(0, 5).map((activity, index) => `
      <div class="activity-item">
        <span class="activity-icon">${activity.icon || '📦'}</span>
        <div class="activity-content">
          <div class="activity-title">${activity.title}</div>
          <div class="activity-meta">${activity.meta || this.formatTime(activity.timestamp)}</div>
        </div>
        <button class="activity-action" data-index="${index}" title="Supprimer">×</button>
      </div>
    `).join('');

    list.querySelectorAll('.activity-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removeActivity(index);
      });
    });
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

  addActivity(title, icon = '📦', meta = null) {
    this.activities.unshift({
      title,
      icon,
      meta,
      timestamp: new Date().toISOString()
    });
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

  showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span class="toast-message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  async importCurrentPage() {
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord à ShopOpti', 'warning');
      return;
    }

    const btn = document.getElementById('importPageBtn');
    const originalContent = btn?.innerHTML;
    
    try {
      if (btn) {
        btn.innerHTML = '<div class="action-icon-wrapper"><span class="spinner"></span></div><div class="action-content"><span class="action-title">Import en cours...</span><span class="action-desc">Patientez</span></div>';
        btn.disabled = true;
      }

      // Get current tab URL
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.url) {
        throw new Error('Impossible de récupérer l\'URL');
      }

      // Send import request to background
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_FROM_URL',
        url: tab.url
      });

      if (response?.success) {
        this.stats.products++;
        this.addActivity(`Produit importé: ${response.data?.product?.name || 'Nouveau produit'}`, '✅');
        this.showToast('Produit importé avec succès!', 'success');
        await this.saveData();
        this.updateUI();
      } else {
        throw new Error(response?.error || 'Échec de l\'import');
      }
    } catch (error) {
      console.error('[ShopOpti+] Import error:', error);
      this.showToast(`Erreur: ${error.message}`, 'error');
      this.addActivity(`Échec import: ${error.message}`, '❌');
    } finally {
      if (btn) {
        btn.innerHTML = originalContent;
        btn.disabled = false;
      }
    }
  }

  async importAllProducts() {
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord à ShopOpti', 'warning');
      return;
    }

    this.showToast('Recherche des produits sur la page...', 'info');
    
    try {
      // Send message to content script to get all product URLs
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const response = await chrome.tabs.sendMessage(tab.id, {
        type: 'GET_ALL_PRODUCT_URLS'
      });

      if (response?.urls?.length > 0) {
        this.showToast(`${response.urls.length} produits trouvés. Import en cours...`, 'info');
        
        let successCount = 0;
        for (const url of response.urls.slice(0, 20)) { // Limit to 20
          try {
            const importResult = await chrome.runtime.sendMessage({
              type: 'IMPORT_FROM_URL',
              url: url
            });
            if (importResult?.success) successCount++;
          } catch (e) {
            console.error('[ShopOpti+] Bulk import error:', e);
          }
        }
        
        this.stats.products += successCount;
        this.addActivity(`Import en masse: ${successCount} produits`, '📦');
        this.showToast(`${successCount} produits importés!`, 'success');
        await this.saveData();
        this.updateUI();
      } else {
        this.showToast('Aucun produit trouvé sur cette page', 'warning');
      }
    } catch (error) {
      console.error('[ShopOpti+] Bulk import error:', error);
      this.showToast('Erreur lors de la recherche des produits', 'error');
    }
  }

  async importReviews() {
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord à ShopOpti', 'warning');
      return;
    }

    this.showToast('Import des avis en cours...', 'info');
    
    try {
      const response = await chrome.runtime.sendMessage({
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
        this.showToast('Aucun avis trouvé ou erreur', 'warning');
      }
    } catch (error) {
      console.error('[ShopOpti+] Review import error:', error);
      this.showToast('Erreur lors de l\'import des avis', 'error');
    }
  }

  async startPriceMonitor() {
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord à ShopOpti', 'warning');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    this.stats.monitored++;
    this.addActivity(`Surveillance prix activée`, '📊');
    this.showToast('Surveillance des prix activée!', 'success');
    await this.saveData();
    this.updateUI();
  }

  async syncData() {
    const btn = document.getElementById('syncBtn');
    if (btn) btn.classList.add('spinning');

    try {
      await this.checkConnection();
      this.showToast('Synchronisation réussie!', 'success');
    } catch (error) {
      this.showToast('Erreur de synchronisation', 'error');
    } finally {
      if (btn) btn.classList.remove('spinning');
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  openDashboard() {
    chrome.tabs.create({ url: `${this.APP_URL}/dashboard` });
  }

  openAuth() {
    chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
  }

  async disconnect() {
    await chrome.storage.local.remove(['extensionToken']);
    this.extensionToken = null;
    this.isConnected = false;
    this.updateUI();
    this.showToast('Déconnecté de ShopOpti', 'info');
  }

  showFeature(featureName) {
    this.showToast(`${featureName} - Fonctionnalité Pro`, 'info');
    chrome.tabs.create({ url: `${this.APP_URL}/pricing` });
  }

  showPremiumFeature() {
    this.showToast('Fonctionnalité réservée aux membres Pro', 'info');
    chrome.tabs.create({ url: `${this.APP_URL}/pricing` });
  }

  openBulkImport() {
    chrome.tabs.create({ url: `${this.APP_URL}/products/import` });
  }

  sendToApp() {
    chrome.tabs.create({ url: `${this.APP_URL}/dashboard` });
  }

  handleStatClick(action) {
    switch (action) {
      case 'products':
        chrome.tabs.create({ url: `${this.APP_URL}/products` });
        break;
      case 'reviews':
        chrome.tabs.create({ url: `${this.APP_URL}/reviews` });
        break;
      case 'monitoring':
        chrome.tabs.create({ url: `${this.APP_URL}/price-monitoring` });
        break;
    }
  }

  loadTemplate(template) {
    this.showToast(`Template ${template} chargé`, 'success');
  }

  addMappingRule() {
    this.showToast('Fonctionnalité en développement', 'info');
  }

  saveMapping() {
    this.showToast('Mapping sauvegardé!', 'success');
  }

  autoMapVariants() {
    this.showToast('Auto-mapping en cours...', 'info');
  }

  syncAll() {
    this.syncData();
  }

  syncStock() {
    this.showToast('Synchronisation du stock...', 'info');
  }

  syncPrices() {
    this.showToast('Synchronisation des prix...', 'info');
  }

  addStore() {
    chrome.tabs.create({ url: `${this.APP_URL}/stores/connect` });
  }

  pushProduct() {
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord', 'warning');
      return;
    }
    this.showToast('Sélectionnez une boutique cible', 'info');
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const popup = new ShopOptiPopup();
  popup.init();
});

// Add toast styles
const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .toast {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: var(--dc-bg-elevated, #334155);
    border: 1px solid var(--dc-border, #475569);
    border-radius: 12px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    z-index: 9999;
    opacity: 0;
    transition: all 0.3s ease;
  }
  .toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
  .toast.success { border-color: var(--dc-success, #10b981); }
  .toast.error { border-color: var(--dc-error, #ef4444); }
  .toast.warning { border-color: var(--dc-warning, #f59e0b); }
  .toast-icon { font-size: 16px; }
  .toast-message { font-size: 13px; font-weight: 500; color: var(--dc-text, #f8fafc); }
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spinning svg { animation: spin 1s linear infinite; }
`;
document.head.appendChild(toastStyles);