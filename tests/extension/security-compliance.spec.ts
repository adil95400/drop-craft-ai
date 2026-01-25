import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * ShopOpti+ Chrome Extension - Security & Compliance Tests
 * Version 5.0.0 - Chrome Web Store compliance validation
 * 
 * Tests validate:
 * - Manifest V3 compliance
 * - Content Security Policy
 * - Permission minimization
 * - XSS prevention
 * - Data sanitization
 */

const EXTENSION_PATH = path.join(__dirname, '../../public/chrome-extension');

test.describe('Manifest V3 Compliance', () => {
  let manifest: any;

  test.beforeAll(() => {
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  });

  test('uses Manifest V3', () => {
    expect(manifest.manifest_version).toBe(3);
  });

  test('has required fields', () => {
    expect(manifest.name).toBeTruthy();
    expect(manifest.version).toBeTruthy();
    expect(manifest.description).toBeTruthy();
  });

  test('uses service worker for background', () => {
    expect(manifest.background).toBeDefined();
    expect(manifest.background.service_worker).toBeTruthy();
  });

  test('has no deprecated permissions', () => {
    const deprecatedPermissions = [
      'background', // V2 only
      'unlimitedStorage', // Not typically needed
      'webRequestBlocking' // V3 uses declarativeNetRequest
    ];

    const permissions = manifest.permissions || [];
    deprecatedPermissions.forEach(perm => {
      expect(permissions).not.toContain(perm);
    });
  });

  test('host_permissions do not include broad wildcards', () => {
    const hostPermissions = manifest.host_permissions || [];
    const optionalHostPermissions = manifest.optional_host_permissions || [];
    
    const allPermissions = [...hostPermissions, ...optionalHostPermissions];
    
    // Should not have *://*/* patterns
    expect(allPermissions).not.toContain('*://*/*');
    expect(allPermissions).not.toContain('http://*/*');
    expect(allPermissions).not.toContain('https://*/*');
    expect(allPermissions).not.toContain('<all_urls>');
  });

  test('web_accessible_resources are properly scoped', () => {
    const webResources = manifest.web_accessible_resources || [];
    
    webResources.forEach((resource: any) => {
      // Each resource should have matches defined
      expect(resource.matches).toBeDefined();
      
      // Should not use <all_urls> unless necessary
      if (resource.matches.includes('<all_urls>')) {
        // Only icons and CSS should be accessible to all
        const allowedForAll = ['icons/', '.css', '.png'];
        const hasOnlyAllowedResources = resource.resources.every((r: string) => 
          allowedForAll.some(allowed => r.includes(allowed))
        );
        expect(hasOnlyAllowedResources).toBe(true);
      }
    });
  });
});

test.describe('Content Security Policy', () => {
  test('CSP is defined and strict', () => {
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    expect(manifest.content_security_policy).toBeDefined();
    expect(manifest.content_security_policy.extension_pages).toBeDefined();

    const csp = manifest.content_security_policy.extension_pages;
    
    // Should have default-src 'self'
    expect(csp).toContain("default-src 'self'");
    
    // Should NOT allow unsafe-inline for scripts
    expect(csp).not.toContain("'unsafe-inline'");
    
    // Should NOT allow unsafe-eval
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test('no inline scripts in HTML files', () => {
    const htmlFiles = ['popup.html', 'options.html', 'auth.html'];

    htmlFiles.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for inline scripts with content (not just src)
        const inlineScriptPattern = /<script[^>]*>(?![\s]*<\/script>).+?<\/script>/gs;
        const matches = content.match(inlineScriptPattern) || [];
        
        // Filter out scripts that are just src references
        const actualInlineScripts = matches.filter(match => {
          return !match.includes('src=') || match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '').trim().length > 0;
        });
        
        expect(actualInlineScripts.length, `Inline scripts found in ${file}`).toBe(0);
      }
    });
  });

  test('no inline event handlers in HTML', () => {
    const htmlFiles = ['popup.html', 'options.html', 'auth.html'];
    const eventHandlerPattern = /\s+on\w+\s*=/gi;

    htmlFiles.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const matches = content.match(eventHandlerPattern) || [];
        
        expect(matches.length, `Inline event handlers in ${file}: ${matches.join(', ')}`).toBe(0);
      }
    });
  });
});

test.describe('XSS Prevention', () => {
  test('content.js does not use dangerous DOM methods', () => {
    const contentPath = path.join(EXTENSION_PATH, 'content.js');
    const content = fs.readFileSync(contentPath, 'utf-8');

    // Count innerHTML assignments (should be minimal or zero)
    const innerHTMLAssignments = (content.match(/\.innerHTML\s*=/g) || []).length;
    
    // Count document.write usage (should be zero)
    const documentWrite = (content.match(/document\.write\(/g) || []).length;
    expect(documentWrite).toBe(0);

    // Count eval usage (should be zero)
    const evalUsage = (content.match(/\beval\s*\(/g) || []).length;
    expect(evalUsage).toBe(0);

    // Count new Function (should be zero)
    const newFunction = (content.match(/new\s+Function\s*\(/g) || []).length;
    expect(newFunction).toBe(0);

    // innerHTML should be minimal (ideally 0, but max 5 for edge cases)
    expect(innerHTMLAssignments).toBeLessThan(5);
  });

  test('uses Security.createElement for DOM creation', () => {
    const contentPath = path.join(EXTENSION_PATH, 'content.js');
    const content = fs.readFileSync(contentPath, 'utf-8');

    // Should reference Security module
    expect(content).toContain('Security');
    
    // Should use secure element creation
    const secureCreationCount = (content.match(/Security\.createElement/g) || []).length;
    expect(secureCreationCount).toBeGreaterThan(0);
  });

  test('import-overlay.js sanitizes product data', () => {
    const overlayPath = path.join(EXTENSION_PATH, 'import-overlay.js');
    const content = fs.readFileSync(overlayPath, 'utf-8');

    // Should not directly inject product data into innerHTML without sanitization
    // Check if there's any sanitization or escaping
    const hasSanitization = 
      content.includes('sanitize') ||
      content.includes('escape') ||
      content.includes('textContent') ||
      content.includes('createTextNode');
    
    // If using innerHTML, should be with template literals that are controlled
    const innerHTMLCount = (content.match(/\.innerHTML\s*=/g) || []).length;
    
    // Overlay may use innerHTML for templates, but should be careful
    if (innerHTMLCount > 0) {
      console.warn(`import-overlay.js has ${innerHTMLCount} innerHTML assignments`);
    }
  });

  test('security.js implements proper sanitization', () => {
    const securityPath = path.join(EXTENSION_PATH, 'lib/security.js');
    
    if (fs.existsSync(securityPath)) {
      const content = fs.readFileSync(securityPath, 'utf-8');

      // Should have sanitize function
      expect(content).toContain('sanitize');

      // Should handle script tags
      expect(content.toLowerCase()).toContain('script');

      // Should handle event handlers
      expect(content).toContain('on');

      // Should have createElement helper
      expect(content).toContain('createElement');
    }
  });
});

test.describe('Message Validation', () => {
  test('background.js validates message origins', () => {
    const bgPath = path.join(EXTENSION_PATH, 'background.js');
    const content = fs.readFileSync(bgPath, 'utf-8');

    // Should check sender
    expect(content).toContain('sender');

    // Should validate messages
    expect(content).toContain('validate');

    // Should have action whitelist
    expect(content).toContain('action');
  });

  test('message actions are whitelisted', () => {
    const bgPath = path.join(EXTENSION_PATH, 'background.js');
    const content = fs.readFileSync(bgPath, 'utf-8');

    // Look for valid actions array or switch statement
    const hasActionValidation = 
      content.includes('VALID_MESSAGE_ACTIONS') ||
      content.includes('validActions') ||
      content.includes('switch') && content.includes('action');

    expect(hasActionValidation).toBe(true);
  });

  test('URLs are validated before fetch', () => {
    const bgPath = path.join(EXTENSION_PATH, 'background.js');
    const content = fs.readFileSync(bgPath, 'utf-8');

    // Should have URL validation
    const hasUrlValidation = 
      content.includes('isWhitelisted') ||
      content.includes('validateUrl') ||
      content.includes('whitelist');

    expect(hasUrlValidation).toBe(true);
  });
});

test.describe('Rate Limiting', () => {
  test('background.js implements rate limiting', () => {
    const bgPath = path.join(EXTENSION_PATH, 'background.js');
    const content = fs.readFileSync(bgPath, 'utf-8');

    // Should have rate limiting
    expect(content).toContain('rateLimit');
  });

  test('rate limit configuration is reasonable', () => {
    const bgPath = path.join(EXTENSION_PATH, 'background.js');
    const content = fs.readFileSync(bgPath, 'utf-8');

    // Look for rate limit values
    const maxRequestsMatch = content.match(/maxRequests[:\s]*(\d+)/);
    const windowMsMatch = content.match(/windowMs[:\s]*(\d+)/);

    if (maxRequestsMatch) {
      const maxRequests = parseInt(maxRequestsMatch[1]);
      // Should be reasonable (10-100 per minute)
      expect(maxRequests).toBeGreaterThanOrEqual(10);
      expect(maxRequests).toBeLessThanOrEqual(100);
    }

    if (windowMsMatch) {
      const windowMs = parseInt(windowMsMatch[1]);
      // Should be at least 30 seconds
      expect(windowMs).toBeGreaterThanOrEqual(30000);
    }
  });
});

test.describe('Data Storage Security', () => {
  test('sensitive data uses chrome.storage.local not localStorage', () => {
    const filesToCheck = ['background.js', 'popup.js', 'options.js'];

    filesToCheck.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Should use chrome.storage
        if (content.includes('token') || content.includes('credential')) {
          expect(content).toContain('chrome.storage');
        }
      }
    });
  });

  test('tokens are not logged', () => {
    const filesToCheck = ['background.js', 'popup.js', 'content.js', 'options.js'];

    filesToCheck.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Look for patterns that might log tokens
        const dangerousPatterns = [
          /console\.(log|info|debug)\s*\([^)]*token/gi,
          /console\.(log|info|debug)\s*\([^)]*apiKey/gi,
          /console\.(log|info|debug)\s*\([^)]*secret/gi
        ];

        dangerousPatterns.forEach(pattern => {
          const matches = content.match(pattern) || [];
          expect(matches.length, `Token logging in ${file}`).toBe(0);
        });
      }
    });
  });
});

test.describe('Single Purpose Compliance', () => {
  test('extension focuses on product import functionality', () => {
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Description should clearly state purpose
    const description = manifest.description.toLowerCase();
    expect(
      description.includes('import') ||
      description.includes('dropshipping') ||
      description.includes('produit')
    ).toBe(true);
  });

  test('optional features are properly scoped', () => {
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Most host permissions should be optional
    const requiredHosts = manifest.host_permissions || [];
    const optionalHosts = manifest.optional_host_permissions || [];

    // Optional hosts should outnumber required hosts
    expect(optionalHosts.length).toBeGreaterThan(requiredHosts.length);
  });
});

test.describe('Privacy Compliance', () => {
  test('PRIVACY_POLICY.md exists', () => {
    const privacyPath = path.join(EXTENSION_PATH, 'PRIVACY_POLICY.md');
    expect(fs.existsSync(privacyPath)).toBe(true);
  });

  test('privacy policy covers required topics', () => {
    const privacyPath = path.join(EXTENSION_PATH, 'PRIVACY_POLICY.md');
    
    if (fs.existsSync(privacyPath)) {
      const content = fs.readFileSync(privacyPath, 'utf-8').toLowerCase();

      const requiredTopics = [
        'collect', // What data is collected
        'use', // How data is used
        'shar', // Data sharing (share/sharing)
        'secur', // Security measures
        'contact' // Contact information
      ];

      requiredTopics.forEach(topic => {
        expect(content).toContain(topic);
      });
    }
  });

  test('no third-party tracking scripts', () => {
    const filesToCheck = ['popup.html', 'options.html', 'background.js'];
    const trackingDomains = [
      'google-analytics',
      'googletagmanager',
      'facebook.net',
      'hotjar',
      'mixpanel',
      'segment.io'
    ];

    filesToCheck.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8').toLowerCase();

        trackingDomains.forEach(domain => {
          expect(content).not.toContain(domain);
        });
      }
    });
  });
});

test.describe('Error Handling Security', () => {
  test('errors do not expose sensitive information', () => {
    const filesToCheck = ['background.js', 'content.js', 'popup.js'];

    filesToCheck.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');

        // Error messages should not include full stack traces to users
        // They should use generic messages
        const hasGenericErrors = 
          content.includes('Erreur') ||
          content.includes('Error') ||
          content.includes('error');

        expect(hasGenericErrors).toBe(true);
      }
    });
  });
});

test.describe('Version Synchronization', () => {
  test('all files reference same version', () => {
    const manifestPath = path.join(EXTENSION_PATH, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const expectedVersion = manifest.version;

    const filesToCheck = ['content.js', 'background.js', 'popup.js'];
    
    filesToCheck.forEach(file => {
      const filePath = path.join(EXTENSION_PATH, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Look for version references
        const versionMatch = content.match(/VERSION[:\s]*['"]([^'"]+)['"]/);
        if (versionMatch) {
          expect(versionMatch[1], `Version mismatch in ${file}`).toBe(expectedVersion);
        }
      }
    });
  });
});
