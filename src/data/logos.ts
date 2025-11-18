export type LogoKey =
  | "shopify" | "woocommerce" | "bigbuy" | "aliexpress" | "amazon" | "canva"
  | "paypal" | "stripe" | "tiktok-shop" | "ebay" | "cdiscount" | "meta-ads"
  | "google-ads" | "klaviyo" | "zapier" | "prestashop" | "tiktok" | "facebook" | "instagram"
  | "magento" | "etsy";

export const LOGOS: Record<LogoKey, { src: string; alt: string; cdn?: string }> = {
  shopify: { src: "/logos/shopify.svg", alt: "Shopify", cdn: "https://cdn.simpleicons.org/shopify" },
  woocommerce: { src: "/logos/woocommerce.svg", alt: "WooCommerce", cdn: "https://cdn.simpleicons.org/woocommerce" },
  bigbuy: { src: "/logos/bigbuy.svg", alt: "BigBuy" },
  aliexpress: { src: "/logos/aliexpress.svg", alt: "AliExpress", cdn: "https://cdn.simpleicons.org/aliexpress" },
  amazon: { src: "/logos/amazon.svg", alt: "Amazon", cdn: "https://cdn.simpleicons.org/amazon" },
  canva: { src: "/logos/canva.svg", alt: "Canva", cdn: "https://cdn.simpleicons.org/canva" },
  paypal: { src: "/logos/paypal.svg", alt: "PayPal", cdn: "https://cdn.simpleicons.org/paypal" },
  stripe: { src: "/logos/stripe.svg", alt: "Stripe", cdn: "https://cdn.simpleicons.org/stripe" },
  "tiktok-shop": { src: "/logos/tiktok-shop.svg", alt: "TikTok Shop", cdn: "https://cdn.simpleicons.org/tiktok" },
  ebay: { src: "/logos/ebay.svg", alt: "eBay", cdn: "https://cdn.simpleicons.org/ebay" },
  cdiscount: { src: "/logos/cdiscount.svg", alt: "Cdiscount Pro" },
  "meta-ads": { src: "/logos/meta-ads.svg", alt: "Meta Ads", cdn: "https://cdn.simpleicons.org/meta" },
  "google-ads": { src: "/logos/google-ads.svg", alt: "Google Ads", cdn: "https://cdn.simpleicons.org/googleads" },
  klaviyo: { src: "/logos/klaviyo.svg", alt: "Klaviyo", cdn: "https://cdn.simpleicons.org/klaviyo" },
  zapier: { src: "/logos/zapier.svg", alt: "Zapier", cdn: "https://cdn.simpleicons.org/zapier" },
  prestashop: { src: "/logos/prestashop.svg", alt: "PrestaShop", cdn: "https://cdn.simpleicons.org/prestashop" },
  tiktok: { src: "/logos/tiktok.svg", alt: "TikTok", cdn: "https://cdn.simpleicons.org/tiktok" },
  facebook: { src: "/logos/facebook.svg", alt: "Facebook", cdn: "https://cdn.simpleicons.org/facebook" },
  instagram: { src: "/logos/instagram.svg", alt: "Instagram", cdn: "https://cdn.simpleicons.org/instagram" },
  magento: { src: "/logos/magento.svg", alt: "Magento", cdn: "https://cdn.simpleicons.org/adobecommerce" },
  etsy: { src: "/logos/etsy.svg", alt: "Etsy", cdn: "https://cdn.simpleicons.org/etsy" },
};