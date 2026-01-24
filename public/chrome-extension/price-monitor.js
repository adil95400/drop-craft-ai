/**
 * ShopOpti+ Price Monitor v4.3.16
 * Real-time price tracking and alerts
 */

class ShopOptiPriceMonitor {
  constructor() {
    this.config = null;
    this.checkInterval = null;
    this.trackedProducts = [];
  }

  async init() {
    await this.loadConfig();
    await this.loadTrackedProducts();
    this.startMonitoring();
    this.injectUI();
  }

  async loadConfig() {
    return new Promise(resolve => {
      chrome.storage.local.get(['shopopti_config', 'extensionToken'], result => {
        this.config = result.shopopti_config || {};
        this.token = result.extensionToken || '';
        resolve();
      });
    });
  }

  async loadTrackedProducts() {
    return new Promise(resolve => {
      chrome.storage.local.get(['tracked_products'], result => {
        this.trackedProducts = result.tracked_products || [];
        resolve();
      });
    });
  }

  async saveTrackedProducts() {
    return new Promise(resolve => {
      chrome.storage.local.set({ tracked_products: this.trackedProducts }, resolve);
    });
  }

  startMonitoring() {
    // Check prices every 30 minutes
    const interval = (this.config.priceCheckInterval || 30) * 60 * 1000;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      this.checkAllPrices();
    }, interval);

    console.log('[ShopOpti+] Price monitoring started');
  }

  async checkAllPrices() {
    if (!this.token) return;

    try {
      const response = await fetch(`${this.getApiUrl()}/price-check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': this.token
        },
        body: JSON.stringify({
          products: this.trackedProducts.map(p => ({
            id: p.id,
            url: p.url,
            lastPrice: p.currentPrice
          }))
        })
      });

      if (response.ok) {
        const { results } = await response.json();
        await this.processResults(results);
      }
    } catch (error) {
      console.error('[ShopOpti+] Price check failed:', error);
    }
  }

  async processResults(results) {
    const alerts = [];

    for (const result of results) {
      const tracked = this.trackedProducts.find(p => p.id === result.id);
      if (!tracked) continue;

      const oldPrice = tracked.currentPrice;
      const newPrice = result.newPrice;
      const priceDiff = ((newPrice - oldPrice) / oldPrice) * 100;

      // Update tracked product
      tracked.currentPrice = newPrice;
      tracked.lastChecked = new Date().toISOString();
      tracked.priceHistory = tracked.priceHistory || [];
      tracked.priceHistory.push({
        price: newPrice,
        date: new Date().toISOString()
      });

      // Keep only last 30 price points
      if (tracked.priceHistory.length > 30) {
        tracked.priceHistory = tracked.priceHistory.slice(-30);
      }

      // Check alert thresholds
      if (tracked.alertThreshold) {
        if (priceDiff <= -tracked.alertThreshold) {
          alerts.push({
            type: 'price_drop',
            product: tracked,
            oldPrice,
            newPrice,
            change: priceDiff
          });
        } else if (priceDiff >= tracked.alertThreshold) {
          alerts.push({
            type: 'price_increase',
            product: tracked,
            oldPrice,
            newPrice,
            change: priceDiff
          });
        }
      }

      // Check target price
      if (tracked.targetPrice && newPrice <= tracked.targetPrice) {
        alerts.push({
          type: 'target_reached',
          product: tracked,
          targetPrice: tracked.targetPrice,
          currentPrice: newPrice
        });
      }
    }

    await this.saveTrackedProducts();
    
    if (alerts.length > 0) {
      await this.sendAlerts(alerts);
    }
  }

  async sendAlerts(alerts) {
    // Browser notifications
    for (const alert of alerts) {
      const title = alert.type === 'price_drop' 
        ? '📉 Prix en baisse!'
        : alert.type === 'price_increase'
        ? '📈 Prix en hausse!'
        : '🎯 Prix cible atteint!';

      const message = alert.type === 'target_reached'
        ? `${alert.product.title}: ${alert.currentPrice}€ (cible: ${alert.targetPrice}€)`
        : `${alert.product.title}: ${alert.oldPrice}€ → ${alert.newPrice}€ (${alert.change.toFixed(1)}%)`;

      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icons/icon128.png'),
          title,
          message,
          priority: 2
        });
      }
    }

    // Send to backend for email/SMS alerts
    if (this.token) {
      try {
        await fetch(`${this.getApiUrl()}/price-alerts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': this.token
          },
          body: JSON.stringify({ alerts })
        });
      } catch (error) {
        console.error('[ShopOpti+] Failed to send alerts to backend:', error);
      }
    }
  }

  async trackProduct(productData) {
    const existing = this.trackedProducts.find(p => p.url === productData.url);
    
    if (existing) {
      // Update existing
      Object.assign(existing, {
        title: productData.title,
        currentPrice: productData.price,
        image: productData.image,
        lastChecked: new Date().toISOString()
      });
    } else {
      // Add new
      this.trackedProducts.push({
        id: `track_${Date.now()}`,
        url: productData.url,
        title: productData.title,
        currentPrice: productData.price,
        originalPrice: productData.price,
        image: productData.image || productData.images?.[0],
        platform: productData.platform,
        addedAt: new Date().toISOString(),
        lastChecked: new Date().toISOString(),
        alertThreshold: 5, // 5% default
        targetPrice: null,
        priceHistory: [{
          price: productData.price,
          date: new Date().toISOString()
        }]
      });
    }

    await this.saveTrackedProducts();
    this.showNotification('Produit suivi', `${productData.title} ajouté au suivi des prix`);
  }

  async untrackProduct(productUrl) {
    this.trackedProducts = this.trackedProducts.filter(p => p.url !== productUrl);
    await this.saveTrackedProducts();
  }

  async setTargetPrice(productUrl, targetPrice) {
    const product = this.trackedProducts.find(p => p.url === productUrl);
    if (product) {
      product.targetPrice = targetPrice;
      await this.saveTrackedProducts();
    }
  }

  async setAlertThreshold(productUrl, threshold) {
    const product = this.trackedProducts.find(p => p.url === productUrl);
    if (product) {
      product.alertThreshold = threshold;
      await this.saveTrackedProducts();
    }
  }

  injectUI() {
    if (document.getElementById('shopopti-price-monitor-btn')) return;

    // Create floating button for price tracking
    const btn = document.createElement('button');
    btn.id = 'shopopti-price-monitor-btn';
    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    `;
    btn.style.cssText = `
      position: fixed;
      bottom: 180px;
      right: 20px;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      cursor: pointer;
      z-index: 999998;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
      transition: all 0.3s ease;
    `;

    btn.onmouseenter = () => {
      btn.style.transform = 'scale(1.1)';
    };
    btn.onmouseleave = () => {
      btn.style.transform = 'scale(1)';
    };

    btn.onclick = () => this.togglePanel();

    document.body.appendChild(btn);
  }

  togglePanel() {
    let panel = document.getElementById('shopopti-price-monitor-panel');
    
    if (panel) {
      panel.remove();
      return;
    }

    panel = document.createElement('div');
    panel.id = 'shopopti-price-monitor-panel';
    panel.innerHTML = this.renderPanel();
    panel.style.cssText = `
      position: fixed;
      bottom: 240px;
      right: 20px;
      width: 350px;
      max-height: 500px;
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
    const currentUrl = window.location.href;
    const isTracked = this.trackedProducts.some(p => p.url === currentUrl);

    return `
      <div style="padding: 16px; background: linear-gradient(135deg, #10b981, #059669); color: white;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
            <span style="font-weight: 600; font-size: 16px;">Suivi des Prix</span>
          </div>
          <button id="shopopti-close-monitor" style="background: none; border: none; color: white; cursor: pointer; padding: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      <div style="padding: 16px;">
        ${isTracked ? `
          <div style="background: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 12px; margin-bottom: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; color: #166534;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span style="font-weight: 500;">Ce produit est suivi</span>
            </div>
            <button id="shopopti-untrack-btn" style="
              width: 100%;
              margin-top: 8px;
              padding: 8px;
              background: white;
              border: 1px solid #fca5a5;
              color: #dc2626;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            ">Arrêter le suivi</button>
          </div>
        ` : `
          <button id="shopopti-track-btn" style="
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #10b981, #059669);
            border: none;
            color: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            font-size: 14px;
            margin-bottom: 16px;
          ">📊 Suivre ce produit</button>
        `}

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px;">
          <div style="font-weight: 600; margin-bottom: 12px; color: #374151;">
            Produits suivis (${this.trackedProducts.length})
          </div>
          <div style="max-height: 250px; overflow-y: auto;">
            ${this.trackedProducts.length === 0 ? `
              <div style="text-align: center; color: #9ca3af; padding: 20px;">
                Aucun produit suivi
              </div>
            ` : this.trackedProducts.slice(0, 10).map(p => `
              <div style="
                display: flex;
                gap: 10px;
                padding: 10px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 8px;
              ">
                <img src="${p.image || 'https://via.placeholder.com/50'}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;"
                     onerror="this.src='https://via.placeholder.com/50'">
                <div style="flex: 1; min-width: 0;">
                  <div style="font-size: 13px; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${p.title}
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                    <span style="font-weight: 600; color: #059669;">${p.currentPrice?.toFixed(2) || '?'}€</span>
                    ${p.originalPrice && p.currentPrice < p.originalPrice ? `
                      <span style="text-decoration: line-through; color: #9ca3af; font-size: 12px;">
                        ${p.originalPrice.toFixed(2)}€
                      </span>
                      <span style="background: #dcfce7; color: #166534; padding: 2px 6px; border-radius: 4px; font-size: 11px;">
                        -${(((p.originalPrice - p.currentPrice) / p.originalPrice) * 100).toFixed(0)}%
                      </span>
                    ` : ''}
                  </div>
                  <div style="font-size: 11px; color: #9ca3af; margin-top: 2px;">
                    ${p.platform} • ${this.formatDate(p.lastChecked)}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  attachPanelEvents(panel) {
    panel.querySelector('#shopopti-close-monitor')?.addEventListener('click', () => {
      panel.remove();
    });

    panel.querySelector('#shopopti-track-btn')?.addEventListener('click', async () => {
      // Extract current page product using grabber
      if (window.ShopOptiGrabber) {
        const grabber = new window.ShopOptiGrabber();
        const product = await grabber.extractSingleProductData();
        if (product) {
          await this.trackProduct(product);
          this.togglePanel(); // Refresh panel
          this.togglePanel();
        }
      } else {
        // Fallback: send message to background
        chrome.runtime.sendMessage({ type: 'TRACK_CURRENT_PAGE' });
      }
    });

    panel.querySelector('#shopopti-untrack-btn')?.addEventListener('click', async () => {
      await this.untrackProduct(window.location.href);
      this.togglePanel(); // Refresh panel
      this.togglePanel();
    });
  }

  formatDate(dateStr) {
    if (!dateStr) return 'Jamais';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'À l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString('fr-FR');
  }

  showNotification(title, message) {
    if (chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title,
        message
      });
    }
  }

  getApiUrl() {
    return this.config?.apiUrl || 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';
  }
}

// Initialize and expose
window.ShopOptiPriceMonitor = ShopOptiPriceMonitor;

// Legacy compatibility
window.DropCraftPriceMonitor = ShopOptiPriceMonitor;

// Auto-init if on product page
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const monitor = new ShopOptiPriceMonitor();
    monitor.init();
  });
} else {
  const monitor = new ShopOptiPriceMonitor();
  monitor.init();
}

console.log('[ShopOpti+] Price monitor v4.3.16 loaded');
