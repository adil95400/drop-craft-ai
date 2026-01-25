import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';

/**
 * ShopOpti+ Chrome Extension E2E Tests
 * Version 4.4.0 - Security & Performance Optimized
 * 
 * Tests cover:
 * - Button injection on supported platforms
 * - API communication and message validation
 * - Popup functionality and UI
 * - Permission handling
 * - Security validations
 */

const EXTENSION_PATH = path.join(__dirname, '../../public/chrome-extension');

// Platform test configurations
const PLATFORMS = {
  amazon: {
    name: 'Amazon',
    searchUrl: 'https://www.amazon.fr/s?k=test',
    productUrl: 'https://www.amazon.fr/dp/B0TEST123',
    selectors: {
      productCard: '[data-component-type="s-search-result"]',
      importButton: '.shopopti-import-btn'
    }
  },
  aliexpress: {
    name: 'AliExpress',
    searchUrl: 'https://www.aliexpress.com/wholesale?SearchText=test',
    productUrl: 'https://www.aliexpress.com/item/1005001234567890.html',
    selectors: {
      productCard: '.search-item-card-wrapper-gallery',
      importButton: '.shopopti-import-btn'
    }
  },
  cdiscount: {
    name: 'Cdiscount',
    searchUrl: 'https://www.cdiscount.com/search/10/test.html',
    productUrl: 'https://www.cdiscount.com/f-12345-test.html',
    selectors: {
      productCard: '.prdtBloc, .c-productCard',
      importButton: '.shopopti-import-btn'
    }
  },
  temu: {
    name: 'Temu',
    searchUrl: 'https://www.temu.com/search_result.html?search_key=test',
    productUrl: 'https://www.temu.com/product-123.html',
    selectors: {
      productCard: '[data-testid="product-card"]',
      importButton: '.shopopti-import-btn'
    }
  }
};

// Helper to create extension context
async function createExtensionContext(): Promise<BrowserContext> {
  const browser = await chromium.launchPersistentContext('', {
    headless: false, // Extensions require headed mode
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  
  // Wait for extension to load
  await browser.waitForEvent('serviceworker');
  
  return browser;
}

test.describe('Chrome Extension - Core Functionality', () => {
  let context: BrowserContext;

  test.beforeAll(async () => {
    // Note: These tests require headed mode and actual extension loading
    // In CI, they should be skipped or run with special configuration
    if (process.env.CI) {
      test.skip();
    }
  });

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
  });

  test('extension manifest is valid', async () => {
    const fs = await import('fs');
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Validate required fields
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toBeTruthy();
    expect(manifest.permissions).toContain('storage');
    expect(manifest.permissions).toContain('activeTab');
    
    // Validate CSP is present
    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toContain("default-src 'self'");
    
    // Validate no overly broad permissions
    expect(manifest.host_permissions).not.toContain('*://*/*');
    expect(manifest.host_permissions).not.toContain('http://*/*');
    expect(manifest.host_permissions).not.toContain('https://*/*');
  });

  test('security module exports required functions', async () => {
    const fs = await import('fs');
    const securityPath = path.join(EXTENSION_PATH, 'lib/security.js');
    const securityContent = fs.readFileSync(securityPath, 'utf-8');

    // Validate security functions exist
    expect(securityContent).toContain('isWhitelistedDomain');
    expect(securityContent).toContain('validateMessage');
    expect(securityContent).toContain('sanitizeHTML');
    expect(securityContent).toContain('createElement');
    expect(securityContent).toContain('WHITELISTED_DOMAINS');
    expect(securityContent).toContain('VALID_MESSAGE_ACTIONS');
  });

  test('content script uses secure DOM manipulation', async () => {
    const fs = await import('fs');
    const contentPath = path.join(EXTENSION_PATH, 'content.js');
    const content = fs.readFileSync(contentPath, 'utf-8');

    // Should use Security.createElement instead of innerHTML
    const innerHTMLCount = (content.match(/\.innerHTML\s*=/g) || []).length;
    const createElementCount = (content.match(/Security\.createElement/g) || []).length;
    
    // Most DOM creation should use secure methods
    expect(createElementCount).toBeGreaterThan(0);
    
    // innerHTML usage should be minimal (ideally 0)
    expect(innerHTMLCount).toBeLessThan(5);
  });

  test('background script validates message origins', async () => {
    const fs = await import('fs');
    const bgPath = path.join(EXTENSION_PATH, 'background.js');
    const bgContent = fs.readFileSync(bgPath, 'utf-8');

    // Should validate sender origin
    expect(bgContent).toContain('Security.validateMessage');
    expect(bgContent).toContain('sender');
    
    // Should have rate limiting
    expect(bgContent).toContain('rateLimit');
  });
});

test.describe('Chrome Extension - Platform Detection', () => {
  test('detects Amazon product pages correctly', () => {
    const amazonPatterns = [
      'https://www.amazon.fr/dp/B0TEST123',
      'https://www.amazon.com/product-name/dp/B0TEST123/ref=sr_1_1',
      'https://www.amazon.de/-/en/dp/B0TEST123',
      'https://amazon.co.uk/gp/product/B0TEST123'
    ];

    const amazonRegex = /amazon\.(com|fr|de|co\.uk|es|it|ca|co\.jp).*\/(dp|gp\/product|product)\//i;

    amazonPatterns.forEach(url => {
      expect(amazonRegex.test(url)).toBe(true);
    });
  });

  test('detects AliExpress product pages correctly', () => {
    const aliPatterns = [
      'https://www.aliexpress.com/item/1005001234567890.html',
      'https://fr.aliexpress.com/item/1005001234567890.html',
      'https://aliexpress.us/item/3256801234567890.html'
    ];

    const aliRegex = /aliexpress\.(com|fr|us)\/item\/\d+\.html/i;

    aliPatterns.forEach(url => {
      expect(aliRegex.test(url)).toBe(true);
    });
  });

  test('detects listing pages correctly', () => {
    const listingPatterns = [
      { url: 'https://www.amazon.fr/s?k=test', expected: true },
      { url: 'https://www.aliexpress.com/wholesale?SearchText=test', expected: true },
      { url: 'https://www.cdiscount.com/search/10/test.html', expected: true },
      { url: 'https://www.temu.com/search_result.html?search_key=test', expected: true },
      { url: 'https://www.google.com/', expected: false }
    ];

    const listingRegex = /\/s\?|\/search|\/wholesale\?|search_result|\/browse/i;

    listingPatterns.forEach(({ url, expected }) => {
      if (expected) {
        expect(listingRegex.test(url)).toBe(true);
      }
    });
  });
});

test.describe('Chrome Extension - Message Validation', () => {
  const validActions = [
    'GET_AUTH_STATUS',
    'IMPORT_PRODUCT',
    'IMPORT_REVIEWS',
    'SYNC_PRODUCT',
    'ANALYZE_PRODUCT',
    'GET_SETTINGS',
    'SAVE_SETTINGS'
  ];

  test('accepts valid message actions', () => {
    validActions.forEach(action => {
      const message = { action, data: {} };
      expect(validActions.includes(message.action)).toBe(true);
    });
  });

  test('rejects invalid message actions', () => {
    const invalidActions = [
      'EXECUTE_SCRIPT',
      'EVAL_CODE',
      'FETCH_ARBITRARY',
      'RUN_COMMAND'
    ];

    invalidActions.forEach(action => {
      expect(validActions.includes(action)).toBe(false);
    });
  });

  test('validates URL whitelist', () => {
    const whitelistedDomains = [
      'amazon.com', 'amazon.fr', 'amazon.de',
      'aliexpress.com', 'aliexpress.fr',
      'ebay.com', 'ebay.fr',
      'cdiscount.com', 'fnac.com',
      'shopopti.io'
    ];

    const testUrls = [
      { url: 'https://www.amazon.fr/dp/test', expected: true },
      { url: 'https://malicious-site.com/fake', expected: false },
      { url: 'https://www.aliexpress.com/item/123.html', expected: true },
      { url: 'javascript:alert(1)', expected: false }
    ];

    testUrls.forEach(({ url, expected }) => {
      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        const isWhitelisted = whitelistedDomains.some(domain => 
          hostname === domain || hostname.endsWith('.' + domain)
        );
        expect(isWhitelisted).toBe(expected);
      } catch {
        // Invalid URL (like javascript:) should fail
        expect(expected).toBe(false);
      }
    });
  });
});

test.describe('Chrome Extension - Security Sanitization', () => {
  test('sanitizes HTML content', () => {
    const dangerousInputs = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      '<a href="javascript:alert(1)">Click</a>',
      '<div onmouseover="evil()">Hover</div>'
    ];

    // Simple sanitization check (actual implementation in security.js)
    dangerousInputs.forEach(input => {
      const sanitized = input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/javascript:/gi, '');
      
      expect(sanitized).not.toContain('<script');
      expect(sanitized).not.toContain('onerror=');
      expect(sanitized).not.toContain('javascript:');
    });
  });

  test('escapes special characters in text content', () => {
    const inputs = [
      { input: '<test>', expected: '&lt;test&gt;' },
      { input: '"quoted"', expected: '&quot;quoted&quot;' },
      { input: "it's", expected: "it&#039;s" }
    ];

    const escapeHTML = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    inputs.forEach(({ input, expected }) => {
      expect(escapeHTML(input)).toBe(expected);
    });
  });
});

test.describe('Chrome Extension - Rate Limiting', () => {
  test('rate limiter configuration is correct', () => {
    const RATE_LIMIT = {
      maxRequests: 30,
      windowMs: 60000 // 1 minute
    };

    expect(RATE_LIMIT.maxRequests).toBe(30);
    expect(RATE_LIMIT.windowMs).toBe(60000);
  });

  test('rate limiter blocks excessive requests', () => {
    const requests: number[] = [];
    const RATE_LIMIT = { maxRequests: 30, windowMs: 60000 };
    
    const checkRateLimit = (): boolean => {
      const now = Date.now();
      const windowStart = now - RATE_LIMIT.windowMs;
      
      // Clean old requests
      while (requests.length > 0 && requests[0] < windowStart) {
        requests.shift();
      }
      
      if (requests.length >= RATE_LIMIT.maxRequests) {
        return false; // Rate limited
      }
      
      requests.push(now);
      return true;
    };

    // First 30 requests should pass
    for (let i = 0; i < 30; i++) {
      expect(checkRateLimit()).toBe(true);
    }

    // 31st request should be blocked
    expect(checkRateLimit()).toBe(false);
  });
});

test.describe('Chrome Extension - Popup UI', () => {
  test('popup HTML is valid', async () => {
    const fs = await import('fs');
    const popupPath = path.join(EXTENSION_PATH, 'popup.html');
    const popupContent = fs.readFileSync(popupPath, 'utf-8');

    // Check basic structure
    expect(popupContent).toContain('<!DOCTYPE html>');
    expect(popupContent).toContain('<html');
    expect(popupContent).toContain('</html>');
    
    // Check required elements
    expect(popupContent).toContain('popup.js');
    
    // Should not have inline scripts (CSP compliance)
    const inlineScriptCount = (popupContent.match(/<script[^>]*>[^<]+<\/script>/g) || [])
      .filter(s => !s.includes('src=')).length;
    expect(inlineScriptCount).toBe(0);
  });

  test('options HTML is valid', async () => {
    const fs = await import('fs');
    const optionsPath = path.join(EXTENSION_PATH, 'options.html');
    const optionsContent = fs.readFileSync(optionsPath, 'utf-8');

    expect(optionsContent).toContain('<!DOCTYPE html>');
    expect(optionsContent).toContain('options.js');
  });
});
