// ShopOpti+ Chrome Extension - Popup Script v3.0
// Inspired by AutoDS Professional

class ShopOptiPopup {
  constructor() {
    this.isConnected = false;
    this.extensionToken = null;
    this.stats = { products: 0, reviews: 0, monitored: 0 };
    this.activities = [];
    this.pendingItems = [];
    this.currentPlatform = null;
    this.API_URL = 'https://dtozyrmmekdnvekissuh.supabase.co/functions/v1';
  }

  async init() {
    await this.loadStoredData();
    await this.checkConnection();
    await this.detectCurrentPage();
    this.bindEvents();
    this.updateUI();
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get([
        'extensionToken',
        'stats',
        'activities',
        'pendingItems',
        'userPlan'
      ]);
      
      this.extensionToken = result.extensionToken || null;
      this.stats = result.stats || { products: 0, reviews: 0, monitored: 0 };
      this.activities = result.activities || [];
      this.pendingItems = result.pendingItems || [];
      this.userPlan = result.userPlan || 'free';
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
        'shein': { name: 'Shein', icon: '👗', color: '#000' }
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
    document.getElementById('connectBtn')?.addEventListener('click', () => this.openAuth());

    // Main actions
    document.getElementById('importPageBtn')?.addEventListener('click', () => this.importCurrentPage());
    document.getElementById('importAllBtn')?.addEventListener('click', () => this.importAllProducts());
    document.getElementById('importReviewsBtn')?.addEventListener('click', () => this.importReviews());
    document.getElementById('priceMonitorBtn')?.addEventListener('click', () => this.startPriceMonitor());

    // Advanced features
    document.getElementById('autoOrderBtn')?.addEventListener('click', () => this.showFeature('Auto-Order'));
    document.getElementById('competitorBtn')?.addEventListener('click', () => this.showFeature('Spy Competitor'));
    document.getElementById('bulkImportBtn')?.addEventListener('click', () => this.showFeature('Bulk Import'));
    document.getElementById('aiOptimizeBtn')?.addEventListener('click', () => this.showPremiumFeature());

    // Activity
    document.getElementById('clearActivityBtn')?.addEventListener('click', () => this.clearActivity());

    // Footer
    document.getElementById('sendToAppBtn')?.addEventListener('click', () => this.sendToApp());

    // Stats cards
    document.querySelectorAll('.stat-card').forEach(card => {
      card.addEventListener('click', () => this.handleStatClick(card.dataset.action));
    });
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
      statusText.textContent = this.isConnected ? 'Connecté à ShopOpti+' : 'Non connecté';
    }
    if (connectBtn) {
      connectBtn.textContent = this.isConnected ? 'Déconnecter' : 'Connecter';
    }

    // Update plan badge
    const planBadge = document.getElementById('planBadge');
    if (planBadge) {
      planBadge.textContent = this.userPlan === 'pro' ? 'PRO' : 'Free';
      planBadge.className = `plan-badge ${this.userPlan === 'pro' ? 'pro' : ''}`;
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
      
      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' });

      if (response?.success) {
        this.stats.products += response.count || 1;
        this.addActivity(`${response.count || 1} produit(s) importé(s)`, '📦', this.currentPlatform?.name);
        this.showToast(`${response.count || 1} produit(s) importé(s)!`, 'success');
        await this.saveData();
        this.updateUI();
      } else {
        throw new Error(response?.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Import error:', error);
      
      // Fallback: try URL scraping
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await this.scrapeByUrl(tab.url);
        
        if (result.success) {
          this.stats.products += 1;
          this.addActivity('Produit importé par URL', '📦', this.currentPlatform?.name);
          this.showToast('Produit importé!', 'success');
          await this.saveData();
          this.updateUI();
        } else {
          throw new Error(result.error);
        }
      } catch (fallbackError) {
        this.showToast('Erreur: ' + (fallbackError.message || 'Import échoué'), 'error');
      }
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
      
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'AUTO_SCRAPE' });

      this.showToast('Scan en cours... Vérifiez la page', 'info');
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
      
      // Store URL for monitoring
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

    if (this.pendingItems.length === 0) {
      this.showToast('Aucun élément en attente', 'info');
      return;
    }

    this.showLoading('Envoi en cours...');

    try {
      const response = await fetch(`${this.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.extensionToken
        },
        body: JSON.stringify({
          action: 'bulk_import',
          items: this.pendingItems
        })
      });

      if (response.ok) {
        const count = this.pendingItems.length;
        this.pendingItems = [];
        this.addActivity(`${count} élément(s) envoyé(s)`, '📤');
        this.showToast(`${count} élément(s) envoyé(s)!`, 'success');
        await this.saveData();
        this.updateUI();
      }
    } catch (error) {
      this.showToast('Erreur lors de l\'envoi', 'error');
    } finally {
      this.hideLoading();
    }
  }

  async syncData() {
    this.showLoading('Synchronisation...');
    await this.checkConnection();
    this.updateUI();
    this.hideLoading();
    this.showToast('Données synchronisées', 'success');
  }

  openAuth() {
    chrome.tabs.create({ url: chrome.runtime.getURL('auth.html') });
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  openDashboard() {
    chrome.tabs.create({ url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/dashboard' });
  }

  showFeature(name) {
    this.showToast(`${name} - Bientôt disponible`, 'info');
  }

  showPremiumFeature() {
    if (this.userPlan !== 'pro') {
      this.showToast('Fonctionnalité PRO - Mettez à niveau', 'warning');
      chrome.tabs.create({ url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/pricing' });
    } else {
      this.showFeature('AI Optimize');
    }
  }

  handleStatClick(action) {
    const urls = {
      products: '/products',
      reviews: '/reviews',
      monitoring: '/price-monitoring'
    };
    
    if (urls[action]) {
      chrome.tabs.create({ 
        url: `https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com${urls[action]}` 
      });
    }
  }

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
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type]}</span> ${message}`;
    
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toastIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const popup = new ShopOptiPopup();
  await popup.init();
  window.shopOptiPopup = popup;
});
