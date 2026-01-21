/**
 * Drop Craft AI - Video Extractor Module
 * Extracts product videos from supported platforms
 */

class DropCraftVideoExtractor {
  constructor() {
    this.extractedVideos = [];
    this.platform = this.detectPlatform();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('aliexpress')) return 'aliexpress';
    if (hostname.includes('amazon')) return 'amazon';
    if (hostname.includes('temu')) return 'temu';
    if (hostname.includes('ebay')) return 'ebay';
    if (hostname.includes('alibaba') || hostname.includes('1688')) return 'alibaba';
    if (hostname.includes('shein')) return 'shein';
    return 'unknown';
  }

  async extractVideos() {
    this.extractedVideos = [];
    
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
      default:
        await this.extractGenericVideos();
    }

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

    // Method 2: Search in page scripts for video URLs
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      
      // Look for video URLs in JSON data
      const videoPatterns = [
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /"video_url"\s*:\s*"([^"]+)"/g,
        /"videoId"\s*:\s*"([^"]+)"/g,
        /https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g,
        /https?:\/\/cloud\.video\.taobao\.com[^"'\s]+/g,
        /https?:\/\/video\.aliexpress[^"'\s]+/g
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
    const videoThumbnails = document.querySelectorAll('[data-video], [data-video-url], .video-thumbnail');
    videoThumbnails.forEach(thumb => {
      const videoUrl = thumb.dataset.video || thumb.dataset.videoUrl;
      if (videoUrl && this.isValidVideoUrl(videoUrl)) {
        this.addVideo(videoUrl, 'thumbnail');
      }
    });

    // Method 4: Check for iframe embeds
    const iframes = document.querySelectorAll('iframe[src*="video"], iframe[src*="player"]');
    iframes.forEach(iframe => {
      this.addVideo(iframe.src, 'iframe');
    });
  }

  async extractAmazonVideos() {
    // Method 1: Video player in product gallery
    const videoBlocks = document.querySelectorAll('.vse-player video, #vse-player video, .a-video-content video');
    videoBlocks.forEach(video => {
      if (video.src && this.isValidVideoUrl(video.src)) {
        this.addVideo(video.src, 'player');
      }
    });

    // Method 2: Look in data attributes
    const videoContainers = document.querySelectorAll('[data-video-url], [data-mp4-url]');
    videoContainers.forEach(container => {
      const url = container.dataset.videoUrl || container.dataset.mp4Url;
      if (url && this.isValidVideoUrl(url)) {
        this.addVideo(url, 'data-attribute');
      }
    });

    // Method 3: Search in page scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      
      const patterns = [
        /"url"\s*:\s*"(https?:\/\/[^"]+\.mp4[^"]*)"/g,
        /"videoUrl"\s*:\s*"([^"]+)"/g,
        /https?:\/\/[^"'\s]+cloudfront\.net[^"'\s]+\.mp4[^"'\s]*/g,
        /https?:\/\/[^"'\s]+amazon[^"'\s]+\.mp4[^"'\s]*/g
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
    const aplusVideos = document.querySelectorAll('.aplus-module video, #aplus video');
    aplusVideos.forEach(video => {
      if (video.src) {
        this.addVideo(video.src, 'aplus');
      }
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
      const matches = content.matchAll(/https?:\/\/[^"'\s]+\.mp4[^"'\s]*/g);
      for (const match of matches) {
        if (this.isValidVideoUrl(match[0])) {
          this.addVideo(this.cleanUrl(match[0]), 'script');
        }
      }
    });
  }

  async extractAlibabaVideos() {
    // Similar approach to AliExpress
    const videoElements = document.querySelectorAll('video, .video-player');
    videoElements.forEach(el => {
      if (el.src) this.addVideo(el.src, 'video');
    });

    // 1688.com specific patterns
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const patterns = [
        /https?:\/\/cloud\.video\.taobao\.com[^"'\s]+/g,
        /https?:\/\/[^"'\s]+1688[^"'\s]+\.mp4[^"'\s]*/g
      ];
      patterns.forEach(pattern => {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          this.addVideo(this.cleanUrl(match[0]), 'script');
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
      const matches = content.matchAll(/https?:\/\/[^"'\s]+shein[^"'\s]+\.mp4[^"'\s]*/gi);
      for (const match of matches) {
        this.addVideo(this.cleanUrl(match[0]), 'script');
      }
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

    // Look for common video URL patterns in scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      const content = script.textContent || '';
      const matches = content.matchAll(/https?:\/\/[^"'\s]+\.(mp4|webm|mov)[^"'\s]*/gi);
      for (const match of matches) {
        if (this.isValidVideoUrl(match[0])) {
          this.addVideo(this.cleanUrl(match[0]), 'generic');
        }
      }
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
      /\.jpg$/i
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(url)) return false;
    }

    // Must be a video URL
    const validPatterns = [
      /\.mp4/i,
      /\.webm/i,
      /\.mov/i,
      /video/i,
      /player/i,
      /cloudfront/i,
      /taobao\.com/i
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
    const cleanedUrl = this.cleanUrl(url);
    
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
