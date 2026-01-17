/**
 * DropCraft - Optimiseur d'Images Avancé
 * Compression, redimensionnement et conversion WebP automatique
 */

class DropCraftImageOptimizer {
  constructor() {
    this.settings = {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
      format: 'webp',
      autoOptimize: true,
      removeBackground: false,
      addWatermark: false,
      watermarkText: ''
    };
    this.queue = [];
    this.processing = false;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.injectStyles();
    this.createOptimizerPanel();
    this.bindEvents();
    console.log('🖼️ DropCraft Image Optimizer initialisé');
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get('dc_image_settings');
      if (result.dc_image_settings) {
        this.settings = { ...this.settings, ...result.dc_image_settings };
      }
    } catch (e) {
      console.log('Using default image settings');
    }
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({ dc_image_settings: this.settings });
    } catch (e) {
      console.error('Error saving image settings:', e);
    }
  }

  injectStyles() {
    if (document.getElementById('dropcraft-image-optimizer-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'dropcraft-image-optimizer-styles';
    styles.textContent = `
      .dc-img-optimizer-btn {
        position: fixed;
        bottom: 160px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
        z-index: 999994;
        transition: all 0.3s ease;
      }

      .dc-img-optimizer-btn:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(245, 158, 11, 0.5);
      }

      .dc-img-optimizer-panel {
        position: fixed;
        bottom: 220px;
        right: 20px;
        width: 400px;
        max-height: 550px;
        background: linear-gradient(180deg, #1a1f2e 0%, #0f1419 100%);
        border-radius: 16px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        z-index: 999995;
        display: none;
        flex-direction: column;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      .dc-img-optimizer-panel.open {
        display: flex;
        animation: dc-img-slide-in 0.3s ease;
      }

      @keyframes dc-img-slide-in {
        from {
          opacity: 0;
          transform: translateY(20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .dc-img-header {
        padding: 20px;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }

      .dc-img-header h3 {
        margin: 0 0 8px 0;
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .dc-img-header p {
        margin: 0;
        font-size: 13px;
        opacity: 0.9;
      }

      .dc-img-close {
        position: absolute;
        top: 15px;
        right: 15px;
        background: rgba(255, 255, 255, 0.2);
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        color: white;
        cursor: pointer;
        font-size: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }

      .dc-img-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .dc-img-tabs {
        display: flex;
        background: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .dc-img-tab {
        flex: 1;
        padding: 12px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 2px solid transparent;
      }

      .dc-img-tab:hover {
        color: white;
        background: rgba(255, 255, 255, 0.02);
      }

      .dc-img-tab.active {
        color: #f59e0b;
        border-bottom-color: #f59e0b;
      }

      .dc-img-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }

      .dc-img-tab-content {
        display: none;
      }

      .dc-img-tab-content.active {
        display: block;
      }

      /* Dropzone */
      .dc-img-dropzone {
        border: 2px dashed rgba(245, 158, 11, 0.3);
        border-radius: 12px;
        padding: 30px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        background: rgba(245, 158, 11, 0.05);
        margin-bottom: 16px;
      }

      .dc-img-dropzone:hover,
      .dc-img-dropzone.dragover {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }

      .dc-img-dropzone-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }

      .dc-img-dropzone-text {
        color: rgba(255, 255, 255, 0.7);
        font-size: 14px;
        margin-bottom: 8px;
      }

      .dc-img-dropzone-hint {
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
      }

      /* Queue */
      .dc-img-queue {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .dc-img-queue-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
      }

      .dc-img-queue-thumb {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        object-fit: cover;
        background: rgba(0, 0, 0, 0.3);
      }

      .dc-img-queue-info {
        flex: 1;
        min-width: 0;
      }

      .dc-img-queue-name {
        color: white;
        font-size: 13px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
      }

      .dc-img-queue-size {
        color: rgba(255, 255, 255, 0.5);
        font-size: 11px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .dc-img-queue-savings {
        color: #10b981;
        font-weight: 600;
      }

      .dc-img-queue-status {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      }

      .dc-img-queue-status.pending {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.5);
      }

      .dc-img-queue-status.processing {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        animation: dc-spin 1s linear infinite;
      }

      .dc-img-queue-status.done {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }

      .dc-img-queue-status.error {
        background: rgba(239, 68, 68, 0.2);
        color: #ef4444;
      }

      @keyframes dc-spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      /* Settings */
      .dc-img-setting {
        margin-bottom: 18px;
      }

      .dc-img-setting-label {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .dc-img-setting-label span {
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
      }

      .dc-img-setting-value {
        color: #f59e0b;
        font-size: 12px;
        font-weight: 600;
      }

      .dc-img-slider {
        width: 100%;
        height: 6px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.1);
        -webkit-appearance: none;
        cursor: pointer;
      }

      .dc-img-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
      }

      .dc-img-select {
        width: 100%;
        padding: 10px 14px;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        color: white;
        font-size: 13px;
        cursor: pointer;
      }

      .dc-img-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .dc-img-toggle-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 13px;
      }

      .dc-img-toggle-switch {
        position: relative;
        width: 44px;
        height: 24px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      .dc-img-toggle-switch.active {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      }

      .dc-img-toggle-switch::after {
        content: '';
        position: absolute;
        top: 2px;
        left: 2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: white;
        transition: all 0.3s ease;
      }

      .dc-img-toggle-switch.active::after {
        left: 22px;
      }

      /* Actions */
      .dc-img-actions {
        padding: 16px;
        background: rgba(0, 0, 0, 0.2);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        gap: 10px;
      }

      .dc-img-action-btn {
        flex: 1;
        padding: 12px;
        border-radius: 10px;
        border: none;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .dc-img-action-btn.primary {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: white;
      }

      .dc-img-action-btn.primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
      }

      .dc-img-action-btn.secondary {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.8);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .dc-img-action-btn.secondary:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      /* Stats */
      .dc-img-stats {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-bottom: 16px;
      }

      .dc-img-stat {
        padding: 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 10px;
        text-align: center;
      }

      .dc-img-stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #f59e0b;
        margin-bottom: 4px;
      }

      .dc-img-stat-label {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.6);
        text-transform: uppercase;
      }

      /* Presets */
      .dc-img-presets {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 16px;
      }

      .dc-img-preset {
        padding: 14px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: center;
      }

      .dc-img-preset:hover {
        border-color: rgba(245, 158, 11, 0.3);
        background: rgba(245, 158, 11, 0.05);
      }

      .dc-img-preset.active {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
      }

      .dc-img-preset-icon {
        font-size: 24px;
        margin-bottom: 6px;
      }

      .dc-img-preset-name {
        color: white;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 2px;
      }

      .dc-img-preset-desc {
        color: rgba(255, 255, 255, 0.5);
        font-size: 10px;
      }

      /* Progress */
      .dc-img-progress-bar {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        margin-top: 8px;
        overflow: hidden;
      }

      .dc-img-progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #f59e0b, #d97706);
        border-radius: 2px;
        transition: width 0.3s ease;
      }
    `;
    document.head.appendChild(styles);
  }

  createOptimizerPanel() {
    // Trigger button
    const trigger = document.createElement('button');
    trigger.className = 'dc-img-optimizer-btn';
    trigger.innerHTML = '🖼️';
    trigger.title = 'Optimiseur d\'images';
    document.body.appendChild(trigger);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'dc-img-optimizer-panel';
    panel.innerHTML = `
      <div class="dc-img-header">
        <button class="dc-img-close">✕</button>
        <h3>🖼️ Optimiseur d'Images</h3>
        <p>Compressez et optimisez vos images produits</p>
      </div>

      <div class="dc-img-tabs">
        <button class="dc-img-tab active" data-tab="optimize">Optimiser</button>
        <button class="dc-img-tab" data-tab="settings">Paramètres</button>
        <button class="dc-img-tab" data-tab="stats">Statistiques</button>
      </div>

      <div class="dc-img-content">
        <!-- Optimize Tab -->
        <div class="dc-img-tab-content active" id="dc-img-optimize">
          <div class="dc-img-presets">
            <div class="dc-img-preset active" data-preset="ecommerce">
              <div class="dc-img-preset-icon">🛒</div>
              <div class="dc-img-preset-name">E-commerce</div>
              <div class="dc-img-preset-desc">1200px, 85% qualité</div>
            </div>
            <div class="dc-img-preset" data-preset="social">
              <div class="dc-img-preset-icon">📱</div>
              <div class="dc-img-preset-name">Social Media</div>
              <div class="dc-img-preset-desc">1080px, 90% qualité</div>
            </div>
            <div class="dc-img-preset" data-preset="thumbnail">
              <div class="dc-img-preset-icon">🔍</div>
              <div class="dc-img-preset-name">Miniatures</div>
              <div class="dc-img-preset-desc">400px, 80% qualité</div>
            </div>
            <div class="dc-img-preset" data-preset="custom">
              <div class="dc-img-preset-icon">⚙️</div>
              <div class="dc-img-preset-name">Personnalisé</div>
              <div class="dc-img-preset-desc">Paramètres custom</div>
            </div>
          </div>

          <div class="dc-img-dropzone" id="dc-img-dropzone">
            <div class="dc-img-dropzone-icon">📂</div>
            <div class="dc-img-dropzone-text">Glissez vos images ici</div>
            <div class="dc-img-dropzone-hint">ou cliquez pour sélectionner (max 10 Mo)</div>
            <input type="file" id="dc-img-input" multiple accept="image/*" style="display: none;">
          </div>

          <div class="dc-img-queue" id="dc-img-queue">
            <!-- Queue items will be added here -->
          </div>
        </div>

        <!-- Settings Tab -->
        <div class="dc-img-tab-content" id="dc-img-settings">
          <div class="dc-img-setting">
            <div class="dc-img-setting-label">
              <span>Largeur max</span>
              <span class="dc-img-setting-value" id="dc-width-value">${this.settings.maxWidth}px</span>
            </div>
            <input type="range" class="dc-img-slider" id="dc-img-width" min="400" max="2400" step="100" value="${this.settings.maxWidth}">
          </div>

          <div class="dc-img-setting">
            <div class="dc-img-setting-label">
              <span>Qualité</span>
              <span class="dc-img-setting-value" id="dc-quality-value">${this.settings.quality}%</span>
            </div>
            <input type="range" class="dc-img-slider" id="dc-img-quality" min="50" max="100" step="5" value="${this.settings.quality}">
          </div>

          <div class="dc-img-setting">
            <div class="dc-img-setting-label">
              <span>Format de sortie</span>
            </div>
            <select class="dc-img-select" id="dc-img-format">
              <option value="webp" ${this.settings.format === 'webp' ? 'selected' : ''}>WebP (recommandé)</option>
              <option value="jpeg" ${this.settings.format === 'jpeg' ? 'selected' : ''}>JPEG</option>
              <option value="png" ${this.settings.format === 'png' ? 'selected' : ''}>PNG</option>
            </select>
          </div>

          <div class="dc-img-toggle">
            <span class="dc-img-toggle-label">Optimisation automatique à l'import</span>
            <div class="dc-img-toggle-switch ${this.settings.autoOptimize ? 'active' : ''}" id="dc-auto-optimize"></div>
          </div>

          <div class="dc-img-toggle">
            <span class="dc-img-toggle-label">Suppression fond (Beta)</span>
            <div class="dc-img-toggle-switch ${this.settings.removeBackground ? 'active' : ''}" id="dc-remove-bg"></div>
          </div>

          <div class="dc-img-toggle">
            <span class="dc-img-toggle-label">Ajouter filigrane</span>
            <div class="dc-img-toggle-switch ${this.settings.addWatermark ? 'active' : ''}" id="dc-watermark"></div>
          </div>
        </div>

        <!-- Stats Tab -->
        <div class="dc-img-tab-content" id="dc-img-stats">
          <div class="dc-img-stats">
            <div class="dc-img-stat">
              <div class="dc-img-stat-value" id="dc-stat-total">0</div>
              <div class="dc-img-stat-label">Images optimisées</div>
            </div>
            <div class="dc-img-stat">
              <div class="dc-img-stat-value" id="dc-stat-saved">0 Mo</div>
              <div class="dc-img-stat-label">Espace économisé</div>
            </div>
            <div class="dc-img-stat">
              <div class="dc-img-stat-value" id="dc-stat-avg">0%</div>
              <div class="dc-img-stat-label">Réduction moyenne</div>
            </div>
            <div class="dc-img-stat">
              <div class="dc-img-stat-value" id="dc-stat-webp">0</div>
              <div class="dc-img-stat-label">Conversions WebP</div>
            </div>
          </div>

          <div style="text-align: center; color: rgba(255, 255, 255, 0.5); font-size: 12px; padding: 20px;">
            📊 Statistiques basées sur votre utilisation de l'optimiseur
          </div>
        </div>
      </div>

      <div class="dc-img-actions">
        <button class="dc-img-action-btn secondary" id="dc-img-clear">🗑️ Vider</button>
        <button class="dc-img-action-btn primary" id="dc-img-process">⚡ Optimiser</button>
      </div>
    `;
    document.body.appendChild(panel);

    this.trigger = trigger;
    this.panel = panel;
  }

  bindEvents() {
    // Toggle panel
    this.trigger.addEventListener('click', () => this.toggle());
    
    // Close button
    this.panel.querySelector('.dc-img-close').addEventListener('click', () => this.close());

    // Tabs
    this.panel.querySelectorAll('.dc-img-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    // Presets
    this.panel.querySelectorAll('.dc-img-preset').forEach(preset => {
      preset.addEventListener('click', () => this.applyPreset(preset.dataset.preset));
    });

    // Dropzone
    const dropzone = this.panel.querySelector('#dc-img-dropzone');
    const fileInput = this.panel.querySelector('#dc-img-input');

    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });

    fileInput.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
    });

    // Settings
    const widthSlider = this.panel.querySelector('#dc-img-width');
    widthSlider.addEventListener('input', (e) => {
      this.settings.maxWidth = parseInt(e.target.value);
      this.panel.querySelector('#dc-width-value').textContent = `${this.settings.maxWidth}px`;
      this.saveSettings();
    });

    const qualitySlider = this.panel.querySelector('#dc-img-quality');
    qualitySlider.addEventListener('input', (e) => {
      this.settings.quality = parseInt(e.target.value);
      this.panel.querySelector('#dc-quality-value').textContent = `${this.settings.quality}%`;
      this.saveSettings();
    });

    const formatSelect = this.panel.querySelector('#dc-img-format');
    formatSelect.addEventListener('change', (e) => {
      this.settings.format = e.target.value;
      this.saveSettings();
    });

    // Toggles
    const toggles = ['dc-auto-optimize', 'dc-remove-bg', 'dc-watermark'];
    const settingKeys = ['autoOptimize', 'removeBackground', 'addWatermark'];
    
    toggles.forEach((id, index) => {
      this.panel.querySelector(`#${id}`).addEventListener('click', (e) => {
        e.target.classList.toggle('active');
        this.settings[settingKeys[index]] = e.target.classList.contains('active');
        this.saveSettings();
      });
    });

    // Actions
    this.panel.querySelector('#dc-img-clear').addEventListener('click', () => this.clearQueue());
    this.panel.querySelector('#dc-img-process').addEventListener('click', () => this.processQueue());
  }

  switchTab(tabId) {
    this.panel.querySelectorAll('.dc-img-tab').forEach(t => t.classList.remove('active'));
    this.panel.querySelectorAll('.dc-img-tab-content').forEach(c => c.classList.remove('active'));
    
    this.panel.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    this.panel.querySelector(`#dc-img-${tabId}`).classList.add('active');

    if (tabId === 'stats') {
      this.updateStats();
    }
  }

  applyPreset(preset) {
    this.panel.querySelectorAll('.dc-img-preset').forEach(p => p.classList.remove('active'));
    this.panel.querySelector(`[data-preset="${preset}"]`).classList.add('active');

    const presets = {
      ecommerce: { maxWidth: 1200, maxHeight: 1200, quality: 85, format: 'webp' },
      social: { maxWidth: 1080, maxHeight: 1080, quality: 90, format: 'jpeg' },
      thumbnail: { maxWidth: 400, maxHeight: 400, quality: 80, format: 'webp' },
      custom: this.settings
    };

    if (preset !== 'custom') {
      Object.assign(this.settings, presets[preset]);
      this.updateSettingsUI();
      this.saveSettings();
    }
  }

  updateSettingsUI() {
    this.panel.querySelector('#dc-img-width').value = this.settings.maxWidth;
    this.panel.querySelector('#dc-width-value').textContent = `${this.settings.maxWidth}px`;
    
    this.panel.querySelector('#dc-img-quality').value = this.settings.quality;
    this.panel.querySelector('#dc-quality-value').textContent = `${this.settings.quality}%`;
    
    this.panel.querySelector('#dc-img-format').value = this.settings.format;
  }

  handleFiles(files) {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > 10 * 1024 * 1024) {
        this.showToast('❌ Fichier trop volumineux', `${file.name} dépasse 10 Mo`);
        return false;
      }
      return true;
    });

    validFiles.forEach(file => this.addToQueue(file));
  }

  addToQueue(file) {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    const item = {
      id,
      file,
      name: file.name,
      originalSize: file.size,
      optimizedSize: null,
      status: 'pending',
      thumbnail: null
    };

    this.queue.push(item);
    this.renderQueue();

    // Generate thumbnail
    const reader = new FileReader();
    reader.onload = (e) => {
      item.thumbnail = e.target.result;
      this.renderQueue();
    };
    reader.readAsDataURL(file);
  }

  renderQueue() {
    const container = this.panel.querySelector('#dc-img-queue');
    
    if (this.queue.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = this.queue.map(item => {
      const statusIcons = {
        pending: '⏳',
        processing: '🔄',
        done: '✅',
        error: '❌'
      };

      let sizeInfo = this.formatSize(item.originalSize);
      if (item.optimizedSize !== null) {
        const savings = Math.round((1 - item.optimizedSize / item.originalSize) * 100);
        sizeInfo = `${this.formatSize(item.originalSize)} → ${this.formatSize(item.optimizedSize)} <span class="dc-img-queue-savings">(-${savings}%)</span>`;
      }

      return `
        <div class="dc-img-queue-item" data-id="${item.id}">
          <img src="${item.thumbnail || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" class="dc-img-queue-thumb" alt="">
          <div class="dc-img-queue-info">
            <div class="dc-img-queue-name">${item.name}</div>
            <div class="dc-img-queue-size">${sizeInfo}</div>
          </div>
          <div class="dc-img-queue-status ${item.status}">
            ${statusIcons[item.status]}
          </div>
        </div>
      `;
    }).join('');
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const pendingItems = this.queue.filter(item => item.status === 'pending');

    for (const item of pendingItems) {
      item.status = 'processing';
      this.renderQueue();

      try {
        const result = await this.optimizeImage(item);
        item.optimizedSize = result.size;
        item.optimizedBlob = result.blob;
        item.status = 'done';
      } catch (error) {
        console.error('Error optimizing image:', error);
        item.status = 'error';
      }

      this.renderQueue();
    }

    this.processing = false;
    this.updateStatistics();
    this.showToast('✅ Optimisation terminée', `${pendingItems.length} images traitées`);
  }

  async optimizeImage(item) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate new dimensions
        let { width, height } = img;
        const maxW = this.settings.maxWidth;
        const maxH = this.settings.maxHeight;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = this.settings.format === 'png' ? 'image/png' : 
                        this.settings.format === 'webp' ? 'image/webp' : 'image/jpeg';
        const quality = this.settings.quality / 100;

        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, size: blob.size });
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, mimeType, quality);
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = item.thumbnail;
    });
  }

  clearQueue() {
    this.queue = [];
    this.renderQueue();
  }

  formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(2) + ' Mo';
  }

  async updateStatistics() {
    try {
      const stats = await this.getStats();
      
      const doneItems = this.queue.filter(i => i.status === 'done');
      stats.total += doneItems.length;
      stats.webpCount += doneItems.filter(i => this.settings.format === 'webp').length;
      
      const savedBytes = doneItems.reduce((sum, item) => {
        return sum + (item.originalSize - (item.optimizedSize || item.originalSize));
      }, 0);
      stats.savedBytes += savedBytes;

      if (doneItems.length > 0) {
        const avgReduction = doneItems.reduce((sum, item) => {
          return sum + (1 - (item.optimizedSize || item.originalSize) / item.originalSize);
        }, 0) / doneItems.length;
        stats.avgReduction = Math.round(avgReduction * 100);
      }

      await chrome.storage.local.set({ dc_image_stats: stats });
    } catch (e) {
      console.error('Error updating stats:', e);
    }
  }

  async getStats() {
    try {
      const result = await chrome.storage.local.get('dc_image_stats');
      return result.dc_image_stats || { total: 0, savedBytes: 0, avgReduction: 0, webpCount: 0 };
    } catch (e) {
      return { total: 0, savedBytes: 0, avgReduction: 0, webpCount: 0 };
    }
  }

  async updateStats() {
    const stats = await this.getStats();
    
    this.panel.querySelector('#dc-stat-total').textContent = stats.total;
    this.panel.querySelector('#dc-stat-saved').textContent = this.formatSize(stats.savedBytes);
    this.panel.querySelector('#dc-stat-avg').textContent = `${stats.avgReduction}%`;
    this.panel.querySelector('#dc-stat-webp').textContent = stats.webpCount;
  }

  showToast(title, message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      padding: 14px 24px;
      border-radius: 10px;
      font-size: 13px;
      z-index: 999999;
      box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
    `;
    toast.innerHTML = `<strong>${title}</strong><br><span style="opacity: 0.9;">${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.panel.classList.add('open');
    this.isOpen = true;
  }

  close() {
    this.panel.classList.remove('open');
    this.isOpen = false;
  }
}

// Initialize
if (!window.DropCraftImageOptimizer) {
  window.DropCraftImageOptimizer = new DropCraftImageOptimizer();
}
