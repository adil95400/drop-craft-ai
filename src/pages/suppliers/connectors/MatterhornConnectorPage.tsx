import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'matterhorn',
  name: 'Matterhorn',
  description: 'Grossiste européen textile et mode',
  website: 'https://www.matterhorn-wholesale.com',
  category: 'wholesaler',
  region: 'Europe',
  features: [
    'Catalogue textile',
    'Mode femme & homme',
    'Import API',
    'Dropshipping'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'API Key', key: 'api_key', type: 'password', placeholder: 'Votre clé API Matterhorn', required: true }
  ],
  documentation: 'https://www.matterhorn-wholesale.com/api-docs',
  productCount: '30K+',
  deliveryTime: '2-5 jours',
  pricing: 'Prix grossiste',
  color: '#3f51b5'
}

export default function MatterhornConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
