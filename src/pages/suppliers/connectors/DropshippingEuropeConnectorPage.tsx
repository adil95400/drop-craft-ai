import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'dropshipping-europe',
  name: 'Dropshipping Europe',
  description: 'Agrégateur de fournisseurs dropshipping européens',
  website: 'https://www.dropshipping-europe.com',
  category: 'dropshipping',
  region: 'Europe',
  features: [
    'Multi-fournisseurs EU',
    'Livraison rapide Europe',
    'TVA incluse',
    'Support FR'
  ],
  authType: 'api_key',
  authFields: [
    { name: 'API Key', key: 'api_key', type: 'password', placeholder: 'Votre clé API', required: true }
  ],
  productCount: '200K+',
  deliveryTime: '2-7 jours',
  pricing: 'Variable',
  color: '#2196f3'
}

export default function DropshippingEuropeConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
