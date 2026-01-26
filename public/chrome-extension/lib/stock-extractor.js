/**
 * ShopOpti+ Stock Extractor v5.7.0
 * Extract detailed stock information: quantity, availability, low stock alerts
 */

const ShopOptiStockExtractor = {
  VERSION: '5.7.0',

  /**
   * Extract stock information from page
   */
  async extractStock(platform) {
    switch (platform) {
      case 'amazon':
        return this.extractAmazonStock();
      case 'aliexpress':
        return this.extractAliExpressStock();
      case 'shopify':
        return this.extractShopifyStock();
      case 'ebay':
        return this.extractEbayStock();
      case 'temu':
        return this.extractTemuStock();
      default:
        return this.extractGenericStock();
    }
  },

  /**
   * Amazon stock extraction with quantity
   */
  extractAmazonStock() {
    const stock = {
      available: false,
      quantity: null,
      lowStock: false,
      inStock: false,
      status: 'unknown',
      restockDate: null
    };

    // Availability status
    const availabilityEl = document.querySelector('#availability span, #availability-string');
    if (availabilityEl) {
      const text = availabilityEl.textContent.toLowerCase();
      
      if (text.includes('en stock') || text.includes('in stock')) {
        stock.available = true;
        stock.inStock = true;
        stock.status = 'in_stock';
      } else if (text.includes('seulement') || text.includes('only')) {
        stock.available = true;
        stock.lowStock = true;
        stock.status = 'low_stock';
        
        // Extract quantity
        const qtyMatch = text.match(/(\d+)\s*(exemplaire|article|restant|left|in stock)/i);
        if (qtyMatch) {
          stock.quantity = parseInt(qtyMatch[1], 10);
        }
      } else if (text.includes('indisponible') || text.includes('unavailable') || text.includes('out of stock')) {
        stock.available = false;
        stock.inStock = false;
        stock.status = 'out_of_stock';
      } else if (text.includes('pré-commande') || text.includes('pre-order')) {
        stock.available = true;
        stock.status = 'preorder';
      }
    }

    // Quantity dropdown (max selectable = stock)
    const qtySelect = document.querySelector('#quantity select, #quantityDropdownDiv select');
    if (qtySelect) {
      const options = qtySelect.querySelectorAll('option');
      if (options.length > 0) {
        const lastOption = options[options.length - 1];
        const maxQty = parseInt(lastOption.value, 10);
        if (maxQty > 0) {
          stock.quantity = maxQty;
          stock.available = true;
          stock.inStock = true;
          if (maxQty <= 5) {
            stock.lowStock = true;
            stock.status = 'low_stock';
          }
        }
      }
    }

    // Restock date
    const restockEl = document.querySelector('.a-color-success.a-text-bold, #availability .a-color-success');
    if (restockEl && restockEl.textContent.includes('202')) {
      stock.restockDate = restockEl.textContent.trim();
    }

    // Add to Cart button presence
    const addToCartBtn = document.querySelector('#add-to-cart-button, #buy-now-button');
    if (!addToCartBtn || addToCartBtn.disabled) {
      if (stock.status === 'unknown') {
        stock.available = false;
        stock.status = 'out_of_stock';
      }
    }

    return stock;
  },

  /**
   * AliExpress stock extraction
   */
  extractAliExpressStock() {
    const stock = {
      available: true,
      quantity: null,
      lowStock: false,
      inStock: true,
      status: 'in_stock',
      variants: []
    };

    // Stock from page scripts
    const scripts = document.querySelectorAll('script:not([src])');
    for (const script of scripts) {
      const content = script.textContent;
      
      // skuModule.skuPriceList for quantities
      const skuMatch = content.match(/"skuPriceList"\s*:\s*(\[[\s\S]*?\])/);
      if (skuMatch) {
        try {
          const skuData = JSON.parse(skuMatch[1]);
          skuData.forEach(sku => {
            if (sku.skuAttr) {
              stock.variants.push({
                id: sku.skuId,
                name: sku.skuAttr,
                quantity: sku.skuVal?.availQuantity || null,
                available: (sku.skuVal?.availQuantity || 0) > 0
              });
            }
          });
        } catch (e) {}
      }

      // Total available quantity
      const totalMatch = content.match(/"totalAvailQuantity"\s*:\s*(\d+)/);
      if (totalMatch) {
        stock.quantity = parseInt(totalMatch[1], 10);
      }
    }

    // DOM fallback
    const stockEl = document.querySelector('[class*="quantity-info"], [class*="stock-count"]');
    if (stockEl) {
      const match = stockEl.textContent.match(/(\d+)\s*(pièces?|pieces?|disponible|available)/i);
      if (match) {
        stock.quantity = parseInt(match[1], 10);
      }
    }

    // Low stock check
    if (stock.quantity !== null && stock.quantity > 0 && stock.quantity <= 10) {
      stock.lowStock = true;
      stock.status = 'low_stock';
    }

    if (stock.quantity === 0) {
      stock.available = false;
      stock.inStock = false;
      stock.status = 'out_of_stock';
    }

    return stock;
  },

  /**
   * Shopify stock extraction
   */
  extractShopifyStock() {
    const stock = {
      available: true,
      quantity: null,
      lowStock: false,
      inStock: true,
      status: 'in_stock',
      trackInventory: false
    };

    // From window.ShopifyAnalytics
    if (window.ShopifyAnalytics?.meta?.product) {
      const product = window.ShopifyAnalytics.meta.product;
      stock.available = product.available !== false;
      stock.inStock = stock.available;
    }

    // From product JSON (often embedded)
    const productJson = document.querySelector('script[type="application/json"][data-product-json], script#product-json');
    if (productJson) {
      try {
        const product = JSON.parse(productJson.textContent);
        stock.available = product.available !== false;
        
        // Sum variant inventories
        if (product.variants) {
          let totalQty = 0;
          product.variants.forEach(v => {
            if (v.inventory_quantity !== undefined) {
              totalQty += v.inventory_quantity;
              stock.trackInventory = true;
            }
          });
          if (stock.trackInventory) {
            stock.quantity = totalQty;
          }
        }
      } catch (e) {}
    }

    // Sold out button
    const soldOutBtn = document.querySelector('[name="add"][disabled], .btn--sold-out, .sold-out');
    if (soldOutBtn) {
      stock.available = false;
      stock.inStock = false;
      stock.status = 'out_of_stock';
    }

    // Low stock indicator
    const lowStockEl = document.querySelector('.low-stock, [class*="low-inventory"], [class*="hurry"]');
    if (lowStockEl) {
      stock.lowStock = true;
      stock.status = 'low_stock';
    }

    return stock;
  },

  /**
   * eBay stock extraction
   */
  extractEbayStock() {
    const stock = {
      available: true,
      quantity: null,
      lowStock: false,
      inStock: true,
      status: 'in_stock',
      sold: 0
    };

    // Quantity available
    const qtyEl = document.querySelector('#qtySubTxt, .x-quantity__availability');
    if (qtyEl) {
      const match = qtyEl.textContent.match(/(\d+)\s*(disponible|available)/i);
      if (match) {
        stock.quantity = parseInt(match[1], 10);
      }
    }

    // Items sold
    const soldEl = document.querySelector('.x-quantity__sold, #vi-qtyS-cnt');
    if (soldEl) {
      const match = soldEl.textContent.match(/(\d+)\s*(vendu|sold)/i);
      if (match) {
        stock.sold = parseInt(match[1], 10);
      }
    }

    // Out of stock
    const outOfStockEl = document.querySelector('.x-out-of-stock, #soldout');
    if (outOfStockEl) {
      stock.available = false;
      stock.inStock = false;
      stock.status = 'out_of_stock';
    }

    // Low stock
    if (stock.quantity !== null && stock.quantity > 0 && stock.quantity <= 3) {
      stock.lowStock = true;
      stock.status = 'low_stock';
    }

    return stock;
  },

  /**
   * Temu stock extraction
   */
  extractTemuStock() {
    const stock = {
      available: true,
      quantity: null,
      lowStock: false,
      inStock: true,
      status: 'in_stock',
      soldCount: 0
    };

    // Sold count
    const soldEl = document.querySelector('[class*="sold"], [class*="orders"]');
    if (soldEl) {
      const match = soldEl.textContent.match(/(\d+[\d,.]*)\s*(vendu|sold|orders)/i);
      if (match) {
        stock.soldCount = parseInt(match[1].replace(/[,.]/g, ''), 10);
      }
    }

    // Low stock warning
    const lowStockEl = document.querySelector('[class*="low-stock"], [class*="hurry"]');
    if (lowStockEl) {
      stock.lowStock = true;
      stock.status = 'low_stock';
    }

    // Out of stock
    const outStockEl = document.querySelector('[class*="out-of-stock"], [class*="sold-out"]');
    if (outStockEl) {
      stock.available = false;
      stock.inStock = false;
      stock.status = 'out_of_stock';
    }

    return stock;
  },

  /**
   * Generic stock extraction
   */
  extractGenericStock() {
    const stock = {
      available: true,
      quantity: null,
      lowStock: false,
      inStock: true,
      status: 'unknown'
    };

    // Check for add to cart button
    const addToCartBtn = document.querySelector('[class*="add-to-cart"]:not([disabled]), [name="add"]:not([disabled]), button:contains("Add to Cart"), button:contains("Ajouter au panier")');
    if (!addToCartBtn) {
      const disabledBtn = document.querySelector('[class*="add-to-cart"][disabled], [class*="sold-out"], [class*="out-of-stock"]');
      if (disabledBtn) {
        stock.available = false;
        stock.inStock = false;
        stock.status = 'out_of_stock';
      }
    }

    // Stock quantity patterns
    const stockPatterns = [
      /(\d+)\s*(en stock|in stock|disponible|available)/i,
      /seulement\s*(\d+)/i,
      /only\s*(\d+)\s*left/i,
      /(\d+)\s*restant/i
    ];

    const bodyText = document.body.innerText;
    for (const pattern of stockPatterns) {
      const match = bodyText.match(pattern);
      if (match) {
        stock.quantity = parseInt(match[1], 10);
        stock.available = stock.quantity > 0;
        stock.inStock = stock.available;
        stock.status = stock.available ? 'in_stock' : 'out_of_stock';
        break;
      }
    }

    return stock;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiStockExtractor = ShopOptiStockExtractor;
}
