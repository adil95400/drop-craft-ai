/**
 * ShopOpti+ - Media Enrichment Library v5.7.0
 * Enhanced video and image extraction with multi-platform support
 * Captures review videos, product videos, and high-res images
 */

(function() {
  'use strict';

  const VERSION = '5.7.0';

  class MediaEnrichmentService {
    constructor() {
      this.capturedVideos = new Set();
      this.capturedImages = new Set();
      this.networkVideos = [];
      this.setupNetworkInterception();
    }

    /**
     * Setup network request interception to capture dynamically loaded videos
     */
    setupNetworkInterception() {
      const self = this;

      // Intercept fetch
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0]?.url || args[0];
        if (typeof url === 'string' && self.isVideoUrl(url)) {
          self.networkVideos.push({ url, source: 'fetch', timestamp: Date.now() });
        }
        return originalFetch.apply(this, args);
      };

      // Intercept XMLHttpRequest
      const originalXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url) {
        if (typeof url === 'string' && self.isVideoUrl(url)) {
          self.networkVideos.push({ url, source: 'xhr', timestamp: Date.now() });
        }
        return originalXHROpen.apply(this, arguments);
      };
    }

    /**
     * Extract all product videos from page
     */
    async extractProductVideos() {
      const videos = [];
      const seenUrls = new Set();

      // 1. Direct video elements
      document.querySelectorAll('video').forEach(video => {
        this.processVideoElement(video, videos, seenUrls, 'video-element');
      });

      // 2. Video sources
      document.querySelectorAll('source[type*="video"]').forEach(source => {
        const url = source.src;
        if (url && !seenUrls.has(url) && this.isValidVideoUrl(url)) {
          seenUrls.add(url);
          videos.push({
            url: this.cleanUrl(url),
            type: 'product',
            source: 'source-element',
            format: this.getVideoFormat(url)
          });
        }
      });

      // 3. Extract from data attributes
      const videoDataSelectors = [
        '[data-video-url]',
        '[data-video-src]',
        '[data-video]',
        '[data-mp4]',
        '[data-hls]'
      ];
      document.querySelectorAll(videoDataSelectors.join(', ')).forEach(el => {
        const url = el.dataset.videoUrl || el.dataset.videoSrc || el.dataset.video || el.dataset.mp4 || el.dataset.hls;
        if (url && !seenUrls.has(url) && this.isValidVideoUrl(url)) {
          seenUrls.add(url);
          videos.push({
            url: this.cleanUrl(url),
            type: 'product',
            source: 'data-attribute',
            format: this.getVideoFormat(url)
          });
        }
      });

      // 4. Extract from scripts
      const scriptVideos = this.extractVideosFromScripts();
      scriptVideos.forEach(v => {
        if (!seenUrls.has(v.url)) {
          seenUrls.add(v.url);
          videos.push(v);
        }
      });

      // 5. Network intercepted videos
      this.networkVideos.forEach(v => {
        if (!seenUrls.has(v.url) && this.isValidVideoUrl(v.url)) {
          seenUrls.add(v.url);
          videos.push({
            url: this.cleanUrl(v.url),
            type: 'product',
            source: 'network-intercept',
            format: this.getVideoFormat(v.url)
          });
        }
      });

      // 6. Platform-specific extraction
      const platformVideos = await this.extractPlatformSpecificVideos();
      platformVideos.forEach(v => {
        if (!seenUrls.has(v.url)) {
          seenUrls.add(v.url);
          videos.push(v);
        }
      });

      return videos;
    }

    /**
     * Process video element and extract all sources
     */
    processVideoElement(video, videos, seenUrls, source) {
      // Main source
      if (video.src && !seenUrls.has(video.src) && this.isValidVideoUrl(video.src)) {
        seenUrls.add(video.src);
        videos.push({
          url: this.cleanUrl(video.src),
          type: 'product',
          source,
          format: this.getVideoFormat(video.src),
          thumbnail: video.poster,
          duration: video.duration || null
        });
      }

      // Child source elements
      video.querySelectorAll('source').forEach(source => {
        if (source.src && !seenUrls.has(source.src) && this.isValidVideoUrl(source.src)) {
          seenUrls.add(source.src);
          videos.push({
            url: this.cleanUrl(source.src),
            type: 'product',
            source: 'video-source',
            format: source.type || this.getVideoFormat(source.src),
            thumbnail: video.poster
          });
        }
      });
    }

    /**
     * Extract videos from page scripts
     */
    extractVideosFromScripts() {
      const videos = [];
      const scripts = document.querySelectorAll('script');

      const patterns = [
        // Generic video URL patterns
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /"video_url"\s*:\s*"([^"]+)"/g,
        /"playUrl"\s*:\s*"([^"]+)"/g,
        /"hlsUrl"\s*:\s*"([^"]+)"/g,
        /"dashUrl"\s*:\s*"([^"]+)"/g,
        /"mediaUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
        
        // Platform-specific patterns
        /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
        /https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g,
        /https?:\/\/cloud\.video\.taobao\.com[^"'\s]+/g,
        /https?:\/\/[^"'\s]*alicdn[^"'\s]*video[^"'\s]*/g,
        /https?:\/\/[^"'\s]*cloudfront[^"'\s]*\.mp4[^"'\s]*/g,
        /https?:\/\/[^"'\s]*tiktok[^"'\s]*video[^"'\s]*/g
      ];

      scripts.forEach(script => {
        const content = script.textContent || '';
        
        patterns.forEach(pattern => {
          const matches = content.matchAll(pattern);
          for (const match of matches) {
            const url = match[1] || match[0];
            if (this.isValidVideoUrl(url)) {
              videos.push({
                url: this.cleanUrl(url),
                type: 'product',
                source: 'script',
                format: this.getVideoFormat(url)
              });
            }
          }
        });
      });

      return videos;
    }

    /**
     * Platform-specific video extraction
     */
    async extractPlatformSpecificVideos() {
      const videos = [];
      const hostname = window.location.hostname.toLowerCase();

      // AliExpress
      if (hostname.includes('aliexpress')) {
        videos.push(...this.extractAliExpressVideos());
      }

      // Amazon
      if (hostname.includes('amazon')) {
        videos.push(...this.extractAmazonVideos());
      }

      // TikTok Shop
      if (hostname.includes('tiktok')) {
        videos.push(...this.extractTikTokVideos());
      }

      // Temu
      if (hostname.includes('temu')) {
        videos.push(...this.extractTemuVideos());
      }

      // Shein
      if (hostname.includes('shein')) {
        videos.push(...this.extractSheinVideos());
      }

      return videos;
    }

    extractAliExpressVideos() {
      const videos = [];
      
      // AliExpress video containers
      document.querySelectorAll('.pdp-video-viewer video, .product-video video, [class*="video-container"] video').forEach(video => {
        if (video.src) {
          videos.push({
            url: video.src,
            type: 'product',
            source: 'aliexpress-player',
            format: this.getVideoFormat(video.src),
            thumbnail: video.poster
          });
        }
      });

      return videos;
    }

    extractAmazonVideos() {
      const videos = [];

      // Amazon video player
      document.querySelectorAll('.vse-player video, #vse-player video, .a-video-content video').forEach(video => {
        if (video.src) {
          videos.push({
            url: video.src,
            type: 'product',
            source: 'amazon-player',
            format: this.getVideoFormat(video.src),
            thumbnail: video.poster
          });
        }
      });

      // A+ Content videos
      document.querySelectorAll('.aplus-module video, #aplus video').forEach(video => {
        if (video.src) {
          videos.push({
            url: video.src,
            type: 'marketing',
            source: 'amazon-aplus',
            format: this.getVideoFormat(video.src)
          });
        }
      });

      return videos;
    }

    extractTikTokVideos() {
      const videos = [];

      // TikTok video elements
      document.querySelectorAll('[data-e2e*="video"] video, [class*="video"] video').forEach(video => {
        if (video.src) {
          videos.push({
            url: video.src,
            type: 'product',
            source: 'tiktok-player',
            format: this.getVideoFormat(video.src),
            thumbnail: video.poster
          });
        }
      });

      return videos;
    }

    extractTemuVideos() {
      const videos = [];

      document.querySelectorAll('video').forEach(video => {
        video.querySelectorAll('source').forEach(source => {
          if (source.src) {
            videos.push({
              url: source.src,
              type: 'product',
              source: 'temu-player',
              format: this.getVideoFormat(source.src)
            });
          }
        });
      });

      return videos;
    }

    extractSheinVideos() {
      const videos = [];

      document.querySelectorAll('video').forEach(video => {
        if (video.src) {
          videos.push({
            url: video.src,
            type: 'product',
            source: 'shein-player',
            format: this.getVideoFormat(video.src)
          });
        }
      });

      return videos;
    }

    /**
     * Extract high-resolution images
     */
    async extractHighResImages() {
      const images = [];
      const seenUrls = new Set();

      // 1. Product gallery images
      const gallerySelectors = [
        '.image-gallery img',
        '[class*="gallery"] img',
        '[class*="product-image"] img',
        '[class*="ProductImage"] img',
        '.pdp-image img',
        '#main-image',
        '#landingImage'
      ];

      document.querySelectorAll(gallerySelectors.join(', ')).forEach(img => {
        const src = this.getHighResImageUrl(img);
        if (src && !seenUrls.has(src) && this.isValidImageUrl(src)) {
          seenUrls.add(src);
          images.push({
            url: src,
            type: 'product',
            alt: img.alt,
            source: 'gallery'
          });
        }
      });

      // 2. Data attributes for lazy-loaded images
      document.querySelectorAll('[data-src], [data-lazy-src], [data-zoom-src], [data-large]').forEach(el => {
        const src = el.dataset.src || el.dataset.lazySrc || el.dataset.zoomSrc || el.dataset.large;
        if (src && !seenUrls.has(src) && this.isValidImageUrl(src)) {
          seenUrls.add(src);
          images.push({
            url: this.getHighResImageUrl({ src }),
            type: 'product',
            source: 'lazy-load'
          });
        }
      });

      // 3. Zoom/high-res image sources
      document.querySelectorAll('[data-zoom], [data-full-image], [data-original]').forEach(el => {
        const src = el.dataset.zoom || el.dataset.fullImage || el.dataset.original;
        if (src && !seenUrls.has(src)) {
          seenUrls.add(src);
          images.push({
            url: src,
            type: 'product',
            source: 'zoom'
          });
        }
      });

      return images;
    }

    /**
     * Extract review media (images and videos from reviews)
     */
    async extractReviewMedia() {
      const media = {
        images: [],
        videos: []
      };
      const seenUrls = new Set();

      // Review containers
      const reviewSelectors = [
        '.review-image',
        '.review-media',
        '[class*="review-photo"]',
        '[class*="feedback-photo"]',
        '.customer-review-media'
      ];

      // Review images
      document.querySelectorAll(`${reviewSelectors.join(' img, ')} img`).forEach(img => {
        const src = this.getHighResImageUrl(img);
        if (src && !seenUrls.has(src) && this.isValidImageUrl(src)) {
          seenUrls.add(src);
          media.images.push({
            url: src,
            type: 'review',
            source: 'review-media'
          });
        }
      });

      // Review videos
      document.querySelectorAll('.review-video video, [class*="review"] video').forEach(video => {
        if (video.src && !seenUrls.has(video.src)) {
          seenUrls.add(video.src);
          media.videos.push({
            url: video.src,
            type: 'review',
            source: 'review-video',
            thumbnail: video.poster
          });
        }
      });

      return media;
    }

    /**
     * Get high-resolution version of image URL
     */
    getHighResImageUrl(img) {
      const src = img.src || img.dataset?.src || img.dataset?.original;
      if (!src) return null;

      // Platform-specific high-res transforms
      let highRes = src;

      // Amazon - get highest resolution
      if (src.includes('amazon')) {
        highRes = src
          .replace(/\._[A-Z]{2}\d+_\./, '._SL1500_.')
          .replace(/\._[A-Z]{2}\d+,\d+_\./, '._SL1500_.');
      }

      // AliExpress - get original size
      if (src.includes('alicdn') || src.includes('aliexpress')) {
        highRes = src
          .replace(/_\d+x\d+[^.]*\./, '.')
          .replace(/\.jpg_\d+x\d+.*/, '.jpg');
      }

      // Temu
      if (src.includes('temu')) {
        highRes = src.replace(/\/\d+x\d+\//, '/800x800/');
      }

      // Shein
      if (src.includes('shein')) {
        highRes = src.replace(/_thumbnail_\d+x/, '');
      }

      // Generic size replacements
      highRes = highRes
        .replace(/\?w=\d+/, '?w=1200')
        .replace(/&h=\d+/, '&h=1200')
        .replace(/\/\d+x\d+\//, '/1200x1200/')
        .replace(/width=\d+/, 'width=1200')
        .replace(/height=\d+/, 'height=1200');

      return highRes;
    }

    // Validation and utility methods
    isVideoUrl(url) {
      if (!url) return false;
      const videoPatterns = [/\.mp4/i, /\.webm/i, /\.m3u8/i, /\.mov/i, /video/i, /player/i];
      return videoPatterns.some(p => p.test(url));
    }

    isValidVideoUrl(url) {
      if (!url) return false;
      const excludePatterns = [/analytics/i, /tracking/i, /pixel/i, /beacon/i, /ads\./i, /advertisement/i];
      return this.isVideoUrl(url) && !excludePatterns.some(p => p.test(url));
    }

    isValidImageUrl(url) {
      if (!url) return false;
      const excludePatterns = [/analytics/, /tracking/, /pixel/, /beacon/, /1x1/, /spacer/, /\.gif$/];
      return !excludePatterns.some(p => p.test(url)) && url.length > 20;
    }

    cleanUrl(url) {
      try {
        return url.replace(/\\u002F/g, '/').replace(/\\/g, '');
      } catch (e) {
        return url;
      }
    }

    getVideoFormat(url) {
      if (url.includes('.mp4')) return 'mp4';
      if (url.includes('.webm')) return 'webm';
      if (url.includes('.m3u8')) return 'hls';
      if (url.includes('.mpd')) return 'dash';
      return 'unknown';
    }
  }

  // Export
  window.MediaEnrichmentService = MediaEnrichmentService;
  window.mediaEnrichment = new MediaEnrichmentService();

  console.log(`[ShopOpti+] Media Enrichment Library v${VERSION} loaded`);

})();
