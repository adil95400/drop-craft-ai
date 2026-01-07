import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'wix',
  name: 'Wix Stores',
  description: 'Solution e-commerce intégrée à Wix',
  website: 'https://www.wix.com/ecommerce',
  category: 'ecommerce',
  region: 'Monde',
  features: [
    'Import produits Wix',
    'Synchronisation catalogue',
    'Gestion des commandes',
    'Wix API moderne'
  ],
  authType: 'oauth',
  authFields: [
    { name: 'API Key', key: 'api_key', type: 'password', placeholder: 'Votre clé API Wix', required: true },
    { name: 'Account ID', key: 'account_id', type: 'text', placeholder: 'Votre Account ID', required: true }
  ],
  documentation: 'https://dev.wix.com/api/rest',
  productCount: 'Illimité',
  deliveryTime: 'Variable',
  pricing: 'À partir de €27/mois',
  color: '#0c6efc'
}

export default function WixConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
