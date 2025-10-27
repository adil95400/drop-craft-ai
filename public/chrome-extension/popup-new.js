// Drop Craft AI - Extension Chrome 1-Click Import
const API_URL = 'https://dtozyrmmekdnvekissuh.supabase.co'
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0b3p5cm1tZWtkbnZla2lzc3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MjMwODIsImV4cCI6MjA2OTk5OTA4Mn0.5glFIyN1_wR_6WFO7ieFiL93aWDz_os8P26DHw-E_dI'

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading')
  const status = document.getElementById('status')
  const productContainer = document.getElementById('product-container')
  const errorDiv = document.getElementById('error')
  const successDiv = document.getElementById('success')

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    
    // Inject content script to scrape page
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: scrapeProductData
    })

    loading.style.display = 'none'
    status.style.display = 'block'

    if (result?.result) {
      const productData = result.result
      
      // Update status
      document.getElementById('platform-name').textContent = productData.platform
      document.getElementById('product-count').textContent = `${productData.products.length} produit(s) détecté(s)`

      // Display products
      productData.products.forEach(product => {
        const productCard = createProductCard(product)
        productContainer.appendChild(productCard)
      })
    } else {
      throw new Error('Aucun produit détecté sur cette page')
    }
  } catch (error) {
    loading.style.display = 'none'
    errorDiv.textContent = error.message
    errorDiv.style.display = 'block'
  }
})

function createProductCard(product) {
  const card = document.createElement('div')
  card.className = 'detected-product'
  
  card.innerHTML = `
    <img src="${product.image || '/placeholder.svg'}" alt="${product.title}" class="product-image" onerror="this.src='/placeholder.svg'">
    <div class="product-title">${product.title}</div>
    <div class="product-price">${product.price || 'Prix non disponible'}</div>
    <div class="product-meta">
      ${product.rating ? `<span class="badge">⭐ ${product.rating}</span>` : ''}
      ${product.orders ? `<span class="badge">🛒 ${product.orders}</span>` : ''}
      ${product.shipping ? `<span class="badge">📦 ${product.shipping}</span>` : ''}
    </div>
    <button class="btn btn-primary" onclick="importProduct(${JSON.stringify(product).replace(/"/g, '&quot;')})">
      <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 5v14M5 12l7 7 7-7"/>
      </svg>
      Import 1-Click
    </button>
    <button class="btn btn-secondary" onclick="analyzeProduct(${JSON.stringify(product).replace(/"/g, '&quot;')})">
      🤖 Analyser avec IA
    </button>
  `
  
  return card
}

async function importProduct(product) {
  const successDiv = document.getElementById('success')
  const errorDiv = document.getElementById('error')
  
  try {
    // Get user session from extension storage
    const { userToken } = await chrome.storage.local.get('userToken')
    
    if (!userToken) {
      throw new Error('Veuillez vous connecter à Drop Craft AI')
    }

    // Import product via Supabase
    const response = await fetch(`${API_URL}/rest/v1/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY,
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        name: product.title,
        price: parseFloat(product.price?.replace(/[^0-9.]/g, '')) || 0,
        image_url: product.image,
        supplier_url: product.url,
        tags: ['chrome-extension', 'imported', product.platform],
        category: 'Extension Import',
        status: 'draft',
        sku: `EXT-${Date.now()}`,
        stock_quantity: 100
      })
    })

    if (!response.ok) throw new Error('Erreur lors de l\'import')

    successDiv.textContent = '✅ Produit importé avec succès dans votre catalogue!'
    successDiv.style.display = 'block'
    setTimeout(() => {
      successDiv.style.display = 'none'
    }, 3000)
    
  } catch (error) {
    errorDiv.textContent = error.message
    errorDiv.style.display = 'block'
  }
}

async function analyzeProduct(product) {
  alert('Analyse IA en cours... Cette fonctionnalité sera bientôt disponible!')
}

// Content script to scrape product data
function scrapeProductData() {
  const url = window.location.href
  const hostname = window.location.hostname
  
  let platform = 'Inconnu'
  let products = []
  
  // Detect platform
  if (hostname.includes('amazon')) {
    platform = 'Amazon'
    products = scrapeAmazon()
  } else if (hostname.includes('aliexpress')) {
    platform = 'AliExpress'
    products = scrapeAliExpress()
  } else if (hostname.includes('ebay')) {
    platform = 'eBay'
    products = scrapeEbay()
  } else if (hostname.includes('etsy')) {
    platform = 'Etsy'
    products = scrapeEtsy()
  } else {
    // Generic scraper
    platform = hostname
    products = scrapeGeneric()
  }
  
  return { platform, products, url }
}

function scrapeAmazon() {
  return [{
    title: document.querySelector('#productTitle')?.textContent.trim() || 'Produit Amazon',
    price: document.querySelector('.a-price-whole')?.textContent.trim(),
    image: document.querySelector('#landingImage')?.src,
    rating: document.querySelector('.a-icon-star .a-icon-alt')?.textContent.trim(),
    orders: document.querySelector('#acrCustomerReviewText')?.textContent.trim(),
    url: window.location.href,
    platform: 'Amazon'
  }]
}

function scrapeAliExpress() {
  return [{
    title: document.querySelector('.product-title-text')?.textContent.trim() || 'Produit AliExpress',
    price: document.querySelector('.product-price-value')?.textContent.trim(),
    image: document.querySelector('.magnifier-image')?.src,
    rating: document.querySelector('.overview-rating-average')?.textContent.trim(),
    orders: document.querySelector('.product-reviewer-sold')?.textContent.trim(),
    url: window.location.href,
    platform: 'AliExpress'
  }]
}

function scrapeEbay() {
  return [{
    title: document.querySelector('.x-item-title__mainTitle')?.textContent.trim() || 'Produit eBay',
    price: document.querySelector('.x-price-primary')?.textContent.trim(),
    image: document.querySelector('.ux-image-carousel-item img')?.src,
    url: window.location.href,
    platform: 'eBay'
  }]
}

function scrapeEtsy() {
  return [{
    title: document.querySelector('h1')?.textContent.trim() || 'Produit Etsy',
    price: document.querySelector('.wt-text-title-03')?.textContent.trim(),
    image: document.querySelector('.wt-max-width-full')?.src,
    url: window.location.href,
    platform: 'Etsy'
  }]
}

function scrapeGeneric() {
  // Generic product scraper for any website
  const title = document.querySelector('h1')?.textContent.trim() || 
                document.querySelector('[class*="title"]')?.textContent.trim() ||
                document.title
                
  const priceElements = document.querySelectorAll('[class*="price"]')
  let price = ''
  for (let el of priceElements) {
    if (el.textContent.match(/\d+[.,]\d+/)) {
      price = el.textContent.trim()
      break
    }
  }
  
  const images = document.querySelectorAll('img')
  let image = ''
  for (let img of images) {
    if (img.width > 200 && img.height > 200) {
      image = img.src
      break
    }
  }
  
  return [{
    title,
    price,
    image,
    url: window.location.href,
    platform: window.location.hostname
  }]
}
