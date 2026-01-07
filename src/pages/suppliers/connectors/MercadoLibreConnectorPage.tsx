import SupplierConnectorTemplate, { SupplierConnectorConfig } from './SupplierConnectorTemplate'

const config: SupplierConnectorConfig = {
  id: 'mercadolibre',
  name: 'MercadoLibre',
  description: 'Plus grande marketplace d\'Amérique Latine',
  website: 'https://www.mercadolibre.com',
  category: 'marketplace',
  region: 'Amérique Latine',
  features: [
    'Import produits LATAM',
    'Gestion multi-pays',
    'Synchronisation des prix',
    'MercadoPago intégré'
  ],
  authType: 'oauth',
  authFields: [
    { name: 'App ID', key: 'app_id', type: 'text', placeholder: 'Votre App ID', required: true },
    { name: 'Client Secret', key: 'client_secret', type: 'password', placeholder: 'Votre Client Secret', required: true }
  ],
  documentation: 'https://developers.mercadolibre.com',
  productCount: '50M+',
  deliveryTime: '3-15 jours',
  pricing: 'Variable',
  color: '#ffe600'
}

export default function MercadoLibreConnectorPage() {
  return <SupplierConnectorTemplate config={config} />
}
