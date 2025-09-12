import shopifyLogo from '@/assets/logos/shopify-logo.png'
import woocommerceLogo from '@/assets/logos/woocommerce-logo.png'
import prestashopLogo from '@/assets/logos/prestashop-logo.png'
import magentoLogo from '@/assets/logos/magento-logo.png'

export const platformLogos = {
  shopify: shopifyLogo,
  woocommerce: woocommerceLogo,
  prestashop: prestashopLogo,
  magento: magentoLogo
} as const

export const getPlatformLogo = (platform: string) => {
  return platformLogos[platform as keyof typeof platformLogos] || null
}

export const platformColors = {
  shopify: 'bg-green-500 text-white',
  woocommerce: 'bg-purple-500 text-white', 
  prestashop: 'bg-blue-500 text-white',
  magento: 'bg-orange-500 text-white'
} as const

export const platformNames = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  prestashop: 'PrestaShop',
  magento: 'Magento'
} as const