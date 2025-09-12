export const platformLogos = {
  shopify: 'https://cdn.shopify.com/assets2/press/brand/shopify-logo-main-small-f029fcaf14649a054509f6790ce2ce94d1f1c037b4015b4f106c5a67ab033f5b.png',
  woocommerce: 'https://woocommerce.com/wp-content/themes/woo/images/logo-woocommerce.svg',
  prestashop: 'https://www.prestashop.com/sites/all/themes/prestashop/favicon.ico',
  magento: 'https://magento.com/sites/default/files/magento-logo.svg'
}

export const platformNames = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  prestashop: 'PrestaShop',
  magento: 'Magento'
}

export const platformColors = {
  shopify: 'bg-green-500 text-white',
  woocommerce: 'bg-purple-500 text-white',
  prestashop: 'bg-blue-500 text-white',
  magento: 'bg-orange-500 text-white'
}

export const getPlatformLogo = (platform: string) => {
  return platformLogos[platform as keyof typeof platformLogos] || null
}