import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'bigcommerce',
  name: 'BigCommerce',
  description: 'Plateforme e-commerce SaaS pour entreprises en croissance',
  website: 'https://www.bigcommerce.com',
  category: 'ecommerce',
  region: 'Monde',
  features: [
    'Import catalogue complet',
    'Synchronisation des stocks',
    'Gestion multi-canaux',
    'API REST moderne'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'Store Hash', key: 'store_hash', type: 'text', placeholder: 'Votre Store Hash', required: true, helpText: 'Trouvé dans l\'URL de l\'admin' },
    { name: 'Access Token', key: 'access_token', type: 'password', placeholder: 'Votre Access Token', required: true },
    { name: 'Client ID', key: 'client_id', type: 'text', placeholder: 'Votre Client ID', required: true }
  ],
  documentation: 'https://developer.bigcommerce.com/docs',
  productCount: 'Illimité',
  deliveryTime: 'Variable',
  pricing: 'À partir de $29/mois',
  color: '#34313f'
}

export default function BigCommerceConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
