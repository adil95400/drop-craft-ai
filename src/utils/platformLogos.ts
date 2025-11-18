export const platformLogos = {
  shopify: '/logos/shopify.svg',
  woocommerce: '/logos/woocommerce.svg',
  prestashop: '/logos/prestashop.svg',
  magento: '/logos/magento.svg',
  etsy: '/logos/etsy.svg'
}

export const platformNames = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  prestashop: 'PrestaShop',
  magento: 'Magento',
  etsy: 'Etsy'
}

export const platformColors = {
  shopify: 'bg-green-500 text-white',
  woocommerce: 'bg-purple-500 text-white',
  prestashop: 'bg-blue-500 text-white',
  magento: 'bg-orange-500 text-white',
  etsy: 'bg-orange-600 text-white'
}

export const getPlatformLogo = (platform: string) => {
  return platformLogos[platform as keyof typeof platformLogos] || null
}