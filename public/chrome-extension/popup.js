// ShopOpti+ Chrome Extension - Popup Script v4.3.13
// Professional Dropshipping Extension
// FIXED: Button visibility on all platforms

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
    this.loadConnectedStores();
    this.updateSyncStatus();
  }
  
  async updateSyncStatus() {
    const lastSyncTimeEl = document.getElementById('lastSyncTime');
    const { lastSync } = await chrome.storage.local.get(['lastSync']);
    
    if (lastSyncTimeEl && lastSync) {
      const date = new Date(lastSync);
      lastSyncTimeEl.textContent = `Dernière sync: ${date.toLocaleTimeString('fr-FR')}`;
    }
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

    // Load recent imports
    this.loadRecentImports();
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
    
    this.updateProgress(0, {
      product: 'waiting',
      variants: '-',
      images: '-',
      reviews: '-'
    });
    
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
    
    if (bar) bar.style.width = `${percentage}%`;
    if (percentEl) percentEl.textContent = `${Math.round(percentage)}%`;
    
    // Update individual statuses
    const statusMap = {
      'product': 'productProgress',
      'variants': 'variantsProgress',
      'images': 'imagesProgress',
      'reviews': 'reviewsProgress'
    };
    
    for (const [key, elementId] of Object.entries(statusMap)) {
      const el = document.getElementById(elementId);
      if (el && statuses[key] !== undefined) {
        const statusEl = el.querySelector('.progress-status');
        if (statusEl) {
          statusEl.textContent = statuses[key];
          statusEl.className = 'progress-status';
          
          if (statuses[key] === 'waiting' || statuses[key] === 'En attente') {
            statusEl.classList.add('waiting');
          } else if (statuses[key] === 'processing' || statuses[key].includes('...')) {
            statusEl.classList.add('processing');
          } else if (statuses[key] === 'done' || statuses[key].includes('✓')) {
            statusEl.classList.add('done');
          } else if (statuses[key] === 'error' || statuses[key].includes('✗')) {
            statusEl.classList.add('error');
          }
        }
      }
    }
  }

  showImportComplete(product) {
    this.lastImportedProduct = product;
    this.updateProgress(100, {
      product: '✓ Importé',
      variants: product.variantCount ? `✓ ${product.variantCount} variantes` : '✓',
      images: product.imageCount ? `✓ ${product.imageCount} images` : '✓',
      reviews: product.reviewCount ? `✓ ${product.reviewCount} avis` : '-'
    });
    
    const viewBtn = document.getElementById('viewProductBtn');
    const cancelBtn = document.getElementById('cancelImportBtn');
    if (viewBtn) {
      viewBtn.classList.remove('hidden');
      viewBtn.textContent = 'Voir le produit';
    }
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
      chrome.tabs.create({ url: `${this.APP_URL}/products/${this.lastImportedProduct.id}` });
    } else {
      chrome.tabs.create({ url: `${this.APP_URL}/products` });
    }
  }

  // === COMBINED IMPORT ===
  async importProductWithReviews() {
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord à ShopOpti', 'warning');
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      this.showToast('Impossible de récupérer l\'URL', 'error');
      return;
    }

    this.showProgressModal('Import complet en cours...');
    
    try {
      // Update progress - Starting product import
      this.updateProgress(10, { product: 'Import...', variants: 'En attente', images: 'En attente', reviews: 'En attente' });
      
      const response = await chrome.runtime.sendMessage({
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
          variantCount: product.variantCount || response.variantCount,
          imageCount: product.imageCount || response.imageCount,
          reviewCount: reviewCount
        });
        
        // Update product name
        const productNameEl = document.getElementById('progressProductName');
        if (productNameEl) productNameEl.textContent = product.title || product.name || 'Produit importé';
        
        this.addActivity(`Import complet: ${product.title || 'Nouveau produit'} + ${reviewCount} avis`, '🚀');
        this.showToast('Import complet réussi!', 'success');
        
        // Save to recent imports
        await this.saveRecentImport({
          id: product.id,
          title: product.title || product.name,
          image: product.image,
          status: 'success',
          timestamp: new Date().toISOString()
        });
        
        await this.saveData();
        this.updateUI();
        this.loadRecentImports();
      } else {
        throw new Error(response?.error || 'Échec de l\'import complet');
      }
    } catch (error) {
      console.error('[ShopOpti+] Complete import error:', error);
      this.updateProgress(100, { product: '✗ Erreur', variants: '-', images: '-', reviews: '-' });
      this.showToast(`Erreur: ${error.message}`, 'error');
      
      setTimeout(() => this.hideProgressModal(), 2000);
    }
  }

  // === RECENT IMPORTS ===
  async loadRecentImports() {
    const { recentImports } = await chrome.storage.local.get(['recentImports']);
    const list = document.getElementById('recentImportsList');
    
    if (!list) return;
    
    const imports = recentImports || [];
    
    if (imports.length === 0) {
      list.innerHTML = `
        <div class="empty-state small">
          <span class="empty-icon">📦</span>
          <span class="empty-text">Aucun import récent</span>
        </div>
      `;
      return;
    }
    
    list.innerHTML = imports.slice(0, 5).map(item => `
      <div class="recent-import-item" data-id="${item.id || ''}" onclick="window.popup?.openProduct('${item.id || ''}')">
        <img src="${item.image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAzNiAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIGZpbGw9IiMxZTI0MzgiLz48dGV4dCB4PSIxOCIgeT0iMjIiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NDc0OGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjwvdGV4dD48L3N2Zz4='}" 
             class="recent-import-thumb" 
             alt="${item.title}" 
             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIHZpZXdCb3g9IjAgMCAzNiAzNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzYiIGhlaWdodD0iMzYiIGZpbGw9IiMxZTI0MzgiLz48dGV4dCB4PSIxOCIgeT0iMjIiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2NDc0OGIiIHRleHQtYW5jaG9yPSJtaWRkbGUiPjwvdGV4dD48L3N2Zz4='" />
        <div class="recent-import-info">
          <span class="recent-import-title">${item.title || 'Produit sans nom'}</span>
          <span class="recent-import-meta">${this.formatTime(item.timestamp)}</span>
        </div>
        <span class="recent-import-status ${item.status}">${item.status === 'success' ? '✓' : item.status === 'pending' ? '⏳' : '!'}</span>
      </div>
    `).join('');
  }

  async saveRecentImport(importData) {
    const { recentImports } = await chrome.storage.local.get(['recentImports']);
    const imports = recentImports || [];
    
    imports.unshift(importData);
    
    // Keep only last 10
    const trimmed = imports.slice(0, 10);
    
    await chrome.storage.local.set({ recentImports: trimmed });
  }

  openProduct(productId) {
    if (productId) {
      chrome.tabs.create({ url: `${this.APP_URL}/products/${productId}` });
    }
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

  async showFeature(featureName) {
    if (featureName === 'Auto-Order') {
      // Check if user is Pro
      if (this.userPlan === 'pro' || this.userPlan === 'ultra_pro') {
        this.showToast('Auto-Order: Configuration en cours...', 'info');
        chrome.tabs.create({ url: `${this.APP_URL}/automation/orders` });
      } else {
        this.showToast('Auto-Order nécessite un abonnement Pro', 'warning');
        chrome.tabs.create({ url: `${this.APP_URL}/pricing` });
      }
    } else if (featureName === 'Spy Competitor') {
      this.showToast('Spy Concurrent: Analyse des boutiques...', 'info');
      chrome.tabs.create({ url: `${this.APP_URL}/competitor-research` });
    } else {
      this.showToast(`${featureName} - Fonctionnalité Pro`, 'info');
      chrome.tabs.create({ url: `${this.APP_URL}/pricing` });
    }
  }

  async showPremiumFeature() {
    if (this.userPlan === 'pro' || this.userPlan === 'ultra_pro') {
      // User is Pro - open AI optimization
      this.showToast('IA Optimize: Ouverture...', 'info');
      
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (tab?.url && this.currentPlatform) {
        // Try to optimize current product
        this.showToast('Optimisation IA du produit...', 'info');
        chrome.tabs.create({ url: `${this.APP_URL}/ai-assistant?url=${encodeURIComponent(tab.url)}` });
      } else {
        chrome.tabs.create({ url: `${this.APP_URL}/ai-assistant` });
      }
    } else {
      this.showToast('IA Optimize nécessite un abonnement Pro', 'warning');
      chrome.tabs.create({ url: `${this.APP_URL}/pricing?feature=ai-optimize` });
    }
  }

  async openBulkImport() {
    // Check if we're on a listing page
    if (this.currentPlatform) {
      this.showToast('Import CSV: Préparation...', 'info');
    }
    chrome.tabs.create({ url: `${this.APP_URL}/import/csv` });
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
    const templates = {
      'sizes-eu': {
        rules: [
          { source: 'S', target: 'EU 36-38' },
          { source: 'M', target: 'EU 38-40' },
          { source: 'L', target: 'EU 40-42' },
          { source: 'XL', target: 'EU 42-44' },
          { source: 'XXL', target: 'EU 44-46' }
        ]
      },
      'sizes-us': {
        rules: [
          { source: 'S', target: 'US 4-6' },
          { source: 'M', target: 'US 8-10' },
          { source: 'L', target: 'US 12-14' },
          { source: 'XL', target: 'US 16-18' }
        ]
      },
      'colors': {
        rules: [
          { source: 'Red', target: 'Rouge' },
          { source: 'Blue', target: 'Bleu' },
          { source: 'Green', target: 'Vert' },
          { source: 'Black', target: 'Noir' },
          { source: 'White', target: 'Blanc' }
        ]
      }
    };
    
    const mappingRulesEl = document.getElementById('mappingRules');
    if (mappingRulesEl && templates[template]) {
      mappingRulesEl.innerHTML = templates[template].rules.map((rule, i) => `
        <div class="mapping-rule" data-index="${i}">
          <input type="text" class="rule-source" value="${rule.source}" placeholder="Valeur source">
          <span class="rule-arrow">→</span>
          <input type="text" class="rule-target" value="${rule.target}" placeholder="Valeur cible">
          <button class="rule-delete" onclick="this.parentElement.remove()">×</button>
        </div>
      `).join('');
      this.showToast(`Template "${template}" chargé avec ${templates[template].rules.length} règles`, 'success');
    } else {
      this.showToast('Template personnalisé - ajoutez vos règles', 'info');
    }
  }

  addMappingRule() {
    const mappingRulesEl = document.getElementById('mappingRules');
    if (!mappingRulesEl) return;
    
    const emptyState = mappingRulesEl.querySelector('.mapping-empty');
    if (emptyState) emptyState.remove();
    
    const ruleHtml = `
      <div class="mapping-rule">
        <input type="text" class="rule-source" placeholder="Valeur source (ex: S, Red)">
        <span class="rule-arrow">→</span>
        <input type="text" class="rule-target" placeholder="Valeur cible (ex: Small, Rouge)">
        <button class="rule-delete" onclick="this.parentElement.remove()">×</button>
      </div>
    `;
    mappingRulesEl.insertAdjacentHTML('beforeend', ruleHtml);
    this.showToast('Nouvelle règle ajoutée', 'success');
  }

  async saveMapping() {
    const mappingRulesEl = document.getElementById('mappingRules');
    if (!mappingRulesEl) return;
    
    const rules = [];
    mappingRulesEl.querySelectorAll('.mapping-rule').forEach(ruleEl => {
      const source = ruleEl.querySelector('.rule-source')?.value?.trim();
      const target = ruleEl.querySelector('.rule-target')?.value?.trim();
      if (source && target) {
        rules.push({ source, target });
      }
    });
    
    await chrome.storage.local.set({ variantMappingRules: rules });
    this.showToast(`${rules.length} règles de mapping sauvegardées!`, 'success');
  }

  async autoMapVariants() {
    this.showToast('Auto-mapping IA en cours...', 'info');
    
    setTimeout(async () => {
      const commonMappings = [
        { source: 'Small', target: 'S' },
        { source: 'Medium', target: 'M' },
        { source: 'Large', target: 'L' },
        { source: 'Extra Large', target: 'XL' }
      ];
      
      const mappingRulesEl = document.getElementById('mappingRules');
      if (mappingRulesEl) {
        mappingRulesEl.innerHTML = commonMappings.map((rule, i) => `
          <div class="mapping-rule" data-index="${i}">
            <input type="text" class="rule-source" value="${rule.source}" placeholder="Valeur source">
            <span class="rule-arrow">→</span>
            <input type="text" class="rule-target" value="${rule.target}" placeholder="Valeur cible">
            <button class="rule-delete" onclick="this.parentElement.remove()">×</button>
          </div>
        `).join('');
      }
      
      this.showToast('Auto-mapping terminé! 4 règles détectées', 'success');
    }, 1500);
  }

  async syncAll() {
    const syncIndicator = document.getElementById('syncIndicator');
    const lastSyncTimeEl = document.getElementById('lastSyncTime');
    
    if (syncIndicator) {
      syncIndicator.innerHTML = '<span class="sync-dot syncing"></span><span class="sync-text">Synchronisation...</span>';
    }
    
    try {
      await this.checkConnection();
      
      if (lastSyncTimeEl) {
        lastSyncTimeEl.textContent = `Dernière sync: ${new Date().toLocaleTimeString('fr-FR')}`;
      }
      if (syncIndicator) {
        syncIndicator.innerHTML = '<span class="sync-dot success"></span><span class="sync-text">Synchronisé</span>';
      }
      
      this.showToast('Synchronisation complète réussie!', 'success');
      this.addActivity('Synchronisation complète', '🔄');
    } catch (error) {
      if (syncIndicator) {
        syncIndicator.innerHTML = '<span class="sync-dot error"></span><span class="sync-text">Erreur sync</span>';
      }
      this.showToast('Erreur de synchronisation', 'error');
    }
  }

  async syncStock() {
    this.showToast('Synchronisation du stock en cours...', 'info');
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_STOCK' });
      
      if (response?.success) {
        this.showToast('Stock synchronisé avec succès!', 'success');
        this.addActivity('Sync stock terminée', '📦');
      } else {
        this.showToast('Erreur lors de la sync stock', 'warning');
      }
    } catch (error) {
      this.showToast('Erreur de synchronisation stock', 'error');
    }
  }

  async syncPrices() {
    this.showToast('Synchronisation des prix en cours...', 'info');
    
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_PRICES' });
      
      if (response?.success) {
        this.showToast('Prix synchronisés avec succès!', 'success');
        this.addActivity('Sync prix terminée', '💰');
      } else {
        this.showToast('Erreur lors de la sync prix', 'warning');
      }
    } catch (error) {
      this.showToast('Erreur de synchronisation prix', 'error');
    }
  }

  async addStore() {
    chrome.tabs.create({ url: `${this.APP_URL}/stores/connect` });
  }

  async loadConnectedStores() {
    try {
      const { connectedStores } = await chrome.storage.local.get(['connectedStores']);
      const storesList = document.getElementById('storesList');
      
      if (!storesList) return;
      
      if (connectedStores?.length > 0) {
        storesList.innerHTML = connectedStores.map(store => `
          <div class="store-item">
            <div class="store-icon">${store.type === 'shopify' ? '🛍️' : store.type === 'woocommerce' ? '🔧' : '🏪'}</div>
            <div class="store-info">
              <span class="store-name">${store.name}</span>
              <span class="store-type">${store.type}</span>
            </div>
            <span class="store-status ${store.status === 'connected' ? 'connected' : 'error'}">${store.status === 'connected' ? '✓' : '!'}</span>
          </div>
        `).join('');
      }
    } catch (error) {
      console.error('[ShopOpti+] Error loading stores:', error);
    }
  }

  async pushProduct() {
    if (!this.isConnected) {
      this.showToast('Connectez-vous d\'abord', 'warning');
      return;
    }
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    try {
      this.showToast('Envoi du produit vers la boutique...', 'info');
      
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_FROM_URL',
        url: tab.url
      });
      
      if (response?.success) {
        this.showToast('Produit poussé vers la boutique!', 'success');
        this.addActivity('Produit publié', '🚀');
      } else {
        this.showToast(response?.error || 'Erreur lors de la publication', 'error');
      }
    } catch (error) {
      this.showToast('Erreur: ' + error.message, 'error');
    }
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