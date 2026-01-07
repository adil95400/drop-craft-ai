import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'magento',
  name: 'Magento',
  description: 'Adobe Commerce - Plateforme e-commerce enterprise',
  website: 'https://business.adobe.com/products/magento/magento-commerce.html',
  category: 'ecommerce',
  region: 'Monde',
  features: [
    'Import catalogue Magento',
    'Synchronisation bidirectionnelle',
    'Gestion multi-boutiques',
    'Webhook & API REST'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'Store URL', key: 'store_url', type: 'text', placeholder: 'https://votre-boutique.com', required: true },
    { name: 'Access Token', key: 'access_token', type: 'password', placeholder: 'Bearer token Magento', required: true }
  ],
  documentation: 'https://developer.adobe.com/commerce/webapi/get-started/',
  productCount: 'Illimité',
  deliveryTime: 'Variable',
  pricing: 'Enterprise',
  color: '#f46f25'
}

export default function MagentoConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
