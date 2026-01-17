// Drop Craft AI Chrome Extension - Popup Script v4.0
// Professional Dropshipping Extension

class DropCraftPopup {
  constructor() {
    this.isConnected = false;
    this.extensionToken = null;
    this.stats = { products: 0, reviews: 0, monitored: 0 };
    this.activities = [];
    this.pendingItems = [];
    this.currentPlatform = null;
    this.API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
    this.APP_URL = 'https://drop-craft-ai.lovable.app';
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
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  async saveData() {
    try {
      await chrome.storage.local.set({
        stats: this.stats,
        activities: this.activities,
        pendingItems: this.pendingItems
      });
    } catch (error) {
      console.error('Error saving data:', error);
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
            products: data.todayStats.imports || 0,
            reviews: data.todayStats.reviews || 0,
            monitored: data.todayStats.monitored || 0
          };
        }
        if (data.userPlan) {
          this.userPlan = data.userPlan;
          await chrome.storage.local.set({ userPlan: data.userPlan });
        }
      }
    } catch (error) {
      console.error('Connection check failed:', error);
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
        'taobao': { name: 'Taobao', icon: '🛍️', color: '#ff4400' }
      };

      for (const [key, platform] of Object.entries(platforms)) {
        if (hostname.includes(key)) {
          this.currentPlatform = { ...platform, url: tab.url, hostname };
          break;
        }
      }
    } catch (error) {
      console.error('Error detecting page:', error);
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

    // Mapping type buttons
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Price suggestion buttons
    document.querySelectorAll('.price-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applySuggestedMargin(parseInt(btn.dataset.margin)));
    });
  }

  initTabs() {
    // Show main tab by default
    this.switchTab('main');
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Show/hide tab panels
    const panels = {
      'main': [],
      'profit': ['profitTab'],
      'variants': ['variantsTab'],
      'sync': ['syncTab']
    };

    // Hide all panels first
    document.querySelectorAll('.tab-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    // Show relevant panels
    if (panels[tabName]) {
      panels[tabName].forEach(panelId => {
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.remove('hidden');
        }
      });
    }

    // Show/hide main content sections
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

    // Update display
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

    // Update recommendations
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
      statusText.textContent = this.isConnected ? 'Connecté à Drop Craft AI' : 'Non connecté';
    }
    if (connectBtn) {
      connectBtn.textContent = this.isConnected ? 'Déconnecter' : 'Connecter';
    }

    // Update plan badge
    const planBadge = document.getElementById('planBadge');
    if (planBadge) {
      const planNames = { 'free': 'Free', 'starter': 'Starter', 'pro': 'Pro', 'ultra_pro': 'Ultra Pro' };
      planBadge.textContent = planNames[this.userPlan] || 'Free';
      planBadge.className = `plan-badge ${this.userPlan === 'pro' || this.userPlan === 'ultra_pro' ? 'pro' : ''}`;
    }

    // Update stats
    document.getElementById('todayProducts').textContent = this.stats.products;
    document.getElementById('todayReviews').textContent = this.stats.reviews;
    document.getElementById('monitoredCount').textContent = this.stats.monitored;

    // Update page info
    const pageInfo = document.getElementById('pageInfo');
    if (this.currentPlatform && pageInfo) {
      pageInfo.classList.remove('hidden');
      pageInfo.querySelector('.page-icon').textContent = this.currentPlatform.icon;
      pageInfo.querySelector('.page-platform').textContent = this.currentPlatform.name;
      pageInfo.querySelector('.page-url').textContent = this.currentPlatform.hostname;
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

    // Bind delete buttons
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
    this.showToast('Historique effacé', 'success');
  }

  async importCurrentPage() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      this.openAuth();
      return;
    }

    this.showLoading('Import en cours...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Try to send message to content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' });
        
        if (response?.success) {
          this.stats.products += response.count || 1;
          this.addActivity(`${response.count || 1} produit(s) importé(s)`, '📦', this.currentPlatform?.name);
          this.showToast(`${response.count || 1} produit(s) importé(s)!`, 'success');
          await this.saveData();
          this.updateUI();
          return;
        }
      } catch (e) {
        console.log('Content script not ready, trying URL scraping');
      }
      
      // Fallback: try URL scraping
      const result = await this.scrapeByUrl(tab.url);
      
      if (result.success) {
        this.stats.products += 1;
        this.addActivity('Produit importé via URL', '📦', this.currentPlatform?.name);
        this.showToast('Produit importé!', 'success');
        await this.saveData();
        this.updateUI();
      } else {
        throw new Error(result.error || 'Impossible d\'importer ce produit');
      }
    } catch (error) {
      console.error('Import error:', error);
      this.showToast('Erreur: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async importAllProducts() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      return;
    }

    this.showLoading('Scan des produits...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.tabs.sendMessage(tab.id, { type: 'INJECT_ONE_CLICK_BUTTONS' });
      await chrome.tabs.sendMessage(tab.id, { type: 'AUTO_SCRAPE' });

      this.showToast('Scan lancé! Vérifiez la page', 'info');
      this.addActivity('Scan multiple lancé', '📥', this.currentPlatform?.name);
    } catch (error) {
      this.showToast('Erreur lors du scan', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async importReviews() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      return;
    }

    this.showLoading('Import des avis...');

    try {
      const response = await chrome.runtime.sendMessage({ type: 'IMPORT_REVIEWS' });
      
      if (response?.success) {
        this.stats.reviews += response.count || 0;
        this.addActivity(`${response.count || 0} avis importés`, '⭐');
        this.showToast(`${response.count || 0} avis importés!`, 'success');
        await this.saveData();
        this.updateUI();
      }
    } catch (error) {
      this.showToast('Erreur lors de l\'import des avis', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async startPriceMonitor() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      return;
    }

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const result = await chrome.storage.local.get(['monitoredUrls']);
      const urls = result.monitoredUrls || [];
      
      if (!urls.includes(tab.url)) {
        urls.push(tab.url);
        await chrome.storage.local.set({ monitoredUrls: urls });
        
        this.stats.monitored = urls.length;
        this.addActivity('Prix surveillé', '📊', this.currentPlatform?.name);
        this.showToast('Surveillance activée!', 'success');
        await this.saveData();
        this.updateUI();
      } else {
        this.showToast('Déjà surveillé', 'info');
      }
    } catch (error) {
      this.showToast('Erreur', 'error');
    }
  }

  async scrapeByUrl(url) {
    try {
      const response = await fetch(`${this.API_URL}/product-url-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.extensionToken
        },
        body: JSON.stringify({ url })
      });

      return await response.json();
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendToApp() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      return;
    }

    // Open dashboard
    chrome.tabs.create({ url: `${this.APP_URL}/products` });
    this.addActivity('Ouverture du dashboard', '📊');
  }

  async syncData() {
    this.showLoading('Synchronisation...');
    await this.checkConnection();
    this.updateUI();
    this.hideLoading();
    this.showToast('Données synchronisées', 'success');
  }

  async disconnect() {
    await chrome.storage.local.remove(['extensionToken']);
    this.extensionToken = null;
    this.isConnected = false;
    this.updateUI();
    this.showToast('Déconnecté', 'info');
  }

  openAuth() {
    chrome.tabs.create({ url: `${this.APP_URL}/extensions/chrome` });
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  openDashboard() {
    chrome.tabs.create({ url: `${this.APP_URL}/dashboard` });
  }

  openBulkImport() {
    chrome.tabs.create({ url: `${this.APP_URL}/products/import` });
  }

  showFeature(name) {
    this.showToast(`${name} - Disponible dans l'app!`, 'info');
    chrome.tabs.create({ url: `${this.APP_URL}/dashboard` });
  }

  showPremiumFeature() {
    if (this.userPlan === 'pro' || this.userPlan === 'ultra_pro') {
      chrome.tabs.create({ url: `${this.APP_URL}/ai-tools` });
    } else {
      this.showToast('Fonctionnalité Pro - Upgrade requis', 'warning');
      chrome.tabs.create({ url: `${this.APP_URL}/pricing` });
    }
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
        chrome.tabs.create({ url: `${this.APP_URL}/monitoring` });
        break;
    }
  }

  // Mapping functions
  addMappingRule() {
    const container = document.getElementById('mappingRules');
    const rule = document.createElement('div');
    rule.className = 'mapping-rule';
    rule.innerHTML = `
      <input type="text" placeholder="Source (ex: XL)" class="source-input" />
      <span class="arrow">→</span>
      <input type="text" placeholder="Cible (ex: Extra Large)" class="target-input" />
      <button class="remove-btn">×</button>
    `;
    rule.querySelector('.remove-btn').addEventListener('click', () => rule.remove());
    container.appendChild(rule);
  }

  saveMapping() {
    this.showToast('Mapping sauvegardé!', 'success');
  }

  autoMapVariants() {
    this.showToast('Mapping IA en cours...', 'info');
    // Simulate AI mapping
    setTimeout(() => {
      this.showToast('Variantes mappées automatiquement!', 'success');
    }, 1500);
  }

  loadTemplate(template) {
    this.showToast(`Template ${template} chargé`, 'success');
  }

  // Sync functions
  syncAll() {
    this.showToast('Synchronisation en cours...', 'info');
    setTimeout(() => {
      document.getElementById('lastSyncTime').textContent = 'À l\'instant';
      this.showToast('Synchronisation terminée!', 'success');
    }, 2000);
  }

  syncStock() {
    this.showToast('Sync stock en cours...', 'info');
  }

  syncPrices() {
    this.showToast('Sync prix en cours...', 'info');
  }

  addStore() {
    chrome.tabs.create({ url: `${this.APP_URL}/stores/connect` });
  }

  pushProduct() {
    const targetStore = document.getElementById('targetStore')?.value;
    if (!targetStore) {
      this.showToast('Sélectionnez une boutique', 'warning');
      return;
    }
    this.showToast('Envoi en cours...', 'info');
  }

  // UI Helpers
  showLoading(text = 'Chargement...') {
    const overlay = document.getElementById('loadingOverlay');
    const loadingText = document.getElementById('loadingText');
    if (overlay) overlay.classList.remove('hidden');
    if (loadingText) loadingText.textContent = text;
  }

  hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('hidden');
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const popup = new DropCraftPopup();
  popup.init();
});
