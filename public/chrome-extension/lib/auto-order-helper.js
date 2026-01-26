// ============================================
// ShopOpti+ Auto-Order Helper v5.7.0
// Assists with supplier order placement
// ============================================

const ShopOptiAutoOrderHelper = {
  // Supported suppliers
  suppliers: {
    aliexpress: {
      name: 'AliExpress',
      domain: 'aliexpress.com',
      cartUrl: 'https://www.aliexpress.com/p/shoppingcart/index.html',
      checkoutUrl: 'https://www.aliexpress.com/p/order/confirm.html'
    },
    amazon: {
      name: 'Amazon',
      domain: 'amazon.',
      cartUrl: '/gp/cart/view.html',
      checkoutUrl: '/gp/buy/spc/handlers/display.html'
    },
    cjdropshipping: {
      name: 'CJ Dropshipping',
      domain: 'cjdropshipping.com',
      cartUrl: 'https://cjdropshipping.com/cart.html'
    },
    temu: {
      name: 'Temu',
      domain: 'temu.com',
      cartUrl: 'https://www.temu.com/cart.html'
    }
  },

  /**
   * Detect current supplier from URL
   */
  detectSupplier(url) {
    const urlLower = url.toLowerCase();
    
    for (const [key, supplier] of Object.entries(this.suppliers)) {
      if (urlLower.includes(supplier.domain)) {
        return { key, ...supplier };
      }
    }
    
    return null;
  },

  /**
   * Pre-fill cart with product
   */
  async addToCart(productData) {
    const supplier = this.detectSupplier(window.location.href);
    if (!supplier) {
      return { success: false, error: 'Supplier not detected' };
    }
    
    try {
      switch (supplier.key) {
        case 'aliexpress':
          return await this.addToCartAliExpress(productData);
        case 'amazon':
          return await this.addToCartAmazon(productData);
        case 'temu':
          return await this.addToCartTemu(productData);
        default:
          return { success: false, error: 'Supplier not supported for auto-cart' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * AliExpress add to cart
   */
  async addToCartAliExpress(productData) {
    // Select variant if specified
    if (productData.variant) {
      await this.selectVariantAliExpress(productData.variant);
    }
    
    // Set quantity
    if (productData.quantity) {
      await this.setQuantityAliExpress(productData.quantity);
    }
    
    // Click add to cart button
    const addButton = document.querySelector('[class*="addcart"], [data-role="add-to-cart"], button[class*="add-to-cart"]');
    if (addButton) {
      addButton.click();
      await this.waitForCartUpdate();
      return { success: true, message: 'Added to cart' };
    }
    
    return { success: false, error: 'Add to cart button not found' };
  },

  /**
   * Select variant on AliExpress
   */
  async selectVariantAliExpress(variant) {
    // Find variant selectors
    const skuSelectors = document.querySelectorAll('[class*="sku-property"] [class*="sku-property-item"]');
    
    for (const selector of skuSelectors) {
      const text = selector.textContent?.toLowerCase() || '';
      const variantLower = variant.toLowerCase();
      
      if (text.includes(variantLower) || selector.getAttribute('title')?.toLowerCase().includes(variantLower)) {
        selector.click();
        await this.sleep(300);
      }
    }
  },

  /**
   * Set quantity on AliExpress
   */
  async setQuantityAliExpress(quantity) {
    const input = document.querySelector('input[class*="quantity"], input[type="number"][class*="count"]');
    if (input) {
      input.value = quantity;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  },

  /**
   * Amazon add to cart
   */
  async addToCartAmazon(productData) {
    // Select variant if specified
    if (productData.variant) {
      await this.selectVariantAmazon(productData.variant);
    }
    
    // Set quantity
    if (productData.quantity) {
      await this.setQuantityAmazon(productData.quantity);
    }
    
    // Click add to cart
    const addButton = document.getElementById('add-to-cart-button') || 
                      document.querySelector('input[name="submit.add-to-cart"]');
    if (addButton) {
      addButton.click();
      await this.waitForCartUpdate();
      return { success: true, message: 'Added to Amazon cart' };
    }
    
    return { success: false, error: 'Amazon add to cart button not found' };
  },

  /**
   * Select variant on Amazon
   */
  async selectVariantAmazon(variant) {
    // Try dropdown selectors
    const dropdowns = document.querySelectorAll('select[name^="dropdown_selected"]');
    for (const dropdown of dropdowns) {
      const options = dropdown.querySelectorAll('option');
      for (const option of options) {
        if (option.textContent.toLowerCase().includes(variant.toLowerCase())) {
          dropdown.value = option.value;
          dropdown.dispatchEvent(new Event('change', { bubbles: true }));
          await this.sleep(500);
          break;
        }
      }
    }
    
    // Try swatch buttons
    const swatches = document.querySelectorAll('[id^="color_name_"] li, [id^="size_name_"] li');
    for (const swatch of swatches) {
      const title = swatch.getAttribute('title') || swatch.textContent;
      if (title?.toLowerCase().includes(variant.toLowerCase())) {
        swatch.click();
        await this.sleep(500);
      }
    }
  },

  /**
   * Set quantity on Amazon
   */
  async setQuantityAmazon(quantity) {
    const qtySelect = document.getElementById('quantity');
    if (qtySelect) {
      const option = qtySelect.querySelector(`option[value="${quantity}"]`);
      if (option) {
        qtySelect.value = quantity;
        qtySelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  },

  /**
   * Temu add to cart
   */
  async addToCartTemu(productData) {
    const addButton = document.querySelector('[class*="add-to-cart"], button[class*="AddToCart"]');
    if (addButton) {
      addButton.click();
      await this.waitForCartUpdate();
      return { success: true, message: 'Added to Temu cart' };
    }
    return { success: false, error: 'Temu add to cart button not found' };
  },

  /**
   * Wait for cart to update
   */
  async waitForCartUpdate() {
    return new Promise(resolve => {
      let checks = 0;
      const maxChecks = 20;
      
      const checkInterval = setInterval(() => {
        checks++;
        
        // Look for success indicators
        const successModal = document.querySelector('[class*="cart-success"], [class*="added-to-cart"], [class*="CartSuccess"]');
        const cartCount = document.querySelector('[class*="cart-count"], [id*="cart-count"]');
        
        if (successModal || checks >= maxChecks) {
          clearInterval(checkInterval);
          resolve(true);
        }
      }, 200);
    });
  },

  /**
   * Pre-fill shipping address
   */
  async prefillAddress(address) {
    const fieldMappings = {
      name: ['input[name="name"]', 'input[name="fullName"]', '#ship-to-name'],
      street: ['input[name="address"]', 'input[name="street"]', '#ship-address1'],
      city: ['input[name="city"]', '#ship-city'],
      state: ['input[name="state"]', 'select[name="state"]', '#ship-state'],
      zip: ['input[name="zip"]', 'input[name="postalCode"]', '#ship-zip'],
      country: ['select[name="country"]', '#ship-country'],
      phone: ['input[name="phone"]', 'input[name="phoneNumber"]', '#ship-phone']
    };
    
    for (const [field, selectors] of Object.entries(fieldMappings)) {
      if (!address[field]) continue;
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
          if (element.tagName === 'SELECT') {
            // Handle select dropdowns
            const option = Array.from(element.options).find(opt => 
              opt.textContent.toLowerCase().includes(address[field].toLowerCase())
            );
            if (option) {
              element.value = option.value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
            }
          } else {
            // Handle inputs
            element.value = address[field];
            element.dispatchEvent(new Event('input', { bubbles: true }));
          }
          break;
        }
      }
    }
    
    return { success: true, message: 'Address prefilled' };
  },

  /**
   * Extract tracking number from order confirmation
   */
  extractTrackingNumber() {
    const trackingPatterns = [
      // Common tracking number patterns
      /\b(1Z[A-Z0-9]{16})\b/i,           // UPS
      /\b(\d{12,22})\b/,                  // Generic numeric
      /\b([A-Z]{2}\d{9}[A-Z]{2})\b/i,    // International
      /\b(JD\d{12,15})\b/i,               // China Post
      /\b(YANWEN\w{10,20})\b/i,           // Yanwen
      /\b(YT\d{16})\b/i,                  // Yun Track
      /\b(LP\d{14,18})\b/i                // La Poste
    ];
    
    // Look in common tracking containers
    const containers = document.querySelectorAll(
      '[class*="tracking"], [class*="shipment"], [id*="tracking"], [data-tracking]'
    );
    
    for (const container of containers) {
      const text = container.textContent || '';
      for (const pattern of trackingPatterns) {
        const match = text.match(pattern);
        if (match) {
          return {
            found: true,
            trackingNumber: match[1],
            source: container.className
          };
        }
      }
    }
    
    // Try page-wide search as fallback
    const pageText = document.body.textContent || '';
    for (const pattern of trackingPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        return {
          found: true,
          trackingNumber: match[1],
          source: 'page_scan'
        };
      }
    }
    
    return { found: false };
  },

  /**
   * Get order confirmation details
   */
  extractOrderConfirmation() {
    const confirmation = {
      orderNumber: null,
      totalAmount: null,
      currency: null,
      estimatedDelivery: null,
      trackingNumber: null
    };
    
    // Order number patterns
    const orderPatterns = [
      /order\s*(?:number|#|id)?[:\s]*([A-Z0-9-]{8,30})/i,
      /commande\s*(?:n°|numéro)?[:\s]*([A-Z0-9-]{8,30})/i
    ];
    
    const pageText = document.body.textContent || '';
    
    for (const pattern of orderPatterns) {
      const match = pageText.match(pattern);
      if (match) {
        confirmation.orderNumber = match[1];
        break;
      }
    }
    
    // Extract tracking
    const trackingResult = this.extractTrackingNumber();
    if (trackingResult.found) {
      confirmation.trackingNumber = trackingResult.trackingNumber;
    }
    
    // Extract total
    const totalMatch = pageText.match(/total[:\s]*([€$£¥]\s*[\d,.]+|[\d,.]+\s*[€$£¥])/i);
    if (totalMatch) {
      confirmation.totalAmount = totalMatch[1].trim();
    }
    
    return confirmation;
  },

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiAutoOrderHelper = ShopOptiAutoOrderHelper;
}
