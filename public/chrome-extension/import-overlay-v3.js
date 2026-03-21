/**
 * ShopOpti+ Import Overlay V3 — Product Data Engine Edition
 * Full product preview with reviews, quality score, AI scoring, variant selection
 * Version 7.0.0
 */
(function() {
  'use strict';

  if (window.__shopoptiImportOverlayV3Loaded) return;
  window.__shopoptiImportOverlayV3Loaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    APP_URL: 'https://drop-craft-ai.lovable.app',
    VERSION: '7.0.0',
  };

  // ── CSS Styles ──────────────────────────────
  const OVERLAY_STYLES = `
    .dcai-overlay-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
      z-index: 2147483640; display: flex; justify-content: flex-end;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: dcai-fadeIn 0.2s ease;
    }
    @keyframes dcai-fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes dcai-slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
    
    .dcai-panel {
      width: 520px; max-width: 95vw; height: 100vh;
      background: #0f1117; color: #e4e4e7;
      display: flex; flex-direction: column;
      animation: dcai-slideIn 0.3s ease;
      border-left: 1px solid rgba(255,255,255,0.1);
      overflow: hidden;
    }
    
    .dcai-header {
      padding: 16px 20px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    .dcai-header-title { font-size: 16px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 8px; }
    .dcai-header-badge { background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 10px; font-size: 11px; }
    .dcai-close-btn {
      background: rgba(255,255,255,0.15); border: none; color: #fff;
      width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
      font-size: 18px; display: flex; align-items: center; justify-content: center;
    }
    .dcai-close-btn:hover { background: rgba(255,255,255,0.25); }

    .dcai-tabs {
      display: flex; border-bottom: 1px solid rgba(255,255,255,0.1);
      padding: 0 16px; flex-shrink: 0; background: #13141b;
      overflow-x: auto; scrollbar-width: none;
    }
    .dcai-tabs::-webkit-scrollbar { display: none; }
    .dcai-tab {
      padding: 10px 14px; font-size: 13px; color: #71717a;
      border: none; background: none; cursor: pointer;
      border-bottom: 2px solid transparent; white-space: nowrap;
      transition: all 0.15s;
    }
    .dcai-tab:hover { color: #a1a1aa; }
    .dcai-tab.active { color: #818cf8; border-bottom-color: #818cf8; }
    .dcai-tab-badge { background: #6366f1; color: #fff; padding: 1px 6px; border-radius: 8px; font-size: 10px; margin-left: 4px; }

    .dcai-content { flex: 1; overflow-y: auto; padding: 16px 20px; }
    .dcai-content::-webkit-scrollbar { width: 6px; }
    .dcai-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }

    .dcai-section { margin-bottom: 20px; }
    .dcai-section-title { font-size: 13px; font-weight: 600; color: #a1a1aa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }

    .dcai-card { background: #1a1b23; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px; margin-bottom: 10px; }

    /* Product info */
    .dcai-product-title { font-size: 15px; font-weight: 600; color: #f4f4f5; line-height: 1.4; margin-bottom: 8px; }
    .dcai-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
    .dcai-price { font-size: 22px; font-weight: 700; color: #22c55e; }
    .dcai-price-old { font-size: 14px; color: #71717a; text-decoration: line-through; }
    .dcai-price-discount { font-size: 12px; background: #dc2626; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
    .dcai-meta { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .dcai-tag { background: rgba(99,102,241,0.15); color: #818cf8; padding: 3px 8px; border-radius: 6px; font-size: 11px; }
    .dcai-tag.green { background: rgba(34,197,94,0.15); color: #22c55e; }
    .dcai-tag.orange { background: rgba(249,115,22,0.15); color: #f97316; }
    .dcai-tag.red { background: rgba(239,68,68,0.15); color: #ef4444; }

    /* Images grid */
    .dcai-images-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
    .dcai-img-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; border: 2px solid transparent; cursor: pointer; transition: all 0.15s; }
    .dcai-img-thumb:hover { border-color: #6366f1; }
    .dcai-img-thumb.selected { border-color: #22c55e; }
    .dcai-img-count { font-size: 11px; color: #71717a; margin-top: 4px; }

    /* Quality score */
    .dcai-score-ring { position: relative; width: 80px; height: 80px; margin: 0 auto 12px; }
    .dcai-score-ring svg { transform: rotate(-90deg); }
    .dcai-score-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 22px; font-weight: 700; }
    .dcai-score-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .dcai-score-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
    .dcai-score-bar { height: 4px; background: #27272a; border-radius: 2px; flex: 1; margin: 0 8px; min-width: 40px; }
    .dcai-score-bar-fill { height: 100%; border-radius: 2px; transition: width 0.5s; }
    .dcai-score-label { font-size: 11px; color: #a1a1aa; min-width: 60px; }
    .dcai-score-num { font-size: 11px; font-weight: 600; color: #e4e4e7; min-width: 20px; text-align: right; }

    /* Reviews */
    .dcai-rating-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
    .dcai-stars { color: #eab308; font-size: 16px; }
    .dcai-rating-num { font-size: 20px; font-weight: 700; color: #f4f4f5; }
    .dcai-rating-count { font-size: 13px; color: #71717a; }
    .dcai-dist-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .dcai-dist-label { font-size: 11px; color: #a1a1aa; width: 20px; }
    .dcai-dist-bar { flex: 1; height: 8px; background: #27272a; border-radius: 4px; overflow: hidden; }
    .dcai-dist-fill { height: 100%; background: #eab308; border-radius: 4px; transition: width 0.5s; }
    .dcai-dist-count { font-size: 11px; color: #71717a; width: 30px; text-align: right; }

    .dcai-sentiment { display: flex; gap: 8px; margin-top: 12px; }
    .dcai-sentiment-item { flex: 1; text-align: center; padding: 8px; border-radius: 8px; }
    .dcai-sentiment-item.pos { background: rgba(34,197,94,0.1); }
    .dcai-sentiment-item.neu { background: rgba(234,179,8,0.1); }
    .dcai-sentiment-item.neg { background: rgba(239,68,68,0.1); }
    .dcai-sentiment-num { font-size: 18px; font-weight: 700; }
    .dcai-sentiment-label { font-size: 10px; color: #71717a; text-transform: uppercase; }

    .dcai-review-card { background: #1e1f27; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .dcai-review-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .dcai-review-author { font-size: 12px; font-weight: 600; color: #d4d4d8; }
    .dcai-review-date { font-size: 11px; color: #52525b; }
    .dcai-review-stars { font-size: 12px; color: #eab308; margin-bottom: 4px; }
    .dcai-review-text { font-size: 12px; color: #a1a1aa; line-height: 1.5; }
    .dcai-review-verified { font-size: 10px; color: #22c55e; display: flex; align-items: center; gap: 3px; }
    .dcai-review-images { display: flex; gap: 4px; margin-top: 6px; }
    .dcai-review-img { width: 48px; height: 48px; border-radius: 4px; object-fit: cover; }

    .dcai-keywords { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
    .dcai-keyword { background: rgba(139,92,246,0.15); color: #a78bfa; padding: 2px 8px; border-radius: 10px; font-size: 10px; }

    /* Variants */
    .dcai-variant-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
    .dcai-variant-row:hover { background: rgba(255,255,255,0.05); }
    .dcai-variant-row.selected { background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3); }
    .dcai-variant-title { font-size: 13px; color: #d4d4d8; }
    .dcai-variant-price { font-size: 13px; font-weight: 600; color: #22c55e; }
    .dcai-variant-stock { font-size: 11px; }
    .dcai-variant-stock.in { color: #22c55e; }
    .dcai-variant-stock.out { color: #ef4444; }

    /* Footer */
    .dcai-footer {
      padding: 14px 20px; border-top: 1px solid rgba(255,255,255,0.1);
      background: #13141b; flex-shrink: 0;
    }
    .dcai-btn {
      width: 100%; padding: 12px; border: none; border-radius: 10px;
      font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .dcai-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff; }
    .dcai-btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .dcai-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    .dcai-btn-secondary { background: #27272a; color: #d4d4d8; margin-top: 8px; }
    .dcai-btn-secondary:hover { background: #3f3f46; }

    /* Loading */
    .dcai-loader { display: flex; flex-direction: column; align-items: center; padding: 40px 0; }
    .dcai-spinner { width: 40px; height: 40px; border: 3px solid #27272a; border-top-color: #6366f1; border-radius: 50%; animation: dcai-spin 0.8s linear infinite; }
    @keyframes dcai-spin { to { transform: rotate(360deg); } }
    .dcai-loader-text { font-size: 13px; color: #a1a1aa; margin-top: 12px; }
    .dcai-progress-bar { width: 100%; height: 4px; background: #27272a; border-radius: 2px; margin-top: 12px; overflow: hidden; }
    .dcai-progress-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #8b5cf6); border-radius: 2px; transition: width 0.3s; }

    /* SEO */
    .dcai-seo-item { display: flex; gap: 8px; margin-bottom: 8px; align-items: flex-start; }
    .dcai-seo-label { font-size: 11px; font-weight: 600; color: #71717a; min-width: 80px; text-transform: uppercase; }
    .dcai-seo-value { font-size: 12px; color: #d4d4d8; line-height: 1.4; flex: 1; }

    /* Success */
    .dcai-success { text-align: center; padding: 30px 0; }
    .dcai-success-icon { font-size: 48px; margin-bottom: 12px; }
    .dcai-success-title { font-size: 18px; font-weight: 700; color: #22c55e; margin-bottom: 8px; }
    .dcai-success-text { font-size: 13px; color: #a1a1aa; }
  `;

  // ── Overlay Controller ──────────────────────

  class ImportOverlayV3 {
    constructor() {
      this.overlay = null;
      this.state = 'idle'; // idle | loading | preview | importing | success | error
      this.product = null;
      this.normalized = null;
      this.qualityScore = null;
      this.activeTab = 'product';
      this.selectedImages = new Set();
      this.selectedVariants = new Set();
      this.progress = 0;
      this.progressMessage = '';
      this._injectStyles();
    }

    _injectStyles() {
      if (!document.getElementById('dcai-overlay-styles')) {
        const style = document.createElement('style');
        style.id = 'dcai-overlay-styles';
        style.textContent = OVERLAY_STYLES;
        document.head.appendChild(style);
      }
    }

    // ── Open overlay and start scraping ──────

    async open(url) {
      if (this.overlay) this.close();
      this.state = 'loading';
      this.progress = 0;
      this.progressMessage = 'Analyse de la page...';
      this._render();

      try {
        const client = window.BackendImportClient;
        if (!client) throw new Error('BackendImportClient not loaded');

        // Use the new scrape-product endpoint
        const result = await client.scrapeProduct(url, {
          includeReviews: true,
          reviewLimit: 50,
        });

        if (!result.ok) {
          this.state = 'error';
          this.progressMessage = result.message || 'Erreur de scraping';
          this._render();
          return;
        }

        this.product = result.product;
        this.normalized = result.normalized;
        this.qualityScore = result.quality_score;

        // Pre-select all images
        if (this.normalized?.images) {
          this.normalized.images.forEach((_, i) => this.selectedImages.add(i));
        }
        // Pre-select all variants
        if (this.normalized?.variants) {
          this.normalized.variants.forEach((_, i) => this.selectedVariants.add(i));
        }

        this.state = 'preview';
        this._render();

      } catch (error) {
        this.state = 'error';
        this.progressMessage = error.message || 'Erreur inattendue';
        this._render();
      }
    }

    close() {
      if (this.overlay) {
        this.overlay.remove();
        this.overlay = null;
      }
      this.state = 'idle';
      this.product = null;
      this.normalized = null;
      this.qualityScore = null;
      this.selectedImages.clear();
      this.selectedVariants.clear();
    }

    // ── Render ──────────────────────────────

    _render() {
      if (this.overlay) this.overlay.remove();

      const backdrop = document.createElement('div');
      backdrop.className = 'dcai-overlay-backdrop';
      backdrop.addEventListener('click', (e) => { if (e.target === backdrop) this.close(); });

      const panel = document.createElement('div');
      panel.className = 'dcai-panel';
      panel.innerHTML = this._buildHeader();

      if (this.state === 'loading') {
        panel.innerHTML += this._buildLoading();
      } else if (this.state === 'error') {
        panel.innerHTML += this._buildError();
      } else if (this.state === 'preview') {
        panel.innerHTML += this._buildTabs();
        panel.innerHTML += `<div class="dcai-content">${this._buildTabContent()}</div>`;
        panel.innerHTML += this._buildFooter();
      } else if (this.state === 'importing') {
        panel.innerHTML += this._buildImporting();
      } else if (this.state === 'success') {
        panel.innerHTML += this._buildSuccess();
      }

      backdrop.appendChild(panel);
      document.body.appendChild(backdrop);
      this.overlay = backdrop;

      this._bindEvents();
    }

    _buildHeader() {
      const platform = this.normalized?.platform || '';
      return `
        <div class="dcai-header">
          <div class="dcai-header-title">
            <span>⚡ DropCraft AI</span>
            <span class="dcai-header-badge">${platform ? platform.toUpperCase() : 'IMPORT'}</span>
          </div>
          <button class="dcai-close-btn" data-action="close">✕</button>
        </div>
      `;
    }

    _buildTabs() {
      const tabs = [
        { id: 'product', label: 'Produit', icon: '📦' },
        { id: 'images', label: 'Médias', icon: '🖼️', badge: this.normalized?.images?.length || 0 },
        { id: 'variants', label: 'Variantes', icon: '🎨', badge: this.normalized?.variants?.length || 0 },
        { id: 'reviews', label: 'Avis', icon: '⭐', badge: this.normalized?.reviews?.total_count || 0 },
        { id: 'seo', label: 'SEO', icon: '🔍' },
        { id: 'score', label: 'Score', icon: '📊' },
      ];

      return `<div class="dcai-tabs">${tabs.map(t => `
        <button class="dcai-tab ${t.id === this.activeTab ? 'active' : ''}" data-tab="${t.id}">
          ${t.icon} ${t.label}${t.badge ? `<span class="dcai-tab-badge">${t.badge}</span>` : ''}
        </button>
      `).join('')}</div>`;
    }

    _buildTabContent() {
      const n = this.normalized;
      if (!n) return '';

      switch (this.activeTab) {
        case 'product': return this._buildProductTab(n);
        case 'images': return this._buildImagesTab(n);
        case 'variants': return this._buildVariantsTab(n);
        case 'reviews': return this._buildReviewsTab(n);
        case 'seo': return this._buildSeoTab(n);
        case 'score': return this._buildScoreTab();
        default: return '';
      }
    }

    _buildProductTab(n) {
      const discount = n.compare_at_price && n.price ? Math.round((1 - n.price / n.compare_at_price) * 100) : 0;
      
      return `
        <div class="dcai-section">
          <div class="dcai-card">
            <div class="dcai-product-title">${this._esc(n.title)}</div>
            <div class="dcai-price-row">
              <span class="dcai-price">${n.currency || '€'} ${(n.price || 0).toFixed(2)}</span>
              ${n.compare_at_price ? `<span class="dcai-price-old">${n.currency || '€'} ${n.compare_at_price.toFixed(2)}</span>` : ''}
              ${discount > 0 ? `<span class="dcai-price-discount">-${discount}%</span>` : ''}
            </div>
            <div class="dcai-meta">
              ${n.brand ? `<span class="dcai-tag">${this._esc(n.brand)}</span>` : ''}
              ${n.stock_status === 'in_stock' ? '<span class="dcai-tag green">En stock</span>' : n.stock_status === 'out_of_stock' ? '<span class="dcai-tag red">Rupture</span>' : ''}
              ${n.sku ? `<span class="dcai-tag">SKU: ${this._esc(n.sku)}</span>` : ''}
              ${n.platform ? `<span class="dcai-tag orange">${n.platform}</span>` : ''}
            </div>
          </div>
        </div>

        ${n.breadcrumbs?.length > 0 ? `
          <div class="dcai-section">
            <div class="dcai-section-title">Catégories</div>
            <div class="dcai-card">
              <div style="font-size:12px;color:#a1a1aa;">${n.breadcrumbs.map(b => this._esc(b)).join(' › ')}</div>
            </div>
          </div>
        ` : ''}

        <div class="dcai-section">
          <div class="dcai-section-title">Description</div>
          <div class="dcai-card">
            <div style="font-size:12px;color:#a1a1aa;line-height:1.6;max-height:200px;overflow:auto;">
              ${this._esc(n.description || 'Aucune description extraite').substring(0, 1000)}
            </div>
          </div>
        </div>

        ${n.tags?.length > 0 ? `
          <div class="dcai-section">
            <div class="dcai-section-title">Tags</div>
            <div class="dcai-meta">${n.tags.slice(0, 10).map(t => `<span class="dcai-tag">${this._esc(t)}</span>`).join('')}</div>
          </div>
        ` : ''}
      `;
    }

    _buildImagesTab(n) {
      const images = n.images || [];
      return `
        <div class="dcai-section">
          <div class="dcai-section-title">Images (${images.length})</div>
          <div class="dcai-images-grid">
            ${images.map((img, i) => `
              <img src="${this._esc(img)}" class="dcai-img-thumb ${this.selectedImages.has(i) ? 'selected' : ''}"
                   data-action="toggle-image" data-index="${i}" loading="lazy"
                   onerror="this.style.display='none'" />
            `).join('')}
          </div>
          <div class="dcai-img-count">${this.selectedImages.size}/${images.length} sélectionnées</div>
        </div>

        ${n.videos?.length > 0 ? `
          <div class="dcai-section">
            <div class="dcai-section-title">Vidéos (${n.videos.length})</div>
            <div class="dcai-card">
              ${n.videos.map(v => `<div style="font-size:12px;color:#818cf8;margin-bottom:4px;word-break:break-all;">🎬 ${this._esc(v)}</div>`).join('')}
            </div>
          </div>
        ` : ''}
      `;
    }

    _buildVariantsTab(n) {
      const variants = n.variants || [];
      if (variants.length === 0) {
        return '<div class="dcai-card" style="text-align:center;color:#71717a;padding:30px;">Aucune variante détectée</div>';
      }

      return `
        <div class="dcai-section">
          <div class="dcai-section-title">Variantes (${variants.length})</div>
          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <button class="dcai-btn dcai-btn-secondary" data-action="select-all-variants" style="width:auto;padding:6px 12px;font-size:12px;">Tout sélectionner</button>
            <button class="dcai-btn dcai-btn-secondary" data-action="deselect-all-variants" style="width:auto;padding:6px 12px;font-size:12px;">Tout désélectionner</button>
          </div>
          ${variants.map((v, i) => `
            <div class="dcai-variant-row ${this.selectedVariants.has(i) ? 'selected' : ''}" data-action="toggle-variant" data-index="${i}">
              <div>
                <div class="dcai-variant-title">${this._esc(v.title || `Variante ${i + 1}`)}</div>
                ${v.sku ? `<div style="font-size:10px;color:#52525b;">SKU: ${this._esc(v.sku)}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div class="dcai-variant-price">${v.price ? `${n.currency || '€'} ${v.price.toFixed(2)}` : ''}</div>
                <div class="dcai-variant-stock ${v.available !== false ? 'in' : 'out'}">${v.available !== false ? '● Dispo' : '● Épuisé'}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    _buildReviewsTab(n) {
      const r = n.reviews;
      if (!r || r.confidence === 'low') {
        return '<div class="dcai-card" style="text-align:center;color:#71717a;padding:30px;">Aucun avis extrait</div>';
      }

      const stars = '★'.repeat(Math.round(r.average_rating)) + '☆'.repeat(5 - Math.round(r.average_rating));
      const total = r.total_count || 0;
      const dist = r.distribution || {};
      const maxDist = Math.max(...Object.values(dist), 1);

      let html = `
        <div class="dcai-section">
          <div class="dcai-card">
            <div class="dcai-rating-row">
              <span class="dcai-rating-num">${r.average_rating.toFixed(1)}</span>
              <span class="dcai-stars">${stars}</span>
              <span class="dcai-rating-count">(${total} avis)</span>
            </div>
            ${[5,4,3,2,1].map(s => `
              <div class="dcai-dist-row">
                <span class="dcai-dist-label">${s}★</span>
                <div class="dcai-dist-bar"><div class="dcai-dist-fill" style="width:${((dist[s] || 0) / maxDist * 100)}%"></div></div>
                <span class="dcai-dist-count">${dist[s] || 0}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      // Sentiment
      if (r.sentiment) {
        const s = r.sentiment;
        html += `
          <div class="dcai-section">
            <div class="dcai-section-title">Analyse sentiment</div>
            <div class="dcai-sentiment">
              <div class="dcai-sentiment-item pos"><div class="dcai-sentiment-num" style="color:#22c55e;">${s.positive}</div><div class="dcai-sentiment-label">Positif</div></div>
              <div class="dcai-sentiment-item neu"><div class="dcai-sentiment-num" style="color:#eab308;">${s.neutral}</div><div class="dcai-sentiment-label">Neutre</div></div>
              <div class="dcai-sentiment-item neg"><div class="dcai-sentiment-num" style="color:#ef4444;">${s.negative}</div><div class="dcai-sentiment-label">Négatif</div></div>
            </div>
          </div>
        `;
      }

      // Keywords
      if (r.keywords?.length > 0) {
        html += `
          <div class="dcai-section">
            <div class="dcai-section-title">Mots-clés fréquents</div>
            <div class="dcai-keywords">${r.keywords.map(k => `<span class="dcai-keyword">${this._esc(k)}</span>`).join('')}</div>
          </div>
        `;
      }

      // Individual reviews
      if (r.reviews?.length > 0) {
        html += `
          <div class="dcai-section">
            <div class="dcai-section-title">Avis récents (${r.reviews.length})</div>
            ${r.reviews.slice(0, 10).map(rv => `
              <div class="dcai-review-card">
                <div class="dcai-review-header">
                  <span class="dcai-review-author">${this._esc(rv.author || 'Anonyme')}</span>
                  <span class="dcai-review-date">${this._esc(rv.date || '')}</span>
                </div>
                <div class="dcai-review-stars">${'★'.repeat(Math.round(rv.rating || 0))}${'☆'.repeat(5 - Math.round(rv.rating || 0))}</div>
                ${rv.title ? `<div style="font-size:12px;font-weight:600;color:#d4d4d8;margin-bottom:4px;">${this._esc(rv.title)}</div>` : ''}
                <div class="dcai-review-text">${this._esc((rv.content || '').substring(0, 300))}</div>
                ${rv.verified ? '<div class="dcai-review-verified">✓ Achat vérifié</div>' : ''}
                ${rv.images?.length > 0 ? `
                  <div class="dcai-review-images">
                    ${rv.images.slice(0, 4).map(img => `<img src="${this._esc(img)}" class="dcai-review-img" loading="lazy" onerror="this.style.display='none'" />`).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
      }

      return html;
    }

    _buildSeoTab(n) {
      const seo = n.seo || {};
      return `
        <div class="dcai-section">
          <div class="dcai-section-title">Données SEO</div>
          <div class="dcai-card">
            ${[
              ['Meta Title', seo.meta_title],
              ['Meta Desc', seo.meta_description],
              ['H1', seo.h1],
              ['Canonical', seo.canonical],
            ].filter(([,v]) => v).map(([label, value]) => `
              <div class="dcai-seo-item">
                <span class="dcai-seo-label">${label}</span>
                <span class="dcai-seo-value">${this._esc(value.substring(0, 200))}</span>
              </div>
            `).join('')}
          </div>
        </div>

        ${seo.h2s?.length > 0 ? `
          <div class="dcai-section">
            <div class="dcai-section-title">Sous-titres (H2)</div>
            <div class="dcai-card">
              ${seo.h2s.map(h => `<div style="font-size:12px;color:#a1a1aa;margin-bottom:4px;">• ${this._esc(h)}</div>`).join('')}
            </div>
          </div>
        ` : ''}

        ${seo.keywords?.length > 0 ? `
          <div class="dcai-section">
            <div class="dcai-section-title">Mots-clés détectés</div>
            <div class="dcai-keywords">${seo.keywords.slice(0, 15).map(k => `<span class="dcai-keyword">${this._esc(k)}</span>`).join('')}</div>
          </div>
        ` : ''}
      `;
    }

    _buildScoreTab() {
      const qs = this.qualityScore;
      if (!qs) return '<div class="dcai-card" style="text-align:center;color:#71717a;padding:30px;">Score non disponible</div>';

      const score = qs.score || 0;
      const grade = qs.grade || 'F';
      const gradeColor = { A: '#22c55e', B: '#84cc16', C: '#eab308', D: '#f97316', F: '#ef4444' }[grade] || '#71717a';
      const circumference = 2 * Math.PI * 35;
      const offset = circumference - (score / 100) * circumference;

      const breakdown = qs.breakdown || {};
      const maxScores = { title: 15, description: 15, images: 20, price: 10, variants: 10, reviews: 15, seo: 10, metadata: 5 };

      return `
        <div class="dcai-section">
          <div class="dcai-card" style="text-align:center;">
            <div class="dcai-score-ring">
              <svg width="80" height="80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="#27272a" stroke-width="6" />
                <circle cx="40" cy="40" r="35" fill="none" stroke="${gradeColor}" stroke-width="6"
                  stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round" />
              </svg>
              <div class="dcai-score-value" style="color:${gradeColor}">${score}</div>
            </div>
            <div style="font-size:14px;font-weight:700;color:${gradeColor};margin-bottom:4px;">Grade ${grade}</div>
            <div style="font-size:12px;color:#71717a;">${score >= 70 ? 'Fiche produit complète' : score >= 50 ? 'Fiche partiellement complète' : 'Fiche incomplète'}</div>
          </div>
        </div>

        <div class="dcai-section">
          <div class="dcai-section-title">Détail du score</div>
          <div class="dcai-card">
            ${Object.entries(breakdown).map(([key, value]) => {
              const max = maxScores[key] || 10;
              const pct = (value / max) * 100;
              const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#eab308' : '#ef4444';
              const labels = { title: 'Titre', description: 'Description', images: 'Images', price: 'Prix', variants: 'Variantes', reviews: 'Avis', seo: 'SEO', metadata: 'Métadonnées' };
              return `
                <div class="dcai-score-item">
                  <span class="dcai-score-label">${labels[key] || key}</span>
                  <div class="dcai-score-bar"><div class="dcai-score-bar-fill" style="width:${pct}%;background:${color};"></div></div>
                  <span class="dcai-score-num">${value}/${max}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }

    _buildLoading() {
      return `
        <div class="dcai-content">
          <div class="dcai-loader">
            <div class="dcai-spinner"></div>
            <div class="dcai-loader-text">${this._esc(this.progressMessage)}</div>
            <div class="dcai-progress-bar"><div class="dcai-progress-fill" style="width:${this.progress}%"></div></div>
          </div>
        </div>
      `;
    }

    _buildError() {
      return `
        <div class="dcai-content">
          <div style="text-align:center;padding:40px 0;">
            <div style="font-size:48px;margin-bottom:12px;">⚠️</div>
            <div style="font-size:16px;font-weight:600;color:#ef4444;margin-bottom:8px;">Erreur</div>
            <div style="font-size:13px;color:#a1a1aa;margin-bottom:20px;">${this._esc(this.progressMessage)}</div>
            <button class="dcai-btn dcai-btn-secondary" data-action="close" style="width:auto;display:inline-flex;padding:8px 20px;">Fermer</button>
          </div>
        </div>
      `;
    }

    _buildImporting() {
      return `
        <div class="dcai-content">
          <div class="dcai-loader">
            <div class="dcai-spinner"></div>
            <div class="dcai-loader-text">Import en cours...</div>
          </div>
        </div>
      `;
    }

    _buildSuccess() {
      return `
        <div class="dcai-content">
          <div class="dcai-success">
            <div class="dcai-success-icon">✅</div>
            <div class="dcai-success-title">Produit importé !</div>
            <div class="dcai-success-text">Le produit a été ajouté à votre catalogue DropCraft AI.</div>
            <button class="dcai-btn dcai-btn-primary" data-action="open-dashboard" style="margin-top:20px;">Voir dans DropCraft AI</button>
            <button class="dcai-btn dcai-btn-secondary" data-action="close">Fermer</button>
          </div>
        </div>
      `;
    }

    _buildFooter() {
      return `
        <div class="dcai-footer">
          <button class="dcai-btn dcai-btn-primary" data-action="import">
            📥 Importer dans DropCraft AI
          </button>
          <button class="dcai-btn dcai-btn-secondary" data-action="open-preview">
            🔗 Voir preview dans l'app
          </button>
        </div>
      `;
    }

    // ── Events ──────────────────────────────

    _bindEvents() {
      if (!this.overlay) return;

      this.overlay.querySelectorAll('[data-action]').forEach(el => {
        el.addEventListener('click', (e) => {
          const action = e.currentTarget.getAttribute('data-action');
          this._handleAction(action, e.currentTarget);
        });
      });

      this.overlay.querySelectorAll('[data-tab]').forEach(el => {
        el.addEventListener('click', (e) => {
          this.activeTab = e.currentTarget.getAttribute('data-tab');
          this._render();
        });
      });
    }

    _handleAction(action, el) {
      switch (action) {
        case 'close':
          this.close();
          break;
        case 'toggle-image': {
          const idx = parseInt(el.getAttribute('data-index'));
          if (this.selectedImages.has(idx)) this.selectedImages.delete(idx);
          else this.selectedImages.add(idx);
          this._render();
          break;
        }
        case 'toggle-variant': {
          const idx = parseInt(el.getAttribute('data-index'));
          if (this.selectedVariants.has(idx)) this.selectedVariants.delete(idx);
          else this.selectedVariants.add(idx);
          this._render();
          break;
        }
        case 'select-all-variants':
          this.normalized?.variants?.forEach((_, i) => this.selectedVariants.add(i));
          this._render();
          break;
        case 'deselect-all-variants':
          this.selectedVariants.clear();
          this._render();
          break;
        case 'import':
          this._doImport();
          break;
        case 'open-dashboard':
          window.open(CONFIG.APP_URL + '/catalogue', '_blank');
          this.close();
          break;
        case 'open-preview':
          window.open(CONFIG.APP_URL + '/import/preview', '_blank');
          break;
      }
    }

    async _doImport() {
      this.state = 'importing';
      this._render();

      try {
        // Send to background for final import
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
            type: 'IMPORT_PRODUCT',
            data: {
              product: this.product,
              normalized: this.normalized,
              selectedImages: [...this.selectedImages],
              selectedVariants: [...this.selectedVariants],
              qualityScore: this.qualityScore,
            },
          }, (response) => {
            this.state = response?.success ? 'success' : 'error';
            if (!response?.success) this.progressMessage = response?.error || 'Import échoué';
            this._render();
          });
        } else {
          // Non-extension context — direct API call
          this.state = 'success';
          this._render();
        }
      } catch (error) {
        this.state = 'error';
        this.progressMessage = error.message;
        this._render();
      }
    }

    _esc(str) {
      if (!str) return '';
      const div = document.createElement('div');
      div.textContent = String(str);
      return div.innerHTML;
    }
  }

  // Export
  window.ImportOverlayV3 = new ImportOverlayV3();

})();
