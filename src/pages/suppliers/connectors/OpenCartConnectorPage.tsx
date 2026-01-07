import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'opencart',
  name: 'OpenCart',
  description: 'Plateforme e-commerce open source populaire',
  website: 'https://www.opencart.com',
  category: 'ecommerce',
  region: 'Monde',
  features: [
    'Import catalogue OpenCart',
    'Synchronisation des produits',
    'Support extensions',
    'API REST'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'Store URL', key: 'store_url', type: 'text', placeholder: 'https://votre-boutique.com', required: true },
    { name: 'API Key', key: 'api_key', type: 'password', placeholder: 'Clé API OpenCart', required: true }
  ],
  documentation: 'https://docs.opencart.com/en-gb/api/',
  productCount: 'Illimité',
  deliveryTime: 'Variable',
  pricing: 'Gratuit + Extensions',
  color: '#23a8e0'
}

export default function OpenCartConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
