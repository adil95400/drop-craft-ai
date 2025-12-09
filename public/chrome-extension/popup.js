// Drop Craft AI Chrome Extension Popup Script

let scrapedProducts = [];
let importedReviews = [];
let sessionData = {
  startTime: new Date(),
  scrapedCount: 0,
  reviewsImported: 0
};
let reviewConfig = {};

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  const popup = new DropCraftPopup();
  await popup.init();
  // Make popup globally available for modal functions
  window.reviewPopup = popup;
});

class DropCraftPopup {
  constructor() {
    this.scrapedProducts = [];
    this.importedReviews = [];
    this.sessionData = {
      startTime: new Date(),
      scrapedCount: 0,
      reviewsImported: 0
    };
    this.reviewConfig = {};
  }

  async init() {
    await this.loadStoredData();
    this.bindEvents();
    this.updateUI();
    this.checkConnection();
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get([
        'scrapedProducts', 
        'importedReviews', 
        'sessionData', 
        'reviewConfig'
      ]);
      this.scrapedProducts = result.scrapedProducts || [];
      this.importedReviews = result.importedReviews || [];
      this.sessionData = result.sessionData || {
        startTime: new Date(),
        scrapedCount: 0,
        reviewsImported: 0
      };
      this.reviewConfig = result.reviewConfig || {};
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  async saveData() {
    try {
      await chrome.storage.local.set({
        scrapedProducts: this.scrapedProducts,
        importedReviews: this.importedReviews,
        sessionData: this.sessionData,
        reviewConfig: this.reviewConfig
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  bindEvents() {
    // Main action buttons
    document.getElementById('scrapCurrentPage')?.addEventListener('click', () => this.scrapCurrentPage());
    document.getElementById('scrapAllProducts')?.addEventListener('click', () => this.scrapAllProducts());
    document.getElementById('importReviews')?.addEventListener('click', () => this.importReviews());
    document.getElementById('sendToApp')?.addEventListener('click', () => this.sendToApp());
    document.getElementById('authenticate')?.addEventListener('click', () => this.openAuth());
    document.getElementById('openDashboard')?.addEventListener('click', () => this.openDashboard());
    document.getElementById('reviewSettings')?.addEventListener('click', () => this.openReviewSettings());
    document.getElementById('openSettings')?.addEventListener('click', () => this.openSettings());
    document.getElementById('clearData')?.addEventListener('click', () => this.clearData());
    document.getElementById('priceMonitor')?.addEventListener('click', () => this.enablePriceMonitor());
  }

  updateUI() {
    // Update scraped count
    const countElement = document.getElementById('scrapedCount');
    if (countElement) {
      countElement.textContent = this.scrapedProducts.length;
    }

    // Update reviews count
    const reviewsCountElement = document.getElementById('reviewsCount');
    if (reviewsCountElement) {
      reviewsCountElement.textContent = this.importedReviews.length;
    }

    // Update session count (today's activities)
    const sessionCountElement = document.getElementById('sessionsCount');
    if (sessionCountElement) {
      const today = new Date().toDateString();
      const todayActivities = this.scrapedProducts.filter(p => 
        new Date(p.scrapedAt).toDateString() === today
      ).length + this.importedReviews.filter(r => 
        new Date(r.scrapedAt).toDateString() === today
      ).length;
      sessionCountElement.textContent = todayActivities;
    }

    // Update recent products and reviews lists
    this.updateRecentProducts();
    this.updateRecentReviews();
    
    // Update connection status
    this.checkConnection();
  }

  updateRecentProducts() {
    const recentList = document.getElementById('recentProducts');
    if (!recentList) return;

    recentList.innerHTML = '';
    
    const recentProducts = this.scrapedProducts.slice(-3).reverse();
    
    if (recentProducts.length === 0) {
      recentList.innerHTML = '<div class="no-data">Aucun produit scrapé</div>';
      return;
    }

    recentProducts.forEach(product => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      
      item.innerHTML = `
        <div class="item-info">
          <div class="item-name">${product.name || 'Produit sans nom'}</div>
          <div class="item-meta">${product.domain || 'Site inconnu'} • ${product.price || 'Prix non défini'}</div>
        </div>
        <div class="item-actions">
          <button class="btn-icon" onclick="removeProduct('${product.id}')" title="Supprimer">×</button>
        </div>
      `;
      
      recentList.appendChild(item);
    });
  }

  updateRecentReviews() {
    const recentList = document.getElementById('recentReviews');
    if (!recentList) return;

    recentList.innerHTML = '';
    
    const recentReviews = this.importedReviews.slice(-3).reverse();
    
    if (recentReviews.length === 0) {
      recentList.innerHTML = '<div class="no-data">Aucun avis importé</div>';
      return;
    }

    recentReviews.forEach(review => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      
      const stars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));
      
      item.innerHTML = `
        <div class="item-info">
          <div class="item-name">${stars} ${review.title || review.content?.substring(0, 30) + '...' || 'Avis sans titre'}</div>
          <div class="item-meta">${review.platform || 'Plateforme inconnue'} • ${review.author || 'Auteur inconnu'}</div>
        </div>
        <div class="item-actions">
          <button class="btn-icon" onclick="removeReview('${review.id}')" title="Supprimer">×</button>
        </div>
      `;
      
      recentList.appendChild(item);
    });
  }

  async scrapCurrentPage() {
    this.showLoading(true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.extractProductData
      });

      if (results && results[0] && results[0].result) {
        const products = results[0].result;
        this.scrapedProducts.push(...products);
        await this.saveData();
        this.updateUI();
        this.showNotification(`${products.length} produits scrapés avec succès!`);
      }
    } catch (error) {
      console.error('Error scraping page:', error);
      this.showNotification('Erreur lors du scraping', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async scrapAllProducts() {
    this.showLoading(true);
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Inject advanced scraping script
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: this.advancedProductScraping
      });

      // Listen for scraped data
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'PRODUCTS_SCRAPED') {
          this.scrapedProducts.push(...message.products);
          this.saveData();
          this.updateUI();
          this.sendToApp(message.products);
          this.showNotification(`${message.products.length} produits scrapés automatiquement!`);
        }
      });
    } catch (error) {
      console.error('Error in advanced scraping:', error);
      this.showNotification('Erreur lors du scraping avancé', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async importReviews() {
    try {
      this.showLoading(true);
      
      // Get current review configuration
      const config = await this.getReviewConfig();
      
      // Send message to background script to import reviews
      const response = await chrome.runtime.sendMessage({
        type: 'IMPORT_REVIEWS',
        config: config
      });

      if (response && response.success) {
        this.showNotification('Import des avis lancé avec succès!');
        // Reload data and update UI
        await this.loadStoredData();
        this.updateUI();
      } else {
        throw new Error('Erreur lors de l\'import des avis');
      }
    } catch (error) {
      console.error('Error importing reviews:', error);
      this.showNotification('Erreur lors de l\'import des avis', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async getReviewConfig() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_REVIEW_CONFIG'
      });
      return response || {};
    } catch (error) {
      console.error('Error getting review config:', error);
      return {};
    }
  }

  extractProductData() {
    const products = [];
    
    // Common e-commerce selectors
    const selectors = {
      // Generic product containers
      products: [
        '[data-testid*="product"]',
        '.product-item',
        '.product-card',
        '.product',
        '[class*="product"]',
        '.item',
        '[data-product]'
      ],
      
      // Title selectors
      title: [
        'h1', 'h2', 'h3',
        '.product-title',
        '.title',
        '[data-testid*="title"]',
        '.name',
        '.product-name'
      ],
      
      // Price selectors
      price: [
        '.price',
        '[class*="price"]',
        '[data-testid*="price"]',
        '.cost',
        '.amount'
      ],
      
      // Image selectors
      image: [
        'img[src*="product"]',
        'img[alt*="product"]',
        '.product-image img',
        '.image img',
        'img'
      ]
    };

    // Try to find products
    let productElements = [];
    for (const selector of selectors.products) {
      productElements = document.querySelectorAll(selector);
      if (productElements.length > 0) break;
    }

    // If no product containers found, try to extract from current page
    if (productElements.length === 0) {
      const singleProduct = this.extractSingleProduct();
      if (singleProduct) return [singleProduct];
    }

    // Extract data from each product
    productElements.forEach((element, index) => {
      const product = {
        id: `scraped_${Date.now()}_${index}`,
        name: this.getTextContent(element, selectors.title),
        price: this.getPriceContent(element, selectors.price),
        image: this.getImageSrc(element, selectors.image),
        url: window.location.href,
        domain: window.location.hostname,
        scrapedAt: new Date().toISOString(),
        source: 'chrome_extension'
      };

      if (product.name || product.price) {
        products.push(product);
      }
    });

    return products;
  }

  extractSingleProduct() {
    const product = {
      id: `scraped_single_${Date.now()}`,
      name: this.getTextContent(document, ['h1', 'title', '.title']),
      price: this.getPriceContent(document, ['.price', '[class*="price"]']),
      image: this.getImageSrc(document, ['img']),
      url: window.location.href,
      domain: window.location.hostname,
      scrapedAt: new Date().toISOString(),
      source: 'chrome_extension'
    };

    return product.name ? product : null;
  }

  getTextContent(element, selectors) {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found && found.textContent.trim()) {
        return found.textContent.trim();
      }
    }
    return '';
  }

  getPriceContent(element, selectors) {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found) {
        const text = found.textContent.trim();
        const priceMatch = text.match(/[\d,.]+(€|$|£|₹|¥|kr|zł)/);
        if (priceMatch) return priceMatch[0];
      }
    }
    return '';
  }

  getImageSrc(element, selectors) {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found && found.src) {
        return found.src;
      }
    }
    return '';
  }

  advancedProductScraping() {
    // Advanced scraping with pagination and infinite scroll
    let allProducts = [];
    let currentPage = 1;
    
    const scrapePage = () => {
      const products = this.extractProductData();
      allProducts.push(...products);
      
      // Try to find next page or load more button
      const nextButton = document.querySelector([
        '[data-testid*="next"]',
        '.next-page',
        '.load-more',
        '[class*="next"]',
        'button:contains("Next")',
        'a:contains("Next")'
      ].join(','));
      
      if (nextButton && currentPage < 5) { // Limit to 5 pages
        currentPage++;
        nextButton.click();
        setTimeout(scrapePage, 2000); // Wait for page load
      } else {
        // Send results back
        chrome.runtime.sendMessage({
          type: 'PRODUCTS_SCRAPED',
          products: allProducts
        });
      }
    };
    
    // Handle infinite scroll
    const handleInfiniteScroll = () => {
      return new Promise((resolve) => {
        let scrollCount = 0;
        const maxScrolls = 10;
        
        const scrollInterval = setInterval(() => {
          window.scrollTo(0, document.body.scrollHeight);
          scrollCount++;
          
          if (scrollCount >= maxScrolls) {
            clearInterval(scrollInterval);
            resolve();
          }
        }, 1000);
      });
    };
    
    // Start scraping
    handleInfiniteScroll().then(() => {
      scrapePage();
    });
  }

  async sendToApp(products) {
    if (!products) {
      products = this.scrapedProducts;
    }
    
    if (products.length === 0) {
      this.showNotification('Aucun produit à envoyer', 'error');
      return;
    }

    try {
      this.showLoading(true);
      
      // Get or create extension token
      const token = await this.getExtensionToken();
      
      const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/extension-sync-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({
          action: 'import_products',
          products: products.map(p => ({
            title: p.name,
            name: p.name,
            price: p.price,
            description: p.description || '',
            image: p.image,
            url: p.url,
            source: 'chrome_extension'
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.showNotification(`${result.imported || products.length} produit(s) envoyé(s) avec succès!`);
        
        // Clear sent products
        this.scrapedProducts = [];
        await this.saveData();
        this.updateUI();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur du serveur');
      }
    } catch (error) {
      console.error('Error sending to app:', error);
      this.showNotification('Erreur: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async getExtensionToken() {
    // Try to get existing token
    const result = await chrome.storage.local.get(['extensionToken']);
    if (result.extensionToken) {
      return result.extensionToken;
    }
    
    // No token found, show authentication page
    this.showNotification('⚠️ Veuillez vous authentifier', 'warning');
    this.openAuth();
    throw new Error('Non authentifié');
  }

  openAuth() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('auth.html')
    });
  }

  async sendReviewsToApp() {
    if (this.importedReviews.length === 0) {
      this.showNotification('Aucun avis à envoyer', 'error');
      return;
    }

    try {
      this.showLoading(true);
      
      const token = await this.getExtensionToken();
      
      const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/extension-review-importer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': token
        },
        body: JSON.stringify({
          reviews: this.importedReviews,
          source: 'chrome_extension'
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.showNotification(`${this.importedReviews.length} avis envoyé(s) avec succès!`);
        
        // Clear sent reviews
        this.importedReviews = [];
        await this.saveData();
        this.updateUI();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Erreur du serveur');
      }
    } catch (error) {
      console.error('Error sending reviews to app:', error);
      this.showNotification('Erreur: ' + error.message, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  openDashboard() {
    chrome.tabs.create({
      url: 'https://dtozyrmmekdnvekissuh.supabase.co'
    });
  }

  openReviewSettings() {
    // Open review settings modal
    this.showReviewSettingsModal();
  }

  showReviewSettingsModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>Configuration des Avis</h3>
          <button class="modal-close" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="config-section">
            <h4>Plateformes d'avis</h4>
            <label><input type="checkbox" id="trustpilot-enabled" checked> Trustpilot</label>
            <label><input type="checkbox" id="google-enabled" checked> Google Reviews</label>
            <label><input type="checkbox" id="facebook-enabled"> Facebook</label>
            <label><input type="checkbox" id="yelp-enabled"> Yelp</label>
            <label><input type="checkbox" id="amazon-enabled" checked> Amazon</label>
            <label><input type="checkbox" id="aliexpress-enabled" checked> AliExpress</label>
          </div>
          <div class="config-section">
            <h4>Filtres</h4>
            <label>Note minimum: <input type="range" id="min-rating" min="1" max="5" value="1"> <span id="min-rating-display">1</span></label>
            <label>Note maximum: <input type="range" id="max-rating" min="1" max="5" value="5"> <span id="max-rating-display">5</span></label>
            <label>Nombre max d'avis: <input type="number" id="max-reviews" min="1" max="200" value="50"></label>
            <label>Période (jours): <input type="number" id="date-range" min="1" max="365" value="30"></label>
          </div>
          <div class="config-section">
            <h4>Import automatique</h4>
            <label><input type="checkbox" id="auto-import"> Activer l'import automatique</label>
            <label>Intervalle (minutes): <input type="number" id="import-interval" min="5" max="1440" value="60"></label>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" onclick="this.parentElement.parentElement.parentElement.remove()">Annuler</button>
          <button class="btn-primary" onclick="reviewPopup.saveReviewConfig(this)">Sauvegarder</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      }
      .modal-content {
        background: white;
        border-radius: 8px;
        padding: 0;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
      }
      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
      }
      .modal-body {
        padding: 20px;
      }
      .config-section {
        margin-bottom: 20px;
      }
      .config-section h4 {
        margin-bottom: 10px;
        color: #333;
      }
      .config-section label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
      }
      .config-section input[type="checkbox"] {
        margin-right: 8px;
      }
      .config-section input[type="range"] {
        margin: 0 8px;
        width: 100px;
      }
      .config-section input[type="number"] {
        margin-left: 8px;
        padding: 4px 8px;
        border: 1px solid #ddd;
        border-radius: 4px;
        width: 80px;
      }
      .modal-footer {
        padding: 20px;
        border-top: 1px solid #eee;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
      }
      .btn-primary, .btn-secondary {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        cursor: pointer;
      }
      .btn-primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      .btn-secondary {
        background: #f5f5f5;
        color: #333;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);

    // Setup range input listeners
    const minRating = document.getElementById('min-rating');
    const maxRating = document.getElementById('max-rating');
    const minDisplay = document.getElementById('min-rating-display');
    const maxDisplay = document.getElementById('max-rating-display');

    minRating.addEventListener('input', () => {
      minDisplay.textContent = minRating.value;
    });

    maxRating.addEventListener('input', () => {
      maxDisplay.textContent = maxRating.value;
    });

    // Load current config
    this.loadReviewConfigInModal();
  }

  async loadReviewConfigInModal() {
    const config = await this.getReviewConfig();
    
    // Set platform checkboxes
    if (config.platforms) {
      Object.keys(config.platforms).forEach(platform => {
        const checkbox = document.getElementById(`${platform}-enabled`);
        if (checkbox) {
          checkbox.checked = config.platforms[platform].enabled;
        }
      });
    }

    // Set filters
    if (config.filters) {
      const minRating = document.getElementById('min-rating');
      const maxRating = document.getElementById('max-rating');
      const maxReviews = document.getElementById('max-reviews');
      const dateRange = document.getElementById('date-range');

      if (minRating) {
        minRating.value = config.filters.minRating || 1;
        document.getElementById('min-rating-display').textContent = minRating.value;
      }
      if (maxRating) {
        maxRating.value = config.filters.maxRating || 5;
        document.getElementById('max-rating-display').textContent = maxRating.value;
      }
      if (maxReviews) maxReviews.value = config.filters.maxReviews || 50;
      if (dateRange) dateRange.value = config.filters.dateRange || 30;
    }

    // Set auto import
    const autoImport = document.getElementById('auto-import');
    const importInterval = document.getElementById('import-interval');
    if (autoImport) autoImport.checked = config.autoImport || false;
    if (importInterval) importInterval.value = config.importInterval || 60;
  }

  async saveReviewConfig(button) {
    try {
      const config = {
        platforms: {
          trustpilot: { enabled: document.getElementById('trustpilot-enabled').checked, maxReviews: parseInt(document.getElementById('max-reviews').value) },
          google: { enabled: document.getElementById('google-enabled').checked, maxReviews: parseInt(document.getElementById('max-reviews').value) },
          facebook: { enabled: document.getElementById('facebook-enabled').checked, maxReviews: parseInt(document.getElementById('max-reviews').value) },
          yelp: { enabled: document.getElementById('yelp-enabled').checked, maxReviews: parseInt(document.getElementById('max-reviews').value) },
          amazon: { enabled: document.getElementById('amazon-enabled').checked, maxReviews: parseInt(document.getElementById('max-reviews').value) },
          aliexpress: { enabled: document.getElementById('aliexpress-enabled').checked, maxReviews: parseInt(document.getElementById('max-reviews').value) }
        },
        filters: {
          minRating: parseInt(document.getElementById('min-rating').value),
          maxRating: parseInt(document.getElementById('max-rating').value),
          dateRange: parseInt(document.getElementById('date-range').value),
          language: 'auto'
        },
        autoImport: document.getElementById('auto-import').checked,
        importInterval: parseInt(document.getElementById('import-interval').value)
      };

      // Save to background script
      await chrome.runtime.sendMessage({
        type: 'UPDATE_REVIEW_CONFIG',
        config: config
      });

      this.showNotification('Configuration sauvegardée avec succès!');
      button.parentElement.parentElement.parentElement.remove();
    } catch (error) {
      console.error('Error saving review config:', error);
      this.showNotification('Erreur lors de la sauvegarde', 'error');
    }
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }

  clearData() {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données scrapées et avis importés ?')) {
      this.scrapedProducts = [];
      this.importedReviews = [];
      this.sessionData = {
        startTime: new Date(),
        scrapedCount: 0,
        reviewsImported: 0
      };
      this.saveData();
      this.updateUI();
      this.showNotification('Données effacées avec succès');
    }
  }

  async checkConnection() {
    const statusEl = document.getElementById('connectionStatus');
    const statusText = statusEl?.querySelector('.status-text');
    const authBtn = statusEl?.querySelector('.btn-link');
    
    try {
      const result = await chrome.storage.local.get(['extensionToken']);
      if (!result.extensionToken) {
        statusEl?.classList.remove('connected');
        statusEl?.classList.add('disconnected');
        if (statusText) statusText.textContent = 'Non connecté';
        if (authBtn) authBtn.style.display = 'inline';
        return;
      }
      
      const response = await fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/extension-sync-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': result.extensionToken
        },
        body: JSON.stringify({ action: 'sync_status' })
      });
      
      if (response.ok) {
        statusEl?.classList.remove('disconnected');
        statusEl?.classList.add('connected');
        if (statusText) statusText.textContent = 'Connecté à ShopOpti+';
        if (authBtn) authBtn.style.display = 'none';
      } else {
        statusEl?.classList.remove('connected');
        statusEl?.classList.add('disconnected');
        if (statusText) statusText.textContent = 'Token invalide';
      }
    } catch (error) {
      if (statusText) statusText.textContent = 'Hors ligne';
    }
  }

  enablePriceMonitor() {
    this.showNotification('Surveillance des prix activée pour cette page!');
    chrome.runtime.sendMessage({ type: 'ENABLE_PRICE_MONITOR', url: window.location.href });
  }

  showLoading(show) {
    const loading = document.getElementById('loadingOverlay') || document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  showNotification(message, type = 'success') {
    // Create notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Drop Craft AI',
      message: message
    });
  }
}

// Global functions for item removal
function removeProduct(productId) {
  if (window.reviewPopup) {
    window.reviewPopup.scrapedProducts = window.reviewPopup.scrapedProducts.filter(p => p.id !== productId);
    window.reviewPopup.saveData();
    window.reviewPopup.updateUI();
    window.reviewPopup.showNotification('Produit supprimé');
  }
}

function removeReview(reviewId) {
  if (window.reviewPopup) {
    window.reviewPopup.importedReviews = window.reviewPopup.importedReviews.filter(r => r.id !== reviewId);
    window.reviewPopup.saveData();
    window.reviewPopup.updateUI();
    window.reviewPopup.showNotification('Avis supprimé');
  }
}