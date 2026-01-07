import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'mirakl',
  name: 'Mirakl',
  description: 'Plateforme marketplace enterprise (Carrefour, Leroy Merlin, Galeries Lafayette...)',
  website: 'https://www.mirakl.com',
  category: 'marketplace',
  region: 'Europe',
  features: [
    'Connexion multi-marketplace',
    'API unifiée',
    'Gestion centralisée',
    'B2B & B2C'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'API URL', key: 'api_url', type: 'text', placeholder: 'https://marketplace.mirakl.net/api', required: true },
    { name: 'API Key', key: 'api_key', type: 'password', placeholder: 'Votre clé API Mirakl', required: true }
  ],
  documentation: 'https://help.mirakl.net/api-doc',
  productCount: 'Variable',
  deliveryTime: '2-7 jours',
  pricing: 'Enterprise',
  color: '#0052cc'
}

export default function MiraklConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
