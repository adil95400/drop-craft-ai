// ============================================
// ShopOpti+ Tracking Sync v5.7.0
// Tracking number injection to stores
// ============================================

const ShopOptiTrackingSync = {
  API_URL: 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1',

  // Carrier detection patterns
  carriers: {
    'ups': { patterns: [/^1Z/i], name: 'UPS', trackingUrl: 'https://www.ups.com/track?tracknum=' },
    'fedex': { patterns: [/^\d{12,22}$/], name: 'FedEx', trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=' },
    'usps': { patterns: [/^9[0-9]{21}$/, /^[A-Z]{2}\d{9}US$/i], name: 'USPS', trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' },
    'dhl': { patterns: [/^\d{10}$/, /^[A-Z]{3}\d{7}$/i], name: 'DHL', trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=' },
    'china_post': { patterns: [/^[A-Z]{2}\d{9}CN$/i], name: 'China Post', trackingUrl: 'https://track.yw56.com.cn/en-US/track?nums=' },
    'yanwen': { patterns: [/^YANWEN/i, /^YW/i], name: 'Yanwen', trackingUrl: 'https://track.yw56.com.cn/en-US/track?nums=' },
    'cainiao': { patterns: [/^LP\d{14,18}$/i, /^CAINIAO/i], name: 'Cainiao', trackingUrl: 'https://global.cainiao.com/detail.htm?mailNoList=' },
    'yuntrack': { patterns: [/^YT\d{16}$/i], name: 'Yun Express', trackingUrl: 'https://www.yuntrack.com/Track/Detail?id=' },
    '4px': { patterns: [/^4PX/i], name: '4PX', trackingUrl: 'https://track.4px.com/#/result/0/' },
    'colissimo': { patterns: [/^[0-9A-Z]{11,15}$/i], name: 'Colissimo', trackingUrl: 'https://www.laposte.fr/outils/suivre-vos-envois?code=' },
    'chronopost': { patterns: [/^[A-Z]{2}\d{9}FR$/i], name: 'Chronopost', trackingUrl: 'https://www.chronopost.fr/tracking-no-cms/suivi-page?listeNumerosLT=' }
  },

  /**
   * Detect carrier from tracking number
   */
  detectCarrier(trackingNumber) {
    if (!trackingNumber) return null;
    
    const normalized = trackingNumber.trim().toUpperCase();
    
    for (const [code, carrier] of Object.entries(this.carriers)) {
      for (const pattern of carrier.patterns) {
        if (pattern.test(normalized)) {
          return {
            code,
            name: carrier.name,
            trackingUrl: carrier.trackingUrl + normalized,
            trackingNumber: normalized
          };
        }
      }
    }
    
    // Default to generic
    return {
      code: 'other',
      name: 'Other',
      trackingUrl: `https://17track.net/en/track#nums=${normalized}`,
      trackingNumber: normalized
    };
  },

  /**
   * Sync tracking to store via API
   */
  async syncToStore(orderId, trackingData, storeId) {
    try {
      const response = await fetch(`${this.API_URL}/tracking-inject-store`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': typeof ShopOptiAuth !== 'undefined' ? ShopOptiAuth.token : ''
        },
        body: JSON.stringify({
          action: 'inject_tracking',
          orderId,
          storeId,
          tracking: {
            number: trackingData.trackingNumber,
            carrier: trackingData.code,
            carrierName: trackingData.name,
            url: trackingData.trackingUrl
          }
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[TrackingSync] Error syncing to store:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Batch sync multiple tracking numbers
   */
  async batchSync(trackingUpdates) {
    const results = [];
    
    for (const update of trackingUpdates) {
      const carrier = this.detectCarrier(update.trackingNumber);
      const result = await this.syncToStore(update.orderId, carrier, update.storeId);
      results.push({
        ...update,
        carrier,
        syncResult: result
      });
      
      // Small delay between requests
      await new Promise(r => setTimeout(r, 200));
    }
    
    return results;
  },

  /**
   * Get tracking status from 17track API
   */
  async getTrackingStatus(trackingNumber) {
    try {
      const response = await fetch(`${this.API_URL}/tracking-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-extension-token': typeof ShopOptiAuth !== 'undefined' ? ShopOptiAuth.token : ''
        },
        body: JSON.stringify({
          action: 'get_status',
          trackingNumber
        })
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Watch for tracking updates on supplier order pages
   */
  watchForTracking(callback) {
    const observer = new MutationObserver(() => {
      // Check for new tracking numbers on page
      const trackingResult = this.scanPageForTracking();
      if (trackingResult.found) {
        callback(trackingResult);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Initial scan
    const initialResult = this.scanPageForTracking();
    if (initialResult.found) {
      callback(initialResult);
    }
    
    return () => observer.disconnect();
  },

  /**
   * Scan page for tracking numbers
   */
  scanPageForTracking() {
    const trackingPatterns = [
      /\b(1Z[A-Z0-9]{16})\b/i,           // UPS
      /\b(\d{20,22})\b/,                  // FedEx/long numeric
      /\b([A-Z]{2}\d{9}[A-Z]{2})\b/i,    // International
      /\b(JD\d{12,15})\b/i,               // JD
      /\b(YANWEN\w{10,20})\b/i,           // Yanwen
      /\b(YT\d{16})\b/i,                  // Yun Track
      /\b(LP\d{14,18})\b/i,               // Cainiao
      /\b(4PX\w{10,20})\b/i               // 4PX
    ];
    
    const containers = document.querySelectorAll(
      '[class*="tracking"], [class*="shipment"], [id*="tracking"], ' +
      '[class*="delivery"], [data-tracking], [class*="order-detail"]'
    );
    
    const found = [];
    
    for (const container of containers) {
      const text = container.textContent || '';
      for (const pattern of trackingPatterns) {
        const matches = text.matchAll(new RegExp(pattern, 'gi'));
        for (const match of matches) {
          const trackingNumber = match[1];
          if (!found.some(f => f.trackingNumber === trackingNumber)) {
            const carrier = this.detectCarrier(trackingNumber);
            found.push({
              trackingNumber,
              carrier,
              element: container
            });
          }
        }
      }
    }
    
    return {
      found: found.length > 0,
      trackingNumbers: found
    };
  },

  /**
   * Format tracking for display
   */
  formatTrackingForDisplay(trackingNumber) {
    const carrier = this.detectCarrier(trackingNumber);
    return {
      number: trackingNumber,
      carrier: carrier.name,
      url: carrier.trackingUrl,
      icon: this.getCarrierIcon(carrier.code)
    };
  },

  /**
   * Get carrier icon class
   */
  getCarrierIcon(carrierCode) {
    const icons = {
      'ups': '📦',
      'fedex': '📫',
      'usps': '🇺🇸',
      'dhl': '🟡',
      'china_post': '🇨🇳',
      'yanwen': '✈️',
      'cainiao': '🐤',
      'yuntrack': '🚀',
      '4px': '📮',
      'colissimo': '🇫🇷',
      'chronopost': '⚡',
      'other': '📍'
    };
    return icons[carrierCode] || '📍';
  }
};

// Export
if (typeof window !== 'undefined') {
  window.ShopOptiTrackingSync = ShopOptiTrackingSync;
}
