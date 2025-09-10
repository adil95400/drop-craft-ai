import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

const extensionFiles = {
  "manifest.json": `{
  "manifest_version": 3,
  "name": "Drop Craft AI - Extension de Scraping E-commerce",
  "version": "1.0.0",
  "description": "Extension Chrome pour scraper automatiquement les produits e-commerce et les synchroniser avec Drop Craft AI",
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "scripting"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],
  "background": {
    "service_worker": "background.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Drop Craft AI Scraper",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["injected.js"],
      "matches": ["<all_urls>"]
    }
  ]
}`,
  "background.js": `chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SCRAPE_COMPLETE') {
    chrome.storage.local.get(['scrapedProducts'], (result) => {
      const products = result.scrapedProducts || [];
      products.push(...message.products);
      chrome.storage.local.set({ scrapedProducts: products });
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content.js']
  });
});`,
  "content.js": `// Content script for Drop Craft AI Extension
(function() {
  'use strict';

  function extractProductData() {
    const products = [];
    
    // Common product selectors
    const productSelectors = [
      '.product-item',
      '.product-card',
      '.item',
      '[data-product]',
      '.product',
      '.listing-item'
    ];
    
    let productElements = [];
    
    for (const selector of productSelectors) {
      productElements = document.querySelectorAll(selector);
      if (productElements.length > 0) break;
    }
    
    if (productElements.length === 0) {
      // Fallback: extract single product
      const singleProduct = extractSingleProduct();
      if (singleProduct) return [singleProduct];
      return [];
    }
    
    productElements.forEach(element => {
      const product = extractFromElement(element);
      if (product.title || product.price) {
        products.push(product);
      }
    });
    
    return products.slice(0, 50); // Limit to 50 products
  }
  
  function extractFromElement(element) {
    const titleSelectors = [
      'h1', 'h2', 'h3', '.title', '.name', '.product-title', '.product-name',
      '[data-title]', '.item-title', '.listing-title'
    ];
    
    const priceSelectors = [
      '.price', '.cost', '.amount', '[data-price]', '.price-current',
      '.sale-price', '.regular-price', '.final-price'
    ];
    
    const imageSelectors = ['img'];
    
    return {
      title: getTextContent(element, titleSelectors),
      price: getPriceContent(element, priceSelectors),
      image: getImageSrc(element, imageSelectors),
      url: window.location.href,
      scrapedAt: new Date().toISOString()
    };
  }
  
  function extractSingleProduct() {
    return {
      title: getTextContent(document, ['h1', '.product-title', '.title']),
      price: getPriceContent(document, ['.price', '.cost', '.amount']),
      image: getImageSrc(document, ['.product-image img', '.main-image img', 'img']),
      url: window.location.href,
      scrapedAt: new Date().toISOString()
    };
  }
  
  function getTextContent(element, selectors) {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found && found.textContent.trim()) {
        return found.textContent.trim();
      }
    }
    return '';
  }
  
  function getPriceContent(element, selectors) {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found) {
        const text = found.textContent.trim();
        const priceMatch = text.match(/[\d,.]+(\\s*€|\\s*\\$|\\s*USD|\\s*EUR)?/);
        if (priceMatch) return priceMatch[0];
      }
    }
    return '';
  }
  
  function getImageSrc(element, selectors) {
    for (const selector of selectors) {
      const found = element.querySelector(selector);
      if (found && found.src) {
        return found.src;
      }
    }
    return '';
  }
  
  // Auto-scrape when content script loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        const products = extractProductData();
        if (products.length > 0) {
          chrome.runtime.sendMessage({
            type: 'SCRAPE_COMPLETE',
            products: products
          });
        }
      }, 2000);
    });
  } else {
    setTimeout(() => {
      const products = extractProductData();
      if (products.length > 0) {
        chrome.runtime.sendMessage({
          type: 'SCRAPE_COMPLETE',
          products: products
        });
      }
    }, 2000);
  }
})();`,
  "popup.html": `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { width: 350px; padding: 20px; font-family: Arial, sans-serif; }
    .header { text-align: center; margin-bottom: 20px; }
    .logo { font-size: 18px; font-weight: bold; color: #2563eb; }
    .status { padding: 10px; border-radius: 5px; margin: 10px 0; }
    .connected { background: #dcfce7; color: #166534; }
    .disconnected { background: #fef2f2; color: #dc2626; }
    .stats { display: flex; justify-content: space-between; margin: 15px 0; }
    .stat { text-align: center; }
    .stat-number { font-size: 24px; font-weight: bold; color: #2563eb; }
    .stat-label { font-size: 12px; color: #64748b; }
    .actions { margin: 20px 0; }
    .btn { width: 100%; padding: 10px; margin: 5px 0; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
    .btn-primary { background: #2563eb; color: white; }
    .btn-secondary { background: #f1f5f9; color: #64748b; }
    .recent { margin-top: 20px; }
    .recent-item { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🚀 Drop Craft AI</div>
    <div class="status connected">
      ✅ Connecté à l'application
    </div>
  </div>
  
  <div class="stats">
    <div class="stat">
      <div class="stat-number" id="scrapedCount">0</div>
      <div class="stat-label">Produits scrapés</div>
    </div>
    <div class="stat">
      <div class="stat-number" id="todayCount">0</div>
      <div class="stat-label">Aujourd'hui</div>
    </div>
  </div>
  
  <div class="actions">
    <button class="btn btn-primary" id="scrapBtn">🔍 Scraper cette page</button>
    <button class="btn btn-secondary" id="dashboardBtn">📊 Ouvrir Dashboard</button>
    <button class="btn btn-secondary" id="settingsBtn">⚙️ Paramètres</button>
  </div>
  
  <div class="recent">
    <h4>Derniers produits scrapés:</h4>
    <div id="recentProducts">Aucun produit scrapé</div>
  </div>
  
  <script src="popup.js"></script>
</body>
</html>`
};

function createZipFile(files: Record<string, string>): Uint8Array {
  // Simple ZIP file creation for demonstration
  // In production, you'd use a proper ZIP library
  const encoder = new TextEncoder();
  let zipData = new Uint8Array(0);
  
  // This is a simplified ZIP structure - in production use proper ZIP library
  for (const [filename, content] of Object.entries(files)) {
    const fileData = encoder.encode(content);
    // Add basic ZIP file structure (simplified)
    const header = encoder.encode(`PK\u0003\u0004${filename}\u0000\u0000`);
    const newData = new Uint8Array(zipData.length + header.length + fileData.length);
    newData.set(zipData);
    newData.set(header, zipData.length);
    newData.set(fileData, zipData.length + header.length);
    zipData = newData;
  }
  
  return zipData;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      // Generate ZIP file with extension
      const zipData = createZipFile(extensionFiles);
      
      return new Response(zipData, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/zip',
          'Content-Disposition': 'attachment; filename="dropcraft-extension.zip"',
          'Content-Length': zipData.length.toString(),
        },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Extension download error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate extension package',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});