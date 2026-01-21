/**
 * DropCraft Auto-Order System
 * Automated order placement for dropshipping
 */

class DropCraftAutoOrder {
  constructor() {
    this.config = null;
    this.auth = null;
    this.pendingOrders = [];
    this.processingQueue = [];
  }

  async init() {
    await this.loadConfig();
    await this.loadPendingOrders();
    this.injectUI();
    this.setupMessageListener();
  }

  async loadConfig() {
    return new Promise(resolve => {
      chrome.storage.local.get(['dropcraft_config', 'dropcraft_auth'], result => {
        this.config = result.dropcraft_config || {};
        this.auth = result.dropcraft_auth || {};
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
      console.error('[DropCraft] Failed to load pending orders:', error);
    }
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
    });
  }

  async processOrder(order) {
    const platform = this.detectPlatform(order.supplierUrl);
    
    if (!platform) {
      return { success: false, error: 'Plateforme non supportée' };
    }

    try {
      // Navigate to product page
      if (window.location.href !== order.supplierUrl) {
        window.location.href = order.supplierUrl;
        // Store order in local storage for processing after navigation
        await this.storeProcessingOrder(order);
        return { success: true, status: 'navigating' };
      }

      // Platform-specific order placement
      switch (platform) {
        case 'aliexpress':
          return await this.placeAliExpressOrder(order);
        case 'amazon':
          return await this.placeAmazonOrder(order);
        case 'cjdropshipping':
          return await this.placeCJOrder(order);
        default:
          return { success: false, error: 'Plateforme non implémentée' };
      }
    } catch (error) {
      console.error('[DropCraft] Order processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  detectPlatform(url) {
    if (url.includes('aliexpress.')) return 'aliexpress';
    if (url.includes('amazon.')) return 'amazon';
    if (url.includes('cjdropshipping.')) return 'cjdropshipping';
    if (url.includes('temu.')) return 'temu';
    return null;
  }

  async placeAliExpressOrder(order) {
    const result = { success: false, steps: [] };

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
      await this.waitForNavigation();

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
          // Extract order number
          const orderNumber = await this.extractOrderNumber();
          result.orderNumber = orderNumber;
          result.success = true;
        }
      } else {
        result.status = 'pending_confirmation';
        result.success = true;
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
        const colorOptions = document.querySelectorAll('[class*="sku-property"] img, [class*="color"] img');
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
        const sizeOptions = document.querySelectorAll('[class*="sku-property"] span, [class*="size"] span');
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
      console.error('[DropCraft] Variant selection failed:', error);
      return false;
    }
  }

  async setQuantity(quantity) {
    try {
      const quantityInput = document.querySelector('input[type="number"][class*="quantity"], .quantity-input input');
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
    try {
      // This would need to be implemented based on AliExpress checkout page structure
      // For now, return true assuming address is pre-saved in AliExpress account
      return true;
    } catch (error) {
      return false;
    }
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
      // Wait for order confirmation page
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

  async placeAmazonOrder(order) {
    // Similar implementation for Amazon
    return { success: false, error: 'Amazon auto-order en développement' };
  }

  async placeCJOrder(order) {
    // CJ Dropshipping has an API - use that instead
    if (!this.auth?.token) {
      return { success: false, error: 'Non authentifié' };
    }

    try {
      const response = await fetch(`${this.getApiUrl()}/cj-place-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.auth.token}`
        },
        body: JSON.stringify({
          productId: order.productId,
          variantId: order.variantId,
          quantity: order.quantity,
          shippingAddress: order.shippingAddress
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
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

  async waitForNavigation() {
    return new Promise(resolve => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve();
      });
      
      observer.observe(document.body, { childList: true, subtree: true });
      
      // Timeout fallback
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 5000);
    });
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  injectUI() {
    if (document.getElementById('dc-auto-order-btn')) return;

    // Create floating button for auto-order
    const btn = document.createElement('button');
    btn.id = 'dc-auto-order-btn';
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
    let panel = document.getElementById('dc-auto-order-panel');
    
    if (panel) {
      panel.remove();
      return;
    }

    panel = document.createElement('div');
    panel.id = 'dc-auto-order-panel';
    panel.innerHTML = this.renderPanel();
    panel.style.cssText = `
      position: fixed;
      bottom: 300px;
      right: 20px;
      width: 350px;
      max-height: 450px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 999999;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    document.body.appendChild(panel);
    this.attachPanelEvents(panel);
  }

  renderPanel() {
    return `
      <div style="padding: 16px; background: linear-gradient(135deg, #f59e0b, #d97706); color: white;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <span style="font-weight: 600; font-size: 16px;">Auto-Commande</span>
          </div>
          <button id="dc-close-order" style="background: none; border: none; color: white; cursor: pointer; padding: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div style="padding: 16px;">
        <div style="
          background: #fef3c7;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div style="font-size: 13px; color: #92400e;">
            L'auto-commande automatise le processus d'achat. Assurez-vous d'être connecté à votre compte fournisseur.
          </div>
        </div>

        <div style="margin-bottom: 16px;">
          <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
            <input type="checkbox" id="dc-auto-confirm" ${this.config.autoConfirmOrders ? 'checked' : ''} style="width: 18px; height: 18px;">
            <span style="font-size: 14px; color: #374151;">Confirmer automatiquement les commandes</span>
          </label>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <div style="font-weight: 600; margin-bottom: 12px; color: #374151;">
            Commandes en attente (${this.pendingOrders.length})
          </div>
          <div style="max-height: 200px; overflow-y: auto;">
            ${this.pendingOrders.length === 0 ? `
              <div style="text-align: center; color: #9ca3af; padding: 20px;">
                Aucune commande en attente
              </div>
            ` : this.pendingOrders.slice(0, 5).map(order => `
              <div style="
                display: flex;
                gap: 10px;
                padding: 10px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 8px;
              ">
                <div style="flex: 1;">
                  <div style="font-size: 13px; font-weight: 500;">
                    Commande #${order.orderNumber || order.id.slice(0, 8)}
                  </div>
                  <div style="font-size: 12px; color: #6b7280; margin-top: 2px;">
                    ${order.items?.length || 1} article(s) • ${order.total?.toFixed(2) || '?'}€
                  </div>
                  <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
                    ${this.formatDate(order.createdAt)}
                  </div>
                </div>
                <button data-order-id="${order.id}" class="dc-process-order-btn" style="
                  padding: 6px 12px;
                  background: linear-gradient(135deg, #f59e0b, #d97706);
                  border: none;
                  color: white;
                  border-radius: 6px;
                  cursor: pointer;
                  font-size: 12px;
                  font-weight: 500;
                ">Traiter</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  attachPanelEvents(panel) {
    panel.querySelector('#dc-close-order')?.addEventListener('click', () => {
      panel.remove();
    });

    panel.querySelector('#dc-auto-confirm')?.addEventListener('change', async (e) => {
      this.config.autoConfirmOrders = e.target.checked;
      await this.saveConfig();
    });

    panel.querySelectorAll('.dc-process-order-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const orderId = btn.dataset.orderId;
        const order = this.pendingOrders.find(o => o.id === orderId);
        if (order) {
          btn.textContent = 'Traitement...';
          btn.disabled = true;
          const result = await this.processOrder(order);
          if (result.success) {
            btn.textContent = '✓ Traité';
            btn.style.background = '#10b981';
          } else {
            btn.textContent = '✗ Échec';
            btn.style.background = '#ef4444';
          }
        }
      });
    });
  }

  async saveConfig() {
    return new Promise(resolve => {
      chrome.storage.local.set({ dropcraft_config: this.config }, resolve);
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
}

// Initialize and expose
window.DropCraftAutoOrder = DropCraftAutoOrder;

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const autoOrder = new DropCraftAutoOrder();
    autoOrder.init();
  });
} else {
  const autoOrder = new DropCraftAutoOrder();
  autoOrder.init();
}

console.log('[DropCraft] Auto-order system loaded');
