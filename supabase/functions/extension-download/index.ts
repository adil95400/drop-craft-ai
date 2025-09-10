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
  const encoder = new TextEncoder();
  
  // Create a proper ZIP file structure
  const fileEntries: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  // Add basic icon file as placeholder (16x16 PNG)
  const iconData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, // 16x16 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x91, 0x68,
    0x36, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
    0x54, 0x08, 0x1D, 0x01, 0x01, 0x00, 0x00, 0xFF,
    0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, 0xE2,
    0x21, 0xBC, 0x33, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  // Add icon files
  const iconSizes = ['16', '32', '48', '128'];
  for (const size of iconSizes) {
    const filename = `icons/icon${size}.png`;
    const fileEntry = createZipEntry(filename, iconData, offset);
    fileEntries.push(fileEntry.data);
    centralDirectory.push(fileEntry.centralDir);
    offset += fileEntry.data.length;
  }

  // Add other files
  for (const [filename, content] of Object.entries(files)) {
    const fileData = encoder.encode(content);
    const fileEntry = createZipEntry(filename, fileData, offset);
    fileEntries.push(fileEntry.data);
    centralDirectory.push(fileEntry.centralDir);
    offset += fileEntry.data.length;
  }

  // Calculate total size
  const centralDirSize = centralDirectory.reduce((sum, dir) => sum + dir.length, 0);
  const totalSize = offset + centralDirSize + 22; // 22 bytes for end of central directory

  // Combine all parts
  const zipFile = new Uint8Array(totalSize);
  let pos = 0;

  // Add file entries
  for (const entry of fileEntries) {
    zipFile.set(entry, pos);
    pos += entry.length;
  }

  // Add central directory
  for (const dir of centralDirectory) {
    zipFile.set(dir, pos);
    pos += dir.length;
  }

  // Add end of central directory record
  const endRecord = new Uint8Array(22);
  endRecord.set([0x50, 0x4B, 0x05, 0x06], 0); // End signature
  endRecord.set(new Uint16Array([0, 0]).buffer, 4); // Disk numbers
  endRecord.set(new Uint16Array([centralDirectory.length]).buffer, 8); // Number of entries
  endRecord.set(new Uint16Array([centralDirectory.length]).buffer, 10); // Total entries
  endRecord.set(new Uint32Array([centralDirSize]).buffer, 12); // Central dir size
  endRecord.set(new Uint32Array([offset]).buffer, 16); // Central dir offset
  endRecord.set(new Uint16Array([0]).buffer, 20); // Comment length

  zipFile.set(endRecord, pos);

  return zipFile;
}

function createZipEntry(filename: string, data: Uint8Array, offset: number) {
  const encoder = new TextEncoder();
  const filenameBytes = encoder.encode(filename);
  
  // Local file header
  const localHeader = new Uint8Array(30 + filenameBytes.length);
  localHeader.set([0x50, 0x4B, 0x03, 0x04], 0); // Local file header signature
  localHeader.set([0x14, 0x00], 4); // Version needed to extract
  localHeader.set([0x00, 0x00], 6); // General purpose bit flag
  localHeader.set([0x00, 0x00], 8); // Compression method (stored)
  localHeader.set([0x00, 0x00], 10); // File last modification time
  localHeader.set([0x00, 0x00], 12); // File last modification date
  localHeader.set(new Uint32Array([0]).buffer, 14); // CRC-32
  localHeader.set(new Uint32Array([data.length]).buffer, 18); // Compressed size
  localHeader.set(new Uint32Array([data.length]).buffer, 22); // Uncompressed size
  localHeader.set(new Uint16Array([filenameBytes.length]).buffer, 26); // File name length
  localHeader.set([0x00, 0x00], 28); // Extra field length
  localHeader.set(filenameBytes, 30);

  // File data
  const fileEntry = new Uint8Array(localHeader.length + data.length);
  fileEntry.set(localHeader, 0);
  fileEntry.set(data, localHeader.length);

  // Central directory file header
  const centralHeader = new Uint8Array(46 + filenameBytes.length);
  centralHeader.set([0x50, 0x4B, 0x01, 0x02], 0); // Central file header signature
  centralHeader.set([0x14, 0x00], 4); // Version made by
  centralHeader.set([0x14, 0x00], 6); // Version needed to extract
  centralHeader.set([0x00, 0x00], 8); // General purpose bit flag
  centralHeader.set([0x00, 0x00], 10); // Compression method
  centralHeader.set([0x00, 0x00], 12); // File last modification time
  centralHeader.set([0x00, 0x00], 14); // File last modification date
  centralHeader.set(new Uint32Array([0]).buffer, 16); // CRC-32
  centralHeader.set(new Uint32Array([data.length]).buffer, 20); // Compressed size
  centralHeader.set(new Uint32Array([data.length]).buffer, 24); // Uncompressed size
  centralHeader.set(new Uint16Array([filenameBytes.length]).buffer, 28); // File name length
  centralHeader.set([0x00, 0x00], 30); // Extra field length
  centralHeader.set([0x00, 0x00], 32); // File comment length
  centralHeader.set([0x00, 0x00], 34); // Disk number where file starts
  centralHeader.set([0x00, 0x00], 36); // Internal file attributes
  centralHeader.set(new Uint32Array([0]).buffer, 38); // External file attributes
  centralHeader.set(new Uint32Array([offset]).buffer, 42); // Relative offset of local header
  centralHeader.set(filenameBytes, 46);

  return {
    data: fileEntry,
    centralDir: centralHeader
  };
}

serve(async (req) => {
  console.log('Extension download request:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method === 'GET') {
      console.log('Generating ZIP file...');
      
      // Generate ZIP file with extension
      const zipData = createZipFile(extensionFiles);
      console.log('ZIP file generated, size:', zipData.length);
      
      // Convert to base64 for JSON response (supabase.functions.invoke expects JSON)
      const base64Data = btoa(String.fromCharCode(...zipData));
      
      return new Response(
        JSON.stringify({ 
          success: true,
          data: base64Data,
          filename: 'dropcraft-extension.zip',
          size: zipData.length
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
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