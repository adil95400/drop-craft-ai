/**
 * Drop Craft AI - Watermark Detection & Image Enhancement v4.2.0
 * Detect watermarks and optimize images for e-commerce
 */

(function() {
  'use strict';

  if (window.__dropCraftWatermarkRemoverLoaded) return;
  window.__dropCraftWatermarkRemoverLoaded = true;

  const CONFIG = {
    API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',
    WATERMARK_PATTERNS: [
      /aliexpress/i, /alibaba/i, /1688/i, /taobao/i, /tmall/i,
      /temu/i, /wish/i, /shein/i, /banggood/i, /dhgate/i,
      /trademark/i, /copyright/i, /©/i, /®/i, /™/i,
      /sample/i, /demo/i, /preview/i, /draft/i
    ],
    SUSPICIOUS_PATTERNS: [
      { type: 'corner_text', areas: ['top-left', 'top-right', 'bottom-left', 'bottom-right'] },
      { type: 'diagonal_text', pattern: /\w+\.\w{2,3}/i },
      { type: 'overlay', opacity: 0.3 }
    ]
  };

  class DropCraftWatermarkRemover {
    constructor() {
      this.processedImages = new Map();
      this.init();
    }

    async init() {
      this.injectStyles();
      console.log('🖼️ DropCraft Watermark Detector v4.2 initialized');
    }

    injectStyles() {
      if (document.getElementById('dc-watermark-styles')) return;

      const style = document.createElement('style');
      style.id = 'dc-watermark-styles';
      style.textContent = `
        .dc-watermark-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          z-index: 100;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        .dc-watermark-badge.warning {
          background: rgba(245, 158, 11, 0.9);
          color: white;
        }

        .dc-watermark-badge.clean {
          background: rgba(16, 185, 129, 0.9);
          color: white;
        }

        .dc-watermark-tooltip {
          position: absolute;
          background: #1a1f2e;
          color: white;
          padding: 12px 16px;
          border-radius: 10px;
          font-size: 12px;
          max-width: 250px;
          z-index: 10000;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          display: none;
        }

        .dc-watermark-tooltip.visible {
          display: block;
        }

        .dc-watermark-actions {
          display: flex;
          gap: 8px;
          margin-top: 10px;
        }

        .dc-watermark-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dc-watermark-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .dc-watermark-btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .dc-image-enhanced {
          outline: 2px solid #10b981 !important;
          outline-offset: 2px;
        }
      `;
      document.head.appendChild(style);
    }

    async analyzeImage(imgElement) {
      const src = imgElement.src || imgElement.dataset.src;
      if (!src || this.processedImages.has(src)) {
        return this.processedImages.get(src);
      }

      const result = {
        hasWatermark: false,
        watermarkType: null,
        confidence: 0,
        suggestions: []
      };

      try {
        // Check URL for watermark indicators
        if (this.checkUrlForWatermark(src)) {
          result.hasWatermark = true;
          result.watermarkType = 'url_pattern';
          result.confidence = 0.8;
          result.suggestions.push('URL contient des indicateurs de watermark');
        }

        // Analyze image visually using canvas
        const visualAnalysis = await this.analyzeVisually(imgElement);
        if (visualAnalysis.hasWatermark) {
          result.hasWatermark = true;
          result.watermarkType = visualAnalysis.type;
          result.confidence = Math.max(result.confidence, visualAnalysis.confidence);
          result.suggestions = [...result.suggestions, ...visualAnalysis.suggestions];
        }

      } catch (error) {
        console.log('Watermark analysis error:', error);
      }

      this.processedImages.set(src, result);
      return result;
    }

    checkUrlForWatermark(url) {
      return CONFIG.WATERMARK_PATTERNS.some(pattern => pattern.test(url));
    }

    async analyzeVisually(imgElement) {
      const result = {
        hasWatermark: false,
        type: null,
        confidence: 0,
        suggestions: []
      };

      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Wait for image to load
        await new Promise((resolve, reject) => {
          if (imgElement.complete) {
            resolve();
          } else {
            imgElement.onload = resolve;
            imgElement.onerror = reject;
          }
        });

        canvas.width = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;
        
        ctx.drawImage(imgElement, 0, 0);

        // Analyze corners for text
        const corners = [
          { x: 0, y: 0, w: canvas.width * 0.2, h: canvas.height * 0.1 },
          { x: canvas.width * 0.8, y: 0, w: canvas.width * 0.2, h: canvas.height * 0.1 },
          { x: 0, y: canvas.height * 0.9, w: canvas.width * 0.2, h: canvas.height * 0.1 },
          { x: canvas.width * 0.8, y: canvas.height * 0.9, w: canvas.width * 0.2, h: canvas.height * 0.1 }
        ];

        for (const corner of corners) {
          const imageData = ctx.getImageData(corner.x, corner.y, corner.w, corner.h);
          const hasText = this.detectTextInRegion(imageData);
          
          if (hasText) {
            result.hasWatermark = true;
            result.type = 'corner_watermark';
            result.confidence = 0.6;
            result.suggestions.push('Texte détecté dans un coin de l\'image');
            break;
          }
        }

        // Check for semi-transparent overlays
        const centerData = ctx.getImageData(
          canvas.width * 0.4, 
          canvas.height * 0.4, 
          canvas.width * 0.2, 
          canvas.height * 0.2
        );
        
        if (this.detectOverlay(centerData)) {
          result.hasWatermark = true;
          result.type = 'overlay';
          result.confidence = 0.5;
          result.suggestions.push('Overlay semi-transparent détecté');
        }

      } catch (error) {
        console.log('Visual analysis skipped:', error.message);
      }

      return result;
    }

    detectTextInRegion(imageData) {
      const data = imageData.data;
      let highContrastPixels = 0;
      const threshold = 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = (r + g + b) / 3;
        
        // Check for high contrast (text is usually high contrast)
        if (brightness < 50 || brightness > 200) {
          highContrastPixels++;
        }
      }

      const percentage = highContrastPixels / (imageData.width * imageData.height);
      return percentage > 0.3 && percentage < 0.7; // Text usually has moderate high contrast
    }

    detectOverlay(imageData) {
      const data = imageData.data;
      let semiTransparentPixels = 0;

      for (let i = 0; i < data.length; i += 4) {
        const a = data[i + 3];
        if (a > 50 && a < 200) {
          semiTransparentPixels++;
        }
      }

      return semiTransparentPixels / (imageData.width * imageData.height) > 0.1;
    }

    async enhanceImage(imgElement) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = imgElement.naturalWidth || imgElement.width;
      canvas.height = imgElement.naturalHeight || imgElement.height;

      ctx.drawImage(imgElement, 0, 0);

      // Apply enhancement filters
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const enhanced = this.applyEnhancements(imageData);
      ctx.putImageData(enhanced, 0, 0);

      return canvas.toDataURL('image/jpeg', 0.92);
    }

    applyEnhancements(imageData) {
      const data = imageData.data;

      // Auto-levels adjustment
      let minR = 255, maxR = 0;
      let minG = 255, maxG = 0;
      let minB = 255, maxB = 0;

      for (let i = 0; i < data.length; i += 4) {
        minR = Math.min(minR, data[i]);
        maxR = Math.max(maxR, data[i]);
        minG = Math.min(minG, data[i + 1]);
        maxG = Math.max(maxG, data[i + 1]);
        minB = Math.min(minB, data[i + 2]);
        maxB = Math.max(maxB, data[i + 2]);
      }

      for (let i = 0; i < data.length; i += 4) {
        data[i] = ((data[i] - minR) / (maxR - minR)) * 255;
        data[i + 1] = ((data[i + 1] - minG) / (maxG - minG)) * 255;
        data[i + 2] = ((data[i + 2] - minB) / (maxB - minB)) * 255;
      }

      // Slight contrast boost
      const contrast = 1.1;
      const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));

      for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));
        data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128));
        data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128));
      }

      // Slight saturation boost
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const saturation = 1.1;
        data[i] = Math.min(255, Math.max(0, avg + saturation * (data[i] - avg)));
        data[i + 1] = Math.min(255, Math.max(0, avg + saturation * (data[i + 1] - avg)));
        data[i + 2] = Math.min(255, Math.max(0, avg + saturation * (data[i + 2] - avg)));
      }

      return imageData;
    }

    async processAllImages() {
      const images = document.querySelectorAll('img');
      const results = [];

      for (const img of images) {
        if (img.width < 100 || img.height < 100) continue;

        try {
          const analysis = await this.analyzeImage(img);
          results.push({ element: img, analysis });

          // Add visual indicator
          if (analysis.hasWatermark) {
            this.addWatermarkBadge(img, analysis);
          }
        } catch (e) {
          console.log('Image processing error:', e);
        }
      }

      return results;
    }

    addWatermarkBadge(imgElement, analysis) {
      const parent = imgElement.parentElement;
      if (!parent || parent.querySelector('.dc-watermark-badge')) return;

      parent.style.position = parent.style.position || 'relative';

      const badge = document.createElement('div');
      badge.className = `dc-watermark-badge ${analysis.hasWatermark ? 'warning' : 'clean'}`;
      badge.innerHTML = analysis.hasWatermark ? '⚠️ Watermark' : '✓ Clean';
      badge.title = analysis.suggestions.join('\n');

      parent.appendChild(badge);
    }

    async optimizeForShopify(images) {
      const optimized = [];

      for (const img of images) {
        try {
          // Resize to Shopify optimal size (max 2048x2048)
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          let width = img.naturalWidth || img.width;
          let height = img.naturalHeight || img.height;
          
          if (width > 2048 || height > 2048) {
            const ratio = Math.min(2048 / width, 2048 / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);

          // Compress
          const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/jpeg', 0.85);
          });

          optimized.push({
            original: img.src,
            optimized: URL.createObjectURL(blob),
            width,
            height,
            size: blob.size
          });

        } catch (e) {
          console.log('Optimization error:', e);
        }
      }

      return optimized;
    }
  }

  // Initialize
  window.DropCraftWatermarkRemover = new DropCraftWatermarkRemover();
})();
