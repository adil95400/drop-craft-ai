export type LogoKey =
  // E-commerce platforms
  | "shopify" | "shopify-text" | "woocommerce" | "prestashop" | "magento" | "magento-text"
  | "bigcommerce" | "bigcommerce-text" | "bigcommerce-icon" | "squarespace" | "squarespace-text"
  | "wix" | "wix-text" | "ecwid" | "opencart"
  // Marketplaces
  | "amazon" | "amazon-text" | "ebay" | "ebay-text" | "ebay-icon" | "etsy" | "etsy-text"
  | "cdiscount" | "cdiscount-text" | "rakuten" | "rakuten-text" | "zalando" | "zalando-text"
  | "fnac" | "fnac-text" | "asos" | "costco" | "aliexpress" | "tiktok-shop" | "walmart"
  // Social & Ads
  | "facebook" | "facebook-text" | "facebook-circle" | "instagram" | "instagram-color"
  | "tiktok" | "tiktok-color" | "tiktok-full" | "meta-ads" | "meta-color"
  | "google-ads" | "google" | "google-text" | "google-g" | "google-sheets"
  | "linkedin" | "linkedin-text" | "pinterest" | "x" | "whatsapp" | "whatsapp-text"
  // Payment & Tools
  | "paypal" | "stripe" | "canva" | "klaviyo" | "zapier" | "excel"
  // Suppliers
  | "bigbuy"
  // Other
  | "android" | "hipchat" | "mail-ios" | "messages-ios";

export const LOGOS: Record<LogoKey, { src: string; alt: string; cdn?: string }> = {
  // E-commerce platforms
  shopify: { src: "/logos/shopify.svg", alt: "Shopify", cdn: "https://cdn.simpleicons.org/shopify" },
  "shopify-text": { src: "/logos/shopify-text.svg", alt: "Shopify" },
  woocommerce: { src: "/logos/woocommerce.svg", alt: "WooCommerce", cdn: "https://cdn.simpleicons.org/woocommerce" },
  prestashop: { src: "/logos/prestashop.svg", alt: "PrestaShop", cdn: "https://cdn.simpleicons.org/prestashop" },
  magento: { src: "/logos/magento.svg", alt: "Magento", cdn: "https://cdn.simpleicons.org/adobecommerce" },
  "magento-text": { src: "/logos/magento-text.svg", alt: "Magento" },
  bigcommerce: { src: "/logos/bigcommerce.svg", alt: "BigCommerce", cdn: "https://cdn.simpleicons.org/bigcommerce" },
  "bigcommerce-text": { src: "/logos/bigcommerce-text.svg", alt: "BigCommerce" },
  "bigcommerce-icon": { src: "/logos/bigcommerce-icon.svg", alt: "BigCommerce" },
  squarespace: { src: "/logos/squarespace.svg", alt: "Squarespace", cdn: "https://cdn.simpleicons.org/squarespace" },
  "squarespace-text": { src: "/logos/squarespace-text.svg", alt: "Squarespace" },
  wix: { src: "/logos/wix.svg", alt: "Wix", cdn: "https://cdn.simpleicons.org/wix" },
  "wix-text": { src: "/logos/wix-text.svg", alt: "Wix" },
  ecwid: { src: "/logos/ecwid.svg", alt: "Ecwid" },
  opencart: { src: "/logos/opencart.svg", alt: "OpenCart" },

  // Marketplaces
  amazon: { src: "/logos/amazon.svg", alt: "Amazon", cdn: "https://cdn.simpleicons.org/amazon" },
  "amazon-text": { src: "/logos/amazon-text.svg", alt: "Amazon" },
  ebay: { src: "/logos/ebay.svg", alt: "eBay", cdn: "https://cdn.simpleicons.org/ebay" },
  "ebay-text": { src: "/logos/ebay-text.svg", alt: "eBay" },
  "ebay-icon": { src: "/logos/ebay-icon.svg", alt: "eBay" },
  etsy: { src: "/logos/etsy.svg", alt: "Etsy", cdn: "https://cdn.simpleicons.org/etsy" },
  "etsy-text": { src: "/logos/etsy-text.svg", alt: "Etsy" },
  cdiscount: { src: "/logos/cdiscount.svg", alt: "Cdiscount" },
  "cdiscount-text": { src: "/logos/cdiscount-text.svg", alt: "Cdiscount" },
  rakuten: { src: "/logos/rakuten.svg", alt: "Rakuten", cdn: "https://cdn.simpleicons.org/rakuten" },
  "rakuten-text": { src: "/logos/rakuten-text.svg", alt: "Rakuten" },
  zalando: { src: "/logos/zalando.svg", alt: "Zalando", cdn: "https://cdn.simpleicons.org/zalando" },
  "zalando-text": { src: "/logos/zalando-text.svg", alt: "Zalando" },
  fnac: { src: "/logos/fnac.svg", alt: "Fnac" },
  "fnac-text": { src: "/logos/fnac-text.svg", alt: "Fnac" },
  asos: { src: "/logos/asos.svg", alt: "ASOS", cdn: "https://cdn.simpleicons.org/asos" },
  costco: { src: "/logos/costco.svg", alt: "Costco" },
  aliexpress: { src: "/logos/aliexpress.svg", alt: "AliExpress", cdn: "https://cdn.simpleicons.org/aliexpress" },
  "tiktok-shop": { src: "/logos/tiktok-shop.svg", alt: "TikTok Shop", cdn: "https://cdn.simpleicons.org/tiktok" },
  walmart: { src: "/logos/walmart.svg", alt: "Walmart" },

  // Social & Ads
  facebook: { src: "/logos/facebook.svg", alt: "Facebook", cdn: "https://cdn.simpleicons.org/facebook" },
  "facebook-text": { src: "/logos/facebook-text.svg", alt: "Facebook" },
  "facebook-circle": { src: "/logos/facebook-circle.svg", alt: "Facebook" },
  instagram: { src: "/logos/instagram.svg", alt: "Instagram", cdn: "https://cdn.simpleicons.org/instagram" },
  "instagram-color": { src: "/logos/instagram-color.svg", alt: "Instagram" },
  tiktok: { src: "/logos/tiktok.svg", alt: "TikTok", cdn: "https://cdn.simpleicons.org/tiktok" },
  "tiktok-color": { src: "/logos/tiktok-color.svg", alt: "TikTok" },
  "tiktok-full": { src: "/logos/tiktok-full.svg", alt: "TikTok" },
  "meta-ads": { src: "/logos/meta-ads.svg", alt: "Meta Ads", cdn: "https://cdn.simpleicons.org/meta" },
  "meta-color": { src: "/logos/meta-color.svg", alt: "Meta" },
  "google-ads": { src: "/logos/google-ads.svg", alt: "Google Ads", cdn: "https://cdn.simpleicons.org/googleads" },
  google: { src: "/logos/google.svg", alt: "Google", cdn: "https://cdn.simpleicons.org/google" },
  "google-text": { src: "/logos/google-text.svg", alt: "Google" },
  "google-g": { src: "/logos/google-g.svg", alt: "Google" },
  "google-sheets": { src: "/logos/google-sheets.svg", alt: "Google Sheets", cdn: "https://cdn.simpleicons.org/googlesheets" },
  linkedin: { src: "/logos/linkedin.svg", alt: "LinkedIn", cdn: "https://cdn.simpleicons.org/linkedin" },
  "linkedin-text": { src: "/logos/linkedin-text.svg", alt: "LinkedIn" },
  pinterest: { src: "/logos/pinterest.svg", alt: "Pinterest", cdn: "https://cdn.simpleicons.org/pinterest" },
  x: { src: "/logos/x.svg", alt: "X", cdn: "https://cdn.simpleicons.org/x" },
  whatsapp: { src: "/logos/whatsapp.svg", alt: "WhatsApp", cdn: "https://cdn.simpleicons.org/whatsapp" },
  "whatsapp-text": { src: "/logos/whatsapp-text.svg", alt: "WhatsApp" },

  // Payment & Tools
  paypal: { src: "/logos/paypal.svg", alt: "PayPal", cdn: "https://cdn.simpleicons.org/paypal" },
  stripe: { src: "/logos/stripe.svg", alt: "Stripe", cdn: "https://cdn.simpleicons.org/stripe" },
  canva: { src: "/logos/canva.svg", alt: "Canva", cdn: "https://cdn.simpleicons.org/canva" },
  klaviyo: { src: "/logos/klaviyo.svg", alt: "Klaviyo", cdn: "https://cdn.simpleicons.org/klaviyo" },
  zapier: { src: "/logos/zapier.svg", alt: "Zapier", cdn: "https://cdn.simpleicons.org/zapier" },
  excel: { src: "/logos/excel.svg", alt: "Excel", cdn: "https://cdn.simpleicons.org/microsoftexcel" },

  // Suppliers
  bigbuy: { src: "/logos/bigbuy.svg", alt: "BigBuy" },

  // Other
  android: { src: "/logos/android.svg", alt: "Android", cdn: "https://cdn.simpleicons.org/android" },
  hipchat: { src: "/logos/hipchat.svg", alt: "HipChat" },
  "mail-ios": { src: "/logos/mail-ios.svg", alt: "Mail" },
  "messages-ios": { src: "/logos/messages-ios.svg", alt: "Messages" },
};

// Helper function to get logo by platform name
export const getLogoBySrc = (platformName: string): string => {
  const key = platformName.toLowerCase().replace(/\s+/g, '-') as LogoKey;
  return LOGOS[key]?.src || `/logos/${platformName.toLowerCase()}.svg`;
};
