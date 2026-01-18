/**
 * Centralized supplier logo mappings
 * Uses CDN logos, local SVGs, and placeholder generators
 */

// Logo CDN URLs for major suppliers
export const supplierLogos: Record<string, string> = {
  // Major E-commerce Platforms
  aliexpress: '/logos/aliexpress.svg',
  amazon: '/logos/amazon.svg',
  ebay: '/logos/ebay.svg',
  etsy: '/logos/etsy.svg',
  cdiscount: '/logos/cdiscount.svg',
  rakuten: '/logos/rakuten.svg',
  zalando: '/logos/zalando.svg',
  fnac: '/logos/fnac.svg',
  asos: '/logos/asos.svg',
  
  // Dropshipping Platforms
  bigbuy: '/logos/bigbuy.svg',
  cjdropshipping: 'https://cdn.worldvectorlogo.com/logos/cj-dropshipping.svg',
  spocket: 'https://images.crunchbase.com/image/upload/c_pad,f_auto,q_auto:eco,dpr_1/r6kj0svqvcxyjhqfvfp1',
  dsers: 'https://www.dsers.com/wp-content/uploads/2021/09/dsers-logo.svg',
  syncee: 'https://syncee.com/assets/images/syncee-logo.svg',
  zendrop: 'https://zendrop.com/wp-content/themes/theme/assets/img/zendrop-logo.svg',
  modalyst: 'https://modalyst.co/wp-content/uploads/2021/08/modalyst-logo.svg',
  salehoo: 'https://www.salehoo.com/assets/images/salehoo-logo.svg',
  doba: 'https://doba.com/wp-content/themes/doba/assets/images/doba-logo.svg',
  wholesale2b: 'https://wholesale2b.com/images/wholesale2b-logo.svg',
  
  // Chinese Platforms
  temu: 'https://www.temu.com/favicon.ico',
  alibaba: 'https://www.alibaba.com/favicon.ico',
  dhgate: 'https://www.dhgate.com/favicon.ico',
  'made-in-china': 'https://www.made-in-china.com/favicon.ico',
  '1688': 'https://www.1688.com/favicon.ico',
  banggood: 'https://www.banggood.com/favicon.ico',
  gearbest: 'https://www.gearbest.com/favicon.ico',
  lightinthebox: 'https://www.lightinthebox.com/favicon.ico',
  
  // Print on Demand
  printful: 'https://www.printful.com/static/images/printful-logo.svg',
  printify: 'https://printify.com/assets/images/printify-logo.svg',
  gooten: 'https://www.gooten.com/wp-content/themes/gooten/assets/images/gooten-logo.svg',
  teespring: 'https://teespring.com/favicon.ico',
  redbubble: 'https://www.redbubble.com/favicon.ico',
  teepublic: 'https://www.teepublic.com/favicon.ico',
  zazzle: 'https://www.zazzle.com/favicon.ico',
  spreadshirt: 'https://www.spreadshirt.com/favicon.ico',
  customcat: 'https://www.customcat.com/favicon.ico',
  
  // European Suppliers
  vidaxl: 'https://www.vidaxl.com/favicon.ico',
  eprolo: 'https://www.eprolo.com/favicon.ico',
  appscenic: 'https://appscenic.com/favicon.ico',
  matterhorn: 'https://matterhorn.com/favicon.ico',
  brandsdistribution: 'https://www.brandsdistribution.com/favicon.ico',
  griffati: 'https://www.griffati.com/favicon.ico',
  
  // Fashion Suppliers
  fashiontiy: 'https://www.fashiontiy.com/favicon.ico',
  worldwide: 'https://www.worldwidebrands.com/favicon.ico',
  
  // Tech/Electronics
  also: 'https://www.also.com/favicon.ico',
  elko: 'https://www.elko.ee/favicon.ico',
  komputronik: 'https://www.komputronik.pl/favicon.ico',
  kosatec: 'https://www.kosatec.de/favicon.ico',
  
  // Social/Ads
  facebook: '/logos/facebook.svg',
  instagram: '/logos/instagram-color.svg',
  tiktok: '/logos/tiktok.svg',
  google: '/logos/google.svg',
  'google-ads': '/logos/google-ads.svg',
  pinterest: '/logos/pinterest.svg',
  
  // Payment
  stripe: '/logos/stripe.svg',
  paypal: '/logos/paypal.svg',
  
  // CMS
  shopify: '/logos/shopify.svg',
  woocommerce: '/logos/woocommerce.svg',
  prestashop: '/logos/prestashop.svg',
  magento: '/logos/magento.svg',
  bigcommerce: '/logos/bigcommerce.svg',
  squarespace: '/logos/squarespace.svg',
  wix: '/logos/wix.svg',
}

// Country flag emojis
const countryFlags: Record<string, string> = {
  CN: '🇨🇳',
  US: '🇺🇸',
  FR: '🇫🇷',
  DE: '🇩🇪',
  UK: '🇬🇧',
  IT: '🇮🇹',
  ES: '🇪🇸',
  NL: '🇳🇱',
  PL: '🇵🇱',
  LT: '🇱🇹',
  LV: '🇱🇻',
  EE: '🇪🇪',
  RO: '🇷🇴',
  CZ: '🇨🇿',
  HU: '🇭🇺',
  GR: '🇬🇷',
  FI: '🇫🇮',
  SE: '🇸🇪',
  EU: '🇪🇺',
  AU: '🇦🇺',
  CA: '🇨🇦',
  NZ: '🇳🇿',
  IN: '🇮🇳',
  JP: '🇯🇵',
  KR: '🇰🇷',
  TR: '🇹🇷',
  BR: '🇧🇷',
  MX: '🇲🇽',
}

// Category icons/emojis
const categoryIcons: Record<string, string> = {
  general: '📦',
  fashion: '👗',
  electronics: '💻',
  home: '🏠',
  beauty: '💄',
  sports: '⚽',
  toys: '🧸',
  food: '🍔',
  pets: '🐕',
  automotive: '🚗',
  print_on_demand: '🖨️',
  wholesale: '🏭',
  gaming: '🎮',
  lighting: '💡',
  garden: '🌿',
  fragrances: '🌸',
  workwear: '👷',
  plumbing: '🔧',
  it: '💿',
}

// Generate a color from string (for consistent placeholder colors)
const stringToColor = (str: string): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 70%, 50%)`
}

// Get initials from supplier name
const getInitials = (name: string): string => {
  return name
    .split(/[\s-]+/)
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Get supplier logo URL
 * Falls back to placeholder if no logo found
 */
export const getSupplierLogo = (supplierId: string, supplierName: string): string => {
  const normalizedId = supplierId.toLowerCase().replace(/\s+/g, '-')
  
  // Check if we have a mapped logo
  if (supplierLogos[normalizedId]) {
    return supplierLogos[normalizedId]
  }
  
  // Return empty string - UI will show placeholder
  return ''
}

/**
 * Get placeholder data for suppliers without logos
 */
export const getSupplierPlaceholder = (supplierName: string, country?: string, category?: string) => {
  return {
    initials: getInitials(supplierName),
    color: stringToColor(supplierName),
    flag: country ? countryFlags[country] || '🌍' : '🌍',
    icon: category ? categoryIcons[category] || '📦' : '📦',
  }
}

/**
 * Check if a logo URL is valid (not a favicon or placeholder)
 */
export const isValidLogoUrl = (url: string): boolean => {
  if (!url) return false
  // Consider favicons as invalid for display purposes
  if (url.includes('favicon.ico')) return false
  return true
}
