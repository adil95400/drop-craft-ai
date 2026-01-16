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
    this.API_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
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
    chrome.tabs.create({ url: 'https://drop-craft-ai.lovable.app/dashboard' });
  }

  showFeature(name) {
    switch(name) {
      case 'Auto-Order':
        this.openAutoOrder();
        break;
      case 'Spy Competitor':
        this.openSpyCompetitor();
        break;
      case 'Bulk Import':
        this.openBulkImport();
        break;
      default:
        this.showToast(`${name} - Fonctionnalité disponible!`, 'info');
    }
  }

  async openAutoOrder() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      return;
    }

    this.showLoading('Chargement Auto-Order...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Get product data from current page
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' });
      
      if (response?.success && response.count > 0) {
        // Open Auto-Order page with product data
        chrome.tabs.create({ 
          url: `https://drop-craft-ai.lovable.app/orders/auto?source=extension&url=${encodeURIComponent(tab.url)}`
        });
        this.addActivity('Auto-Order lancé', '🛒', this.currentPlatform?.name);
        this.showToast('Page Auto-Order ouverte!', 'success');
      } else {
        this.showToast('Aucun produit détecté pour Auto-Order', 'warning');
      }
    } catch (error) {
      this.showToast('Erreur Auto-Order: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  async openSpyCompetitor() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      return;
    }

    this.showLoading('Analyse concurrentielle...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Call competitor analysis API
      const response = await fetch(`${this.API_URL}/analyze-competitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.extensionToken
        },
        body: JSON.stringify({ 
          url: tab.url,
          platform: this.currentPlatform?.name || 'unknown'
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Open competitor analysis page
        chrome.tabs.create({ 
          url: `https://drop-craft-ai.lovable.app/competitors/analyze?url=${encodeURIComponent(tab.url)}`
        });
        
        this.addActivity('Analyse concurrentielle', '🔍', this.currentPlatform?.name);
        this.showToast('Analyse lancée!', 'success');
      } else {
        throw new Error('Analyse échouée');
      }
    } catch (error) {
      // Fallback: open competitor page anyway
      chrome.tabs.create({ 
        url: `https://drop-craft-ai.lovable.app/competitors`
      });
      this.showToast('Page concurrents ouverte', 'info');
    } finally {
      this.hideLoading();
    }
  }

  async openBulkImport() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      return;
    }

    // Open file picker for CSV
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv,.xlsx,.xls';
    
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      this.showLoading('Import en cours...');

      try {
        // Read file content
        const content = await this.readFileContent(file);
        
        // Parse CSV
        const products = this.parseCSV(content);
        
        if (products.length === 0) {
          throw new Error('Aucun produit trouvé dans le fichier');
        }

        // Send to API
        const response = await fetch(`${this.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.extensionToken
          },
          body: JSON.stringify({
            action: 'import_products',
            products: products.map(p => ({
              title: p.title || p.name || p.product_name,
              name: p.title || p.name || p.product_name,
              price: parseFloat(String(p.price || '0').replace(/[^0-9.]/g, '')),
              description: p.description || '',
              image: p.image || p.image_url || '',
              url: p.url || p.link || '',
              source: 'csv_import',
              platform: 'CSV'
            }))
          })
        });

        if (response.ok) {
          const data = await response.json();
          this.stats.products += products.length;
          this.addActivity(`${products.length} produit(s) importés (CSV)`, '📊');
          this.showToast(`${products.length} produit(s) importés!`, 'success');
          await this.saveData();
          this.updateUI();
        } else {
          throw new Error('Erreur lors de l\'import');
        }
      } catch (error) {
        this.showToast('Erreur: ' + error.message, 'error');
      } finally {
        this.hideLoading();
      }
    };

    input.click();
  }

  readFileContent(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error('Erreur lecture fichier'));
      reader.readAsText(file);
    });
  }

  parseCSV(content) {
    const lines = content.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const product = {};
      
      headers.forEach((header, index) => {
        product[header] = values[index] || '';
      });

      if (product.title || product.name || product.product_name) {
        products.push(product);
      }
    }

    return products;
  }

  async openAIOptimize() {
    if (!this.isConnected) {
      this.showToast('Veuillez vous connecter d\'abord', 'warning');
      return;
    }

    if (this.userPlan !== 'pro' && this.userPlan !== 'ultra_pro') {
      this.showToast('Fonctionnalité PRO requise', 'warning');
      chrome.tabs.create({ url: 'https://drop-craft-ai.lovable.app/pricing' });
      return;
    }

    this.showLoading('Optimisation IA...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Scrape current product
      const scrapeResponse = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' });
      
      if (!scrapeResponse?.success) {
        throw new Error('Aucun produit détecté');
      }

      // Call AI optimization API
      const response = await fetch(`${this.API_URL}/ai-optimize-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.extensionToken
        },
        body: JSON.stringify({
          url: tab.url,
          platform: this.currentPlatform?.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        chrome.tabs.create({ 
          url: `https://drop-craft-ai.lovable.app/products/optimize?url=${encodeURIComponent(tab.url)}`
        });
        
        this.addActivity('Optimisation IA lancée', '🤖', this.currentPlatform?.name);
        this.showToast('Optimisation en cours!', 'success');
      } else {
        throw new Error('Erreur optimisation');
      }
    } catch (error) {
      this.showToast('Erreur: ' + error.message, 'error');
    } finally {
      this.hideLoading();
    }
  }

  showPremiumFeature() {
    if (this.userPlan !== 'pro' && this.userPlan !== 'ultra_pro') {
      this.showToast('Fonctionnalité PRO - Mettez à niveau', 'warning');
      chrome.tabs.create({ url: 'https://drop-craft-ai.lovable.app/pricing' });
    } else {
      this.openAIOptimize();
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
        url: `https://drop-craft-ai.lovable.app${urls[action]}` 
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

// ============ PROFIT CALCULATOR ============
class ProfitCalculator {
  constructor(popup) {
    this.popup = popup;
    this.init();
  }

  init() {
    const inputs = ['costPrice', 'shippingCost', 'marketplaceFees', 'transactionFee', 'sellingPrice', 'estimatedQty'];
    inputs.forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => this.calculate());
    });

    document.querySelectorAll('.price-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applySuggestedMargin(parseFloat(btn.dataset.margin)));
    });
  }

  calculate() {
    const costPrice = parseFloat(document.getElementById('costPrice')?.value) || 0;
    const shippingCost = parseFloat(document.getElementById('shippingCost')?.value) || 0;
    const marketplaceFees = parseFloat(document.getElementById('marketplaceFees')?.value) || 0;
    const transactionFee = parseFloat(document.getElementById('transactionFee')?.value) || 0;
    const sellingPrice = parseFloat(document.getElementById('sellingPrice')?.value) || 0;
    const estimatedQty = parseInt(document.getElementById('estimatedQty')?.value) || 1;

    const transactionCost = sellingPrice * (transactionFee / 100);
    const totalCosts = costPrice + shippingCost + marketplaceFees + transactionCost;
    const profitPerUnit = sellingPrice - totalCosts;
    const marginPercent = sellingPrice > 0 ? (profitPerUnit / sellingPrice) * 100 : 0;
    const roiPercent = totalCosts > 0 ? (profitPerUnit / totalCosts) * 100 : 0;
    const totalProfit = profitPerUnit * estimatedQty;

    const profitEl = document.getElementById('profitPerUnit');
    if (profitEl) {
      profitEl.textContent = `${profitPerUnit.toFixed(2)} €`;
      profitEl.classList.toggle('negative', profitPerUnit < 0);
    }
    
    document.getElementById('marginPercent').textContent = `${marginPercent.toFixed(1)}%`;
    document.getElementById('roiPercent').textContent = `${roiPercent.toFixed(1)}%`;
    document.getElementById('totalProfit').textContent = `${totalProfit.toFixed(2)} €`;

    this.generateRecommendations(marginPercent, roiPercent, profitPerUnit);
  }

  generateRecommendations(margin, roi, profit) {
    const box = document.getElementById('profitRecommendations');
    if (!box) return;

    const recs = [];
    
    if (profit < 0) {
      recs.push({ type: 'warning', text: '⚠️ Vous perdez de l\'argent! Augmentez le prix ou réduisez les coûts.' });
    } else if (margin < 15) {
      recs.push({ type: 'warning', text: '⚠️ Marge faible (<15%). Risque élevé.' });
    } else if (margin >= 30) {
      recs.push({ type: 'success', text: '✅ Excellente marge! Potentiel de compétitivité.' });
    }
    
    if (roi > 100) {
      recs.push({ type: 'success', text: '🚀 ROI excellent! Fort potentiel.' });
    }

    box.innerHTML = recs.length > 0 
      ? recs.map(r => `<div class="rec-item ${r.type}">${r.text}</div>`).join('')
      : '<div class="rec-item">💡 Remplissez les champs pour des recommandations</div>';
  }

  applySuggestedMargin(marginPercent) {
    const costPrice = parseFloat(document.getElementById('costPrice')?.value) || 0;
    const shippingCost = parseFloat(document.getElementById('shippingCost')?.value) || 0;
    const marketplaceFees = parseFloat(document.getElementById('marketplaceFees')?.value) || 0;
    const transactionFee = parseFloat(document.getElementById('transactionFee')?.value) || 0;

    const totalFixedCosts = costPrice + shippingCost + marketplaceFees;
    const transactionFeeDecimal = transactionFee / 100;
    const marginDecimal = marginPercent / 100;
    const sellingPrice = totalFixedCosts / (1 - transactionFeeDecimal - marginDecimal);

    document.getElementById('sellingPrice').value = sellingPrice.toFixed(2);
    this.calculate();
  }
}

// ============ VARIANT MAPPING ============
class VariantMapper {
  constructor(popup) {
    this.popup = popup;
    this.savedMappings = [];
    this.templates = {
      'sizes-eu': [
        { source: 'S', target: 'Small (EU 36)' },
        { source: 'M', target: 'Medium (EU 38)' },
        { source: 'L', target: 'Large (EU 40)' },
        { source: 'XL', target: 'Extra Large (EU 42)' }
      ],
      'sizes-us': [
        { source: 'S', target: 'Small (US 4-6)' },
        { source: 'M', target: 'Medium (US 8-10)' },
        { source: 'L', target: 'Large (US 12-14)' },
        { source: 'XL', target: 'Extra Large (US 16-18)' }
      ],
      'colors-fr': [
        { source: 'Black', target: 'Noir' },
        { source: 'White', target: 'Blanc' },
        { source: 'Red', target: 'Rouge' },
        { source: 'Blue', target: 'Bleu' }
      ],
      'colors-en': [
        { source: 'Noir', target: 'Black' },
        { source: 'Blanc', target: 'White' },
        { source: 'Rouge', target: 'Red' },
        { source: 'Bleu', target: 'Blue' }
      ]
    };
    this.init();
  }

  async init() {
    const data = await chrome.storage.local.get(['variantMappings']);
    this.savedMappings = data.variantMappings || [];
    
    document.querySelectorAll('.template-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyTemplate(btn.dataset.template));
    });

    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('addRuleBtn')?.addEventListener('click', () => this.addRule());
    document.getElementById('saveMappingBtn')?.addEventListener('click', () => this.saveMapping());
    document.getElementById('autoMapBtn')?.addEventListener('click', () => this.autoMap());

    this.renderSavedMappings();
  }

  applyTemplate(templateId) {
    const template = this.templates[templateId];
    if (!template) return;

    const container = document.getElementById('mappingRules');
    container.innerHTML = '';
    template.forEach(rule => this.addRule(rule.source, rule.target));
    this.popup.showToast('Template appliqué!', 'success');
  }

  addRule(source = '', target = '') {
    const container = document.getElementById('mappingRules');
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'mapping-rule';
    ruleDiv.innerHTML = `
      <input type="text" placeholder="Source" class="source-input" value="${source}" />
      <span class="arrow">→</span>
      <input type="text" placeholder="Cible" class="target-input" value="${target}" />
      <button class="remove-btn">×</button>
    `;
    ruleDiv.querySelector('.remove-btn').addEventListener('click', () => ruleDiv.remove());
    container.appendChild(ruleDiv);
  }

  async saveMapping() {
    const rules = [];
    document.querySelectorAll('.mapping-rule').forEach(rule => {
      const source = rule.querySelector('.source-input')?.value?.trim();
      const target = rule.querySelector('.target-input')?.value?.trim();
      if (source && target) rules.push({ source, target });
    });

    if (rules.length === 0) {
      this.popup.showToast('Aucune règle à sauvegarder', 'warning');
      return;
    }

    const activeType = document.querySelector('.type-btn.active')?.dataset.type || 'custom';
    const mapping = {
      id: `${activeType}_${Date.now()}`,
      type: activeType,
      rules,
      createdAt: new Date().toISOString()
    };

    this.savedMappings.push(mapping);
    await chrome.storage.local.set({ variantMappings: this.savedMappings });
    this.renderSavedMappings();
    this.popup.showToast('Mapping sauvegardé!', 'success');

    // Sync to backend
    if (this.popup.isConnected) {
      try {
        await fetch(`${this.popup.API_URL}/extension-sync-realtime`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.popup.extensionToken
          },
          body: JSON.stringify({ action: 'save_mapping', mapping })
        });
      } catch (e) { console.error('Sync mapping error:', e); }
    }
  }

  renderSavedMappings() {
    const list = document.getElementById('savedMappingsList');
    if (!list) return;

    if (this.savedMappings.length === 0) {
      list.innerHTML = '<span class="empty-msg">Aucun mapping</span>';
      return;
    }

    list.innerHTML = this.savedMappings.map(m => `
      <div class="mapping-item" data-id="${m.id}">
        <span>${m.type} (${m.rules.length} règles)</span>
        <button class="apply-mapping-btn" data-id="${m.id}">Appliquer</button>
      </div>
    `).join('');

    list.querySelectorAll('.apply-mapping-btn').forEach(btn => {
      btn.addEventListener('click', () => this.applyMapping(btn.dataset.id));
    });
  }

  applyMapping(mappingId) {
    const mapping = this.savedMappings.find(m => m.id === mappingId);
    if (!mapping) return;

    const container = document.getElementById('mappingRules');
    container.innerHTML = '';
    mapping.rules.forEach(r => this.addRule(r.source, r.target));
    this.popup.showToast('Mapping appliqué!', 'success');
  }

  async autoMap() {
    if (!this.popup.isConnected) {
      this.popup.showToast('Connectez-vous pour l\'IA', 'warning');
      return;
    }

    const btn = document.getElementById('autoMapBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Analyse IA...';

    try {
      const existingRules = [];
      document.querySelectorAll('.mapping-rule .source-input').forEach(input => {
        const val = input.value?.trim();
        if (val) existingRules.push(val);
      });

      const response = await fetch(`${this.popup.API_URL}/ai-variant-mapper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.popup.extensionToken
        },
        body: JSON.stringify({
          sourceValues: existingRules.length > 0 ? existingRules : ['S', 'M', 'L', 'XL', 'Black', 'White'],
          targetLanguage: 'fr'
        })
      });

      const data = await response.json();
      
      if (data.mappings) {
        const container = document.getElementById('mappingRules');
        container.innerHTML = '';
        data.mappings.forEach(m => this.addRule(m.source, m.target));
        this.popup.showToast('Mapping IA appliqué!', 'success');
      } else {
        throw new Error(data.error || 'Erreur IA');
      }
    } catch (error) {
      this.popup.showToast('Erreur IA: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '🤖 IA Mapping';
    }
  }
}

// ============ STORE SYNC ============
class StoreSync {
  constructor(popup) {
    this.popup = popup;
    this.stores = [];
    this.init();
  }

  async init() {
    document.getElementById('addStoreBtn')?.addEventListener('click', () => {
      chrome.tabs.create({ url: 'https://drop-craft-ai.lovable.app/integrations/marketplaces' });
    });

    document.getElementById('syncAllBtn')?.addEventListener('click', () => this.syncProducts('all'));
    document.getElementById('syncStockBtn')?.addEventListener('click', () => this.syncProducts('stock'));
    document.getElementById('syncPricesBtn')?.addEventListener('click', () => this.syncProducts('price'));
    document.getElementById('pushProductBtn')?.addEventListener('click', () => this.pushCurrentProduct());

    await this.loadStores();
  }

  async loadStores() {
    const list = document.getElementById('storesList');
    const select = document.getElementById('targetStore');

    if (!this.popup.isConnected) {
      if (list) list.innerHTML = '<span class="loading-msg">Connectez-vous pour voir vos boutiques</span>';
      return;
    }

    try {
      const response = await fetch(`${this.popup.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.popup.extensionToken
        },
        body: JSON.stringify({ action: 'get_stores' })
      });

      const data = await response.json();
      this.stores = data.stores || [];

      if (this.stores.length === 0) {
        if (list) list.innerHTML = '<span class="loading-msg">Aucune boutique connectée</span>';
        return;
      }

      const icons = { shopify: '🛍️', woocommerce: '🔧', amazon: '📦', ebay: '🏷️', etsy: '🎨' };

      if (list) {
        list.innerHTML = this.stores.map(s => `
          <div class="store-item">
            <div class="store-info">
              <div class="store-icon">${icons[s.platform?.toLowerCase()] || '🏪'}</div>
              <div>
                <div class="store-name">${s.name}</div>
                <div class="store-platform">${s.platform}</div>
              </div>
            </div>
            <span class="store-status ${s.status === 'connected' ? '' : 'disconnected'}">${s.status === 'connected' ? 'Connecté' : 'Déconnecté'}</span>
          </div>
        `).join('');
      }

      if (select) {
        select.innerHTML = '<option value="">Sélectionner une boutique</option>' +
          this.stores.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
      }
    } catch (error) {
      if (list) list.innerHTML = '<span class="loading-msg">Erreur de chargement</span>';
    }
  }

  async syncProducts(syncType) {
    if (!this.popup.isConnected) {
      this.popup.showToast('Connectez-vous d\'abord', 'warning');
      return;
    }

    this.popup.showLoading(`Sync ${syncType}...`);

    try {
      const response = await fetch(`${this.popup.API_URL}/cross-marketplace-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.popup.extensionToken
        },
        body: JSON.stringify({ action: 'sync', syncType })
      });

      const data = await response.json();

      if (data.success || data.results) {
        document.getElementById('lastSyncTime').textContent = new Date().toLocaleTimeString('fr-FR');
        document.getElementById('syncedCount').textContent = data.results?.synced || 0;
        document.getElementById('syncErrors').textContent = data.results?.failed || 0;
        this.popup.showToast(`${data.results?.synced || 0} produits synchronisés!`, 'success');
      } else {
        throw new Error(data.error || 'Erreur sync');
      }
    } catch (error) {
      this.popup.showToast('Erreur: ' + error.message, 'error');
    } finally {
      this.popup.hideLoading();
    }
  }

  async pushCurrentProduct() {
    const storeId = document.getElementById('targetStore')?.value;
    if (!storeId) {
      this.popup.showToast('Sélectionnez une boutique', 'warning');
      return;
    }

    this.popup.showLoading('Envoi en cours...');

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const scrapeResponse = await chrome.tabs.sendMessage(tab.id, { type: 'SCRAPE_PAGE' });

      if (!scrapeResponse?.success) {
        throw new Error('Aucun produit détecté');
      }

      const response = await fetch(`${this.popup.API_URL}/extension-sync-realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.popup.extensionToken
        },
        body: JSON.stringify({
          action: 'push_to_store',
          storeId,
          product: scrapeResponse.products?.[0] || scrapeResponse,
          options: {
            withImages: document.getElementById('pushImages')?.checked,
            withVariants: document.getElementById('pushVariants')?.checked,
            asDraft: document.getElementById('pushAsDraft')?.checked
          }
        })
      });

      const data = await response.json();
      if (data.success) {
        this.popup.showToast('Produit envoyé!', 'success');
        this.popup.addActivity('Produit envoyé à la boutique', '📤');
      } else {
        throw new Error(data.error || 'Erreur envoi');
      }
    } catch (error) {
      this.popup.showToast('Erreur: ' + error.message, 'error');
    } finally {
      this.popup.hideLoading();
    }
  }
}

// ============ TAB NAVIGATION ============
function initTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const mainContent = document.querySelector('.actions-section')?.parentElement;

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Hide all tab panels and main content sections
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
      document.querySelectorAll('.actions-section, .features-section, .activity-section').forEach(s => {
        s.style.display = targetTab === 'main' ? 'block' : 'none';
      });

      // Show selected tab
      if (targetTab !== 'main') {
        document.getElementById(`${targetTab}Tab`)?.classList.remove('hidden');
      }
    });
  });
}

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const popup = new ShopOptiPopup();
  await popup.init();
  window.shopOptiPopup = popup;

  // Initialize tabs and new features
  initTabs();
  new ProfitCalculator(popup);
  new VariantMapper(popup);
  new StoreSync(popup);
});
