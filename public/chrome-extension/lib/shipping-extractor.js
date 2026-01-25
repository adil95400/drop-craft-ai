/**
 * ShopOpti+ Shipping Extractor v5.6.2
 * Extract detailed shipping info: cost, methods, delivery time, origin
 */

const ShopOptiShippingExtractor = {
  VERSION: '5.6.2',

  /**
   * Extract shipping information from page
   */
  async extractShipping(platform) {
    switch (platform) {
      case 'amazon':
        return this.extractAmazonShipping();
      case 'aliexpress':
        return this.extractAliExpressShipping();
      case 'temu':
        return this.extractTemuShipping();
      case 'ebay':
        return this.extractEbayShipping();
      default:
        return this.extractGenericShipping();
    }
  },

  /**
   * Amazon shipping extraction
   */
  extractAmazonShipping() {
    const shipping = {
      cost: 0,
      isFree: false,
      methods: [],
      estimatedDelivery: null,
      deliveryMinDays: null,
      deliveryMaxDays: null,
      origin: null,
      fulfillment: null // 'amazon' | 'seller' | 'fba'
    };

    // Free shipping detection
    const freeShippingSelectors = [
      '#deliveryMessageMirId',
      '#delivery-message',
      '.a-section.a-spacing-none.a-spacing-top-base',
      '#mir-layout-DELIVERY_BLOCK'
    ];

    for (const sel of freeShippingSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.toLowerCase();
        if (text.includes('livraison gratuite') || text.includes('free delivery') || text.includes('free shipping')) {
          shipping.isFree = true;
          shipping.cost = 0;
        }
      }
    }

    // Delivery date extraction
    const deliveryEl = document.querySelector('#delivery-message .a-text-bold, #deliveryMessageMirId .a-text-bold, .delivery-message .a-text-bold');
    if (deliveryEl) {
      const deliveryText = deliveryEl.textContent.trim();
      shipping.estimatedDelivery = deliveryText;
      
      // Extract days estimate
      const daysMatch = deliveryText.match(/(\d+)\s*[-–à]\s*(\d+)\s*(jours?|days?)/i) ||
                        deliveryText.match(/(\d+)\s*(jours?|days?)/i);
      if (daysMatch) {
        shipping.deliveryMinDays = parseInt(daysMatch[1], 10);
        shipping.deliveryMaxDays = parseInt(daysMatch[2] || daysMatch[1], 10);
      }
    }

    // Shipping cost if not free
    if (!shipping.isFree) {
      const costSelectors = [
        '#ourprice_shippingmessage .a-size-base',
        '#price-shipping-message',
        '.a-row .a-color-secondary:contains("livraison")'
      ];

      for (const sel of costSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const costMatch = el.textContent.match(/([€$£]\s*[\d,.]+|[\d,.]+\s*[€$£])/);
          if (costMatch) {
            shipping.cost = this.parsePrice(costMatch[1]);
            break;
          }
        }
      }
    }

    // Prime/FBA detection
    if (document.querySelector('#primePopoverContent, #buybox-see-all-buying-choices .a-icon-prime, .prime-message')) {
      shipping.fulfillment = 'fba';
      shipping.isFree = true;
      shipping.cost = 0;
    }

    // Seller/merchant info
    const sellerEl = document.querySelector('#merchant-info, #tabular-buybox-container .tabular-buybox-text');
    if (sellerEl) {
      const sellerText = sellerEl.textContent;
      if (sellerText.includes('Amazon')) {
        shipping.fulfillment = 'amazon';
      } else {
        shipping.fulfillment = 'seller';
      }
    }

    // Shipping methods
    const methodEls = document.querySelectorAll('#ddmDeliveryMessage, .a-lineitem .a-text-bold');
    methodEls.forEach(el => {
      const method = el.textContent.trim();
      if (method && !shipping.methods.includes(method)) {
        shipping.methods.push(method);
      }
    });

    return shipping;
  },

  /**
   * AliExpress shipping extraction
   */
  extractAliExpressShipping() {
    const shipping = {
      cost: 0,
      isFree: false,
      methods: [],
      estimatedDelivery: null,
      deliveryMinDays: null,
      deliveryMaxDays: null,
      origin: 'China'
    };

    // Shipping method list
    const shippingSelectors = [
      '[class*="shipping-panel"]',
      '[class*="dynamic-shipping"]',
      '.product-shipping',
      '[data-pl="product-shipping"]'
    ];

    for (const sel of shippingSelectors) {
      const container = document.querySelector(sel);
      if (container) {
        const text = container.textContent.toLowerCase();
        
        // Free shipping
        if (text.includes('free shipping') || text.includes('livraison gratuite') || text.includes('gratuit')) {
          shipping.isFree = true;
          shipping.cost = 0;
        }

        // Cost extraction
        const costMatch = text.match(/([€$]\s*[\d,.]+|[\d,.]+\s*[€$])/);
        if (costMatch && !shipping.isFree) {
          shipping.cost = this.parsePrice(costMatch[1]);
        }

        // Delivery time
        const daysMatch = text.match(/(\d+)\s*[-–à]\s*(\d+)\s*(jours?|days?)/i) ||
                          text.match(/(\d+)\s*(jours?|days?)/i);
        if (daysMatch) {
          shipping.deliveryMinDays = parseInt(daysMatch[1], 10);
          shipping.deliveryMaxDays = parseInt(daysMatch[2] || daysMatch[1], 10);
        }
      }
    }

    // Shipping methods
    document.querySelectorAll('[class*="shipping-item"], .shipping-method').forEach(el => {
      const method = el.textContent.trim();
      if (method) {
        shipping.methods.push({
          name: method.split(/[€$]/)[0].trim(),
          cost: this.parsePrice(method),
          estimated: null
        });
      }
    });

    return shipping;
  },

  /**
   * Temu shipping extraction
   */
  extractTemuShipping() {
    const shipping = {
      cost: 0,
      isFree: true, // Temu usually free
      methods: [],
      estimatedDelivery: null,
      deliveryMinDays: 7,
      deliveryMaxDays: 15,
      origin: 'China'
    };

    const shippingEl = document.querySelector('[class*="delivery"], [class*="shipping"]');
    if (shippingEl) {
      const text = shippingEl.textContent;
      
      const daysMatch = text.match(/(\d+)\s*[-–à]\s*(\d+)/);
      if (daysMatch) {
        shipping.deliveryMinDays = parseInt(daysMatch[1], 10);
        shipping.deliveryMaxDays = parseInt(daysMatch[2], 10);
      }

      shipping.estimatedDelivery = text.trim();
    }

    return shipping;
  },

  /**
   * eBay shipping extraction
   */
  extractEbayShipping() {
    const shipping = {
      cost: 0,
      isFree: false,
      methods: [],
      estimatedDelivery: null,
      deliveryMinDays: null,
      deliveryMaxDays: null,
      origin: null,
      returns: null
    };

    // Shipping cost
    const shippingCostEl = document.querySelector('#fshippingCost, .ux-labels-values--shipping .ux-textspans, [data-testid="ux-labels-values-shipping"]');
    if (shippingCostEl) {
      const text = shippingCostEl.textContent.toLowerCase();
      if (text.includes('free') || text.includes('gratuit')) {
        shipping.isFree = true;
        shipping.cost = 0;
      } else {
        shipping.cost = this.parsePrice(text);
      }
    }

    // Delivery estimate
    const deliveryEl = document.querySelector('.ux-labels-values--deliverto .ux-textspans, [data-testid="delivery-date"]');
    if (deliveryEl) {
      shipping.estimatedDelivery = deliveryEl.textContent.trim();
    }

    // Item location
    const locationEl = document.querySelector('.ux-labels-values--itemLocation .ux-textspans');
    if (locationEl) {
      shipping.origin = locationEl.textContent.trim();
    }

    return shipping;
  },

  /**
   * Generic shipping extraction
   */
  extractGenericShipping() {
    const shipping = {
      cost: 0,
      isFree: false,
      methods: [],
      estimatedDelivery: null,
      deliveryMinDays: null,
      deliveryMaxDays: null,
      origin: null
    };

    // Generic selectors
    const shippingSelectors = [
      '[class*="shipping"]',
      '[class*="delivery"]',
      '[class*="livraison"]',
      '[data-shipping]'
    ];

    for (const sel of shippingSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.toLowerCase();
        
        if (text.includes('free') || text.includes('gratuit')) {
          shipping.isFree = true;
        }

        const costMatch = text.match(/([€$£]\s*[\d,.]+)/);
        if (costMatch && !shipping.isFree) {
          shipping.cost = this.parsePrice(costMatch[1]);
        }

        const daysMatch = text.match(/(\d+)\s*[-–à]\s*(\d+)\s*(jours?|days?)/i);
        if (daysMatch) {
          shipping.deliveryMinDays = parseInt(daysMatch[1], 10);
          shipping.deliveryMaxDays = parseInt(daysMatch[2], 10);
        }
      }
    }

    return shipping;
  },

  /**
   * Parse price string to number
   */
  parsePrice(priceStr) {
    if (!priceStr || typeof priceStr !== 'string') return 0;
    const clean = priceStr.replace(/[€$£¥\s]/g, '').replace(',', '.').trim();
    const match = clean.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiShippingExtractor = ShopOptiShippingExtractor;
}
