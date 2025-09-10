import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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
</html>`,
  "popup.js": `// Popup script for Drop Craft AI Extension
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  bindEvents();
  updateUI();
  checkConnection();
});

let scrapedProducts = [];
let sessionData = {};

function loadStoredData() {
  chrome.storage.local.get(['scrapedProducts', 'sessionData'], (result) => {
    scrapedProducts = result.scrapedProducts || [];
    sessionData = result.sessionData || {};
    updateUI();
  });
}

function saveData() {
  chrome.storage.local.set({
    scrapedProducts: scrapedProducts,
    sessionData: sessionData
  });
}

function bindEvents() {
  document.getElementById('scrapBtn').addEventListener('click', scrapCurrentPage);
  document.getElementById('dashboardBtn').addEventListener('click', openDashboard);
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
}

function scrapCurrentPage() {
  showLoading(true);
  
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: extractProductData
    }, (results) => {
      showLoading(false);
      
      if (results && results[0] && results[0].result) {
        const products = results[0].result;
        if (products.length > 0) {
          scrapedProducts.push(...products);
          saveData();
          updateUI();
          sendToApp(products);
          showNotification('Produits scrapés avec succès!', 'success');
        } else {
          showNotification('Aucun produit trouvé sur cette page', 'warning');
        }
      } else {
        showNotification('Erreur lors du scraping', 'error');
      }
    });
  });
}

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
      const priceMatch = text.match(/[\\d,.]+(\\s*€|\\s*\\$|\\s*USD|\\s*EUR)?/);
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

function sendToApp(products) {
  // Send scraped products to Drop Craft AI app
  fetch('https://dtozyrmmekdnvekissuh.supabase.co/functions/v1/extension-operations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'import_products',
      products: products
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('Products sent to app:', data);
  })
  .catch(error => {
    console.error('Error sending to app:', error);
  });
}

function openDashboard() {
  chrome.tabs.create({
    url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/dashboard'
  });
}

function openSettings() {
  chrome.tabs.create({
    url: 'https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/settings'
  });
}

function clearData() {
  scrapedProducts = [];
  sessionData = {};
  saveData();
  updateUI();
  showNotification('Données effacées', 'info');
}

function updateUI() {
  // Update scraped count
  document.getElementById('scrapedCount').textContent = scrapedProducts.length;
  
  // Update today count
  const today = new Date().toDateString();
  const todayProducts = scrapedProducts.filter(p => 
    new Date(p.scrapedAt).toDateString() === today
  );
  document.getElementById('todayCount').textContent = todayProducts.length;
  
  // Update recent products
  const recentContainer = document.getElementById('recentProducts');
  if (scrapedProducts.length === 0) {
    recentContainer.innerHTML = 'Aucun produit scrapé';
  } else {
    const recent = scrapedProducts.slice(-3).reverse();
    recentContainer.innerHTML = recent.map(product => 
      '<div class="recent-item">' + 
      (product.title || 'Produit sans titre') + 
      (product.price ? ' - ' + product.price : '') +
      '</div>'
    ).join('');
  }
}

function checkConnection() {
  // Simple connection check to the app
  fetch('https://7af4654f-dfc7-42c6-900f-b9ac682ca5ec.lovableproject.com/')
    .then(() => {
      document.querySelector('.status').className = 'status connected';
      document.querySelector('.status').innerHTML = '✅ Connecté à l\\'application';
    })
    .catch(() => {
      document.querySelector('.status').className = 'status disconnected';
      document.querySelector('.status').innerHTML = '❌ Connexion impossible';
    });
}

function showLoading(show) {
  const btn = document.getElementById('scrapBtn');
  if (show) {
    btn.textContent = '🔄 Scraping...';
    btn.disabled = true;
  } else {
    btn.textContent = '🔍 Scraper cette page';
    btn.disabled = false;
  }
}

function showNotification(message, type) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon48.png',
    title: 'Drop Craft AI',
    message: message
  });
}`
};

// CRC-32 calculation table
const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
})();

function calculateCRC32(data: Uint8Array): number {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = CRC32_TABLE[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function writeUint16LE(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xFF;
  buffer[offset + 1] = (value >>> 8) & 0xFF;
}

function writeUint32LE(buffer: Uint8Array, offset: number, value: number): void {
  buffer[offset] = value & 0xFF;
  buffer[offset + 1] = (value >>> 8) & 0xFF;
  buffer[offset + 2] = (value >>> 16) & 0xFF;
  buffer[offset + 3] = (value >>> 24) & 0xFF;
}

function createZipFile(files: Record<string, string>): Uint8Array {
  console.log('Creating ZIP file with proper CRC32 validation...');
  const encoder = new TextEncoder();
  
  const fileEntries: Uint8Array[] = [];
  const centralDirectory: Uint8Array[] = [];
  let offset = 0;

  // Simple 16x16 transparent PNG icon
  const iconData = new Uint8Array([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF,
    0x61, 0x00, 0x00, 0x00, 0x0B, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9C, 0x63, 0x60, 0x00, 0x00, 0x00,
    0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
    0x42, 0x60, 0x82
  ]);

  // Add icon files for each size
  const iconSizes = ['16', '32', '48', '128'];
  for (const size of iconSizes) {
    const filename = `icons/icon${size}.png`;
    const fileEntry = createZipEntry(filename, iconData, offset);
    fileEntries.push(fileEntry.data);
    centralDirectory.push(fileEntry.centralDir);
    offset += fileEntry.data.length;
  }

  // Add extension files
  for (const [filename, content] of Object.entries(files)) {
    const fileData = encoder.encode(content);
    const fileEntry = createZipEntry(filename, fileData, offset);
    fileEntries.push(fileEntry.data);
    centralDirectory.push(fileEntry.centralDir);
    offset += fileEntry.data.length;
  }

  // Calculate sizes
  const centralDirSize = centralDirectory.reduce((sum, dir) => sum + dir.length, 0);
  const totalSize = offset + centralDirSize + 22;

  console.log(`ZIP structure: ${fileEntries.length} files, ${centralDirSize} bytes central dir, ${totalSize} total bytes`);

  // Build final ZIP
  const zipFile = new Uint8Array(totalSize);
  let pos = 0;

  // Write file entries
  for (const entry of fileEntries) {
    zipFile.set(entry, pos);
    pos += entry.length;
  }

  // Write central directory
  for (const dir of centralDirectory) {
    zipFile.set(dir, pos);
    pos += dir.length;
  }

  // End of central directory record
  const endRecord = new Uint8Array(22);
  endRecord.set([0x50, 0x4B, 0x05, 0x06], 0); // Signature
  writeUint16LE(endRecord, 4, 0); // Number of this disk
  writeUint16LE(endRecord, 6, 0); // Disk where central directory starts
  writeUint16LE(endRecord, 8, centralDirectory.length); // Number of central directory records on this disk
  writeUint16LE(endRecord, 10, centralDirectory.length); // Total number of central directory records
  writeUint32LE(endRecord, 12, centralDirSize); // Size of central directory
  writeUint32LE(endRecord, 16, offset); // Offset of start of central directory
  writeUint16LE(endRecord, 20, 0); // Comment length

  zipFile.set(endRecord, pos);

  console.log('ZIP file created successfully with proper structure');
  return zipFile;
}

function createZipEntry(filename: string, data: Uint8Array, offset: number) {
  const encoder = new TextEncoder();
  const filenameBytes = encoder.encode(filename);
  const crc32 = calculateCRC32(data);
  
  console.log(`Creating ZIP entry for ${filename}: ${data.length} bytes, CRC32: 0x${crc32.toString(16)}`);
  
  // Local file header (30 bytes + filename)
  const localHeader = new Uint8Array(30 + filenameBytes.length);
  localHeader.set([0x50, 0x4B, 0x03, 0x04], 0); // Local file header signature
  writeUint16LE(localHeader, 4, 20); // Version needed to extract
  writeUint16LE(localHeader, 6, 0); // General purpose bit flag
  writeUint16LE(localHeader, 8, 0); // Compression method (stored)
  writeUint16LE(localHeader, 10, 0); // File last modification time
  writeUint16LE(localHeader, 12, 0); // File last modification date
  writeUint32LE(localHeader, 14, crc32); // CRC-32
  writeUint32LE(localHeader, 18, data.length); // Compressed size
  writeUint32LE(localHeader, 22, data.length); // Uncompressed size
  writeUint16LE(localHeader, 26, filenameBytes.length); // File name length
  writeUint16LE(localHeader, 28, 0); // Extra field length
  localHeader.set(filenameBytes, 30);

  // Create complete file entry
  const fileEntry = new Uint8Array(localHeader.length + data.length);
  fileEntry.set(localHeader, 0);
  fileEntry.set(data, localHeader.length);

  // Central directory file header (46 bytes + filename)
  const centralHeader = new Uint8Array(46 + filenameBytes.length);
  centralHeader.set([0x50, 0x4B, 0x01, 0x02], 0); // Central file header signature
  writeUint16LE(centralHeader, 4, 20); // Version made by
  writeUint16LE(centralHeader, 6, 20); // Version needed to extract
  writeUint16LE(centralHeader, 8, 0); // General purpose bit flag
  writeUint16LE(centralHeader, 10, 0); // Compression method
  writeUint16LE(centralHeader, 12, 0); // File last modification time
  writeUint16LE(centralHeader, 14, 0); // File last modification date
  writeUint32LE(centralHeader, 16, crc32); // CRC-32
  writeUint32LE(centralHeader, 20, data.length); // Compressed size
  writeUint32LE(centralHeader, 24, data.length); // Uncompressed size
  writeUint16LE(centralHeader, 28, filenameBytes.length); // File name length
  writeUint16LE(centralHeader, 30, 0); // Extra field length
  writeUint16LE(centralHeader, 32, 0); // File comment length
  writeUint16LE(centralHeader, 34, 0); // Disk number where file starts
  writeUint16LE(centralHeader, 36, 0); // Internal file attributes
  writeUint32LE(centralHeader, 38, 0); // External file attributes
  writeUint32LE(centralHeader, 42, offset); // Relative offset of local header
  centralHeader.set(filenameBytes, 46);

  return {
    data: fileEntry,
    centralDir: centralHeader
  };
}

serve(async (req) => {
  console.log('=== Extension Download Request ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { 
      headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  try {
    if (req.method === 'GET' || req.method === 'POST') {
      console.log('Processing extension download request...');
      
      // Validate extension files first
      console.log('Validating extension files...');
      const fileCount = Object.keys(extensionFiles).length;
      console.log(`Extension files count: ${fileCount}`);
      
      if (fileCount === 0) {
        throw new Error('No extension files available');
      }
      
      console.log('Generating ZIP file...');
      const startTime = Date.now();
      
      // Generate ZIP file with extension
      const zipData = createZipFile(extensionFiles);
      const generateTime = Date.now() - startTime;
      
      console.log(`ZIP file generated successfully in ${generateTime}ms`);
      console.log('ZIP file size:', zipData.length, 'bytes');
      
      if (zipData.length === 0) {
        throw new Error('Generated ZIP file is empty');
      }
      
      console.log('Converting to base64...');
      const base64StartTime = Date.now();
      
      // Convert to base64 for JSON response (supabase.functions.invoke expects JSON)
      const base64Data = btoa(String.fromCharCode(...zipData));
      const base64Time = Date.now() - base64StartTime;
      
      console.log(`Base64 conversion completed in ${base64Time}ms`);
      console.log('Base64 data length:', base64Data.length);
      
      const response = {
        success: true,
        data: base64Data,
        filename: 'dropcraft-extension.zip',
        size: zipData.length,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTime: generateTime + base64Time,
          fileCount: fileCount + 4 // +4 for icon files
        }
      };
      
      console.log('Sending successful response:', {
        success: response.success,
        filename: response.filename,
        size: response.size,
        dataLength: response.data.length
      });
      
      return new Response(
        JSON.stringify(response),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
          },
        }
      );
    }

    console.log('Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ 
        error: 'Method not allowed',
        allowedMethods: ['GET', 'POST']
      }),
      { 
        status: 405, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Allow': 'GET, POST, OPTIONS'
        } 
      }
    );

  } catch (error) {
    console.error('=== Extension Download Error ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    const errorResponse = {
      error: 'Failed to generate extension package',
      details: error.message,
      timestamp: new Date().toISOString(),
      type: error.constructor.name
    };
    
    console.log('Sending error response:', errorResponse);
    
    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});