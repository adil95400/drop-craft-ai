// Platform logo paths - using SVG files from public/logos
export const platformLogos: Record<string, string> = {
  // E-commerce platforms
  shopify: '/logos/shopify.svg',
  woocommerce: '/logos/woocommerce.svg',
  prestashop: '/logos/prestashop.svg',
  magento: '/logos/magento.svg',
  bigcommerce: '/logos/bigcommerce.svg',
  squarespace: '/logos/squarespace.svg',
  wix: '/logos/wix.svg',
  ecwid: '/logos/ecwid.svg',
  opencart: '/logos/opencart.svg',
  volusion: '/logos/volusion.svg',
  '3dcart': '/logos/3dcart.svg',
  
  // Marketplaces
  amazon: '/logos/amazon.svg',
  ebay: '/logos/ebay.svg',
  etsy: '/logos/etsy.svg',
  aliexpress: '/logos/aliexpress.svg',
  cdiscount: '/logos/cdiscount.svg',
  rakuten: '/logos/rakuten.svg',
  zalando: '/logos/zalando.svg',
  fnac: '/logos/fnac.svg',
  asos: '/logos/asos.svg',
  costco: '/logos/costco.svg',
  'tiktok-shop': '/logos/tiktok-shop.svg',
  walmart: '/logos/walmart.svg',
  
  // Social & Ads
  facebook: '/logos/facebook.svg',
  instagram: '/logos/instagram.svg',
  tiktok: '/logos/tiktok.svg',
  google: '/logos/google.svg',
  'google-ads': '/logos/google-ads.svg',
  'google-shopping': '/logos/google-g.svg',
  'meta-ads': '/logos/meta-ads.svg',
  meta: '/logos/meta-color.svg',
  linkedin: '/logos/linkedin.svg',
  pinterest: '/logos/pinterest.svg',
  x: '/logos/x.svg',
  twitter: '/logos/x.svg',
  whatsapp: '/logos/whatsapp.svg',
  
  // Payment & Tools
  stripe: '/logos/stripe.svg',
  paypal: '/logos/paypal.svg',
  canva: '/logos/canva.svg',
  klaviyo: '/logos/klaviyo.svg',
  zapier: '/logos/zapier.svg',
  excel: '/logos/excel.svg',
  'google-sheets': '/logos/google-sheets.svg',
  
  // Suppliers
  bigbuy: '/logos/bigbuy.svg',
  
  // Mobile & Other
  android: '/logos/android.svg',
  hipchat: '/logos/hipchat.svg',
  mail: '/logos/mail-ios.svg',
  messages: '/logos/messages-ios.svg',
};

export const platformNames: Record<string, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  prestashop: 'PrestaShop',
  magento: 'Magento',
  bigcommerce: 'BigCommerce',
  squarespace: 'Squarespace',
  wix: 'Wix',
  ecwid: 'Ecwid',
  opencart: 'OpenCart',
  walmart: 'Walmart',
  volusion: 'Volusion',
  '3dcart': '3dcart',
  amazon: 'Amazon',
  ebay: 'eBay',
  etsy: 'Etsy',
  aliexpress: 'AliExpress',
  cdiscount: 'Cdiscount',
  rakuten: 'Rakuten',
  zalando: 'Zalando',
  fnac: 'Fnac',
  asos: 'ASOS',
  costco: 'Costco',
  'tiktok-shop': 'TikTok Shop',
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  google: 'Google',
  'google-ads': 'Google Ads',
  'google-shopping': 'Google Shopping',
  'meta-ads': 'Meta Ads',
  meta: 'Meta',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  x: 'X',
  twitter: 'X (Twitter)',
  whatsapp: 'WhatsApp',
  stripe: 'Stripe',
  paypal: 'PayPal',
  canva: 'Canva',
  klaviyo: 'Klaviyo',
  zapier: 'Zapier',
  excel: 'Excel',
  'google-sheets': 'Google Sheets',
  bigbuy: 'BigBuy',
  android: 'Android',
};

export const platformColors: Record<string, string> = {
  shopify: 'bg-[#95BF47] text-white',
  woocommerce: 'bg-[#96588A] text-white',
  prestashop: 'bg-[#DF0067] text-white',
  magento: 'bg-[#EE672F] text-white',
  bigcommerce: 'bg-[#34313F] text-white',
  squarespace: 'bg-[#1A1918] text-white',
  wix: 'bg-[#0C6EFC] text-white',
  ecwid: 'bg-[#0087CD] text-white',
  opencart: 'bg-[#04B6F0] text-white',
  walmart: 'bg-[#0071DC] text-white',
  volusion: 'bg-[#8759F2] text-white',
  '3dcart': 'bg-[#242727] text-white',
  amazon: 'bg-[#FF9900] text-black',
  ebay: 'bg-[#E53238] text-white',
  etsy: 'bg-[#F56400] text-white',
  aliexpress: 'bg-[#E62E04] text-white',
  cdiscount: 'bg-[#00A7E1] text-white',
  rakuten: 'bg-[#BF0000] text-white',
  zalando: 'bg-[#FF6900] text-white',
  fnac: 'bg-[#E1A925] text-black',
  asos: 'bg-[#2D2D2D] text-white',
  'tiktok-shop': 'bg-[#000000] text-white',
  facebook: 'bg-[#1877F2] text-white',
  instagram: 'bg-gradient-to-r from-[#833AB4] via-[#E1306C] to-[#F77737] text-white',
  tiktok: 'bg-[#000000] text-white',
  google: 'bg-[#4285F4] text-white',
  'google-ads': 'bg-[#4285F4] text-white',
  'google-shopping': 'bg-[#4285F4] text-white',
  'meta-ads': 'bg-[#0081FB] text-white',
  meta: 'bg-[#0081FB] text-white',
  linkedin: 'bg-[#0A66C2] text-white',
  pinterest: 'bg-[#E60023] text-white',
  x: 'bg-[#000000] text-white',
  twitter: 'bg-[#000000] text-white',
  whatsapp: 'bg-[#25D366] text-white',
  stripe: 'bg-[#635BFF] text-white',
  paypal: 'bg-[#003087] text-white',
};

export const getPlatformLogo = (platform: string): string | null => {
  const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '-');
  return platformLogos[normalizedPlatform] || null;
};

export const getPlatformName = (platform: string): string => {
  const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '-');
  return platformNames[normalizedPlatform] || platform;
};

export const getPlatformColor = (platform: string): string => {
  const normalizedPlatform = platform.toLowerCase().replace(/\s+/g, '-');
  return platformColors[normalizedPlatform] || 'bg-gray-500 text-white';
};
