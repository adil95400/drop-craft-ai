/**
 * ShopOpti+ History Panel v5.7.0
 * Visual import history, error logs, and activity tracking
 */

const HistoryPanel = {
  VERSION: '5.7.0',
  
  /**
   * Create history panel HTML
   */
  createPanel() {
    const panel = document.createElement('div');
    panel.id = 'sho-history-panel';
    panel.className = 'sho-history-panel hidden';
    panel.innerHTML = `
      <div class="sho-panel-header">
        <div class="sho-panel-title">
          <span class="sho-panel-icon">📋</span>
          <span>Historique & Logs</span>
        </div>
        <button class="sho-panel-close" id="shoCloseHistory">×</button>
      </div>
      
      <div class="sho-panel-tabs">
        <button class="sho-tab active" data-tab="imports">Imports</button>
        <button class="sho-tab" data-tab="errors">Erreurs</button>
        <button class="sho-tab" data-tab="activity">Activité</button>
      </div>
      
      <div class="sho-panel-content">
        <div class="sho-tab-content active" id="shoImportsTab">
          <div class="sho-history-stats">
            <div class="sho-stat"><span id="shoTotalImports">0</span><label>Total</label></div>
            <div class="sho-stat success"><span id="shoSuccessImports">0</span><label>Réussis</label></div>
            <div class="sho-stat error"><span id="shoFailedImports">0</span><label>Échoués</label></div>
          </div>
          <div class="sho-history-list" id="shoImportsList"></div>
        </div>
        
        <div class="sho-tab-content" id="shoErrorsTab">
          <div class="sho-history-list" id="shoErrorsList"></div>
        </div>
        
        <div class="sho-tab-content" id="shoActivityTab">
          <div class="sho-history-list" id="shoActivityList"></div>
        </div>
      </div>
      
      <div class="sho-panel-actions">
        <button class="sho-btn-secondary" id="shoExportHistory">📥 Exporter CSV</button>
        <button class="sho-btn-danger" id="shoClearHistory">🗑️ Effacer</button>
      </div>
    `;
    
    this.addStyles();
    document.body.appendChild(panel);
    this.bindEvents(panel);
    return panel;
  },
  
  addStyles() {
    if (document.getElementById('sho-history-styles')) return;
    const style = document.createElement('style');
    style.id = 'sho-history-styles';
    style.textContent = `
      .sho-history-panel{position:fixed;top:50%;right:20px;transform:translateY(-50%);width:380px;max-height:80vh;background:#1a1a2e;border-radius:16px;box-shadow:0 25px 50px rgba(0,0,0,0.5);z-index:999998;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#fff;overflow:hidden}
      .sho-history-panel.hidden{display:none}
      .sho-panel-header{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.1)}
      .sho-panel-title{display:flex;align-items:center;gap:10px;font-weight:600;font-size:16px}
      .sho-panel-icon{font-size:20px}
      .sho-panel-close{background:none;border:none;color:#888;font-size:24px;cursor:pointer;padding:0;line-height:1}
      .sho-panel-close:hover{color:#fff}
      .sho-panel-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,0.1)}
      .sho-tab{flex:1;padding:12px;background:none;border:none;color:#888;font-size:13px;cursor:pointer;transition:all 0.2s}
      .sho-tab.active{color:#a855f7;border-bottom:2px solid #a855f7}
      .sho-tab:hover{color:#fff}
      .sho-panel-content{max-height:400px;overflow-y:auto}
      .sho-tab-content{display:none;padding:16px}
      .sho-tab-content.active{display:block}
      .sho-history-stats{display:flex;gap:12px;margin-bottom:16px}
      .sho-stat{flex:1;text-align:center;padding:12px;background:rgba(255,255,255,0.05);border-radius:10px}
      .sho-stat span{display:block;font-size:24px;font-weight:700}
      .sho-stat label{font-size:11px;color:#888}
      .sho-stat.success span{color:#10b981}
      .sho-stat.error span{color:#ef4444}
      .sho-history-list{display:flex;flex-direction:column;gap:8px}
      .sho-history-item{padding:12px;background:rgba(255,255,255,0.05);border-radius:10px;border-left:3px solid #a855f7}
      .sho-history-item.error{border-left-color:#ef4444}
      .sho-history-item.success{border-left-color:#10b981}
      .sho-item-title{font-size:13px;font-weight:500;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .sho-item-meta{display:flex;justify-content:space-between;font-size:11px;color:#888}
      .sho-panel-actions{display:flex;gap:10px;padding:16px;border-top:1px solid rgba(255,255,255,0.1)}
      .sho-btn-secondary{flex:1;padding:10px;background:rgba(255,255,255,0.1);border:none;border-radius:8px;color:#fff;font-size:12px;cursor:pointer}
      .sho-btn-danger{flex:1;padding:10px;background:rgba(239,68,68,0.2);border:none;border-radius:8px;color:#ef4444;font-size:12px;cursor:pointer}
      .sho-empty{text-align:center;padding:40px;color:#666}
    `;
    document.head.appendChild(style);
  },
  
  bindEvents(panel) {
    panel.querySelector('#shoCloseHistory').onclick = () => panel.classList.add('hidden');
    panel.querySelectorAll('.sho-tab').forEach(tab => {
      tab.onclick = () => {
        panel.querySelectorAll('.sho-tab').forEach(t => t.classList.remove('active'));
        panel.querySelectorAll('.sho-tab-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        panel.querySelector(`#sho${tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)}Tab`).classList.add('active');
      };
    });
    panel.querySelector('#shoClearHistory').onclick = () => this.clearHistory();
    panel.querySelector('#shoExportHistory').onclick = () => this.exportHistory();
  },
  
  async loadHistory() {
    if (typeof chrome === 'undefined') return;
    const { importHistory = [], activities = [] } = await chrome.storage.local.get(['importHistory', 'activities']);
    
    const imports = importHistory.slice(0, 50);
    const errors = importHistory.filter(i => i.status === 'failed' || i.status === 'error').slice(0, 30);
    
    document.getElementById('shoTotalImports').textContent = importHistory.length;
    document.getElementById('shoSuccessImports').textContent = importHistory.filter(i => i.status === 'completed').length;
    document.getElementById('shoFailedImports').textContent = errors.length;
    
    document.getElementById('shoImportsList').innerHTML = imports.length ? imports.map(i => `
      <div class="sho-history-item ${i.status === 'completed' ? 'success' : i.status === 'failed' ? 'error' : ''}">
        <div class="sho-item-title">${i.title || 'Produit'}</div>
        <div class="sho-item-meta"><span>${i.platform || '-'}</span><span>${new Date(i.timestamp).toLocaleDateString()}</span></div>
      </div>
    `).join('') : '<div class="sho-empty">Aucun import</div>';
    
    document.getElementById('shoErrorsList').innerHTML = errors.length ? errors.map(e => `
      <div class="sho-history-item error">
        <div class="sho-item-title">${e.error || 'Erreur inconnue'}</div>
        <div class="sho-item-meta"><span>${e.title || '-'}</span><span>${new Date(e.timestamp).toLocaleDateString()}</span></div>
      </div>
    `).join('') : '<div class="sho-empty">Aucune erreur</div>';
    
    document.getElementById('shoActivityList').innerHTML = activities.length ? activities.slice(0, 30).map(a => `
      <div class="sho-history-item">
        <div class="sho-item-title">${a.action}</div>
        <div class="sho-item-meta"><span>${JSON.stringify(a.details || {}).substring(0, 30)}</span><span>${new Date(a.timestamp).toLocaleTimeString()}</span></div>
      </div>
    `).join('') : '<div class="sho-empty">Aucune activité</div>';
  },
  
  async clearHistory() {
    if (confirm('Effacer tout l\'historique ?')) {
      await chrome.storage.local.set({ importHistory: [], activities: [] });
      this.loadHistory();
    }
  },
  
  exportHistory() {
    if (typeof ShopOptiHistoryManager !== 'undefined' && ShopOptiHistoryManager.exportToCSV) {
      ShopOptiHistoryManager.exportToCSV();
    }
  },
  
  show() {
    let panel = document.getElementById('sho-history-panel');
    if (!panel) panel = this.createPanel();
    panel.classList.remove('hidden');
    this.loadHistory();
  },
  
  hide() {
    const panel = document.getElementById('sho-history-panel');
    if (panel) panel.classList.add('hidden');
  }
};

if (typeof window !== 'undefined') window.ShopOptiHistoryPanel = HistoryPanel;
