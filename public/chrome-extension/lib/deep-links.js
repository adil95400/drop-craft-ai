/**
 * ShopOpti+ Deep Links Manager v5.8.1
 * Navigate from extension to specific SaaS pages
 */

const ShopOptiDeepLinks = {
  VERSION: '5.8.1',
  
  // Base URL for the SaaS application
  getBaseUrl() {
    return 'https://shopopti.io';
  },
  
  /**
   * Available deep link routes
   */
  ROUTES: {
    // Main sections
    dashboard: '/dashboard',
    products: '/products',
    orders: '/orders',
    analytics: '/analytics',
    
    // Product-specific
    productDetail: (productId) => `/products?id=${productId}`,
    productEdit: (productId) => `/products/${productId}/edit`,
    
    // Extension section
    extensionDashboard: '/extensions',
    extensionSettings: '/extensions/chrome',
    extensionHistory: '/extensions/history',
    
    // Import section
    importHistory: '/import/history',
    importConfig: '/import/config',
    
    // Settings
    settings: '/settings',
    apiKeys: '/settings/api',
    integrations: '/settings/integrations',
    
    // Help
    help: '/help',
    documentation: '/docs',
    changelog: '/changelog',
  },
  
  /**
   * Open a deep link in the SaaS
   */
  open(route, params = {}) {
    let url = this.getBaseUrl();
    
    // Get the route path
    if (typeof route === 'function') {
      url += route(params.id);
    } else if (this.ROUTES[route]) {
      const routePath = this.ROUTES[route];
      url += typeof routePath === 'function' ? routePath(params.id) : routePath;
    } else {
      url += route;
    }
    
    // Add query parameters
    const queryParams = new URLSearchParams();
    
    // Always add source parameter
    queryParams.set('ref', 'extension');
    queryParams.set('v', this.VERSION);
    
    // Add custom parameters
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined && value !== null) {
        queryParams.set(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    // Open in new tab
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
    
    return url;
  },
  
  /**
   * Open product in SaaS
   */
  openProduct(productId) {
    return this.open('productDetail', { id: productId });
  },
  
  /**
   * Open extension dashboard
   */
  openExtensionDashboard() {
    return this.open('extensionDashboard');
  },
  
  /**
   * Open extension settings
   */
  openExtensionSettings() {
    return this.open('extensionSettings');
  },
  
  /**
   * Open import history
   */
  openImportHistory() {
    return this.open('importHistory');
  },
  
  /**
   * Open extension action history
   */
  openActionHistory() {
    return this.open('extensionHistory');
  },
  
  /**
   * Open main dashboard
   */
  openDashboard() {
    return this.open('dashboard');
  },
  
  /**
   * Open product list with optional filters
   */
  openProducts(filters = {}) {
    return this.open('products', filters);
  },
  
  /**
   * Open help/documentation
   */
  openHelp(topic) {
    return this.open('documentation', topic ? { topic } : {});
  },
  
  /**
   * Generate a deep link URL without opening
   */
  generateUrl(route, params = {}) {
    let url = this.getBaseUrl();
    
    if (typeof route === 'function') {
      url += route(params.id);
    } else if (this.ROUTES[route]) {
      const routePath = this.ROUTES[route];
      url += typeof routePath === 'function' ? routePath(params.id) : routePath;
    } else {
      url += route;
    }
    
    const queryParams = new URLSearchParams();
    queryParams.set('ref', 'extension');
    
    Object.entries(params).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        queryParams.set(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
    
    return url;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiDeepLinks = ShopOptiDeepLinks;
}
