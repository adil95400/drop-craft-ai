// Drop Craft AI - Fulfillment Tools v4.0
// Address copier, order processing, and shipment tracking

(function() {
  'use strict';

  if (window.__dropCraftFulfillmentLoaded) return;
  window.__dropCraftFulfillmentLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://shopopti.io',
    CARRIERS: {
      '17track': { name: '17TRACK', url: 'https://t.17track.net/en#nums=' },
      'aftership': { name: 'AfterShip', url: 'https://track.aftership.com/' },
      'cainiao': { name: 'Cainiao', url: 'https://global.cainiao.com/detail.htm?mailNoList=' },
      'usps': { name: 'USPS', url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' },
      'ups': { name: 'UPS', url: 'https://www.ups.com/track?tracknum=' },
      'fedex': { name: 'FedEx', url: 'https://www.fedex.com/apps/fedextrack/?tracknumbers=' },
      'dhl': { name: 'DHL', url: 'https://www.dhl.com/en/express/tracking.html?AWB=' },
      'colissimo': { name: 'Colissimo', url: 'https://www.laposte.fr/outils/suivre-vos-envois?code=' },
      'chronopost': { name: 'Chronopost', url: 'https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=' },
      'yuntrack': { name: 'YunTrack', url: 'https://www.yuntrack.com/Track/Result?ytn=' }
    },
    SUPPLIER_SITES: {
      'aliexpress': { 
        addressForm: '#place-order-form, .address-panel',
        nameField: 'input[name*="name"], input[placeholder*="name"]',
        addressField: 'input[name*="address"], textarea[name*="address"]',
        cityField: 'input[name*="city"]',
        zipField: 'input[name*="zip"], input[name*="postal"]',
        countryField: 'select[name*="country"]',
        phoneField: 'input[name*="phone"], input[type="tel"]'
      },
      'amazon': {
        addressForm: '#address-form, .a-box-inner form',
        nameField: 'input[name*="fullName"], input[id*="fullName"]',
        addressField: 'input[name*="addressLine1"], textarea[name*="address"]',
        cityField: 'input[name*="city"]',
        zipField: 'input[name*="postalCode"]',
        countryField: 'select[name*="country"]',
        phoneField: 'input[name*="phoneNumber"]'
      },
      'cjdropshipping': {
        addressForm: '.address-form, .order-address',
        nameField: 'input[name="name"], input[placeholder*="Name"]',
        addressField: 'input[name="address"], textarea[name="address"]',
        cityField: 'input[name="city"]',
        zipField: 'input[name="zipCode"]',
        countryField: 'select[name="country"]',
        phoneField: 'input[name="phone"]'
      }
    }
  };

  class DropCraftFulfillment {
    constructor() {
      this.currentPlatform = null;
      this.pendingOrders = [];
      this.clipboard = null;
      
      this.init();
    }

    async init() {
      this.detectPlatform();
      this.injectStyles();
      this.createUI();
      this.loadPendingOrders();
      this.bindEvents();
    }

    detectPlatform() {
      const hostname = window.location.hostname.toLowerCase();
      
      for (const [key] of Object.entries(CONFIG.SUPPLIER_SITES)) {
        if (hostname.includes(key)) {
          this.currentPlatform = key;
          return;
        }
      }
    }

    injectStyles() {
      if (document.querySelector('#dc-fulfillment-styles')) return;
      
      const style = document.createElement('style');
      style.id = 'dc-fulfillment-styles';
      style.textContent = `
        /* Fulfillment Panel */
        .dc-fulfillment-panel {
          position: fixed;
          top: 80px;
          right: 20px;
          width: 360px;
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d3d 100%);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 16px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
          z-index: 10000;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-10px);
          transition: all 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .dc-fulfillment-panel.active {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .dc-fulfillment-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dc-fulfillment-title {
          display: flex;
          align-items: center;
          gap: 10px;
          color: white;
          font-weight: 600;
          font-size: 16px;
        }
        
        .dc-fulfillment-title-icon {
          font-size: 20px;
        }
        
        .dc-fulfillment-close {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 18px;
          padding: 4px;
        }
        
        .dc-fulfillment-close:hover {
          color: #ef4444;
        }
        
        .dc-fulfillment-tabs {
          display: flex;
          padding: 12px;
          gap: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .dc-fulfillment-tab {
          flex: 1;
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: none;
          border-radius: 8px;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dc-fulfillment-tab:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .dc-fulfillment-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .dc-fulfillment-content {
          padding: 16px;
          max-height: 500px;
          overflow-y: auto;
        }
        
        /* Address Section */
        .dc-address-section {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
        }
        
        .dc-address-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .dc-address-title {
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        
        .dc-address-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .dc-address-field {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 10px;
          padding: 10px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }
        
        .dc-address-field-icon {
          color: #667eea;
          font-size: 14px;
          margin-top: 2px;
        }
        
        .dc-address-field-content {
          flex: 1;
        }
        
        .dc-address-field-label {
          color: #64748b;
          font-size: 11px;
          margin-bottom: 2px;
        }
        
        .dc-address-field-value {
          color: white;
          font-size: 13px;
          word-break: break-word;
        }
        
        .dc-address-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .dc-address-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        
        .dc-address-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .dc-address-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .dc-address-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        
        .dc-address-btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        
        /* Order List */
        .dc-order-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .dc-order-item {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        
        .dc-order-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(102, 126, 234, 0.3);
        }
        
        .dc-order-item.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.1);
        }
        
        .dc-order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        
        .dc-order-id {
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        
        .dc-order-status {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
        }
        
        .dc-order-status.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        
        .dc-order-status.processing {
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;
        }
        
        .dc-order-status.shipped {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        .dc-order-customer {
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 4px;
        }
        
        .dc-order-items {
          color: #64748b;
          font-size: 11px;
        }
        
        /* Tracking Section */
        .dc-tracking-section {
          padding: 16px;
        }
        
        .dc-tracking-input-group {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
        }
        
        .dc-tracking-input {
          flex: 1;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: white;
          font-size: 13px;
        }
        
        .dc-tracking-input::placeholder {
          color: #64748b;
        }
        
        .dc-tracking-input:focus {
          outline: none;
          border-color: #667eea;
        }
        
        .dc-tracking-btn {
          padding: 12px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .dc-tracking-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        .dc-tracking-carriers {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 16px;
        }
        
        .dc-carrier-btn {
          padding: 10px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }
        
        .dc-carrier-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border-color: #667eea;
        }
        
        /* Tracking Result */
        .dc-tracking-result {
          margin-top: 16px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
        }
        
        .dc-tracking-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        
        .dc-tracking-number {
          color: white;
          font-weight: 600;
          font-size: 14px;
        }
        
        .dc-tracking-result-status {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
        
        .dc-tracking-timeline {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .dc-tracking-event {
          display: flex;
          gap: 12px;
          position: relative;
          padding-left: 24px;
        }
        
        .dc-tracking-event::before {
          content: '';
          position: absolute;
          left: 6px;
          top: 8px;
          bottom: -12px;
          width: 2px;
          background: rgba(255, 255, 255, 0.1);
        }
        
        .dc-tracking-event:last-child::before {
          display: none;
        }
        
        .dc-tracking-event-dot {
          position: absolute;
          left: 0;
          top: 4px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(102, 126, 234, 0.3);
          border: 2px solid #667eea;
        }
        
        .dc-tracking-event:first-child .dc-tracking-event-dot {
          background: #667eea;
        }
        
        .dc-tracking-event-content {
          flex: 1;
        }
        
        .dc-tracking-event-status {
          color: white;
          font-size: 13px;
          font-weight: 500;
        }
        
        .dc-tracking-event-date {
          color: #64748b;
          font-size: 11px;
          margin-top: 2px;
        }
        
        .dc-tracking-event-location {
          color: #94a3b8;
          font-size: 11px;
        }
        
        /* Toggle Button */
        .dc-fulfillment-toggle {
          position: fixed;
          bottom: 160px;
          right: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4);
          z-index: 9999;
          transition: all 0.3s ease;
        }
        
        .dc-fulfillment-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 25px rgba(16, 185, 129, 0.5);
        }
        
        .dc-fulfillment-toggle-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #ef4444;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Empty State */
        .dc-empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #64748b;
        }
        
        .dc-empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .dc-empty-text {
          font-size: 14px;
          margin-bottom: 20px;
        }
        
        .dc-empty-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .dc-empty-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }
        
        /* Scrollbar */
        .dc-fulfillment-content::-webkit-scrollbar {
          width: 6px;
        }
        
        .dc-fulfillment-content::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        
        .dc-fulfillment-content::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        .dc-fulfillment-content::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `;
      document.head.appendChild(style);
    }

    createUI() {
      // Toggle button
      const toggle = document.createElement('button');
      toggle.className = 'dc-fulfillment-toggle';
      toggle.id = 'dc-fulfillment-toggle';
      toggle.innerHTML = `
        📦
        <span class="dc-fulfillment-toggle-badge" id="dc-fulfillment-badge" style="display: none;">0</span>
      `;
      document.body.appendChild(toggle);
      
      // Main panel
      const panel = document.createElement('div');
      panel.className = 'dc-fulfillment-panel';
      panel.id = 'dc-fulfillment-panel';
      panel.innerHTML = this.getPanelHTML();
      document.body.appendChild(panel);
    }

    getPanelHTML() {
      return `
        <div class="dc-fulfillment-header">
          <div class="dc-fulfillment-title">
            <span class="dc-fulfillment-title-icon">📦</span>
            <span>Fulfillment</span>
          </div>
          <button class="dc-fulfillment-close" id="dc-fulfillment-close">✕</button>
        </div>
        
        <div class="dc-fulfillment-tabs">
          <button class="dc-fulfillment-tab active" data-tab="orders">🛒 Commandes</button>
          <button class="dc-fulfillment-tab" data-tab="address">📍 Adresse</button>
          <button class="dc-fulfillment-tab" data-tab="tracking">🚚 Suivi</button>
        </div>
        
        <div class="dc-fulfillment-content" id="dc-fulfillment-content">
          ${this.getOrdersContent()}
        </div>
      `;
    }

    getOrdersContent() {
      if (this.pendingOrders.length === 0) {
        return `
          <div class="dc-empty-state">
            <div class="dc-empty-icon">📭</div>
            <div class="dc-empty-text">Aucune commande en attente</div>
            <a href="${CONFIG.APP_URL}/orders" target="_blank" class="dc-empty-btn">
              🔄 Synchroniser les commandes
            </a>
          </div>
        `;
      }
      
      return `
        <div class="dc-order-list">
          ${this.pendingOrders.map(order => `
            <div class="dc-order-item" data-order-id="${order.id}">
              <div class="dc-order-header">
                <div class="dc-order-id">#${order.order_number || order.id.slice(0, 8)}</div>
                <div class="dc-order-status ${order.status}">${this.getStatusLabel(order.status)}</div>
              </div>
              <div class="dc-order-customer">${order.customer_name || 'Client'}</div>
              <div class="dc-order-items">${order.items_count || 1} article(s) • ${order.total || '0.00'}€</div>
            </div>
          `).join('')}
        </div>
      `;
    }

    getAddressContent(order = null) {
      const address = order?.shipping_address || this.clipboard;
      
      if (!address) {
        return `
          <div class="dc-empty-state">
            <div class="dc-empty-icon">📍</div>
            <div class="dc-empty-text">Sélectionnez une commande pour copier l'adresse</div>
          </div>
        `;
      }
      
      return `
        <div class="dc-address-section">
          <div class="dc-address-header">
            <div class="dc-address-title">Adresse de livraison</div>
            <div class="dc-address-badge">Prêt à coller</div>
          </div>
          
          <div class="dc-address-field">
            <span class="dc-address-field-icon">👤</span>
            <div class="dc-address-field-content">
              <div class="dc-address-field-label">Nom complet</div>
              <div class="dc-address-field-value">${address.name || '-'}</div>
            </div>
          </div>
          
          <div class="dc-address-field">
            <span class="dc-address-field-icon">🏠</span>
            <div class="dc-address-field-content">
              <div class="dc-address-field-label">Adresse</div>
              <div class="dc-address-field-value">${address.address || address.street || '-'}</div>
            </div>
          </div>
          
          <div class="dc-address-field">
            <span class="dc-address-field-icon">🏙️</span>
            <div class="dc-address-field-content">
              <div class="dc-address-field-label">Ville / Code postal</div>
              <div class="dc-address-field-value">${address.city || '-'} ${address.postal_code || address.zip || ''}</div>
            </div>
          </div>
          
          <div class="dc-address-field">
            <span class="dc-address-field-icon">🌍</span>
            <div class="dc-address-field-content">
              <div class="dc-address-field-label">Pays</div>
              <div class="dc-address-field-value">${address.country || '-'}</div>
            </div>
          </div>
          
          <div class="dc-address-field">
            <span class="dc-address-field-icon">📞</span>
            <div class="dc-address-field-content">
              <div class="dc-address-field-label">Téléphone</div>
              <div class="dc-address-field-value">${address.phone || '-'}</div>
            </div>
          </div>
          
          <div class="dc-address-actions">
            <button class="dc-address-btn dc-address-btn-primary" id="dc-auto-fill-btn">
              ⚡ Remplir automatiquement
            </button>
            <button class="dc-address-btn dc-address-btn-secondary" id="dc-copy-address-btn">
              📋 Copier
            </button>
          </div>
        </div>
      `;
    }

    getTrackingContent() {
      return `
        <div class="dc-tracking-section">
          <div class="dc-tracking-input-group">
            <input type="text" class="dc-tracking-input" id="dc-tracking-input" placeholder="Entrez un numéro de suivi...">
            <button class="dc-tracking-btn" id="dc-track-btn">Suivre</button>
          </div>
          
          <div class="dc-tracking-carriers">
            ${Object.entries(CONFIG.CARRIERS).slice(0, 9).map(([key, carrier]) => `
              <button class="dc-carrier-btn" data-carrier="${key}">${carrier.name}</button>
            `).join('')}
          </div>
          
          <div id="dc-tracking-result"></div>
        </div>
      `;
    }

    getStatusLabel(status) {
      const labels = {
        pending: 'En attente',
        processing: 'En cours',
        shipped: 'Expédié',
        delivered: 'Livré',
        cancelled: 'Annulé'
      };
      return labels[status] || status;
    }

    async loadPendingOrders() {
      return new Promise((resolve) => {
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.get(['pendingOrders', 'extensionToken'], async (result) => {
            if (result.pendingOrders) {
              this.pendingOrders = result.pendingOrders;
            }
            
            // Optionally sync from API
            if (result.extensionToken) {
              try {
                const response = await fetch(`${CONFIG.API_URL}/extension-sync-realtime`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-extension-token': result.extensionToken
                  },
                  body: JSON.stringify({ action: 'get_pending_orders' })
                });
                
                if (response.ok) {
                  const data = await response.json();
                  if (data.orders) {
                    this.pendingOrders = data.orders;
                    chrome.storage.local.set({ pendingOrders: this.pendingOrders });
                  }
                }
              } catch (error) {
                console.log('Could not sync orders:', error);
              }
            }
            
            this.updateBadge();
            resolve();
          });
        } else {
          resolve();
        }
      });
    }

    updateBadge() {
      const badge = document.getElementById('dc-fulfillment-badge');
      if (badge) {
        const count = this.pendingOrders.filter(o => o.status === 'pending').length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
      }
    }

    bindEvents() {
      // Toggle panel
      document.getElementById('dc-fulfillment-toggle')?.addEventListener('click', () => this.togglePanel());
      document.getElementById('dc-fulfillment-close')?.addEventListener('click', () => this.closePanel());
      
      // Tabs
      document.querySelectorAll('.dc-fulfillment-tab').forEach(tab => {
        tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
      });
      
      // Order selection
      document.querySelectorAll('.dc-order-item').forEach(item => {
        item.addEventListener('click', () => this.selectOrder(item.dataset.orderId));
      });
    }

    rebindEvents() {
      // Rebind events after content change
      document.getElementById('dc-auto-fill-btn')?.addEventListener('click', () => this.autoFillAddress());
      document.getElementById('dc-copy-address-btn')?.addEventListener('click', () => this.copyAddress());
      document.getElementById('dc-track-btn')?.addEventListener('click', () => this.trackPackage());
      
      document.querySelectorAll('.dc-carrier-btn').forEach(btn => {
        btn.addEventListener('click', () => this.openCarrierTracking(btn.dataset.carrier));
      });
      
      document.querySelectorAll('.dc-order-item').forEach(item => {
        item.addEventListener('click', () => this.selectOrder(item.dataset.orderId));
      });
    }

    togglePanel() {
      const panel = document.getElementById('dc-fulfillment-panel');
      if (panel) {
        panel.classList.toggle('active');
      }
    }

    closePanel() {
      const panel = document.getElementById('dc-fulfillment-panel');
      if (panel) {
        panel.classList.remove('active');
      }
    }

    switchTab(tabName) {
      // Update tab buttons
      document.querySelectorAll('.dc-fulfillment-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });
      
      // Update content
      const content = document.getElementById('dc-fulfillment-content');
      if (content) {
        switch (tabName) {
          case 'orders':
            content.innerHTML = this.getOrdersContent();
            break;
          case 'address':
            content.innerHTML = this.getAddressContent();
            break;
          case 'tracking':
            content.innerHTML = this.getTrackingContent();
            break;
        }
        this.rebindEvents();
      }
    }

    selectOrder(orderId) {
      const order = this.pendingOrders.find(o => o.id === orderId);
      if (!order) return;
      
      // Update UI
      document.querySelectorAll('.dc-order-item').forEach(item => {
        item.classList.toggle('selected', item.dataset.orderId === orderId);
      });
      
      // Store address for copying
      this.clipboard = order.shipping_address;
      
      // Switch to address tab
      this.switchTab('address');
      
      this.showToast('Adresse prête à être copiée', 'success');
    }

    async autoFillAddress() {
      if (!this.clipboard || !this.currentPlatform) {
        this.showToast('Aucune adresse disponible ou plateforme non supportée', 'warning');
        return;
      }
      
      const config = CONFIG.SUPPLIER_SITES[this.currentPlatform];
      if (!config) {
        this.showToast('Plateforme non supportée pour le remplissage automatique', 'warning');
        return;
      }
      
      const fillField = (selector, value) => {
        const field = document.querySelector(selector);
        if (field && value) {
          field.value = value;
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
        }
      };
      
      // Fill all fields
      fillField(config.nameField, this.clipboard.name);
      fillField(config.addressField, this.clipboard.address || this.clipboard.street);
      fillField(config.cityField, this.clipboard.city);
      fillField(config.zipField, this.clipboard.postal_code || this.clipboard.zip);
      fillField(config.phoneField, this.clipboard.phone);
      
      // Handle country select
      const countryField = document.querySelector(config.countryField);
      if (countryField && this.clipboard.country) {
        const options = Array.from(countryField.options);
        const match = options.find(opt => 
          opt.text.toLowerCase().includes(this.clipboard.country.toLowerCase()) ||
          opt.value.toLowerCase().includes(this.clipboard.country.toLowerCase())
        );
        if (match) {
          countryField.value = match.value;
          countryField.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      this.showToast('Adresse remplie automatiquement!', 'success');
    }

    async copyAddress() {
      if (!this.clipboard) {
        this.showToast('Aucune adresse à copier', 'warning');
        return;
      }
      
      const addressText = [
        this.clipboard.name,
        this.clipboard.address || this.clipboard.street,
        `${this.clipboard.city || ''} ${this.clipboard.postal_code || this.clipboard.zip || ''}`.trim(),
        this.clipboard.country,
        this.clipboard.phone
      ].filter(Boolean).join('\n');
      
      try {
        await navigator.clipboard.writeText(addressText);
        this.showToast('Adresse copiée dans le presse-papier!', 'success');
      } catch (error) {
        this.showToast('Erreur lors de la copie', 'error');
      }
    }

    async trackPackage() {
      const input = document.getElementById('dc-tracking-input');
      const trackingNumber = input?.value.trim();
      
      if (!trackingNumber) {
        this.showToast('Veuillez entrer un numéro de suivi', 'warning');
        return;
      }
      
      // Open in 17TRACK by default
      window.open(`${CONFIG.CARRIERS['17track'].url}${trackingNumber}`, '_blank');
    }

    openCarrierTracking(carrier) {
      const input = document.getElementById('dc-tracking-input');
      const trackingNumber = input?.value.trim();
      
      if (!trackingNumber) {
        this.showToast('Veuillez entrer un numéro de suivi', 'warning');
        return;
      }
      
      const carrierConfig = CONFIG.CARRIERS[carrier];
      if (carrierConfig) {
        window.open(`${carrierConfig.url}${trackingNumber}`, '_blank');
      }
    }

    showToast(message, type = 'info') {
      const colors = {
        success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        error: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      };
      
      const toast = document.createElement('div');
      toast.style.cssText = `
        position: fixed;
        bottom: 220px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        font-weight: 500;
        font-size: 13px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        z-index: 100001;
        animation: dc-fulfillment-toast-in 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      `;
      toast.textContent = message;
      
      const style = document.createElement('style');
      style.textContent = `
        @keyframes dc-fulfillment-toast-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `;
      document.head.appendChild(style);
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.style.animation = 'dc-fulfillment-toast-in 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
  }

  // Initialize fulfillment tools
  new DropCraftFulfillment();
})();
