// ============================================================================
// DROP CRAFT AI - EXTENSION DEBUG PANEL v4.3
// Professional debugging interface for extension troubleshooting
// ============================================================================

class DropCraftDebugPanel {
  constructor() {
    this.logs = [];
    this.maxLogs = 500;
    this.isVisible = false;
    this.extractedData = null;
    this.panelElement = null;
  }

  // Initialize debug panel
  init() {
    console.log('[DropCraft Debug] Initializing debug panel...');
    this.createPanel();
    this.setupKeyboardShortcut();
    this.interceptConsole();
    this.log('info', 'Debug panel initialized');
  }

  // Create the debug panel UI
  createPanel() {
    if (document.getElementById('dc-debug-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'dc-debug-panel';
    panel.innerHTML = `
      <style>
        #dc-debug-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 450px;
          max-height: 600px;
          background: linear-gradient(145deg, #1a1a2e 0%, #16213e 100%);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1);
          z-index: 2147483647;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          font-size: 12px;
          color: #e2e8f0;
          display: none;
          flex-direction: column;
          overflow: hidden;
        }

        #dc-debug-panel.visible {
          display: flex;
          animation: dc-slide-in 0.3s ease-out;
        }

        @keyframes dc-slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dc-debug-header {
          padding: 16px;
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          border-bottom: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dc-debug-title {
          font-weight: 700;
          font-size: 14px;
          color: #fff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dc-debug-badge {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
        }

        .dc-debug-controls {
          display: flex;
          gap: 8px;
        }

        .dc-debug-btn {
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #a5b4fc;
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .dc-debug-btn:hover {
          background: rgba(99, 102, 241, 0.4);
          color: #fff;
        }

        .dc-debug-btn.primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: none;
          color: #fff;
        }

        .dc-debug-btn.primary:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }

        .dc-debug-tabs {
          display: flex;
          padding: 8px 16px;
          gap: 4px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
        }

        .dc-debug-tab {
          padding: 8px 16px;
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .dc-debug-tab:hover {
          background: rgba(99, 102, 241, 0.1);
          color: #e2e8f0;
        }

        .dc-debug-tab.active {
          background: rgba(99, 102, 241, 0.2);
          color: #a5b4fc;
        }

        .dc-debug-content {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .dc-debug-content::-webkit-scrollbar {
          width: 6px;
        }

        .dc-debug-content::-webkit-scrollbar-track {
          background: rgba(99, 102, 241, 0.1);
        }

        .dc-debug-content::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }

        .dc-log-entry {
          padding: 8px 12px;
          margin-bottom: 4px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-left: 3px solid;
          font-size: 11px;
          line-height: 1.5;
        }

        .dc-log-entry.info { border-left-color: #3b82f6; }
        .dc-log-entry.success { border-left-color: #10b981; }
        .dc-log-entry.warn { border-left-color: #f59e0b; }
        .dc-log-entry.error { border-left-color: #ef4444; }

        .dc-log-time {
          color: #64748b;
          font-size: 10px;
          margin-right: 8px;
        }

        .dc-log-type {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 10px;
          margin-right: 8px;
        }

        .dc-log-entry.info .dc-log-type { color: #3b82f6; }
        .dc-log-entry.success .dc-log-type { color: #10b981; }
        .dc-log-entry.warn .dc-log-type { color: #f59e0b; }
        .dc-log-entry.error .dc-log-type { color: #ef4444; }

        .dc-data-section {
          margin-bottom: 16px;
        }

        .dc-data-title {
          font-weight: 600;
          color: #a5b4fc;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dc-data-count {
          background: rgba(99, 102, 241, 0.3);
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 10px;
        }

        .dc-data-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .dc-data-card {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          padding: 12px;
          text-align: center;
        }

        .dc-data-value {
          font-size: 24px;
          font-weight: 700;
          color: #fff;
        }

        .dc-data-label {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 4px;
        }

        .dc-image-preview {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 8px;
        }

        .dc-image-thumb {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          object-fit: cover;
          border: 2px solid rgba(99, 102, 241, 0.3);
        }

        .dc-json-view {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(99, 102, 241, 0.2);
          border-radius: 8px;
          padding: 12px;
          font-size: 10px;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .dc-close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(239, 68, 68, 0.2);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s;
        }

        .dc-close-btn:hover {
          background: rgba(239, 68, 68, 0.4);
          color: #fff;
        }

        .dc-status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: dc-pulse 2s infinite;
        }

        @keyframes dc-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .dc-debug-footer {
          padding: 12px 16px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #64748b;
        }
      </style>

      <div class="dc-debug-header">
        <div class="dc-debug-title">
          <span class="dc-status-indicator"></span>
          Drop Craft Debug
          <span class="dc-debug-badge">v4.3</span>
        </div>
        <button class="dc-close-btn" id="dc-close-debug">×</button>
      </div>

      <div class="dc-debug-tabs">
        <button class="dc-debug-tab active" data-tab="logs">📋 Logs</button>
        <button class="dc-debug-tab" data-tab="data">📊 Data</button>
        <button class="dc-debug-tab" data-tab="network">🌐 Network</button>
        <button class="dc-debug-tab" data-tab="raw">🔧 Raw</button>
      </div>

      <div class="dc-debug-content" id="dc-debug-content">
        <!-- Content loaded dynamically -->
      </div>

      <div class="dc-debug-footer">
        <span>Appuyez sur <kbd>Ctrl+Shift+D</kbd> pour toggle</span>
        <div class="dc-debug-controls">
          <button class="dc-debug-btn" id="dc-clear-logs">Clear</button>
          <button class="dc-debug-btn" id="dc-export-logs">Export</button>
          <button class="dc-debug-btn primary" id="dc-test-extract">Test Extract</button>
        </div>
      </div>
    `;

    document.body.appendChild(panel);
    this.panelElement = panel;
    this.setupEventListeners();
    this.renderLogs();
  }

  // Setup event listeners
  setupEventListeners() {
    // Close button
    document.getElementById('dc-close-debug')?.addEventListener('click', () => this.hide());

    // Tab switching
    document.querySelectorAll('.dc-debug-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        document.querySelectorAll('.dc-debug-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.renderTab(e.target.dataset.tab);
      });
    });

    // Control buttons
    document.getElementById('dc-clear-logs')?.addEventListener('click', () => {
      this.logs = [];
      this.renderLogs();
    });

    document.getElementById('dc-export-logs')?.addEventListener('click', () => this.exportLogs());
    document.getElementById('dc-test-extract')?.addEventListener('click', () => this.testExtraction());
  }

  // Setup keyboard shortcut (Ctrl+Shift+D)
  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  // Intercept console for logging
  interceptConsole() {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (...args) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (msg.includes('[DropCraft]') || msg.includes('[DC]')) {
        this.log('info', msg);
      }
      originalLog.apply(console, args);
    };

    console.warn = (...args) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (msg.includes('[DropCraft]') || msg.includes('[DC]')) {
        this.log('warn', msg);
      }
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      if (msg.includes('[DropCraft]') || msg.includes('[DC]')) {
        this.log('error', msg);
      }
      originalError.apply(console, args);
    };
  }

  // Log message
  log(type, message) {
    this.logs.unshift({
      type,
      message,
      timestamp: new Date().toISOString()
    });

    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    if (this.isVisible && document.querySelector('.dc-debug-tab.active')?.dataset.tab === 'logs') {
      this.renderLogs();
    }
  }

  // Store extracted data
  setExtractedData(data) {
    this.extractedData = data;
    this.log('success', `Data extracted: ${data.title?.substring(0, 30)}...`);
    
    if (this.isVisible) {
      const activeTab = document.querySelector('.dc-debug-tab.active')?.dataset.tab;
      if (activeTab === 'data' || activeTab === 'raw') {
        this.renderTab(activeTab);
      }
    }
  }

  // Render logs tab
  renderLogs() {
    const content = document.getElementById('dc-debug-content');
    if (!content) return;

    if (this.logs.length === 0) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <div style="font-size: 32px; margin-bottom: 16px;">📋</div>
          <div>Aucun log pour le moment</div>
          <div style="font-size: 10px; margin-top: 8px;">Les logs apparaîtront ici lors des actions</div>
        </div>
      `;
      return;
    }

    content.innerHTML = this.logs.map(log => `
      <div class="dc-log-entry ${log.type}">
        <span class="dc-log-time">${new Date(log.timestamp).toLocaleTimeString()}</span>
        <span class="dc-log-type">${log.type}</span>
        <span class="dc-log-message">${this.escapeHtml(log.message)}</span>
      </div>
    `).join('');
  }

  // Render data tab
  renderData() {
    const content = document.getElementById('dc-debug-content');
    if (!content) return;

    if (!this.extractedData) {
      content.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #64748b;">
          <div style="font-size: 32px; margin-bottom: 16px;">📊</div>
          <div>Aucune donnée extraite</div>
          <div style="font-size: 10px; margin-top: 8px;">Cliquez sur "Test Extract" pour extraire les données de cette page</div>
        </div>
      `;
      return;
    }

    const data = this.extractedData;
    const images = data.images || data.imageUrls || [];
    const videos = data.videos || data.videoUrls || [];

    content.innerHTML = `
      <div class="dc-data-section">
        <div class="dc-data-title">📈 Résumé</div>
        <div class="dc-data-grid">
          <div class="dc-data-card">
            <div class="dc-data-value">${images.length}</div>
            <div class="dc-data-label">Images</div>
          </div>
          <div class="dc-data-card">
            <div class="dc-data-value">${videos.length}</div>
            <div class="dc-data-label">Vidéos</div>
          </div>
          <div class="dc-data-card">
            <div class="dc-data-value">${(data.variants || []).length}</div>
            <div class="dc-data-label">Variantes</div>
          </div>
        </div>
      </div>

      <div class="dc-data-section">
        <div class="dc-data-title">📦 Produit</div>
        <div class="dc-json-view">
<strong>Titre:</strong> ${this.escapeHtml(data.title || data.name || 'N/A')}
<strong>Prix:</strong> ${data.price || 'N/A'}
<strong>Prix original:</strong> ${data.originalPrice || data.comparePrice || 'N/A'}
<strong>Marque:</strong> ${data.brand || 'N/A'}
<strong>SKU:</strong> ${data.sku || data.mpn || 'N/A'}
<strong>Stock:</strong> ${data.stockStatus || data.inStock ? 'En stock' : 'Rupture'}
<strong>Catégorie:</strong> ${data.category || 'N/A'}
<strong>Rating:</strong> ${data.rating || 'N/A'} ⭐
<strong>Commandes:</strong> ${data.orders || data.sold || 'N/A'}
        </div>
      </div>

      ${images.length > 0 ? `
        <div class="dc-data-section">
          <div class="dc-data-title">🖼️ Images <span class="dc-data-count">${images.length}</span></div>
          <div class="dc-image-preview">
            ${images.slice(0, 8).map(img => `<img src="${img}" class="dc-image-thumb" onerror="this.style.display='none'">`).join('')}
            ${images.length > 8 ? `<div class="dc-data-card" style="width:60px;height:60px;display:flex;align-items:center;justify-content:center;">+${images.length - 8}</div>` : ''}
          </div>
        </div>
      ` : ''}
    `;
  }

  // Render network tab
  renderNetwork() {
    const content = document.getElementById('dc-debug-content');
    if (!content) return;

    content.innerHTML = `
      <div class="dc-data-section">
        <div class="dc-data-title">🌐 Configuration Réseau</div>
        <div class="dc-json-view">
<strong>API URL:</strong> https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1
<strong>Endpoint:</strong> /extension-sync-realtime
<strong>Méthode:</strong> POST
<strong>Headers:</strong>
  - Content-Type: application/json
  - x-extension-token: [stored token]
        </div>
      </div>

      <div class="dc-data-section">
        <div class="dc-data-title">🔑 Statut Authentification</div>
        <div id="dc-auth-status" class="dc-json-view">Chargement...</div>
      </div>

      <div class="dc-data-section">
        <div class="dc-debug-controls" style="justify-content: center;">
          <button class="dc-debug-btn primary" id="dc-test-connection">Tester Connexion</button>
        </div>
      </div>
    `;

    // Check auth status
    this.checkAuthStatus();

    // Test connection button
    document.getElementById('dc-test-connection')?.addEventListener('click', () => this.testConnection());
  }

  // Render raw JSON tab
  renderRaw() {
    const content = document.getElementById('dc-debug-content');
    if (!content) return;

    content.innerHTML = `
      <div class="dc-data-section">
        <div class="dc-data-title">🔧 Données Brutes (JSON)</div>
        <div class="dc-json-view">${this.extractedData 
          ? JSON.stringify(this.extractedData, null, 2) 
          : 'Aucune donnée extraite. Cliquez sur "Test Extract".'}</div>
      </div>

      <div class="dc-data-section">
        <div class="dc-debug-controls">
          <button class="dc-debug-btn" id="dc-copy-raw">📋 Copier JSON</button>
        </div>
      </div>
    `;

    document.getElementById('dc-copy-raw')?.addEventListener('click', () => {
      if (this.extractedData) {
        navigator.clipboard.writeText(JSON.stringify(this.extractedData, null, 2));
        this.log('success', 'JSON copié dans le presse-papiers');
      }
    });
  }

  // Render tab by name
  renderTab(tab) {
    switch (tab) {
      case 'logs': this.renderLogs(); break;
      case 'data': this.renderData(); break;
      case 'network': this.renderNetwork(); break;
      case 'raw': this.renderRaw(); break;
    }
  }

  // Check auth status
  async checkAuthStatus() {
    const statusEl = document.getElementById('dc-auth-status');
    if (!statusEl) return;

    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['extensionToken', 'tokenExpiry', 'userId'], resolve);
      });

      if (result.extensionToken) {
        statusEl.innerHTML = `
<strong>✅ Connecté</strong>
Token: ${result.extensionToken.substring(0, 20)}...
Expiration: ${result.tokenExpiry ? new Date(result.tokenExpiry).toLocaleDateString() : 'N/A'}
User ID: ${result.userId || 'N/A'}
        `;
      } else {
        statusEl.innerHTML = `<strong>❌ Non connecté</strong>\nAucun token trouvé dans le stockage local.`;
      }
    } catch (e) {
      statusEl.innerHTML = `<strong>⚠️ Erreur</strong>\n${e.message}`;
    }
  }

  // Test API connection
  async testConnection() {
    this.log('info', 'Testing API connection...');

    try {
      const { extensionToken } = await new Promise((resolve) => {
        chrome.storage.local.get(['extensionToken'], resolve);
      });

      if (!extensionToken) {
        this.log('error', 'No token found - please login first');
        return;
      }

      const response = await fetch('https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/extension-sync-realtime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': extensionToken
        },
        body: JSON.stringify({ action: 'sync_status' })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.log('success', `Connection OK! Today imports: ${data.todayStats?.imports || 0}`);
      } else {
        this.log('error', `Connection failed: ${data.error || response.status}`);
      }
    } catch (e) {
      this.log('error', `Connection error: ${e.message}`);
    }
  }

  // Test extraction on current page
  async testExtraction() {
    this.log('info', 'Starting extraction test...');

    try {
      // Try to use the global scraper if available
      if (window.DropCraftScraper) {
        const data = await window.DropCraftScraper.scrape();
        this.setExtractedData(data);
        this.renderTab('data');
        document.querySelectorAll('.dc-debug-tab').forEach(t => t.classList.remove('active'));
        document.querySelector('.dc-debug-tab[data-tab="data"]')?.classList.add('active');
      } else {
        this.log('warn', 'DropCraftScraper not available - running basic extraction');
        const basicData = this.basicExtraction();
        this.setExtractedData(basicData);
        this.renderTab('data');
      }
    } catch (e) {
      this.log('error', `Extraction failed: ${e.message}`);
    }
  }

  // Basic extraction fallback
  basicExtraction() {
    const data = {
      url: window.location.href,
      title: document.querySelector('h1')?.textContent?.trim() || document.title,
      images: [],
      price: null,
      platform: this.detectPlatform()
    };

    // Extract images
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.dataset.src;
      if (src && src.startsWith('http') && !src.includes('sprite') && !src.includes('logo')) {
        data.images.push(src);
      }
    });

    // Extract price
    const pricePatterns = ['[class*="price"]', '[data-price]', '.price', '#price'];
    for (const pattern of pricePatterns) {
      const el = document.querySelector(pattern);
      if (el) {
        data.price = el.textContent?.trim();
        break;
      }
    }

    return data;
  }

  // Detect current platform
  detectPlatform() {
    const url = window.location.hostname;
    if (url.includes('aliexpress')) return 'AliExpress';
    if (url.includes('amazon')) return 'Amazon';
    if (url.includes('temu')) return 'Temu';
    if (url.includes('cdiscount')) return 'Cdiscount';
    if (url.includes('fnac')) return 'Fnac';
    if (window.Shopify) return 'Shopify';
    return 'Unknown';
  }

  // Export logs
  exportLogs() {
    const exportData = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      platform: this.detectPlatform(),
      logs: this.logs,
      extractedData: this.extractedData
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dropcraft-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    this.log('success', 'Logs exported successfully');
  }

  // Escape HTML for safe display
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Show panel
  show() {
    this.panelElement?.classList.add('visible');
    this.isVisible = true;
  }

  // Hide panel
  hide() {
    this.panelElement?.classList.remove('visible');
    this.isVisible = false;
  }

  // Toggle panel
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }
}

// Initialize debug panel
window.DropCraftDebug = new DropCraftDebugPanel();
window.DropCraftDebug.init();

console.log('[DropCraft] Debug panel loaded - Press Ctrl+Shift+D to toggle');
