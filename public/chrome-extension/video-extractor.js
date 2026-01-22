/**
 * Drop Craft AI - Video Extractor Module v4.1
 * Extracts product videos from supported platforms with advanced detection
 */

class DropCraftVideoExtractor {
  constructor() {
    this.extractedVideos = [];
    this.platform = this.detectPlatform();
    this.networkVideos = new Set();
    this.setupNetworkInterception();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('aliexpress')) return 'aliexpress';
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('temu')) return 'temu';
    if (hostname.includes('ebay')) return 'ebay';
    if (hostname.includes('alibaba') || hostname.includes('1688')) return 'alibaba';
    if (hostname.includes('shein')) return 'shein';
    if (hostname.includes('walmart')) return 'walmart';
    if (hostname.includes('cdiscount')) return 'cdiscount';
    if (hostname.includes('fnac')) return 'fnac';
    if (hostname.includes('rakuten')) return 'rakuten';
    if (hostname.includes('banggood')) return 'banggood';
    if (hostname.includes('dhgate')) return 'dhgate';
    if (hostname.includes('wish')) return 'wish';
    if (hostname.includes('etsy')) return 'etsy';
    if (hostname.includes('homedepot')) return 'homedepot';
    if (hostname.includes('lowes')) return 'lowes';
    if (hostname.includes('costco')) return 'costco';
    return 'unknown';
  }

  // Intercept network requests to catch dynamically loaded videos
  setupNetworkInterception() {
    // Override fetch to intercept video URLs
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = function(...args) {
      const url = args[0]?.url || args[0];
      if (typeof url === 'string' && self.isVideoUrl(url)) {
        self.networkVideos.add(url);
      }
      return originalFetch.apply(this, args);
    };

    // Override XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
      if (typeof url === 'string' && self.isVideoUrl(url)) {
        self.networkVideos.add(url);
      }
      return originalXHROpen.apply(this, arguments);
    };
  }

  isVideoUrl(url) {
    if (!url) return false;
    const videoPatterns = [
      /\.mp4/i, /\.webm/i, /\.m3u8/i, /\.mov/i,
      /video/i, /player/i, /cloudfront.*video/i,
      /taobao\.com.*video/i, /alicdn.*video/i
    ];
    const excludePatterns = [
      /analytics/i, /tracking/i, /pixel/i, /beacon/i,
      /ads\./i, /advertisement/i
    ];
    
    const isVideo = videoPatterns.some(p => p.test(url));
    const isExcluded = excludePatterns.some(p => p.test(url));
    
    return isVideo && !isExcluded;
  }

  async extractVideos() {
    this.extractedVideos = [];
    
    // Platform-specific extraction
    switch (this.platform) {
      case 'aliexpress':
        await this.extractAliExpressVideos();
        break;
      case 'amazon':
        await this.extractAmazonVideos();
        break;
      case 'temu':
        await this.extractTemuVideos();
        break;
      case 'alibaba':
        await this.extractAlibabaVideos();
        break;
      case 'shein':
        await this.extractSheinVideos();
        break;
      case 'walmart':
        await this.extractWalmartVideos();
        break;
      case 'cdiscount':
        await this.extractCdiscountVideos();
        break;
      case 'ebay':
        await this.extractEbayVideos();
        break;
      default:
        await this.extractGenericVideos();
    }

    // Add network intercepted videos
    this.networkVideos.forEach(url => {
      this.addVideo(url, 'network-intercept');
    });

    return this.extractedVideos;
  }

  async extractAliExpressVideos() {
    // Method 1: Look for video player in gallery
    const videoElements = document.querySelectorAll('video source, video');
    videoElements.forEach(video => {
      const src = video.src || video.querySelector('source')?.src;
      if (src && this.isValidVideoUrl(src)) {
        this.addVideo(src, 'gallery');
      }
    });

    // Method 2: Search in page scripts for video URLs - Extended patterns
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      
      // Look for video URLs in JSON data
      const videoPatterns = [
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /"video_url"\s*:\s*"([^"]+)"/g,
        /"videoId"\s*:\s*"([^"]+)"/g,
        /"videoSrc"\s*:\s*"([^"]+)"/g,
        /"playUrl"\s*:\s*"([^"]+)"/g,
        /"mediaUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
        /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
        /https?:\/\/cloud\.video\.taobao\.com[^"'\s]+/g,
        /https?:\/\/video\.aliexpress[^"'\s]+/g,
        /https?:\/\/[^"'\s]*alicdn[^"'\s]*\.mp4[^"'\s]*/g,
        /https?:\/\/[^"'\s]*video[^"'\s]*\.m3u8[^"'\s]*/g
      ];

      videoPatterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            this.addVideo(this.cleanUrl(url), 'script');
          }
        }
      });
    });

    // Method 3: Look for video thumbnails with data attributes
    const videoThumbnails = document.querySelectorAll('[data-video], [data-video-url], .video-thumbnail, [class*="video"]');
    videoThumbnails.forEach(thumb => {
      const videoUrl = thumb.dataset.video || thumb.dataset.videoUrl || thumb.getAttribute('data-src');
      if (videoUrl && this.isValidVideoUrl(videoUrl)) {
        this.addVideo(videoUrl, 'thumbnail');
      }
    });

    // Method 4: Check for iframe embeds
    const iframes = document.querySelectorAll('iframe[src*="video"], iframe[src*="player"]');
    iframes.forEach(iframe => {
      this.addVideo(iframe.src, 'iframe');
    });

    // Method 5: Look for video in AliExpress specific containers
    const aliSpecificSelectors = [
      '.pdp-video-viewer video',
      '.product-video video',
      '[class*="video-container"] video',
      '.media-video video'
    ];
    aliSpecificSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(v => {
        if (v.src) this.addVideo(v.src, 'ali-specific');
        v.querySelectorAll('source').forEach(s => {
          if (s.src) this.addVideo(s.src, 'ali-source');
        });
      });
    });
  }

  async extractAmazonVideos() {
    // Method 1: Video player in product gallery
    const videoBlocks = document.querySelectorAll('.vse-player video, #vse-player video, .a-video-content video, #video-block video');
    videoBlocks.forEach(video => {
      if (video.src && this.isValidVideoUrl(video.src)) {
        this.addVideo(video.src, 'player');
      }
      video.querySelectorAll('source').forEach(s => {
        if (s.src) this.addVideo(s.src, 'source');
      });
    });

    // Method 2: Look in data attributes
    const videoContainers = document.querySelectorAll('[data-video-url], [data-mp4-url], [data-vide-src]');
    videoContainers.forEach(container => {
      const url = container.dataset.videoUrl || container.dataset.mp4Url || container.dataset.videoSrc;
      if (url && this.isValidVideoUrl(url)) {
        this.addVideo(url, 'data-attribute');
      }
    });

    // Method 3: Search in page scripts - Extended patterns
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      
      const patterns = [
        /"url"\s*:\s*"(https?:\/\/[^"]+\.mp4[^"]*)"/g,
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /"mediaUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
        /https?:\/\/[^"'\s]+cloudfront\.net[^"'\s]+\.mp4[^"'\s]*/g,
        /https?:\/\/[^"'\s]+amazon[^"'\s]+\.mp4[^"'\s]*/g,
        /https?:\/\/[^"'\s]+m3u8[^"'\s]*/g,
        /"hlsUrl"\s*:\s*"([^"]+)"/g,
        /"dashUrl"\s*:\s*"([^"]+)"/g
      ];

      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            this.addVideo(this.cleanUrl(url), 'script');
          }
        }
      });
    });

    // Method 4: A+ Content videos
    const aplusVideos = document.querySelectorAll('.aplus-module video, #aplus video, .a-video-block video');
    aplusVideos.forEach(video => {
      if (video.src) this.addVideo(video.src, 'aplus');
      video.querySelectorAll('source').forEach(s => {
        if (s.src) this.addVideo(s.src, 'aplus-source');
      });
    });

    // Method 5: Video block thumbnails
    document.querySelectorAll('[data-a-video-player]').forEach(el => {
      try {
        const data = JSON.parse(el.getAttribute('data-a-video-player'));
        if (data.url) this.addVideo(data.url, 'player-data');
        if (data.hlsUrl) this.addVideo(data.hlsUrl, 'hls');
      } catch (e) {}
    });
  }

  async extractTemuVideos() {
    // Temu often uses similar structure to AliExpress
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      const sources = video.querySelectorAll('source');
      sources.forEach(source => {
        if (source.src && this.isValidVideoUrl(source.src)) {
          this.addVideo(source.src, 'video-source');
        }
      });
      if (video.src && this.isValidVideoUrl(video.src)) {
        this.addVideo(video.src, 'video');
      }
    });

    // Search in scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const patterns = [
        /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /"video"\s*:\s*"([^"]+\.mp4[^"]*)"/g
      ];
      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            this.addVideo(this.cleanUrl(url), 'script');
          }
        }
      });
    });
  }

  async extractWalmartVideos() {
    // Walmart video elements
    const videoElements = document.querySelectorAll('video, [data-testid*="video"] video');
    videoElements.forEach(video => {
      if (video.src) this.addVideo(video.src, 'video');
      video.querySelectorAll('source').forEach(s => {
        if (s.src) this.addVideo(s.src, 'source');
      });
    });

    // Search in scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const patterns = [
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /"assetUrl"\s*:\s*"([^"]+\.mp4[^"]*)"/g,
        /https?:\/\/[^"'\s]+walmart[^"'\s]+\.mp4[^"'\s]*/g
      ];
      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            this.addVideo(this.cleanUrl(url), 'script');
          }
        }
      });
    });
  }

  async extractCdiscountVideos() {
    // Cdiscount video elements
    const videoElements = document.querySelectorAll('video, .product-video video');
    videoElements.forEach(video => {
      if (video.src) this.addVideo(video.src, 'video');
      video.querySelectorAll('source').forEach(s => {
        if (s.src) this.addVideo(s.src, 'source');
      });
    });

    // Search in scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const patterns = [
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
        /"video"\s*:\s*\{[^}]*"url"\s*:\s*"([^"]+)"/g
      ];
      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            this.addVideo(this.cleanUrl(url), 'script');
          }
        }
      });
    });
  }

  async extractEbayVideos() {
    // eBay video elements
    document.querySelectorAll('video, .ux-video video, [data-video-url]').forEach(el => {
      if (el.src) this.addVideo(el.src, 'video');
      if (el.dataset.videoUrl) this.addVideo(el.dataset.videoUrl, 'data-attr');
      el.querySelectorAll?.('source')?.forEach(s => {
        if (s.src) this.addVideo(s.src, 'source');
      });
    });

    // Search in scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const matches = content.matchAll(/"videoUrl"\s*:\s*"([^"]+)"/g);
      for (const match of matches) {
        if (this.isValidVideoUrl(match[1])) {
          this.addVideo(this.cleanUrl(match[1]), 'script');
        }
      }
    });
  }

  async extractAlibabaVideos() {
    // Similar approach to AliExpress
    const videoElements = document.querySelectorAll('video, .video-player');
    videoElements.forEach(el => {
      if (el.src) this.addVideo(el.src, 'video');
      el.querySelectorAll?.('source')?.forEach(s => {
        if (s.src) this.addVideo(s.src, 'source');
      });
    });

    // 1688.com specific patterns
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const patterns = [
        /https?:\/\/cloud\.video\.taobao\.com[^"'\s]+/g,
        /https?:\/\/[^"'\s]+1688[^"'\s]+\.mp4[^"'\s]*/g,
        /"videoUrl"\s*:\s*"([^"]+)"/g
      ];
      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            this.addVideo(this.cleanUrl(url), 'script');
          }
        }
      });
    });
  }

  async extractSheinVideos() {
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      if (video.src) this.addVideo(video.src, 'video');
      const sources = video.querySelectorAll('source');
      sources.forEach(s => {
        if (s.src) this.addVideo(s.src, 'source');
      });
    });

    // Shein often loads videos dynamically
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const patterns = [
        /https?:\/\/[^"'\s]+shein[^"'\s]+\.mp4[^"'\s]*/gi,
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /"video_url"\s*:\s*"([^"]+)"/g
      ];
      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            this.addVideo(this.cleanUrl(url), 'script');
          }
        }
      });
    });
  }

  async extractGenericVideos() {
    // Generic extraction for unsupported platforms
    const videoElements = document.querySelectorAll('video');
    videoElements.forEach(video => {
      if (video.src) this.addVideo(video.src, 'video');
      video.querySelectorAll('source').forEach(s => {
        if (s.src) this.addVideo(s.src, 'source');
      });
    });

    // Check data attributes
    document.querySelectorAll('[data-video-url], [data-video-src], [data-video]').forEach(el => {
      const url = el.dataset.videoUrl || el.dataset.videoSrc || el.dataset.video;
      if (url && this.isValidVideoUrl(url)) {
        this.addVideo(url.startsWith('//') ? 'https:' + url : url, 'data-attr');
      }
    });

    // Look for common video URL patterns in scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const patterns = [
        /https?:\/\/[^"'\s]+\.(mp4|webm|mov|m3u8)[^"'\s]*/gi,
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /"video_url"\s*:\s*"([^"]+)"/g,
        /"mediaUrl"\s*:\s*"([^"]+)"/g
      ];
      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          const url = match[1] || match[0];
          if (this.isValidVideoUrl(url)) {
            this.addVideo(this.cleanUrl(url), 'generic');
          }
        }
      });
    });

    // Check iframes
    document.querySelectorAll('iframe[src*="video"], iframe[src*="player"], iframe[src*="youtube"], iframe[src*="vimeo"]').forEach(iframe => {
      this.addVideo(iframe.src, 'iframe');
    });
  }

  isValidVideoUrl(url) {
    if (!url) return false;
    
    // Filter out tracking pixels, ads, and invalid URLs
    const invalidPatterns = [
      /analytics/i,
      /tracking/i,
      /pixel/i,
      /beacon/i,
      /ads\./i,
      /advertisement/i,
      /\.gif$/i,
      /\.png$/i,
      /\.jpg$/i,
      /doubleclick/i,
      /facebook\.com\/tr/i,
      /google-analytics/i
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(url)) return false;
    }

    // Must be a video URL
    const validPatterns = [
      /\.mp4/i,
      /\.webm/i,
      /\.mov/i,
      /\.m3u8/i,
      /video/i,
      /player/i,
      /cloudfront.*video/i,
      /taobao\.com/i,
      /youtube\.com/i,
      /youtu\.be/i,
      /vimeo\.com/i
    ];

    return validPatterns.some(p => p.test(url));
  }

  cleanUrl(url) {
    // Remove escape characters and clean the URL
    return url
      .replace(/\\u002F/g, '/')
      .replace(/\\/g, '')
      .replace(/&amp;/g, '&')
      .split('"')[0]
      .split("'")[0]
      .trim();
  }

  addVideo(url, source) {
    let cleanedUrl = this.cleanUrl(url);
    
    // Handle protocol-relative URLs
    if (cleanedUrl.startsWith('//')) {
      cleanedUrl = 'https:' + cleanedUrl;
    }
    
    // Check for duplicates
    if (!this.extractedVideos.find(v => v.url === cleanedUrl)) {
      this.extractedVideos.push({
        url: cleanedUrl,
        source: source,
        platform: this.platform,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Get thumbnail for video (if available)
  async generateThumbnail(videoUrl) {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.src = videoUrl;
      video.currentTime = 1;
      
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      
      video.onerror = () => resolve(null);
      
      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }
}

// Make available globally
window.DropCraftVideoExtractor = DropCraftVideoExtractor;
