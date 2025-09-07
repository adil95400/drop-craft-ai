// Extension popup functionality
class DropCraftExtension {
  constructor() {
    this.scrapedProducts = [];
    this.init();
  }

  async init() {
    await this.loadStoredData();
    this.bindEvents();
    this.updateUI();
    this.checkConnection();
  }

  async loadStoredData() {
    try {
      const result = await chrome.storage.local.get(['scrapedProducts', 'sessionData']);
      this.scrapedProducts = result.scrapedProducts || [];
      this.sessionData = result.sessionData || {};
    } catch (error) {
      console.error('Error loading stored data:', error);
    }
  }

  async saveData() {
    try {
      await chrome.storage.local.set({
        scrapedProducts: this.scrapedProducts,
        sessionData: this.sessionData
      });
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }

  bindEvents() {
    document.getElementById('scrapCurrentPage').addEventListener('click', () => {
      this.scrapCurrentPage();
    });

    document.getElementById('scrapAllProducts').addEventListener('click', () => {
      this.scrapAllProducts();
    });

    document.getElementById('openDashboard').addEventListener('click', () => {
      this.openDashboard();
    });

    document.getElementById('openSettings').addEventListener('click', () => {
      this.openSettings();
    });

    document.getElementById('clearData').addEventListener('click', () => {
      this.clearData();
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
        this.sendToApp(products);
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
    try {
      // Send data to main application
      const response = await fetch('https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/api/extension/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: products,
          source: 'chrome_extension',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('Products sent to app successfully');
      }
    } catch (error) {
      console.error('Error sending products to app:', error);
    }
  }

  openDashboard() {
    chrome.tabs.create({
      url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com'
    });
  }

  openSettings() {
    chrome.tabs.create({
      url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/extensions-hub'
    });
  }

  async clearData() {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données?')) {
      this.scrapedProducts = [];
      await chrome.storage.local.clear();
      this.updateUI();
      this.showNotification('Données effacées avec succès');
    }
  }

  updateUI() {
    document.getElementById('scrapedCount').textContent = this.scrapedProducts.length;
    
    const recentProducts = document.getElementById('recentProducts');
    recentProducts.innerHTML = '';
    
    if (this.scrapedProducts.length === 0) {
      recentProducts.innerHTML = '<div class="product-item"><div class="product-name">Aucun produit scrapé</div></div>';
    } else {
      const recent = this.scrapedProducts.slice(-3).reverse();
      recent.forEach(product => {
        const item = document.createElement('div');
        item.className = 'product-item';
        item.innerHTML = `
          <div class="product-name">${product.name || 'Produit sans nom'}</div>
          <div class="product-price">${product.price || 'Prix non disponible'}</div>
        `;
        recentProducts.appendChild(item);
      });
    }
  }

  checkConnection() {
    // Check if main app is accessible
    fetch('https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com')
      .then(() => {
        document.getElementById('connectionStatus').textContent = 'Connecté à l\'application';
      })
      .catch(() => {
        document.getElementById('connectionStatus').textContent = 'Connexion impossible';
      });
  }

  showLoading(show) {
    const loading = document.getElementById('loading');
    if (show) {
      loading.classList.add('show');
    } else {
      loading.classList.remove('show');
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

// Initialize extension when popup opens
document.addEventListener('DOMContentLoaded', () => {
  new DropCraftExtension();
});