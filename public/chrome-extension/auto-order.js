/**
 * ShopOpti+ Auto-Order System v5.7.0
 * Automated order placement for dropshipping
 * Supports: AliExpress, Amazon, Temu, CJ Dropshipping, Banggood, DHgate, 1688, Shein, eBay, Alibaba
 * Features: Full automation + Semi-auto mode (cart fill + instructions)
 */

class ShopOptiAutoOrder {
  constructor() {
    this.config = null;
    this.auth = null;
    this.pendingOrders = [];
    this.processingQueue = [];
    this.orderHistory = [];
    this.retryAttempts = {};
    this.MAX_RETRIES = 3;
  }

  async init() {
    await this.loadConfig();
    await this.loadPendingOrders();
    await this.loadOrderHistory();
    this.injectUI();
    this.setupMessageListener();
    this.checkForProcessingOrder();
    console.log('[ShopOpti+] Auto-order system initialized');
  }

  async loadConfig() {
    return new Promise(resolve => {
      chrome.storage.local.get(['shopopti_config', 'shopopti_auth'], result => {
        this.config = result.shopopti_config || {
          autoConfirmOrders: false,
          defaultShippingMethod: 'standard',
          notifyOnComplete: true,
          retryOnFailure: true
        };
        this.auth = result.shopopti_auth || {};
        resolve();
      });
    });
  }

  async loadPendingOrders() {
    if (!this.auth?.token) return;

    try {
      const response = await fetch(`${this.getApiUrl()}/pending-orders`, {
        headers: {
          'Authorization': `Bearer ${this.auth.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.pendingOrders = data.orders || [];
      }
    } catch (error) {
      console.error('[ShopOpti+] Failed to load pending orders:', error);
    }
  }

  async loadOrderHistory() {
    return new Promise(resolve => {
      chrome.storage.local.get(['shopopti_order_history'], result => {
        this.orderHistory = result.shopopti_order_history || [];
        resolve();
      });
    });
  }

  async saveOrderHistory() {
    // Keep last 100 orders
    const historyToSave = this.orderHistory.slice(-100);
    return new Promise(resolve => {
      chrome.storage.local.set({ shopopti_order_history: historyToSave }, resolve);
    });
  }

  async checkForProcessingOrder() {
    return new Promise(resolve => {
      chrome.storage.local.get(['processing_order'], async result => {
        if (result.processing_order) {
          const order = result.processing_order;
          const platform = this.detectPlatform(window.location.href);
          
          if (platform && window.location.href.includes(order.supplierUrl?.split('/')[2])) {
            console.log('[ShopOpti+] Resuming order processing:', order);
            await chrome.storage.local.remove(['processing_order']);
            await this.continueOrderProcessing(order, platform);
          }
        }
        resolve();
      });
    });
  }

  async continueOrderProcessing(order, platform) {
    const capabilities = this.getPlatformCapabilities()[platform] || {};
    let result;
    
    // Full automation platforms
    switch (platform) {
      case 'aliexpress':
        result = await this.placeAliExpressOrder(order);
        break;
      case 'amazon':
        result = await this.placeAmazonOrder(order);
        break;
      case 'temu':
        result = await this.placeTemuOrder(order);
        break;
      case 'cjdropshipping':
        result = await this.placeCJOrder(order);
        break;
      // Semi-auto platforms (cart fill + instructions)
      case 'banggood':
      case 'dhgate':
      case 'shein':
      case 'ebay':
      case 'wish':
      case 'gearbest':
      case 'lightinthebox':
        result = await this.placeSemiAutoOrder(order, platform);
        break;
      // Agent-required platforms
      case '1688':
      case 'alibaba':
        result = await this.placeAgentOrder(order, platform);
        break;
      default:
        result = { success: false, error: 'Plateforme non supportée' };
    }

    await this.recordOrderResult(order, result);
    return result;
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'PROCESS_ORDER') {
        this.processOrder(message.order).then(sendResponse);
        return true;
      }
      if (message.type === 'CHECK_ORDER_STATUS') {
        this.checkOrderStatus(message.orderId).then(sendResponse);
        return true;
      }
      if (message.type === 'GET_ORDER_HISTORY') {
        sendResponse({ orders: this.orderHistory });
        return true;
      }
      if (message.type === 'RETRY_ORDER') {
        this.retryOrder(message.orderId).then(sendResponse);
        return true;
      }
    });
  }

  async processOrder(order) {
    const platform = this.detectPlatform(order.supplierUrl);
    
    if (!platform) {
      return { success: false, error: 'Plateforme non supportée' };
    }

    try {
      // Check if we're on the right page
      if (!window.location.href.includes(order.supplierUrl?.split('/')[2])) {
        // Store order and navigate
        await this.storeProcessingOrder(order);
        window.location.href = order.supplierUrl;
        return { success: true, status: 'navigating' };
      }

      // Platform-specific order placement
      const capabilities = this.getPlatformCapabilities()[platform] || {};
      let result;
      
      if (capabilities.fullAuto) {
        switch (platform) {
          case 'aliexpress':
            result = await this.placeAliExpressOrder(order);
            break;
          case 'amazon':
            result = await this.placeAmazonOrder(order);
            break;
          case 'temu':
            result = await this.placeTemuOrder(order);
            break;
          case 'cjdropshipping':
            result = await this.placeCJOrder(order);
            break;
          default:
            result = { success: false, error: 'Plateforme non implémentée' };
        }
      } else if (capabilities.semiAuto) {
        result = await this.placeSemiAutoOrder(order, platform);
      } else if (capabilities.needsAgent) {
        result = await this.placeAgentOrder(order, platform);
      } else {
        result = { success: false, error: 'Plateforme non supportée' };
      }

      await this.recordOrderResult(order, result);
      return result;
    } catch (error) {
      console.error('[ShopOpti+] Order processing failed:', error);
      const errorResult = { success: false, error: error.message };
      await this.recordOrderResult(order, errorResult);
      return errorResult;
    }
  }

  async recordOrderResult(order, result) {
    const historyEntry = {
      id: order.id || `order_${Date.now()}`,
      orderId: order.id,
      orderNumber: result.orderNumber || order.orderNumber,
      supplierOrderNumber: result.supplierOrderNumber,
      platform: this.detectPlatform(order.supplierUrl),
      status: result.success ? 'completed' : 'failed',
      error: result.error,
      steps: result.steps,
      processedAt: new Date().toISOString(),
      order: order
    };

    this.orderHistory.push(historyEntry);
    await this.saveOrderHistory();

    // Notify background
    chrome.runtime.sendMessage({
      type: 'ORDER_PROCESSED',
      result: historyEntry
    });

    // Show notification
    if (this.config.notifyOnComplete) {
      this.showNotification(result.success ? 'success' : 'error', 
        result.success 
          ? `Commande passée avec succès${result.supplierOrderNumber ? ` - #${result.supplierOrderNumber}` : ''}`
          : `Échec: ${result.error}`
      );
    }
  }

  detectPlatform(url) {
    if (!url) return null;
    if (url.includes('aliexpress.')) return 'aliexpress';
    if (url.includes('amazon.')) return 'amazon';
    if (url.includes('cjdropshipping.')) return 'cjdropshipping';
    if (url.includes('temu.')) return 'temu';
    if (url.includes('banggood.')) return 'banggood';
    if (url.includes('dhgate.')) return 'dhgate';
    if (url.includes('1688.')) return '1688';
    if (url.includes('shein.')) return 'shein';
    if (url.includes('ebay.')) return 'ebay';
    if (url.includes('alibaba.')) return 'alibaba';
    if (url.includes('wish.')) return 'wish';
    if (url.includes('gearbest.')) return 'gearbest';
    if (url.includes('lightinthebox.')) return 'lightinthebox';
    return null;
  }

  // Platform capabilities configuration
  getPlatformCapabilities() {
    return {
      aliexpress: { fullAuto: true, semiAuto: true, trackingSync: true },
      amazon: { fullAuto: true, semiAuto: true, trackingSync: true },
      temu: { fullAuto: true, semiAuto: true, trackingSync: true },
      cjdropshipping: { fullAuto: true, semiAuto: true, trackingSync: true, apiDirect: true },
      banggood: { fullAuto: false, semiAuto: true, trackingSync: true },
      dhgate: { fullAuto: false, semiAuto: true, trackingSync: true },
      '1688': { fullAuto: false, semiAuto: true, trackingSync: false, needsAgent: true },
      shein: { fullAuto: false, semiAuto: true, trackingSync: true },
      ebay: { fullAuto: false, semiAuto: true, trackingSync: true },
      alibaba: { fullAuto: false, semiAuto: true, trackingSync: false, needsAgent: true },
      wish: { fullAuto: false, semiAuto: true, trackingSync: true },
      gearbest: { fullAuto: false, semiAuto: true, trackingSync: true },
      lightinthebox: { fullAuto: false, semiAuto: true, trackingSync: true }
    };
  }

  // ============= ALIEXPRESS AUTO-ORDER =============
  async placeAliExpressOrder(order) {
    const result = { success: false, steps: [], platform: 'aliexpress' };

    try {
      // Step 1: Select variant if specified
      if (order.variant) {
        const variantSelected = await this.selectAliExpressVariant(order.variant);
        result.steps.push({ step: 'variant_selection', success: variantSelected });
        if (!variantSelected) {
          return { ...result, error: 'Impossible de sélectionner la variante' };
        }
      }

      // Step 2: Set quantity
      const quantitySet = await this.setQuantity(order.quantity);
      result.steps.push({ step: 'quantity', success: quantitySet });

      // Step 3: Click "Buy Now"
      const buyClicked = await this.clickBuyNow();
      result.steps.push({ step: 'buy_now', success: buyClicked });

      if (!buyClicked) {
        return { ...result, error: 'Bouton Acheter non trouvé' };
      }

      // Wait for checkout page
      await this.waitForPageLoad();

      // Step 4: Fill shipping address
      if (order.shippingAddress) {
        const addressFilled = await this.fillAliExpressAddress(order.shippingAddress);
        result.steps.push({ step: 'address', success: addressFilled });
      }

      // Step 5: Select shipping method
      if (order.shippingMethod) {
        const shippingSelected = await this.selectShippingMethod(order.shippingMethod);
        result.steps.push({ step: 'shipping_method', success: shippingSelected });
      }

      // Step 6: Apply coupon if available
      if (order.couponCode) {
        const couponApplied = await this.applyCoupon(order.couponCode);
        result.steps.push({ step: 'coupon', success: couponApplied });
      }

      // Step 7: Place order (if auto-confirm enabled)
      if (this.config.autoConfirmOrders) {
        const orderPlaced = await this.confirmOrder();
        result.steps.push({ step: 'confirm', success: orderPlaced });
        
        if (orderPlaced) {
          const orderNumber = await this.extractOrderNumber();
          result.supplierOrderNumber = orderNumber;
          result.success = true;
        }
      } else {
        result.status = 'pending_confirmation';
        result.success = true;
        result.message = 'Commande prête - confirmation manuelle requise';
      }

      return result;
    } catch (error) {
      return { ...result, error: error.message };
    }
  }

  async selectAliExpressVariant(variant) {
    try {
      // Color selection
      if (variant.color) {
        const colorOptions = document.querySelectorAll(
          '[class*="sku-property"] img, [class*="color"] img, [data-sku-prop-key*="color"] img'
        );
        for (const opt of colorOptions) {
          const alt = opt.alt?.toLowerCase() || '';
          const title = opt.title?.toLowerCase() || '';
          if (alt.includes(variant.color.toLowerCase()) || title.includes(variant.color.toLowerCase())) {
            opt.click();
            await this.delay(500);
            break;
          }
        }
      }

      // Size selection
      if (variant.size) {
        const sizeOptions = document.querySelectorAll(
          '[class*="sku-property"] span, [class*="size"] span, [data-sku-prop-key*="size"] span'
        );
        for (const opt of sizeOptions) {
          if (opt.textContent.toLowerCase().includes(variant.size.toLowerCase())) {
            opt.click();
            await this.delay(500);
            break;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[ShopOpti+] Variant selection failed:', error);
      return false;
    }
  }

  // ============= AMAZON AUTO-ORDER =============
  async placeAmazonOrder(order) {
    const result = { success: false, steps: [], platform: 'amazon' };

    try {
      console.log('[ShopOpti+] Starting Amazon order process...');

      // Step 1: Check if on product page
      const isProductPage = this.isAmazonProductPage();
      result.steps.push({ step: 'page_detection', success: isProductPage, page: window.location.href });
      
      if (!isProductPage) {
        return { ...result, error: 'Page produit Amazon non détectée' };
      }

      // Step 2: Select variant if specified
      if (order.variant) {
        const variantSelected = await this.selectAmazonVariant(order.variant);
        result.steps.push({ step: 'variant_selection', success: variantSelected });
        await this.delay(800);
      }

      // Step 3: Set quantity
      if (order.quantity && order.quantity > 1) {
        const quantitySet = await this.setAmazonQuantity(order.quantity);
        result.steps.push({ step: 'quantity', success: quantitySet });
        await this.delay(500);
      }

      // Step 4: Check availability
      const availability = await this.checkAmazonAvailability();
      result.steps.push({ step: 'availability_check', success: availability.inStock, details: availability });
      
      if (!availability.inStock) {
        return { ...result, error: 'Produit indisponible sur Amazon' };
      }

      // Step 5: Click Buy Now or Add to Cart
      const addedToCart = await this.addToAmazonCart();
      result.steps.push({ step: 'add_to_cart', success: addedToCart });

      if (!addedToCart) {
        // Try Buy Now button instead
        const buyNowClicked = await this.clickAmazonBuyNow();
        result.steps.push({ step: 'buy_now', success: buyNowClicked });
        
        if (!buyNowClicked) {
          return { ...result, error: 'Impossible d\'ajouter au panier ou cliquer Acheter' };
        }
      }

      // Wait for cart/checkout page
      await this.waitForPageLoad();
      await this.delay(2000);

      // Step 6: Navigate to checkout if needed
      if (window.location.href.includes('/cart') || window.location.href.includes('/gp/cart')) {
        const proceedToCheckout = await this.proceedToAmazonCheckout();
        result.steps.push({ step: 'proceed_to_checkout', success: proceedToCheckout });
        
        if (!proceedToCheckout) {
          return { ...result, error: 'Impossible de procéder au paiement' };
        }
        
        await this.waitForPageLoad();
        await this.delay(2000);
      }

      // Step 7: Select/confirm delivery address
      if (order.shippingAddress) {
        const addressSelected = await this.selectAmazonAddress(order.shippingAddress);
        result.steps.push({ step: 'address_selection', success: addressSelected });
        await this.delay(1000);
      }

      // Step 8: Select shipping speed
      const shippingSelected = await this.selectAmazonShipping(order.shippingMethod || 'standard');
      result.steps.push({ step: 'shipping_selection', success: shippingSelected });
      await this.delay(1000);

      // Step 9: Continue to payment
      const continueClicked = await this.clickAmazonContinue();
      result.steps.push({ step: 'continue_to_payment', success: continueClicked });
      await this.delay(1500);

      // Step 10: Apply gift card or promo code
      if (order.promoCode) {
        const promoApplied = await this.applyAmazonPromoCode(order.promoCode);
        result.steps.push({ step: 'promo_code', success: promoApplied });
      }

      // Step 11: Place order (if auto-confirm enabled)
      if (this.config.autoConfirmOrders) {
        const orderPlaced = await this.placeAmazonOrderFinal();
        result.steps.push({ step: 'place_order', success: orderPlaced });
        
        if (orderPlaced) {
          await this.delay(3000);
          const orderNumber = await this.extractAmazonOrderNumber();
          result.supplierOrderNumber = orderNumber;
          result.success = true;
          result.message = `Commande Amazon passée${orderNumber ? ` - #${orderNumber}` : ''}`;
        }
      } else {
        result.status = 'pending_confirmation';
        result.success = true;
        result.message = 'Commande Amazon prête - confirmation manuelle requise';
      }

      return result;
    } catch (error) {
      console.error('[ShopOpti+] Amazon order error:', error);
      return { ...result, error: error.message };
    }
  }

  isAmazonProductPage() {
    return !!(
      document.getElementById('productTitle') ||
      document.getElementById('title') ||
      document.querySelector('[data-feature-name="title"]') ||
      document.getElementById('dp-container')
    );
  }

  async selectAmazonVariant(variant) {
    try {
      // Select size
      if (variant.size) {
        const sizeDropdown = document.getElementById('native_dropdown_selected_size_name') ||
                            document.querySelector('#variation_size_name select');
        if (sizeDropdown) {
          const options = sizeDropdown.querySelectorAll('option');
          for (const option of options) {
            if (option.textContent.toLowerCase().includes(variant.size.toLowerCase())) {
              sizeDropdown.value = option.value;
              sizeDropdown.dispatchEvent(new Event('change', { bubbles: true }));
              await this.delay(500);
              break;
            }
          }
        }
        
        // Alternative: button-based size selection
        const sizeButtons = document.querySelectorAll('#variation_size_name li, [id*="size"] li');
        for (const btn of sizeButtons) {
          if (btn.textContent.toLowerCase().includes(variant.size.toLowerCase())) {
            btn.click();
            await this.delay(500);
            break;
          }
        }
      }

      // Select color
      if (variant.color) {
        const colorOptions = document.querySelectorAll(
          '#variation_color_name img, [id*="color"] img, .imgSwatch'
        );
        for (const img of colorOptions) {
          const alt = img.alt?.toLowerCase() || '';
          const title = img.title?.toLowerCase() || '';
          if (alt.includes(variant.color.toLowerCase()) || title.includes(variant.color.toLowerCase())) {
            img.click();
            await this.delay(800);
            break;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[ShopOpti+] Amazon variant selection error:', error);
      return false;
    }
  }

  async setAmazonQuantity(quantity) {
    try {
      const quantitySelect = document.getElementById('quantity') ||
                            document.querySelector('select[name="quantity"]');
      if (quantitySelect) {
        const value = Math.min(quantity, 30).toString();
        quantitySelect.value = value;
        quantitySelect.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      // Input-based quantity
      const quantityInput = document.querySelector('input[name="quantity"]');
      if (quantityInput) {
        quantityInput.value = quantity;
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  async checkAmazonAvailability() {
    const availability = {
      inStock: true,
      message: '',
      price: null,
      deliveryDate: null
    };

    // Check for out of stock indicators
    const outOfStockIndicators = [
      '#outOfStock',
      '#availability span.a-color-error',
      '[data-feature-name="availability"] .a-color-error',
      '#availability .a-color-price'
    ];

    for (const selector of outOfStockIndicators) {
      const el = document.querySelector(selector);
      if (el && el.textContent.toLowerCase().includes('indisponible') || 
          el?.textContent.toLowerCase().includes('out of stock') ||
          el?.textContent.toLowerCase().includes('unavailable')) {
        availability.inStock = false;
        availability.message = el.textContent.trim();
        break;
      }
    }

    // Get price
    const priceEl = document.querySelector(
      '#priceblock_ourprice, #priceblock_dealprice, .a-price .a-offscreen, #corePrice_feature_div .a-offscreen'
    );
    if (priceEl) {
      availability.price = priceEl.textContent.trim();
    }

    // Get delivery date
    const deliveryEl = document.querySelector('#delivery-message, #mir-layout-DELIVERY_BLOCK');
    if (deliveryEl) {
      availability.deliveryDate = deliveryEl.textContent.trim().substring(0, 100);
    }

    return availability;
  }

  async addToAmazonCart() {
    const addToCartSelectors = [
      '#add-to-cart-button',
      '#add-to-cart-button-ubb',
      'input[name="submit.add-to-cart"]',
      '#addToCart input[type="submit"]',
      '[data-action="add-to-cart"]'
    ];

    for (const selector of addToCartSelectors) {
      const btn = document.querySelector(selector);
      if (btn && !btn.disabled) {
        btn.click();
        await this.delay(1500);
        return true;
      }
    }

    return false;
  }

  async clickAmazonBuyNow() {
    const buyNowSelectors = [
      '#buy-now-button',
      '#submit.buy-now-button',
      'input[name="submit.buy-now"]',
      '#buyNow input[type="submit"]'
    ];

    for (const selector of buyNowSelectors) {
      const btn = document.querySelector(selector);
      if (btn && !btn.disabled) {
        btn.click();
        await this.delay(2000);
        return true;
      }
    }

    return false;
  }

  async proceedToAmazonCheckout() {
    const checkoutSelectors = [
      '#sc-buy-box-ptc-button input',
      '#sc-buy-box-ptc-button',
      'input[name="proceedToRetailCheckout"]',
      '[data-feature-id="proceed-to-checkout-action"] input',
      '.sc-proceed-to-checkout input',
      '#hlb-ptc-btn-native'
    ];

    for (const selector of checkoutSelectors) {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.click();
        await this.delay(2000);
        return true;
      }
    }

    return false;
  }

  async selectAmazonAddress(address) {
    try {
      // Check if address selection page
      const addressCards = document.querySelectorAll(
        '.address-book-entry, [data-addressid], .ship-to-this-address'
      );

      if (addressCards.length > 0) {
        // Try to find matching address
        for (const card of addressCards) {
          const cardText = card.textContent.toLowerCase();
          if (address.name && cardText.includes(address.name.toLowerCase()) ||
              address.zip && cardText.includes(address.zip)) {
            const selectBtn = card.querySelector('input[type="radio"], a[id*="address"]');
            if (selectBtn) {
              selectBtn.click();
              await this.delay(1000);
              return true;
            }
          }
        }

        // Select first address as fallback
        const firstSelect = addressCards[0].querySelector('input[type="radio"], a[id*="address"]');
        if (firstSelect) {
          firstSelect.click();
          await this.delay(1000);
          return true;
        }
      }

      // Click "Deliver to this address" if present
      const deliverBtn = document.querySelector(
        '.ship-to-this-address a, [data-action="select-address"], input[value*="Deliver to this address"]'
      );
      if (deliverBtn) {
        deliverBtn.click();
        await this.delay(1000);
        return true;
      }

      return true; // Address may already be selected
    } catch (error) {
      console.error('[ShopOpti+] Address selection error:', error);
      return false;
    }
  }

  async selectAmazonShipping(method) {
    try {
      const shippingOptions = document.querySelectorAll(
        '.shipping-speed input[type="radio"], #shippingOptionFormId input[type="radio"]'
      );

      const methodLower = method.toLowerCase();
      
      for (const option of shippingOptions) {
        const label = option.closest('label, .a-row, tr');
        if (label) {
          const text = label.textContent.toLowerCase();
          
          // Match shipping method
          if ((methodLower === 'express' && (text.includes('express') || text.includes('fast') || text.includes('rapid'))) ||
              (methodLower === 'standard' && (text.includes('standard') || text.includes('gratuit') || text.includes('free'))) ||
              (methodLower === 'priority' && text.includes('priorit'))) {
            option.click();
            await this.delay(500);
            return true;
          }
        }
      }

      // Select first available option as fallback
      if (shippingOptions.length > 0) {
        shippingOptions[0].click();
        return true;
      }

      return true; // Shipping may already be selected
    } catch (error) {
      return false;
    }
  }

  async clickAmazonContinue() {
    const continueSelectors = [
      '#shipToThisAddressButton input',
      'input[name="placeYourOrder"]',
      '.continue-button input',
      '#continue-top input',
      '#continue-button input',
      '.a-button-primary input[type="submit"]'
    ];

    for (const selector of continueSelectors) {
      const btn = document.querySelector(selector);
      if (btn) {
        btn.click();
        await this.delay(1500);
        return true;
      }
    }

    return true; // May not be needed on some pages
  }

  async applyAmazonPromoCode(code) {
    try {
      const promoInput = document.querySelector(
        '#spc-gcpromoinput, input[name="claimCode"], #gc-redemption-input'
      );
      const applyBtn = document.querySelector(
        '#gcApplyButtonId, input[name="apply"], #gc-redemption-apply'
      );

      if (promoInput && applyBtn) {
        promoInput.value = code;
        promoInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(300);
        applyBtn.click();
        await this.delay(1500);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  async placeAmazonOrderFinal() {
    const placeOrderSelectors = [
      '#placeYourOrder input',
      '#submitOrderButtonId input',
      'input[name="placeYourOrder1"]',
      '#bottomSubmitOrderButtonId input',
      '.place-your-order-button input'
    ];

    for (const selector of placeOrderSelectors) {
      const btn = document.querySelector(selector);
      if (btn && !btn.disabled) {
        btn.click();
        await this.delay(3000);
        return true;
      }
    }

    return false;
  }

  async extractAmazonOrderNumber() {
    try {
      await this.delay(2000);
      
      // Look for order confirmation
      const orderEl = document.querySelector(
        '[data-component="orderIdComponent"], .a-box .a-color-base b, #orderDetails b'
      );
      
      if (orderEl) {
        const match = orderEl.textContent.match(/\d{3}-\d{7}-\d{7}/);
        if (match) return match[0];
      }

      // Alternative: parse from page
      const pageText = document.body.innerText;
      const orderMatch = pageText.match(/(?:order|commande)[^\d]*(\d{3}-\d{7}-\d{7})/i);
      if (orderMatch) return orderMatch[1];

      return null;
    } catch (error) {
      return null;
    }
  }

  // ============= TEMU AUTO-ORDER =============
  async placeTemuOrder(order) {
    const result = { success: false, steps: [], platform: 'temu' };

    try {
      console.log('[ShopOpti+] Starting Temu order process...');

      // Step 1: Check if on product page
      const isProductPage = this.isTemuProductPage();
      result.steps.push({ step: 'page_detection', success: isProductPage });
      
      if (!isProductPage) {
        return { ...result, error: 'Page produit Temu non détectée' };
      }

      // Step 2: Select variant if specified
      if (order.variant) {
        const variantSelected = await this.selectTemuVariant(order.variant);
        result.steps.push({ step: 'variant_selection', success: variantSelected });
        await this.delay(800);
      }

      // Step 3: Set quantity
      if (order.quantity && order.quantity > 1) {
        const quantitySet = await this.setTemuQuantity(order.quantity);
        result.steps.push({ step: 'quantity', success: quantitySet });
        await this.delay(500);
      }

      // Step 4: Check availability and price
      const availability = await this.checkTemuAvailability();
      result.steps.push({ step: 'availability_check', success: availability.inStock, details: availability });
      
      if (!availability.inStock) {
        return { ...result, error: 'Produit indisponible sur Temu' };
      }

      // Step 5: Click Buy Now or Add to Cart
      const buyNowClicked = await this.clickTemuBuyNow();
      result.steps.push({ step: 'buy_now', success: buyNowClicked });

      if (!buyNowClicked) {
        const addedToCart = await this.addToTemuCart();
        result.steps.push({ step: 'add_to_cart', success: addedToCart });
        
        if (!addedToCart) {
          return { ...result, error: 'Impossible d\'ajouter au panier Temu' };
        }
      }

      // Wait for checkout
      await this.waitForPageLoad();
      await this.delay(2000);

      // Step 6: Handle checkout page
      if (window.location.href.includes('cart') || window.location.href.includes('checkout')) {
        
        // Step 7: Select/confirm shipping address
        if (order.shippingAddress) {
          const addressSelected = await this.selectTemuAddress(order.shippingAddress);
          result.steps.push({ step: 'address_selection', success: addressSelected });
          await this.delay(1000);
        }

        // Step 8: Select shipping method
        const shippingSelected = await this.selectTemuShipping(order.shippingMethod || 'standard');
        result.steps.push({ step: 'shipping_selection', success: shippingSelected });
        await this.delay(800);

        // Step 9: Apply coupon if available
        if (order.couponCode) {
          const couponApplied = await this.applyTemuCoupon(order.couponCode);
          result.steps.push({ step: 'coupon', success: couponApplied });
        }

        // Step 10: Click checkout/proceed
        const checkoutClicked = await this.proceedTemuCheckout();
        result.steps.push({ step: 'proceed_checkout', success: checkoutClicked });
        await this.delay(1500);

        // Step 11: Place order (if auto-confirm enabled)
        if (this.config.autoConfirmOrders) {
          const orderPlaced = await this.placeTemuOrderFinal();
          result.steps.push({ step: 'place_order', success: orderPlaced });
          
          if (orderPlaced) {
            await this.delay(3000);
            const orderNumber = await this.extractTemuOrderNumber();
            result.supplierOrderNumber = orderNumber;
            result.success = true;
            result.message = `Commande Temu passée${orderNumber ? ` - #${orderNumber}` : ''}`;
          }
        } else {
          result.status = 'pending_confirmation';
          result.success = true;
          result.message = 'Commande Temu prête - confirmation manuelle requise';
        }
      }

      return result;
    } catch (error) {
      console.error('[ShopOpti+] Temu order error:', error);
      return { ...result, error: error.message };
    }
  }

  isTemuProductPage() {
    return !!(
      document.querySelector('[class*="ProductTitle"], [class*="product-title"]') ||
      document.querySelector('[class*="goods-price"]') ||
      document.querySelector('[data-testid="pdp-price"]') ||
      window.location.href.includes('/goods.html') ||
      window.location.href.includes('/product/')
    );
  }

  async selectTemuVariant(variant) {
    try {
      // Select size
      if (variant.size) {
        const sizeOptions = document.querySelectorAll(
          '[class*="sku-item"], [class*="size-item"], [data-testid*="sku"]'
        );
        for (const opt of sizeOptions) {
          const text = opt.textContent.toLowerCase();
          if (text.includes(variant.size.toLowerCase())) {
            opt.click();
            await this.delay(600);
            break;
          }
        }
      }

      // Select color
      if (variant.color) {
        const colorOptions = document.querySelectorAll(
          '[class*="color-item"] img, [class*="sku-color"] img, [data-testid*="color"]'
        );
        for (const img of colorOptions) {
          const alt = img.alt?.toLowerCase() || '';
          const title = img.title?.toLowerCase() || '';
          const parentText = img.closest('[class*="item"]')?.textContent.toLowerCase() || '';
          
          if (alt.includes(variant.color.toLowerCase()) || 
              title.includes(variant.color.toLowerCase()) ||
              parentText.includes(variant.color.toLowerCase())) {
            img.click();
            await this.delay(600);
            break;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('[ShopOpti+] Temu variant selection error:', error);
      return false;
    }
  }

  async setTemuQuantity(quantity) {
    try {
      // Find quantity controls
      const increaseBtn = document.querySelector(
        '[class*="quantity-plus"], [class*="qty-increase"], [data-testid="qty-plus"]'
      );
      
      if (increaseBtn) {
        for (let i = 1; i < quantity; i++) {
          increaseBtn.click();
          await this.delay(200);
        }
        return true;
      }

      // Input-based quantity
      const quantityInput = document.querySelector(
        'input[class*="quantity"], input[data-testid="quantity-input"]'
      );
      if (quantityInput) {
        quantityInput.value = quantity;
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  async checkTemuAvailability() {
    const availability = {
      inStock: true,
      message: '',
      price: null
    };

    // Check for sold out indicators
    const soldOutEl = document.querySelector(
      '[class*="sold-out"], [class*="out-of-stock"], [data-testid="sold-out"]'
    );
    if (soldOutEl) {
      availability.inStock = false;
      availability.message = 'Produit épuisé';
    }

    // Get price
    const priceEl = document.querySelector(
      '[class*="goods-price"], [class*="sale-price"], [data-testid="pdp-price"]'
    );
    if (priceEl) {
      availability.price = priceEl.textContent.trim();
    }

    return availability;
  }

  async clickTemuBuyNow() {
    const buyNowSelectors = [
      '[class*="buy-now"]',
      '[data-testid="buy-now-btn"]',
      'button[class*="BuyNow"]',
      '[class*="instant-buy"]'
    ];

    for (const selector of buyNowSelectors) {
      const btn = document.querySelector(selector);
      if (btn && !btn.disabled) {
        btn.click();
        await this.delay(1500);
        return true;
      }
    }

    return false;
  }

  async addToTemuCart() {
    const addToCartSelectors = [
      '[class*="add-to-cart"]',
      '[data-testid="add-to-cart-btn"]',
      'button[class*="AddToCart"]',
      '[class*="cart-btn"]'
    ];

    for (const selector of addToCartSelectors) {
      const btn = document.querySelector(selector);
      if (btn && !btn.disabled) {
        btn.click();
        await this.delay(1500);
        return true;
      }
    }

    return false;
  }

  async selectTemuAddress(address) {
    try {
      const addressCards = document.querySelectorAll(
        '[class*="address-item"], [class*="address-card"], [data-testid*="address"]'
      );

      for (const card of addressCards) {
        const cardText = card.textContent.toLowerCase();
        if ((address.name && cardText.includes(address.name.toLowerCase())) ||
            (address.zip && cardText.includes(address.zip))) {
          const selectEl = card.querySelector('input[type="radio"], [class*="select"]');
          if (selectEl) {
            selectEl.click();
            await this.delay(500);
            return true;
          }
          card.click();
          await this.delay(500);
          return true;
        }
      }

      // Select first address as fallback
      if (addressCards.length > 0) {
        addressCards[0].click();
        return true;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async selectTemuShipping(method) {
    try {
      const shippingOptions = document.querySelectorAll(
        '[class*="shipping-option"], [class*="delivery-option"], [data-testid*="shipping"]'
      );

      const methodLower = method.toLowerCase();

      for (const option of shippingOptions) {
        const text = option.textContent.toLowerCase();
        
        if ((methodLower === 'express' && (text.includes('express') || text.includes('rapid'))) ||
            (methodLower === 'standard' && (text.includes('standard') || text.includes('gratuit') || text.includes('free')))) {
          const radio = option.querySelector('input[type="radio"]');
          if (radio) {
            radio.click();
          } else {
            option.click();
          }
          await this.delay(500);
          return true;
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async applyTemuCoupon(code) {
    try {
      const couponInput = document.querySelector(
        '[class*="coupon-input"], input[placeholder*="coupon"], input[placeholder*="code"]'
      );
      const applyBtn = document.querySelector(
        '[class*="apply-coupon"], [class*="coupon-apply"], button[class*="apply"]'
      );

      if (couponInput) {
        couponInput.value = code;
        couponInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(300);
        
        if (applyBtn) {
          applyBtn.click();
          await this.delay(1000);
        }
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  async proceedTemuCheckout() {
    const checkoutSelectors = [
      '[class*="checkout-btn"]',
      '[data-testid="checkout-button"]',
      'button[class*="Checkout"]',
      '[class*="proceed-checkout"]',
      '[class*="place-order-btn"]'
    ];

    for (const selector of checkoutSelectors) {
      const btn = document.querySelector(selector);
      if (btn && !btn.disabled) {
        btn.click();
        await this.delay(2000);
        return true;
      }
    }

    return true;
  }

  async placeTemuOrderFinal() {
    const placeOrderSelectors = [
      '[class*="submit-order"]',
      '[data-testid="place-order-btn"]',
      'button[class*="PlaceOrder"]',
      '[class*="confirm-order"]',
      '[class*="pay-now"]'
    ];

    for (const selector of placeOrderSelectors) {
      const btn = document.querySelector(selector);
      if (btn && !btn.disabled) {
        btn.click();
        await this.delay(3000);
        return true;
      }
    }

    return false;
  }

  async extractTemuOrderNumber() {
    try {
      await this.delay(2000);
      
      const orderEl = document.querySelector(
        '[class*="order-number"], [class*="order-id"], [data-testid="order-number"]'
      );
      
      if (orderEl) {
        const match = orderEl.textContent.match(/\d{10,}/);
        if (match) return match[0];
        return orderEl.textContent.trim();
      }

      // Parse from URL
      const urlMatch = window.location.href.match(/order[_-]?id=(\d+)/i);
      if (urlMatch) return urlMatch[1];

      return null;
    } catch (error) {
      return null;
    }
  }

  // ============= CJ DROPSHIPPING API ORDER =============
  async placeCJOrder(order) {
    if (!this.auth?.token) {
      return { success: false, error: 'Non authentifié' };
    }

    try {
      const response = await fetch(`${this.getApiUrl()}/auto-order-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`
        },
        body: JSON.stringify({
          action: 'place_order',
          supplierType: 'cjdropshipping',
          orderId: order.id,
          payload: {
            productId: order.productId,
            variantId: order.variantId,
            quantity: order.quantity,
            shippingAddress: order.shippingAddress
          }
        })
      });

      const data = await response.json();
      
      if (data.success) {
        return {
          success: true,
          supplierOrderNumber: data.supplierOrderId,
          trackingNumber: data.trackingNumber,
          platform: 'cjdropshipping'
        };
      } else {
        return { success: false, error: data.error || 'Erreur CJ Dropshipping' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ============= UTILITY FUNCTIONS =============
  async setQuantity(quantity) {
    try {
      const quantityInput = document.querySelector(
        'input[type="number"][class*="quantity"], .quantity-input input, input[name="quantity"]'
      );
      if (quantityInput) {
        quantityInput.value = quantity;
        quantityInput.dispatchEvent(new Event('input', { bubbles: true }));
        quantityInput.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async clickBuyNow() {
    const buyButtons = document.querySelectorAll(
      '[class*="buy-now"], [class*="buyNow"], button[data-spm-click*="buy"], .product-action button:first-child'
    );
    
    for (const btn of buyButtons) {
      const text = btn.textContent.toLowerCase();
      if (text.includes('buy') || text.includes('acheter') || text.includes('comprar')) {
        btn.click();
        return true;
      }
    }
    return false;
  }

  async fillAliExpressAddress(address) {
    // AliExpress typically uses saved addresses
    return true;
  }

  async selectShippingMethod(method) {
    try {
      const shippingOptions = document.querySelectorAll('[class*="shipping-method"], [class*="delivery-option"]');
      for (const opt of shippingOptions) {
        const text = opt.textContent.toLowerCase();
        if (text.includes(method.toLowerCase())) {
          opt.click();
          await this.delay(500);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async applyCoupon(code) {
    try {
      const couponInput = document.querySelector('[class*="coupon-input"], input[placeholder*="coupon"]');
      const applyButton = document.querySelector('[class*="apply-coupon"], button[class*="coupon"]');
      
      if (couponInput && applyButton) {
        couponInput.value = code;
        couponInput.dispatchEvent(new Event('input', { bubbles: true }));
        await this.delay(300);
        applyButton.click();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async confirmOrder() {
    try {
      const confirmButtons = document.querySelectorAll(
        '[class*="place-order"], [class*="confirm-order"], button[data-spm-click*="place"]'
      );
      
      for (const btn of confirmButtons) {
        const text = btn.textContent.toLowerCase();
        if (text.includes('place') || text.includes('confirm') || text.includes('passer') || text.includes('confirmer')) {
          btn.click();
          await this.delay(3000);
          return true;
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async extractOrderNumber() {
    try {
      await this.delay(2000);
      
      const orderNumEl = document.querySelector(
        '[class*="order-number"], [class*="orderId"], [data-order-id]'
      );
      
      if (orderNumEl) {
        const match = orderNumEl.textContent.match(/\d{10,}/);
        return match ? match[0] : null;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async storeProcessingOrder(order) {
    return new Promise(resolve => {
      chrome.storage.local.set({ 
        processing_order: {
          ...order,
          startedAt: new Date().toISOString()
        }
      }, resolve);
    });
  }

  async checkOrderStatus(orderId) {
    if (!this.auth?.token) return null;

    try {
      const response = await fetch(`${this.getApiUrl()}/order-status/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${this.auth.token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async retryOrder(orderId) {
    const orderEntry = this.orderHistory.find(o => o.id === orderId);
    if (!orderEntry || !orderEntry.order) {
      return { success: false, error: 'Commande non trouvée dans l\'historique' };
    }

    const attempts = this.retryAttempts[orderId] || 0;
    if (attempts >= this.MAX_RETRIES) {
      return { success: false, error: 'Nombre maximum de tentatives atteint' };
    }

    this.retryAttempts[orderId] = attempts + 1;
    return await this.processOrder(orderEntry.order);
  }

  async waitForPageLoad() {
    return new Promise(resolve => {
      if (document.readyState === 'complete') {
        resolve();
        return;
      }
      
      window.addEventListener('load', () => resolve(), { once: true });
      
      // Fallback timeout
      setTimeout(resolve, 5000);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  showNotification(type, message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      border-radius: 12px;
      background: ${type === 'success' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #ef4444, #dc2626)'};
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      z-index: 999999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease;
      display: flex;
      align-items: center;
      gap: 10px;
    `;
    
    notification.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' 
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
        }
      </svg>
      <span>${message}</span>
    `;

    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  injectUI() {
    if (document.getElementById('shopopti-auto-order-btn')) return;

    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Create floating button for auto-order
    const btn = document.createElement('button');
    btn.id = 'shopopti-auto-order-btn';
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    `;
    btn.style.cssText = `
      position: fixed;
      bottom: 240px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999997;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
      transition: all 0.3s ease;
    `;

    btn.onmouseenter = () => {
      btn.style.transform = 'scale(1.1)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'scale(1)';
    };

    btn.onclick = () => this.togglePanel();

    // Only show on supported platforms
    const platform = this.detectPlatform(window.location.href);
    if (platform) {
      document.body.appendChild(btn);
    }
  }

  togglePanel() {
    let panel = document.getElementById('shopopti-auto-order-panel');
    
    if (panel) {
      panel.remove();
      return;
    }

    panel = document.createElement('div');
    panel.id = 'shopopti-auto-order-panel';
    panel.innerHTML = this.renderPanel();
    panel.style.cssText = `
      position: fixed;
      bottom: 300px;
      right: 20px;
      width: 380px;
      max-height: 500px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 999999;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    document.body.appendChild(panel);
    this.attachPanelEvents(panel);
  }

  renderPanel() {
    const platform = this.detectPlatform(window.location.href);
    const platformNames = {
      aliexpress: 'AliExpress',
      amazon: 'Amazon',
      temu: 'Temu',
      cjdropshipping: 'CJ Dropshipping'
    };

    return `
      <div style="padding: 16px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <div>
              <span style="font-weight: 600; font-size: 16px;">ShopOpti+ Auto-Order</span>
              <div style="font-size: 12px; opacity: 0.9;">${platform ? platformNames[platform] : 'Multi-plateforme'}</div>
            </div>
          </div>
          <button id="shopopti-close-order" style="background: none; border: none; color: white; cursor: pointer; padding: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div style="padding: 16px;">
        <div style="
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #fcd34d;
          border-radius: 10px;
          padding: 14px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style="font-size: 13px; color: #92400e; line-height: 1.5;">
            Automatise le processus d'achat sur ${platform ? platformNames[platform] : 'toutes les plateformes'}. 
            Connectez-vous à votre compte fournisseur avant de continuer.
          </div>
        </div>

        <div style="margin-bottom: 16px; padding: 12px; background: #f9fafb; border-radius: 10px;">
          <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
            <input type="checkbox" id="shopopti-auto-confirm" ${this.config.autoConfirmOrders ? 'checked' : ''} 
              style="width: 18px; height: 18px; accent-color: #f59e0b;">
            <div>
              <span style="font-size: 14px; color: #374151; font-weight: 500;">Confirmation automatique</span>
              <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">Passer la commande sans confirmation manuelle</div>
            </div>
          </label>
        </div>

        ${platform ? `
          <button id="shopopti-quick-order" style="
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #10b981, #059669);
            border: none;
            color: white;
            border-radius: 10px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            Commander ce produit maintenant
          </button>
        ` : ''}

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <span style="font-weight: 600; color: #374151;">Commandes en attente</span>
            <span style="
              background: #fef3c7;
              color: #92400e;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
            ">${this.pendingOrders.length}</span>
          </div>
          <div style="max-height: 200px; overflow-y: auto;">
            ${this.pendingOrders.length === 0 ? `
              <div style="text-align: center; color: #9ca3af; padding: 24px;">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 10px;">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                </svg>
                <div style="font-size: 14px;">Aucune commande en attente</div>
              </div>
            ` : this.pendingOrders.slice(0, 5).map(order => `
              <div style="
                display: flex;
                gap: 12px;
                padding: 12px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                margin-bottom: 10px;
                background: #fafafa;
              ">
                <div style="flex: 1;">
                  <div style="font-size: 13px; font-weight: 600; color: #374151;">
                    #${order.orderNumber || order.id?.slice(0, 8)}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                    ${order.items?.length || 1} article(s) • ${order.total?.toFixed(2) || '?'}€
                  </div>
                  <div style="font-size: 11px; color: #9ca3af; margin-top: 4px;">
                    ${this.formatDate(order.createdAt)}
                  </div>
                </div>
                <button data-order-id="${order.id}" class="shopopti-process-order-btn" style="
                  padding: 8px 16px;
                  background: linear-gradient(135deg, #f59e0b, #d97706);
                  border: none;
                  color: white;
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 600;
                  align-self: center;
                  transition: transform 0.2s;
                ">Traiter</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  attachPanelEvents(panel) {
    panel.querySelector('#shopopti-close-order')?.addEventListener('click', () => {
      panel.remove();
    });

    panel.querySelector('#shopopti-auto-confirm')?.addEventListener('change', async (e) => {
      this.config.autoConfirmOrders = e.target.checked;
      await this.saveConfig();
    });

    panel.querySelector('#shopopti-quick-order')?.addEventListener('click', async () => {
      const btn = panel.querySelector('#shopopti-quick-order');
      btn.innerHTML = '<span style="display: flex; align-items: center; gap: 8px;"><span class="spinner"></span> Traitement en cours...</span>';
      btn.disabled = true;

      // Create a quick order from current page
      const quickOrder = {
        id: `quick_${Date.now()}`,
        supplierUrl: window.location.href,
        quantity: 1
      };

      const result = await this.processOrder(quickOrder);
      
      if (result.success) {
        btn.innerHTML = '✓ Commande traitée';
        btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
      } else {
        btn.innerHTML = `✗ ${result.error || 'Échec'}`;
        btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
      }
    });

    panel.querySelectorAll('.shopopti-process-order-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.orderId;
        const order = this.pendingOrders.find(o => o.id === orderId);
        if (order) {
          btn.textContent = 'Traitement...';
          btn.disabled = true;
          const result = await this.processOrder(order);
          if (result.success) {
            btn.textContent = '✓ Traité';
            btn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
          } else {
            btn.textContent = '✗ Échec';
            btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
          }
        }
      });
    });
  }

  async saveConfig() {
    return new Promise(resolve => {
      chrome.storage.local.set({ shopopti_config: this.config }, resolve);
    });
  }

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getApiUrl() {
    return this.config?.apiUrl || 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
  }

  // ============= SEMI-AUTO ORDER (Cart fill + Instructions) =============
  async placeSemiAutoOrder(order, platform) {
    const result = { success: false, steps: [], platform, mode: 'semi-auto' };
    
    try {
      console.log(`[ShopOpti+] Starting semi-auto order for ${platform}...`);
      
      // Step 1: Navigate to product page if needed
      if (!window.location.href.includes(order.supplierUrl?.split('/')[2])) {
        await this.storeProcessingOrder(order);
        window.location.href = order.supplierUrl;
        return { success: true, status: 'navigating', mode: 'semi-auto' };
      }
      
      // Step 2: Select variant if specified
      if (order.variant) {
        const variantSelected = await this.selectGenericVariant(platform, order.variant);
        result.steps.push({ step: 'variant_selection', success: variantSelected });
      }
      
      // Step 3: Set quantity
      const quantitySet = await this.setGenericQuantity(platform, order.quantity || 1);
      result.steps.push({ step: 'quantity', success: quantitySet });
      
      // Step 4: Add to cart
      const addedToCart = await this.addToCartGeneric(platform);
      result.steps.push({ step: 'add_to_cart', success: addedToCart });
      
      if (!addedToCart) {
        return { ...result, error: 'Impossible d\'ajouter au panier' };
      }
      
      // Step 5: Show instructions overlay
      this.showSemiAutoInstructions(order, platform);
      
      result.success = true;
      result.status = 'cart_filled';
      result.message = `Produit ajouté au panier. Finalisez manuellement la commande.`;
      result.instructions = this.getCheckoutInstructions(platform, order);
      
      return result;
    } catch (error) {
      console.error(`[ShopOpti+] Semi-auto order failed for ${platform}:`, error);
      return { ...result, error: error.message };
    }
  }
  
  // Generic variant selection for semi-auto platforms
  async selectGenericVariant(platform, variant) {
    const selectors = {
      banggood: ['[class*="option"] img', '[class*="sku"] span', '.sku-item'],
      dhgate: ['[class*="sku"] img', '.attr-item', '.product-sku-item'],
      shein: ['.product-intro__size-radio', '[class*="option"]', '.goods-size__item'],
      ebay: ['#x-msku', '.vim.x-msku__select', '[class*="option"]'],
      wish: ['[class*="option"]', '.ProductAttribute button'],
      gearbest: ['.goods-sku-item', '[class*="option"]'],
      lightinthebox: ['[class*="option"]', '.attr-item']
    };
    
    try {
      const platformSelectors = selectors[platform] || [];
      
      for (const sel of platformSelectors) {
        const elements = document.querySelectorAll(sel);
        for (const el of elements) {
          const text = (el.textContent || el.alt || el.title || '').toLowerCase();
          const variantText = (variant.color || variant.size || '').toLowerCase();
          
          if (text.includes(variantText)) {
            el.click();
            await this.delay(500);
            return true;
          }
        }
      }
      return true; // Don't fail if variant not found
    } catch (e) {
      return false;
    }
  }
  
  // Generic quantity setting
  async setGenericQuantity(platform, quantity) {
    const selectors = [
      'input[name="quantity"]',
      'input[type="number"]',
      '[class*="quantity"] input',
      '#quantity',
      '.qty-input'
    ];
    
    try {
      for (const sel of selectors) {
        const input = document.querySelector(sel);
        if (input) {
          input.value = quantity;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Generic add to cart
  async addToCartGeneric(platform) {
    const selectors = {
      banggood: ['#addToCartBtn', '.add-to-cart', '[class*="add-cart"]'],
      dhgate: ['.add-cart-btn', '[class*="addCart"]', '.buy-now-btn'],
      shein: ['.product-intro__add-btn', '.add-to-bag', '[class*="addBag"]'],
      ebay: ['#atcBtn', '.ux-call-to-action', '#addToCart'],
      wish: ['[class*="add-to-cart"]', '.AddToCartButton'],
      gearbest: ['.add-to-cart', '.add_to_cart_btn'],
      lightinthebox: ['.add-cart', '.btn-add-cart']
    };
    
    try {
      const platformSelectors = selectors[platform] || ['.add-to-cart', '#add-to-cart'];
      
      for (const sel of platformSelectors) {
        const btn = document.querySelector(sel);
        if (btn && !btn.disabled) {
          btn.click();
          await this.delay(1500);
          return true;
        }
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  
  // Show semi-auto instructions overlay
  showSemiAutoInstructions(order, platform) {
    const existing = document.getElementById('sho-semi-auto-overlay');
    if (existing) existing.remove();
    
    const instructions = this.getCheckoutInstructions(platform, order);
    
    const overlay = document.createElement('div');
    overlay.id = 'sho-semi-auto-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        width: 380px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 9999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      ">
        <div style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">📦</span>
            <span style="color: white; font-weight: 600; font-size: 16px;">ShopOpti+ Auto-Order</span>
          </div>
          <button id="sho-close-semi" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
          ">×</button>
        </div>
        
        <div style="padding: 20px;">
          <div style="
            background: linear-gradient(135deg, #10b981, #059669);
            color: white;
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
          ">
            <span style="font-size: 20px;">✓</span>
            <div>
              <div style="font-weight: 600;">Produit ajouté au panier</div>
              <div style="font-size: 12px; opacity: 0.9;">Finalisez manuellement la commande</div>
            </div>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">📋 Instructions:</div>
            <ol style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
              ${instructions.map(i => `<li>${i}</li>`).join('')}
            </ol>
          </div>
          
          <div style="
            background: #f8f9fa;
            padding: 12px;
            border-radius: 8px;
            font-size: 13px;
          ">
            <div style="font-weight: 600; color: #333; margin-bottom: 4px;">📦 Adresse de livraison:</div>
            <div style="color: #666;">
              ${order.shippingAddress?.name || 'Client'}<br>
              ${order.shippingAddress?.address1 || ''}<br>
              ${order.shippingAddress?.city || ''} ${order.shippingAddress?.zip || ''}<br>
              ${order.shippingAddress?.country || ''}
            </div>
          </div>
          
          <button id="sho-copy-address" style="
            width: 100%;
            margin-top: 12px;
            padding: 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
          ">📋 Copier l'adresse</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event handlers
    overlay.querySelector('#sho-close-semi').onclick = () => overlay.remove();
    overlay.querySelector('#sho-copy-address').onclick = () => {
      const addr = order.shippingAddress;
      const text = `${addr?.name || ''}\n${addr?.address1 || ''}\n${addr?.city || ''} ${addr?.zip || ''}\n${addr?.country || ''}`;
      navigator.clipboard.writeText(text);
      overlay.querySelector('#sho-copy-address').textContent = '✓ Copié !';
    };
  }
  
  // Get checkout instructions by platform
  getCheckoutInstructions(platform, order) {
    const common = [
      'Vérifiez la variante et la quantité',
      `Entrez l'adresse de livraison du client`,
      'Choisissez le mode de livraison',
      'Procédez au paiement'
    ];
    
    const platformSpecific = {
      banggood: ['Allez dans votre panier', ...common, 'Copiez le numéro de commande'],
      dhgate: ['Cliquez sur "Voir panier"', ...common, 'Notez le numéro de suivi'],
      shein: ['Accédez au panier', ...common],
      ebay: ['Cliquez sur "Voir le panier"', ...common, 'Utilisez "Acheter maintenant" si possible'],
      wish: ['Ouvrez votre panier', ...common],
      gearbest: ['Allez dans le panier', ...common],
      lightinthebox: ['Accédez au panier', ...common]
    };
    
    return platformSpecific[platform] || common;
  }
  
  // ============= AGENT ORDER (1688, Alibaba) =============
  async placeAgentOrder(order, platform) {
    const result = { success: false, steps: [], platform, mode: 'agent' };
    
    console.log(`[ShopOpti+] Agent order required for ${platform}`);
    
    // Show agent instructions
    this.showAgentInstructions(order, platform);
    
    result.success = true;
    result.status = 'agent_required';
    result.message = `${platform} nécessite un agent d'achat. Instructions affichées.`;
    
    return result;
  }
  
  // Show agent instructions overlay
  showAgentInstructions(order, platform) {
    const existing = document.getElementById('sho-agent-overlay');
    if (existing) existing.remove();
    
    const agents = {
      '1688': ['Superbuy', 'CSSBuy', 'Wegobuy', 'Pandabuy'],
      'alibaba': ['Alibaba Trade Assurance', 'Superbuy', 'CSSBuy']
    };
    
    const overlay = document.createElement('div');
    overlay.id = 'sho-agent-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 450px;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 9999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
      ">
        <div style="
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 24px;">🏭</span>
            <span style="color: white; font-weight: 600; font-size: 16px;">Agent d'achat requis</span>
          </div>
          <button id="sho-close-agent" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
          ">×</button>
        </div>
        
        <div style="padding: 20px;">
          <div style="
            background: #fef3c7;
            border: 1px solid #fcd34d;
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 16px;
            color: #92400e;
          ">
            <strong>${platform.toUpperCase()}</strong> nécessite un agent d'achat pour les commandes internationales.
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">📋 Étapes:</div>
            <ol style="margin: 0; padding-left: 20px; color: #555; line-height: 1.8;">
              <li>Copiez le lien du produit</li>
              <li>Utilisez un agent d'achat recommandé</li>
              <li>Collez le lien et configurez la commande</li>
              <li>L'agent achètera et expédiera pour vous</li>
            </ol>
          </div>
          
          <div style="margin-bottom: 16px;">
            <div style="font-weight: 600; color: #333; margin-bottom: 8px;">🏢 Agents recommandés:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
              ${(agents[platform] || []).map(agent => `
                <span style="
                  background: #f3f4f6;
                  padding: 6px 12px;
                  border-radius: 20px;
                  font-size: 13px;
                  color: #374151;
                ">${agent}</span>
              `).join('')}
            </div>
          </div>
          
          <button id="sho-copy-link" style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
          ">📋 Copier le lien du produit</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(overlay);
    
    // Event handlers
    overlay.querySelector('#sho-close-agent').onclick = () => overlay.remove();
    overlay.querySelector('#sho-copy-link').onclick = () => {
      navigator.clipboard.writeText(window.location.href);
      overlay.querySelector('#sho-copy-link').textContent = '✓ Lien copié !';
    };
  }
}

// Initialize and expose
window.ShopOptiAutoOrder = ShopOptiAutoOrder;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const autoOrder = new ShopOptiAutoOrder();
    autoOrder.init();
  });
} else {
  const autoOrder = new ShopOptiAutoOrder();
  autoOrder.init();
}

console.log('[ShopOpti+] Auto-order system v4.3.16 loaded');
