// ============================================
// ShopOpti+ Search All Suppliers Module v5.1.0
// Meta-search across all supported platforms
// AutoDS parity feature - 10+ platforms
// ============================================

(function() {
  'use strict';

  const SupplierSearch = {
    VERSION: '5.1.0',
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    
    // Supported suppliers with search capabilities
    SUPPLIERS: {
      aliexpress: {
        name: 'AliExpress',
        icon: '🛒',
        color: '#ff6a00',
        searchUrl: 'https://www.aliexpress.com/wholesale?SearchText=',
        avgShipping: '15-30 jours',
        minOrder: 1,
        rating: 4.2
      },
      amazon: {
        name: 'Amazon',
        icon: '📦',
        color: '#ff9900',
        searchUrl: 'https://www.amazon.fr/s?k=',
        avgShipping: '1-3 jours',
        minOrder: 1,
        rating: 4.5
      },
      temu: {
        name: 'Temu',
        icon: '🎁',
        color: '#f97316',
        searchUrl: 'https://www.temu.com/search_result.html?search_key=',
        avgShipping: '7-15 jours',
        minOrder: 1,
        rating: 4.0
      },
      cjdropshipping: {
        name: 'CJ Dropshipping',
        icon: '📦',
        color: '#1a73e8',
        searchUrl: 'https://www.cjdropshipping.com/search.html?key=',
        avgShipping: '8-12 jours',
        minOrder: 1,
        rating: 4.3
      },
      banggood: {
        name: 'Banggood',
        icon: '📱',
        color: '#ff6600',
        searchUrl: 'https://www.banggood.com/search/',
        avgShipping: '10-25 jours',
        minOrder: 1,
        rating: 4.0
      },
      dhgate: {
        name: 'DHgate',
        icon: '🏭',
        color: '#e54d00',
        searchUrl: 'https://www.dhgate.com/wholesale/search.do?searchkey=',
        avgShipping: '15-30 jours',
        minOrder: 2,
        rating: 3.8
      },
      ebay: {
        name: 'eBay',
        icon: '🏷️',
        color: '#e53238',
        searchUrl: 'https://www.ebay.fr/sch/i.html?_nkw=',
        avgShipping: '5-15 jours',
        minOrder: 1,
        rating: 4.1
      },
      walmart: {
        name: 'Walmart',
        icon: '🏪',
        color: '#0071ce',
        searchUrl: 'https://www.walmart.com/search?q=',
        avgShipping: '3-7 jours',
        minOrder: 1,
        rating: 4.2
      },
      wish: {
        name: 'Wish',
        icon: '⭐',
        color: '#2fb7ec',
        searchUrl: 'https://www.wish.com/search/',
        avgShipping: '15-45 jours',
        minOrder: 1,
        rating: 3.5
      },
      '1688': {
        name: '1688',
        icon: '🏭',
        color: '#ff6600',
        searchUrl: 'https://s.1688.com/selloffer/offer_search.htm?keywords=',
        avgShipping: '20-40 jours',
        minOrder: 10,
        rating: 4.0
      }
    },

    // Search results cache
    cache: new Map(),
    cacheTimeout: 5 * 60 * 1000, // 5 minutes

    // Search across all suppliers
    async searchAllSuppliers(query, options = {}) {
      const {
        suppliers = Object.keys(this.SUPPLIERS),
        maxResults = 10,
        sortBy = 'price', // price, rating, shipping
        filters = {}
      } = options;

      const cacheKey = `${query}_${suppliers.join(',')}_${sortBy}`;
      
      // Check cache
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Search each supplier
      const searchPromises = suppliers.map(supplier => 
        this.searchSupplier(supplier, query, maxResults)
      );

      const results = await Promise.allSettled(searchPromises);
      
      // Aggregate results
      let allProducts = [];
      const supplierResults = {};

      results.forEach((result, index) => {
        const supplier = suppliers[index];
        if (result.status === 'fulfilled' && result.value) {
          supplierResults[supplier] = {
            success: true,
            count: result.value.length,
            products: result.value
          };
          allProducts = allProducts.concat(result.value.map(p => ({
            ...p,
            supplier,
            supplierInfo: this.SUPPLIERS[supplier]
          })));
        } else {
          supplierResults[supplier] = {
            success: false,
            error: result.reason?.message || 'Search failed'
          };
        }
      });

      // Apply filters
      allProducts = this.applyFilters(allProducts, filters);

      // Sort results
      allProducts = this.sortResults(allProducts, sortBy);

      const searchResult = {
        query,
        timestamp: new Date().toISOString(),
        totalProducts: allProducts.length,
        supplierResults,
        products: allProducts,
        bestPrice: allProducts.length > 0 ? allProducts[0] : null,
        priceRange: this.getPriceRange(allProducts)
      };

      // Cache results
      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data: searchResult
      });

      return searchResult;
    },

    // Search a single supplier
    async searchSupplier(supplier, query, maxResults = 10) {
      const supplierInfo = this.SUPPLIERS[supplier];
      if (!supplierInfo) return [];

      try {
        // Try to use backend scraper for richer data
        const response = await fetch(`${this.API_URL}/search-suppliers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplier, query, maxResults })
        });

        if (response.ok) {
          const data = await response.json();
          return data.products || [];
        }
      } catch (error) {
        console.warn(`[SupplierSearch] Backend search failed for ${supplier}:`, error);
      }

      // Fallback: return mock search URL for manual search
      return [{
        title: `Rechercher "${query}" sur ${supplierInfo.name}`,
        price: null,
        searchUrl: supplierInfo.searchUrl + encodeURIComponent(query),
        isSearchLink: true,
        supplier
      }];
    },

    // Apply filters to results
    applyFilters(products, filters) {
      return products.filter(product => {
        // Price filter
        if (filters.minPrice && product.price < filters.minPrice) return false;
        if (filters.maxPrice && product.price > filters.maxPrice) return false;
        
        // Shipping filter
        if (filters.maxShipping && product.shippingDays > filters.maxShipping) return false;
        
        // Rating filter
        if (filters.minRating && product.rating < filters.minRating) return false;
        
        // In stock filter
        if (filters.inStockOnly && product.stock === 0) return false;
        
        return true;
      });
    },

    // Sort results
    sortResults(products, sortBy) {
      const sortFunctions = {
        price: (a, b) => (a.price || Infinity) - (b.price || Infinity),
        price_desc: (a, b) => (b.price || 0) - (a.price || 0),
        rating: (a, b) => (b.rating || 0) - (a.rating || 0),
        shipping: (a, b) => (a.shippingDays || 999) - (b.shippingDays || 999),
        relevance: (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
      };

      return products.sort(sortFunctions[sortBy] || sortFunctions.price);
    },

    // Get price range
    getPriceRange(products) {
      const prices = products.filter(p => p.price).map(p => p.price);
      if (prices.length === 0) return null;
      
      return {
        min: Math.min(...prices),
        max: Math.max(...prices),
        avg: prices.reduce((a, b) => a + b, 0) / prices.length
      };
    },

    // Compare product across suppliers
    async compareProduct(productUrl, productTitle) {
      // Extract key terms from title for search
      const searchTerms = this.extractSearchTerms(productTitle);
      
      // Search all suppliers
      const results = await this.searchAllSuppliers(searchTerms, {
        maxResults: 5,
        sortBy: 'price'
      });

      // Find best alternatives
      return {
        originalProduct: { url: productUrl, title: productTitle },
        searchTerms,
        alternatives: results.products.slice(0, 10),
        bestPrice: results.bestPrice,
        savingsPercent: null // Would need original price to calculate
      };
    },

    // Extract search terms from product title
    extractSearchTerms(title) {
      // Remove common noise words
      const noiseWords = [
        'free shipping', 'new', 'hot', 'sale', 'best', 'quality',
        'livraison gratuite', 'nouveau', 'promo', 'offre', 'qualité',
        '2024', '2025', 'pcs', 'lot', 'pack'
      ];
      
      let cleanTitle = title.toLowerCase();
      noiseWords.forEach(word => {
        cleanTitle = cleanTitle.replace(new RegExp(word, 'gi'), '');
      });
      
      // Remove special characters and extra spaces
      cleanTitle = cleanTitle
        .replace(/[^\w\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Take first 5 meaningful words
      const words = cleanTitle.split(' ').filter(w => w.length > 2);
      return words.slice(0, 5).join(' ');
    },

    // Create search UI
    createSearchUI() {
      const container = document.createElement('div');
      container.className = 'dc-supplier-search';
      container.innerHTML = `
        <div class="dc-search-header">
          <h3>🔍 Recherche Multi-Fournisseurs</h3>
          <p class="dc-search-subtitle">Comparez les prix sur ${Object.keys(this.SUPPLIERS).length} plateformes</p>
        </div>
        
        <div class="dc-search-input-container">
          <input type="text" 
                 class="dc-search-input" 
                 id="dc-supplier-search-input"
                 placeholder="Rechercher un produit...">
          <button class="dc-search-btn" id="dc-supplier-search-btn">
            <span class="dc-search-icon">🔍</span>
            Rechercher
          </button>
        </div>
        
        <div class="dc-search-filters">
          <div class="dc-filter-group">
            <label>Trier par</label>
            <select id="dc-search-sort" class="dc-filter-select">
              <option value="price">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="rating">Meilleure note</option>
              <option value="shipping">Livraison rapide</option>
            </select>
          </div>
          <div class="dc-filter-group">
            <label>Prix max</label>
            <input type="number" id="dc-max-price" class="dc-filter-input" placeholder="€">
          </div>
        </div>
        
        <div class="dc-supplier-toggles">
          ${Object.entries(this.SUPPLIERS).map(([key, supplier]) => `
            <label class="dc-supplier-toggle">
              <input type="checkbox" 
                     class="dc-supplier-checkbox" 
                     data-supplier="${key}"
                     checked>
              <span class="dc-supplier-icon" style="background: ${supplier.color}">${supplier.icon}</span>
              <span class="dc-supplier-name">${supplier.name}</span>
            </label>
          `).join('')}
        </div>
        
        <div class="dc-search-results" id="dc-search-results">
          <div class="dc-search-empty">
            <span class="dc-empty-icon">🔍</span>
            <span>Entrez un terme de recherche pour comparer les prix</span>
          </div>
        </div>
      `;

      // Bind events
      const searchBtn = container.querySelector('#dc-supplier-search-btn');
      const searchInput = container.querySelector('#dc-supplier-search-input');
      
      searchBtn?.addEventListener('click', () => this.performSearch(container));
      searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.performSearch(container);
      });

      return container;
    },

    // Perform search from UI
    async performSearch(container) {
      const query = container.querySelector('#dc-supplier-search-input')?.value;
      if (!query) return;

      const resultsContainer = container.querySelector('#dc-search-results');
      const sortBy = container.querySelector('#dc-search-sort')?.value || 'price';
      const maxPrice = parseFloat(container.querySelector('#dc-max-price')?.value) || null;
      
      const selectedSuppliers = Array.from(container.querySelectorAll('.dc-supplier-checkbox:checked'))
        .map(cb => cb.dataset.supplier);

      // Show loading
      resultsContainer.innerHTML = `
        <div class="dc-search-loading">
          <div class="dc-spinner"></div>
          <span>Recherche en cours sur ${selectedSuppliers.length} plateformes...</span>
        </div>
      `;

      try {
        const results = await this.searchAllSuppliers(query, {
          suppliers: selectedSuppliers,
          sortBy,
          filters: maxPrice ? { maxPrice } : {}
        });

        this.renderResults(resultsContainer, results);
      } catch (error) {
        resultsContainer.innerHTML = `
          <div class="dc-search-error">
            <span class="dc-error-icon">❌</span>
            <span>Erreur: ${error.message}</span>
          </div>
        `;
      }
    },

    // Render search results
    renderResults(container, results) {
      if (results.products.length === 0) {
        container.innerHTML = `
          <div class="dc-search-empty">
            <span class="dc-empty-icon">📭</span>
            <span>Aucun résultat trouvé</span>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="dc-results-header">
          <span class="dc-results-count">${results.totalProducts} résultats</span>
          ${results.priceRange ? `
            <span class="dc-price-range">
              Prix: ${results.priceRange.min.toFixed(2)}€ - ${results.priceRange.max.toFixed(2)}€
            </span>
          ` : ''}
        </div>
        
        <div class="dc-results-grid">
          ${results.products.slice(0, 20).map(product => `
            <div class="dc-result-card ${product.isSearchLink ? 'search-link' : ''}">
              <div class="dc-result-supplier" style="background: ${product.supplierInfo?.color || '#666'}">
                ${product.supplierInfo?.icon || '🏪'} ${product.supplierInfo?.name || product.supplier}
              </div>
              ${product.image ? `
                <img src="${product.image}" class="dc-result-image" alt="${product.title}">
              ` : `
                <div class="dc-result-no-image">📦</div>
              `}
              <div class="dc-result-info">
                <h4 class="dc-result-title">${product.title}</h4>
                ${product.price ? `
                  <div class="dc-result-price">${product.price.toFixed(2)} €</div>
                ` : ''}
                <div class="dc-result-meta">
                  ${product.rating ? `<span>⭐ ${product.rating}</span>` : ''}
                  ${product.shippingDays ? `<span>🚚 ${product.shippingDays}j</span>` : ''}
                  ${product.stock ? `<span>📦 ${product.stock}</span>` : ''}
                </div>
              </div>
              <div class="dc-result-actions">
                ${product.isSearchLink ? `
                  <a href="${product.searchUrl}" target="_blank" class="dc-result-btn primary">
                    Rechercher sur ${product.supplierInfo?.name}
                  </a>
                ` : `
                  <button class="dc-result-btn primary dc-import-result" data-url="${product.url || ''}">
                    Importer
                  </button>
                  <a href="${product.url || product.searchUrl}" target="_blank" class="dc-result-btn secondary">
                    Voir
                  </a>
                `}
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
  };

  // Export for use in other modules
  window.SupplierSearch = SupplierSearch;

})();
