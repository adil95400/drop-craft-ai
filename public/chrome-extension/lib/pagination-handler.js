/**
 * ShopOpti+ Pagination Handler v5.6.2
 * Auto-detect and navigate paginated listing pages
 */

const ShopOptiPagination = {
  VERSION: '5.6.2',

  /**
   * Detect pagination on current page
   */
  detectPagination(platform) {
    const pagination = {
      hasPagination: false,
      currentPage: 1,
      totalPages: null,
      nextPageUrl: null,
      prevPageUrl: null,
      pageUrls: []
    };

    // Get current page from URL or DOM
    const urlMatch = window.location.href.match(/[?&]page=(\d+)|\/page\/(\d+)|&pg=(\d+)/i);
    if (urlMatch) {
      pagination.currentPage = parseInt(urlMatch[1] || urlMatch[2] || urlMatch[3], 10);
    }

    // Platform-specific detection
    switch (platform) {
      case 'amazon':
        return this.detectAmazonPagination(pagination);
      case 'aliexpress':
        return this.detectAliExpressPagination(pagination);
      case 'ebay':
        return this.detectEbayPagination(pagination);
      case 'temu':
        return this.detectTemuPagination(pagination);
      default:
        return this.detectGenericPagination(pagination);
    }
  },

  /**
   * Amazon pagination
   */
  detectAmazonPagination(pagination) {
    const nextBtn = document.querySelector('.s-pagination-next:not(.s-pagination-disabled), .a-last a');
    const currentBtn = document.querySelector('.s-pagination-selected, .a-selected');
    const pageButtons = document.querySelectorAll('.s-pagination-item:not(.s-pagination-next):not(.s-pagination-previous), .a-normal a');

    if (currentBtn) {
      pagination.currentPage = parseInt(currentBtn.textContent, 10) || 1;
    }

    if (nextBtn) {
      pagination.hasPagination = true;
      pagination.nextPageUrl = nextBtn.href || null;
    }

    pageButtons.forEach(btn => {
      const pageNum = parseInt(btn.textContent, 10);
      if (!isNaN(pageNum)) {
        pagination.pageUrls.push({ page: pageNum, url: btn.href });
        if (pageNum > (pagination.totalPages || 0)) {
          pagination.totalPages = pageNum;
        }
      }
    });

    // Estimate total pages from "of X results"
    const resultsText = document.querySelector('.s-breadcrumb-title-count, .s-desktop-toolbar .a-size-base')?.textContent;
    if (resultsText) {
      const totalMatch = resultsText.match(/([0-9,]+)\s*(?:résultats|results)/i);
      if (totalMatch) {
        const totalResults = parseInt(totalMatch[1].replace(/,/g, ''), 10);
        const perPage = document.querySelectorAll('[data-component-type="s-search-result"]').length || 20;
        pagination.totalPages = Math.ceil(totalResults / perPage);
      }
    }

    return pagination;
  },

  /**
   * AliExpress pagination
   */
  detectAliExpressPagination(pagination) {
    const nextBtn = document.querySelector('.next-btn:not(.next-btn-disabled), .comet-pagination-item-next:not(.comet-pagination-disabled) a');
    const currentBtn = document.querySelector('.next-current, .comet-pagination-item-active');
    const totalEl = document.querySelector('.next-pagination-total, [class*="total-page"]');

    if (currentBtn) {
      pagination.currentPage = parseInt(currentBtn.textContent, 10) || 1;
    }

    if (nextBtn) {
      pagination.hasPagination = true;
      pagination.nextPageUrl = nextBtn.href || this.buildAliExpressNextUrl(pagination.currentPage);
    }

    if (totalEl) {
      const match = totalEl.textContent.match(/(\d+)/);
      if (match) {
        pagination.totalPages = parseInt(match[1], 10);
      }
    }

    return pagination;
  },

  /**
   * Build AliExpress next page URL
   */
  buildAliExpressNextUrl(currentPage) {
    const url = new URL(window.location.href);
    url.searchParams.set('page', currentPage + 1);
    return url.toString();
  },

  /**
   * eBay pagination
   */
  detectEbayPagination(pagination) {
    const nextBtn = document.querySelector('.pagination__next:not(.pagination__item--disabled) a, a.ebayui-pagination-button-next:not([aria-disabled="true"])');
    const currentBtn = document.querySelector('.pagination__item--current, .ebayui-pagination-li--active');
    const totalEl = document.querySelector('.srp-controls__count');

    if (currentBtn) {
      pagination.currentPage = parseInt(currentBtn.textContent, 10) || 1;
    }

    if (nextBtn) {
      pagination.hasPagination = true;
      pagination.nextPageUrl = nextBtn.href;
    }

    // Parse total results
    if (totalEl) {
      const match = totalEl.textContent.match(/([0-9,]+)\s*(?:résultats|results)/i);
      if (match) {
        const total = parseInt(match[1].replace(/,/g, ''), 10);
        pagination.totalPages = Math.ceil(total / 60); // eBay shows ~60 per page
      }
    }

    return pagination;
  },

  /**
   * Temu pagination (infinite scroll based)
   */
  detectTemuPagination(pagination) {
    // Temu uses infinite scroll, no traditional pagination
    pagination.hasPagination = true;
    pagination.isInfiniteScroll = true;
    pagination.loadMoreSelector = '[class*="LoadMore"], button[class*="load-more"]';
    
    return pagination;
  },

  /**
   * Generic pagination detection
   */
  detectGenericPagination(pagination) {
    // Try common pagination patterns
    const nextSelectors = [
      'a[rel="next"]',
      '.pagination .next a',
      '.pagination-next a',
      '[class*="pagination"] [class*="next"]:not([disabled]) a',
      'a[aria-label="Next"]',
      'a[aria-label="Page suivante"]',
      '.next-page a',
      'li.next a'
    ];

    for (const sel of nextSelectors) {
      const nextBtn = document.querySelector(sel);
      if (nextBtn && nextBtn.href) {
        pagination.hasPagination = true;
        pagination.nextPageUrl = nextBtn.href;
        break;
      }
    }

    // Get current page
    const currentSelectors = [
      '.pagination .active',
      '.pagination-current',
      '[class*="pagination"] [class*="active"]',
      '[aria-current="page"]'
    ];

    for (const sel of currentSelectors) {
      const current = document.querySelector(sel);
      if (current) {
        const pageNum = parseInt(current.textContent, 10);
        if (!isNaN(pageNum)) {
          pagination.currentPage = pageNum;
          break;
        }
      }
    }

    return pagination;
  },

  /**
   * Navigate to next page
   */
  async goToNextPage(paginationData) {
    if (!paginationData.hasPagination) {
      return { success: false, error: 'No pagination detected' };
    }

    if (paginationData.isInfiniteScroll) {
      return this.triggerInfiniteScroll(paginationData.loadMoreSelector);
    }

    if (paginationData.nextPageUrl) {
      window.location.href = paginationData.nextPageUrl;
      return { success: true, navigating: true };
    }

    return { success: false, error: 'No next page URL' };
  },

  /**
   * Trigger infinite scroll loading
   */
  async triggerInfiniteScroll(loadMoreSelector) {
    return new Promise((resolve) => {
      // Scroll to bottom
      window.scrollTo(0, document.body.scrollHeight);
      
      // Wait for load
      setTimeout(() => {
        const loadMoreBtn = document.querySelector(loadMoreSelector);
        if (loadMoreBtn) {
          loadMoreBtn.click();
          setTimeout(() => {
            resolve({ success: true, loaded: true });
          }, 2000);
        } else {
          resolve({ success: true, scrolled: true });
        }
      }, 1000);
    });
  },

  /**
   * Get all product cards on current page
   */
  getProductCards(platform) {
    const selectors = {
      amazon: '[data-component-type="s-search-result"], .s-result-item[data-asin]',
      aliexpress: '.search-item-card-wrapper-gallery, .list--gallery--34TropR, [class*="product-card"]',
      ebay: '.s-item:not(.s-item__pl-on-bottom), .srp-results .s-item__wrapper',
      temu: '._2BUQJ_w2, [data-testid="goods-item"], [class*="ProductCard"]',
      default: '.product-card, .product-item, [data-product-id]'
    };

    const selector = selectors[platform] || selectors.default;
    return Array.from(document.querySelectorAll(selector));
  },

  /**
   * Auto-paginate and collect products
   */
  async collectAllPages(platform, options = {}) {
    const { maxPages = 5, delayBetweenPages = 2000 } = options;
    const allProducts = [];
    let currentPage = 1;

    while (currentPage <= maxPages) {
      // Collect products from current page
      const cards = this.getProductCards(platform);
      console.log(`[ShopOpti+] Page ${currentPage}: Found ${cards.length} products`);
      
      cards.forEach(card => {
        const product = this.extractFromCard(card, platform);
        if (product) {
          allProducts.push(product);
        }
      });

      // Check for next page
      const pagination = this.detectPagination(platform);
      if (!pagination.hasPagination || !pagination.nextPageUrl) {
        break;
      }

      // Navigate
      await this.delay(delayBetweenPages);
      const result = await this.goToNextPage(pagination);
      if (!result.success) {
        break;
      }

      currentPage++;
      
      // Wait for new page to load
      await this.delay(3000);
    }

    return allProducts;
  },

  /**
   * Extract basic product info from card element
   */
  extractFromCard(card, platform) {
    try {
      const title = card.querySelector('h2, h3, [class*="title"], .s-item__title, .product-title')?.textContent?.trim();
      const priceEl = card.querySelector('[class*="price"], .a-price, .s-item__price');
      const price = priceEl ? this.parsePrice(priceEl.textContent) : 0;
      const image = card.querySelector('img')?.src || card.querySelector('img')?.dataset?.src;
      const link = card.querySelector('a')?.href;

      if (!title && !link) return null;

      return {
        title: title?.substring(0, 200) || '',
        price,
        image,
        url: link,
        platform
      };
    } catch (e) {
      return null;
    }
  },

  parsePrice(priceStr) {
    if (!priceStr) return 0;
    const clean = priceStr.replace(/[€$£¥\s]/g, '').replace(',', '.').trim();
    const match = clean.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiPagination = ShopOptiPagination;
}
