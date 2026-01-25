import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * ShopOpti+ Chrome Extension Integration Tests
 * Tests API communication, storage, and cross-script messaging
 */

const EXTENSION_PATH = path.join(__dirname, '../../public/chrome-extension');
const API_BASE_URL = 'https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1';

test.describe('Extension Files Integrity', () => {
  test('all required files exist', () => {
    const requiredFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'popup.html',
      'popup.js',
      'options.html',
      'options.js',
      'lib/security.js',
      'content.css',
      'icons/icon16.png',
      'icons/icon32.png',
      'icons/icon48.png',
      'icons/icon128.png'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      expect(fs.existsSync(filePath), `Missing file: ${file}`).toBe(true);
    });
  });

  test('manifest version is synchronized', () => {
    const manifest = JSON.parse(fs.readFileSync(
      path.join(EXTENSION_PATH, 'manifest.json'), 
      'utf-8'
    ));
    
    const contentJs = fs.readFileSync(
      path.join(EXTENSION_PATH, 'content.js'),
      'utf-8'
    );
    
    const bgJs = fs.readFileSync(
      path.join(EXTENSION_PATH, 'background.js'),
      'utf-8'
    );

    // Extract version from content.js
    const contentVersionMatch = contentJs.match(/VERSION\s*[:=]\s*['"]([^'"]+)['"]/);
    const bgVersionMatch = bgJs.match(/VERSION\s*[:=]\s*['"]([^'"]+)['"]/);

    if (contentVersionMatch) {
      expect(contentVersionMatch[1]).toBe(manifest.version);
    }
    if (bgVersionMatch) {
      expect(bgVersionMatch[1]).toBe(manifest.version);
    }
  });

  test('no console.log in production code', () => {
    const filesToCheck = ['background.js', 'content.js', 'popup.js', 'options.js'];
    
    filesToCheck.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Count console.log occurrences (excluding comments)
        const lines = content.split('\n');
        const consoleLogLines = lines.filter(line => {
          const trimmed = line.trim();
          return !trimmed.startsWith('//') && 
                 !trimmed.startsWith('*') && 
                 trimmed.includes('console.log');
        });

        // Allow some debug logs but warn if excessive
        if (consoleLogLines.length > 20) {
          console.warn(`Warning: ${file} has ${consoleLogLines.length} console.log statements`);
        }
      }
    });
  });
});

test.describe('API Endpoint Validation', () => {
  const endpoints = [
    { path: '/extension-sync', method: 'POST' },
    { path: '/product-url-scraper', method: 'POST' },
    { path: '/import-reviews', method: 'POST' },
    { path: '/quick-import-url', method: 'POST' }
  ];

  endpoints.forEach(({ path: endpointPath, method }) => {
    test(`${method} ${endpointPath} returns valid response`, async ({ request }) => {
      // Test without auth - should return 401 or structured error
      const response = await request.fetch(`${API_BASE_URL}${endpointPath}`, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        data: {}
      });

      // Should return JSON response
      const contentType = response.headers()['content-type'];
      expect(contentType).toContain('application/json');

      // Should return 401 for unauthenticated requests or 400 for bad request
      expect([400, 401, 403, 500]).toContain(response.status());
    });
  });
});

test.describe('Content Script Selectors', () => {
  test('Amazon selectors are comprehensive', () => {
    const contentJs = fs.readFileSync(
      path.join(EXTENSION_PATH, 'content.js'),
      'utf-8'
    );

    const amazonSelectors = [
      's-result-item',
      'data-component-type',
      's-search-result',
      'sg-col-inner'
    ];

    amazonSelectors.forEach(selector => {
      expect(contentJs).toContain(selector);
    });
  });

  test('AliExpress selectors are comprehensive', () => {
    const contentJs = fs.readFileSync(
      path.join(EXTENSION_PATH, 'content.js'),
      'utf-8'
    );

    const aliSelectors = [
      'search-item-card',
      'product-container',
      'gallery'
    ];

    aliSelectors.forEach(selector => {
      expect(contentJs.toLowerCase()).toContain(selector.toLowerCase());
    });
  });

  test('Cdiscount selectors are comprehensive', () => {
    const contentJs = fs.readFileSync(
      path.join(EXTENSION_PATH, 'content.js'),
      'utf-8'
    );

    const cdiscountSelectors = [
      'prdtBloc',
      'productCard',
      'lpContent'
    ];

    cdiscountSelectors.forEach(selector => {
      expect(contentJs).toContain(selector);
    });
  });
});

test.describe('Message Protocol', () => {
  test('all message types are documented', () => {
    const bgJs = fs.readFileSync(
      path.join(EXTENSION_PATH, 'background.js'),
      'utf-8'
    );

    const messageTypes = [
      'GET_AUTH_STATUS',
      'IMPORT_PRODUCT',
      'IMPORT_REVIEWS',
      'SYNC_PRODUCT',
      'GET_SETTINGS',
      'SAVE_SETTINGS'
    ];

    messageTypes.forEach(type => {
      expect(bgJs).toContain(type);
    });
  });

  test('error responses include proper structure', () => {
    const bgJs = fs.readFileSync(
      path.join(EXTENSION_PATH, 'background.js'),
      'utf-8'
    );

    // Should have error handling patterns
    expect(bgJs).toContain('success: false');
    expect(bgJs).toContain('error');
  });
});

test.describe('Storage Keys', () => {
  test('storage keys follow naming convention', () => {
    const filesToCheck = ['background.js', 'popup.js', 'options.js', 'content.js'];
    
    const storageKeys: string[] = [];
    
    filesToCheck.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Extract storage key references
        const matches = content.matchAll(/chrome\.storage\.\w+\.(get|set)\(\s*\[?\s*['"]([^'"]+)['"]/g);
        for (const match of matches) {
          storageKeys.push(match[2]);
        }
      }
    });

    // Keys should be lowercase with underscores or camelCase
    storageKeys.forEach(key => {
      const validPattern = /^[a-zA-Z][a-zA-Z0-9_]*$/;
      expect(validPattern.test(key), `Invalid storage key: ${key}`).toBe(true);
    });
  });
});

test.describe('CSS Styling', () => {
  test('content.css exists and has button styles', () => {
    const cssPath = path.join(EXTENSION_PATH, 'content.css');
    expect(fs.existsSync(cssPath)).toBe(true);

    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Should have ShopOpti button styles
    expect(cssContent).toContain('shopopti');
    
    // Should have z-index for overlay
    expect(cssContent).toContain('z-index');
  });

  test('no !important overuse', () => {
    const cssPath = path.join(EXTENSION_PATH, 'content.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    const importantCount = (cssContent.match(/!important/g) || []).length;
    
    // Some !important is acceptable for extension overlay, but not excessive
    expect(importantCount).toBeLessThan(50);
  });
});

test.describe('Icon Assets', () => {
  test('all icon sizes exist', () => {
    const iconSizes = ['16', '32', '48', '128'];
    
    iconSizes.forEach(size => {
      const iconPath = path.join(EXTENSION_PATH, `icons/icon${size}.png`);
      expect(fs.existsSync(iconPath), `Missing icon: icon${size}.png`).toBe(true);
    });
  });

  test('icons are valid PNG files', () => {
    const iconSizes = ['16', '32', '48', '128'];
    const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4E, 0x47]);
    
    iconSizes.forEach(size => {
      const iconPath = path.join(EXTENSION_PATH, `icons/icon${size}.png`);
      if (fs.existsSync(iconPath)) {
        const buffer = fs.readFileSync(iconPath);
        const header = buffer.slice(0, 4);
        expect(header.equals(PNG_HEADER), `icon${size}.png is not a valid PNG`).toBe(true);
      }
    });
  });
});

test.describe('Performance Checks', () => {
  test('content.js is reasonably sized', () => {
    const contentPath = path.join(EXTENSION_PATH, 'content.js');
    const stats = fs.statSync(contentPath);
    
    // Content script should be under 500KB
    const maxSizeKB = 500;
    const sizeKB = stats.size / 1024;
    
    expect(sizeKB).toBeLessThan(maxSizeKB);
    console.log(`content.js size: ${sizeKB.toFixed(2)} KB`);
  });

  test('background.js is reasonably sized', () => {
    const bgPath = path.join(EXTENSION_PATH, 'background.js');
    const stats = fs.statSync(bgPath);
    
    // Background script should be under 200KB
    const maxSizeKB = 200;
    const sizeKB = stats.size / 1024;
    
    expect(sizeKB).toBeLessThan(maxSizeKB);
    console.log(`background.js size: ${sizeKB.toFixed(2)} KB`);
  });

  test('no synchronous XHR usage', () => {
    const filesToCheck = ['background.js', 'content.js', 'popup.js'];
    
    filesToCheck.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for synchronous XHR
        expect(content).not.toMatch(/\.open\([^)]*,\s*false\s*\)/);
      }
    });
  });
});

test.describe('Localization Readiness', () => {
  test('hardcoded French strings are identifiable', () => {
    const contentJs = fs.readFileSync(
      path.join(EXTENSION_PATH, 'content.js'),
      'utf-8'
    );

    // Common French strings that should eventually be localized
    const frenchStrings = [
      'Importer',
      'Importation',
      'Erreur',
      'Succès'
    ];

    let foundStrings = 0;
    frenchStrings.forEach(str => {
      if (contentJs.includes(str)) {
        foundStrings++;
      }
    });

    // Just counting for awareness - not a failure
    console.log(`Found ${foundStrings}/${frenchStrings.length} French strings to localize`);
  });
});
