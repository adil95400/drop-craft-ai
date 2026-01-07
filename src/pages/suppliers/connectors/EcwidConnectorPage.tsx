import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'ecwid',
  name: 'Ecwid',
  description: 'E-commerce multiplateforme et intégrable partout',
  website: 'https://www.ecwid.com',
  category: 'ecommerce',
  region: 'Monde',
  features: [
    'Import catalogue Ecwid',
    'Multi-plateforme',
    'Synchronisation temps réel',
    'API REST complète'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'Store ID', key: 'store_id', type: 'text', placeholder: 'Votre Store ID', required: true },
    { name: 'Access Token', key: 'access_token', type: 'password', placeholder: 'Token d\'accès', required: true }
  ],
  documentation: 'https://api-docs.ecwid.com/reference',
  productCount: 'Illimité',
  deliveryTime: 'Variable',
  pricing: 'Gratuit + Plans',
  color: '#5ea9dd'
}

export default function EcwidConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
